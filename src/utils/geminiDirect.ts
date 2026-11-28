import {
  SCAN_CANDIDATE_TIMEOUT_MS,
  SCAN_CLIENT_TIMEOUT_MS,
  SCAN_MODEL_CANDIDATES,
  SCAN_PROMPT,
  SCAN_RESPONSE_SCHEMA,
  SCAN_THINKING_CONFIG
} from './scanPrompt';

/** HTTPS only. CapacitorHttp (already on) sends this from the Android shell without a WebView CORS block. */
export const GEMINI_API_ORIGIN = 'https://generativelanguage.googleapis.com';

export type GeminiKeyFailure = 'invalid' | 'limited' | 'offline' | 'failed' | 'timeout';

const FAILURE_MESSAGE: Record<GeminiKeyFailure, string> = {
  invalid: '키가 올바르지 않습니다. AI Studio에서 받은 키를 다시 확인해 주세요.',
  limited: '오늘 쓸 수 있는 횟수를 넘겼습니다. 잠시 뒤 다시 시도해 주세요.',
  offline: '인터넷에 연결되지 않아 사진을 보내지 못했습니다.',
  failed: '사진 인식을 끝내지 못했습니다. 직접 입력으로 등록할 수 있습니다.',
  timeout: '시간이 너무 걸려 끝내지 못했습니다. 다시 시도해 주세요.'
};

export function geminiKeyFailureMessage(kind: GeminiKeyFailure): string {
  return FAILURE_MESSAGE[kind];
}

export class UserGeminiError extends Error {
  readonly kind: GeminiKeyFailure;

  constructor(kind: GeminiKeyFailure) {
    super(geminiKeyFailureMessage(kind));
    this.name = 'UserGeminiError';
    this.kind = kind;
  }
}

/** 400, 401 and 403 are a key the service will not accept. 429 is the free-tier cap. */
export function classifyGeminiStatus(status: number): GeminiKeyFailure | 'ok' {
  if (status === 0) return 'offline';
  if (status === 400 || status === 401 || status === 403) return 'invalid';
  if (status === 429) return 'limited';
  if (status >= 200 && status < 300) return 'ok';
  return 'failed';
}

/** The key stays in a header. A URL with the key would land in logs and error text. */
export function geminiModelsUrl(): string {
  return `${GEMINI_API_ORIGIN}/v1beta/models?pageSize=1`;
}

export function geminiGenerateUrl(model: string): string {
  return `${GEMINI_API_ORIGIN}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

export function geminiKeyHeader(apiKey: string): Record<string, string> {
  return { 'x-goog-api-key': apiKey };
}

export function buildGenerateBody(image: { data: string; mimeType: string }, thinking = true) {
  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: SCAN_PROMPT }, { inlineData: { mimeType: image.mimeType, data: image.data } }]
      }
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: SCAN_RESPONSE_SCHEMA,
      ...(thinking ? { thinkingConfig: SCAN_THINKING_CONFIG } : {})
    }
  };
}

export function textFromGeminiResponse(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const candidates = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as { content?: unknown }).content;
  if (typeof content !== 'object' || content === null) return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((part) => {
      if (typeof part !== 'object' || part === null) return '';
      const value = (part as { text?: unknown }).text;
      return typeof value === 'string' ? value : '';
    })
    .join('');
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A light list call. No photo is sent, and the key is not placed in the URL. */
export async function verifyUserGeminiKey(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const trimmed = apiKey.trim();
  if (trimmed.length < 10) throw new UserGeminiError('invalid');
  let response: Response;
  try {
    response = await fetchImpl(geminiModelsUrl(), { headers: geminiKeyHeader(trimmed) });
  } catch {
    throw new UserGeminiError('offline');
  }
  const kind = classifyGeminiStatus(response.status);
  if (kind !== 'ok') throw new UserGeminiError(kind);
}

type Attempt = Response | 'timeout' | 'offline';

export interface ReadGamesOptions {
  candidateTimeoutMs?: number;
  clientTimeoutMs?: number;
  signal?: AbortSignal;
}

async function errorText(response: Response): Promise<string> {
  try {
    return (await response.text()).toLowerCase();
  } catch {
    return '';
  }
}

function keyRejected(text: string): boolean {
  return text.includes('api key') || text.includes('api_key');
}

async function postModel(
  fetchImpl: typeof fetch,
  apiKey: string,
  model: string,
  image: { data: string; mimeType: string },
  thinking: boolean,
  deadline: number,
  candidateTimeoutMs: number,
  parent: AbortSignal
): Promise<Attempt> {
  if (parent.aborted || deadline - Date.now() <= 0) return 'timeout';
  const controller = new AbortController();
  const ms = Math.min(candidateTimeoutMs, deadline - Date.now());
  const timer = setTimeout(() => controller.abort(), ms);
  const onParent = () => controller.abort();
  parent.addEventListener('abort', onParent);
  try {
    return await fetchImpl(geminiGenerateUrl(model), {
      method: 'POST',
      headers: { ...geminiKeyHeader(apiKey), 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGenerateBody(image, thinking)),
      signal: controller.signal
    });
  } catch {
    if (parent.aborted || controller.signal.aborted) return 'timeout';
    return 'offline';
  } finally {
    clearTimeout(timer);
    parent.removeEventListener('abort', onParent);
  }
}

async function gamesFromOk(response: Response): Promise<unknown> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    throw new UserGeminiError('failed');
  }
  const text = textFromGeminiResponse(body);
  if (!text) throw new UserGeminiError('failed');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new UserGeminiError('failed');
  }
}

/**
 * Reads one photo with the user's own key. Tries the shared model list.
 * A model that rejects minimal thinking is asked once more without it.
 * 404, 429, 503, and a per-model timeout move to the next id.
 * The thrown message is a fixed Korean sentence and never includes the key or the provider body.
 */
export async function readGamesWithUserKey(
  apiKey: string,
  image: { data: string; mimeType: string },
  fetchImpl: typeof fetch = fetch,
  options?: ReadGamesOptions
): Promise<unknown> {
  const trimmed = apiKey.trim();
  const candidateTimeoutMs = options?.candidateTimeoutMs ?? SCAN_CANDIDATE_TIMEOUT_MS;
  const clientTimeoutMs = options?.clientTimeoutMs ?? SCAN_CLIENT_TIMEOUT_MS;
  const parent = options?.signal ?? new AbortController().signal;
  const deadline = Date.now() + clientTimeoutMs;
  let sawOffline = false;
  let sawLimited = false;
  let sawTimeout = false;

  const note = (attempt: Attempt): Response | null => {
    if (attempt === 'offline') {
      sawOffline = true;
      return null;
    }
    if (attempt === 'timeout') {
      sawTimeout = true;
      return null;
    }
    return attempt;
  };

  for (const model of SCAN_MODEL_CANDIDATES) {
    let response = note(await postModel(fetchImpl, trimmed, model, image, true, deadline, candidateTimeoutMs, parent));
    if (sawOffline || (sawTimeout && parent.aborted)) break;
    if (!response) continue;
    if (response.status === 400) {
      const text = await errorText(response);
      if (keyRejected(text)) throw new UserGeminiError('invalid');
      response = note(await postModel(fetchImpl, trimmed, model, image, false, deadline, candidateTimeoutMs, parent));
      if (sawOffline || (sawTimeout && parent.aborted)) break;
      if (!response) continue;
    }
    const kind = classifyGeminiStatus(response.status);
    if (kind === 'ok') return gamesFromOk(response);
    if (kind === 'invalid') throw new UserGeminiError('invalid');
    if (response.status === 429) {
      sawLimited = true;
      continue;
    }
    if (response.status === 404 || response.status === 503) continue;
    throw new UserGeminiError('failed');
  }

  if (sawOffline) throw new UserGeminiError('offline');
  if (sawTimeout) throw new UserGeminiError('timeout');
  if (sawLimited) throw new UserGeminiError('limited');
  throw new UserGeminiError('failed');
}
