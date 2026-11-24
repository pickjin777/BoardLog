import { GoogleGenAI, Type } from '@google/genai';
import { PUBLIC_SCAN_ERROR } from '../src/utils/publicScanError';
import { MAX_SCAN_IMAGES, ONE_PHOTO_LIMIT_MESSAGE, parseRecognizedGames } from '../src/utils/scanRecognition';

/**
 * Model ids retire while still appearing in the account's model list, so a single
 * hardcoded id eventually stops working. GEMINI_MODEL wins when set; otherwise these
 * are tried in order, starting with the alias that tracks the current flash release.
 */

const MODEL_CANDIDATES = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat([
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `You are reading one photograph of physical board game boxes. A single photo may show several boxes at once.

Return every distinct board game whose title you can read. The response is a JSON object with a "games" array. Each item has only:
- "title": the product title printed on that box, in the language printed on the box. Keep Korean titles in Korean. When both a Korean and an English title are printed, use the Korean one.
- "confidence": a number from 0 to 1 for how sure you are of that title.

Titles may be printed in any of these ways. Read all of them:
- Horizontal text across a box face.
- Vertically stacked characters, each one below the previous.
- Horizontal text on a spine, rotated 90 degrees clockwise or counter-clockwise.

Rules:
- One array item per physical box. Never merge two boxes. Never split one box into two.
- Ignore publisher names, taglines, player-count badges, age ratings, awards, barcodes and expansion banners.
- When a title is partly hidden or blurred, report the legible part and lower the confidence.
- When the photo shows no board game box, return an empty "games" array. Do not guess.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    games: {
      type: Type.ARRAY,
      description: 'Every board game read from this one photo',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title as printed on the box' },
          confidence: { type: Type.NUMBER, description: '0 to 1' }
        },
        required: ['title', 'confidence']
      }
    }
  },
  required: ['games']
};

/**
 * The provider reports a bad key, a disabled API and an unavailable model all as one
 * failed call, and each needs a different fix. The raw text stays in the log; only the
 * classification is returned.
 */
export function classifyProviderError(err: unknown): { status: number; error: string; reason: string } {
  const text = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const detail = (err instanceof Error ? err.message : String(err)).slice(0, 300);
  let status = 502;
  let reason = 'UNKNOWN';

  if (text.includes('api key not valid') || text.includes('api_key_invalid') || text.includes('invalid api key')) {
    reason = 'INVALID_KEY';
  } else if (text.includes('permission_denied') || text.includes('has not been used') || text.includes('is disabled')) {
    reason = 'API_DISABLED';
  } else if (text.includes('not_found') || text.includes('not found')) {
    reason = 'MODEL_NOT_FOUND';
  } else if (text.includes('resource_exhausted') || text.includes('quota') || text.includes('rate limit')) {
    status = 429;
    reason = 'RATE_LIMITED';
  } else if (text.includes('location') || text.includes('region') || text.includes('user location')) {
    reason = 'REGION_BLOCKED';
  } else if (text.includes('unavailable') || text.includes('overloaded') || text.includes('high demand')) {
    status = 503;
    reason = 'MODEL_OVERLOADED';
  } else {
    const upstreamStatus = (err as { status?: unknown }).status;
    const fromMessage = /\b(4\d{2}|5\d{2})\b/.exec(text);
    const upstream = typeof upstreamStatus === 'number' ? String(upstreamStatus) : fromMessage?.[1];
    reason = upstream ? `UNKNOWN_${upstream}` : 'UNKNOWN';
  }

  console.error('scan-games provider text', { reason, detail });
  return { status, reason, error: PUBLIC_SCAN_ERROR };
}

/**
 * Model ids move over time, so a not-found answer is more useful with the list of ids
 * this key can actually reach: one of them goes straight into GEMINI_MODEL.
 */
async function listUsableModels(apiKey: string): Promise<string[]> {
  try {
    const pager = await new GoogleGenAI({ apiKey }).models.list();
    const names: string[] = [];
    for await (const model of pager) {
      const actions = model.supportedActions;
      const usable = !actions || actions.length === 0 || actions.includes('generateContent');
      if (model.name && usable) names.push(model.name.replace(/^models\//, ''));
      if (names.length >= 40) break;
    }
    return names;
  } catch (err) {
    console.error('scan-games model listing failed', err);
    return [];
  }
}

interface IncomingImage {
  data: string;
  mimeType: string;
}

interface HandlerRequest {
  method?: string;
  body?: unknown;
  headers?: { origin?: string | string[] };
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  setHeader(name: string, value: string): void;
  json(payload: unknown): void;
  end(): void;
}

const NATIVE_SHELL_ORIGINS = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost']);

/** The bundled shell is a different origin from the Vercel function. Other sites stay blocked. */
export function nativeShellAllowOrigin(origin: string | string[] | undefined): string | null {
  const value = Array.isArray(origin) ? origin[0] : origin;
  if (!value || !NATIVE_SHELL_ORIGINS.has(value)) return null;
  return value;
}

function applyNativeShellCors(req: HandlerRequest, res: HandlerResponse): void {
  const allow = nativeShellAllowOrigin(req.headers?.origin);
  if (!allow) return;
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readImages(body: unknown): IncomingImage[] | string {
  if (typeof body !== 'object' || body === null) return '요청 형식이 올바르지 않습니다.';
  const raw = (body as { images?: unknown }).images;
  if (!Array.isArray(raw) || raw.length === 0) return '이미지가 없습니다.';
  if (raw.length > MAX_SCAN_IMAGES) return ONE_PHOTO_LIMIT_MESSAGE;

  const images: IncomingImage[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return '이미지 형식이 올바르지 않습니다.';
    const { data, mimeType } = entry as { data?: unknown; mimeType?: unknown };
    if (typeof data !== 'string' || typeof mimeType !== 'string') {
      return '이미지 형식이 올바르지 않습니다.';
    }
    if (!ALLOWED_MIME.includes(mimeType)) {
      return '지원되지 않는 이미지 형식입니다. JPG, PNG, WebP';
    }
    // base64 inflates by 4/3, so this bounds the decoded size.
    if (data.length * 0.75 > MAX_IMAGE_BYTES) {
      return '이미지 용량이 너무 큽니다.';
    }
    images.push({ data, mimeType });
  }
  return images;
}

/** Non-empty server key. The value is never returned to the browser. */
export function isScanConfigured(apiKey: string | undefined): apiKey is string {
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse): Promise<void> {
  applyNativeShellCors(req, res);
  if (req.method === 'OPTIONS') {
    if (nativeShellAllowOrigin(req.headers?.origin)) {
      res.status(204).end();
      return;
    }
    res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    return;
  }

  // A probe the client can call without sending a photo or reaching Gemini.
  // When a key is added, the next check turns the button back on by itself.
  if (req.method === 'GET') {
    res.status(200).json({ available: isScanConfigured(process.env.GEMINI_API_KEY) });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isScanConfigured(apiKey)) {
    // Surfaced as a setup problem, not a user error: the deployment is missing its key.
    res.status(503).json({ error: '사진 인식 기능이 아직 설정되지 않았습니다.', code: 'NOT_CONFIGURED' });
    return;
  }

  const images = readImages(req.body);
  if (typeof images === 'string') {
    res.status(400).json({ error: images, code: 'VALIDATION' });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    {
      role: 'user',
      parts: [
        { text: PROMPT },
        ...images.map((image) => ({
          inlineData: { mimeType: image.mimeType, data: image.data }
        }))
      ]
    }
  ];

  let lastError: unknown = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0
        }
      });

      const text = result.text;
      if (!text) {
        res.status(502).json({ error: '사진에서 게임 이름을 읽지 못했습니다. 다시 시도해주세요.' });
        return;
      }

      const parsed = JSON.parse(text) as unknown;
      const games = parseRecognizedGames(parsed);
      res.status(200).json({ games });
      return;
    } catch (err) {
      console.error(`scan-games failed on ${model}`, err);
      lastError = err;
      const reason = classifyProviderError(err).reason;
      // A missing or momentarily overloaded model might succeed on another id; a bad
      // key or a spent quota fails the same way on every one, so stop immediately.
      if (reason !== 'MODEL_NOT_FOUND' && reason !== 'MODEL_OVERLOADED') break;
    }
  }

  const classified = classifyProviderError(lastError);
  if (classified.reason === 'MODEL_NOT_FOUND') {
    const available = await listUsableModels(apiKey);
    // A candidate rejected as "not found" that still appears in the account's own
    // listing was never actually missing: the provider is misbehaving under load.
    const stillListed = MODEL_CANDIDATES.some((model) => available.includes(model));
    console.error('scan-games model list', { tried: MODEL_CANDIDATES, available, stillListed });
    res.status(stillListed ? 503 : classified.status).json({ error: PUBLIC_SCAN_ERROR, code: 'SCAN_FAILED' });
    return;
  }
  res.status(classified.status).json({ error: PUBLIC_SCAN_ERROR, code: 'SCAN_FAILED' });
}
