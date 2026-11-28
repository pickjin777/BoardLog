import { describe, expect, it, vi } from 'vitest';
import {
  UserGeminiError,
  buildGenerateBody,
  classifyGeminiStatus,
  geminiGenerateUrl,
  geminiKeyFailureMessage,
  geminiKeyHeader,
  geminiModelsUrl,
  readGamesWithUserKey,
  textFromGeminiResponse,
  verifyUserGeminiKey
} from './geminiDirect';

const SECRET = 'device-key-for-tests';
const image = { data: 'QQ==', mimeType: 'image/jpeg' };

function response(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body ?? '');
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => text
  } as unknown as Response;
}

function hangUntilAbort(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) {
      reject(new Error('no signal'));
      return;
    }
    if (signal.aborted) {
      reject(new Error('aborted'));
      return;
    }
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
}

describe('gemini status and urls', () => {
  it('classifies key, quota, offline, success, and other failures', () => {
    expect(classifyGeminiStatus(0)).toBe('offline');
    expect(classifyGeminiStatus(400)).toBe('invalid');
    expect(classifyGeminiStatus(401)).toBe('invalid');
    expect(classifyGeminiStatus(403)).toBe('invalid');
    expect(classifyGeminiStatus(429)).toBe('limited');
    expect(classifyGeminiStatus(200)).toBe('ok');
    expect(classifyGeminiStatus(204)).toBe('ok');
    expect(classifyGeminiStatus(404)).toBe('failed');
    expect(classifyGeminiStatus(500)).toBe('failed');
  });

  it('names each failure in Korean and keeps the key out of the sentence', () => {
    for (const kind of ['invalid', 'limited', 'offline', 'failed', 'timeout'] as const) {
      const message = geminiKeyFailureMessage(kind);
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toContain(SECRET);
      expect(new UserGeminiError(kind).message).toBe(message);
    }
  });

  it('puts the key in a header, not the address or the photo body', () => {
    expect(geminiModelsUrl()).not.toContain(SECRET);
    expect(geminiGenerateUrl('gemini-2.5-flash')).toContain('generativelanguage.googleapis.com');
    expect(geminiGenerateUrl('gemini-2.5-flash')).not.toContain(SECRET);
    const body = JSON.stringify(buildGenerateBody(image));
    expect(body).toContain('one photo');
    expect(body).toContain('"thinkingLevel":"minimal"');
    expect(JSON.stringify(buildGenerateBody(image, false))).not.toContain('thinkingLevel');
    expect(body).toContain('inlineData');
    expect(body).toContain('QQ==');
    expect(body).not.toContain(SECRET);
    const dotted = 'AQ.ab.cd-ef_12';
    expect(geminiKeyHeader(dotted)['x-goog-api-key']).toBe(dotted);
    expect(JSON.stringify(geminiKeyHeader(dotted))).not.toContain('%2E');
  });
});

describe('textFromGeminiResponse', () => {
  it('reads joined text and drops everything else', () => {
    expect(textFromGeminiResponse('nope')).toBeNull();
    expect(textFromGeminiResponse(null)).toBeNull();
    expect(textFromGeminiResponse({})).toBeNull();
    expect(textFromGeminiResponse({ candidates: 'no' })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [] })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [{}] })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [{ content: null }] })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [{ content: { parts: 'no' } }] })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [{ content: { parts: [null, { text: 1 }] } }] })).toBeNull();
    expect(textFromGeminiResponse({ candidates: [{ content: { parts: [{ text: '  ' }] } }] })).toBeNull();
    expect(
      textFromGeminiResponse({
        candidates: [{ content: { parts: [{ text: '{"games":[]}' }, { text: '' }] } }]
      })
    ).toBe('{"games":[]}');
  });
});

describe('verifyUserGeminiKey', () => {
  it('rejects a short key without calling the network', async () => {
    const fetchImpl = vi.fn();
    await expect(verifyUserGeminiKey('short', fetchImpl)).rejects.toMatchObject({ kind: 'invalid' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts a listed key and classifies 401, 429, 500, and a dropped connection', async () => {
    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(200, { models: [] }));
    await verifyUserGeminiKey(`  ${SECRET}  `, fetchImpl);
    expect(String(fetchImpl.mock.calls[0]?.[0])).not.toContain(SECRET);
    expect(fetchImpl.mock.calls[0]?.[1]?.headers['x-goog-api-key']).toBe(SECRET);

    fetchImpl.mockResolvedValueOnce(response(401, { error: SECRET }));
    await expect(verifyUserGeminiKey(SECRET, fetchImpl)).rejects.toMatchObject({ kind: 'invalid' });

    fetchImpl.mockResolvedValueOnce(response(429, {}));
    await expect(verifyUserGeminiKey(SECRET, fetchImpl)).rejects.toMatchObject({ kind: 'limited' });

    fetchImpl.mockResolvedValueOnce(response(500, {}));
    await expect(verifyUserGeminiKey(SECRET, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });

    fetchImpl.mockRejectedValueOnce(new Error(`network ${SECRET}`));
    await expect(verifyUserGeminiKey(SECRET, fetchImpl)).rejects.toMatchObject({
      kind: 'offline',
      message: expect.not.stringContaining(SECRET)
    });
  });
});

const gamesBody = (text: string) => response(200, { candidates: [{ content: { parts: [{ text }] } }] });

describe('readGamesWithUserKey', () => {
  it('retries a missing model and returns the parsed games', async () => {
    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(404, {}));
    fetchImpl.mockResolvedValueOnce(gamesBody('{"games":[{"title":"카탄","confidence":0.9}]}'));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).resolves.toEqual({
      games: [{ title: '카탄', confidence: 0.9 }]
    });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('gemini-3.1-flash-lite');
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain('gemini-flash-lite-latest');
    expect(String(fetchImpl.mock.calls[1]?.[0])).not.toContain(SECRET);
    expect(String(fetchImpl.mock.calls[1]?.[1]?.body)).not.toContain(SECRET);
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toContain('"thinkingLevel":"minimal"');
  });

  it('asks again without thinking when the model rejects it, and stops on a bad key', async () => {
    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(400, { error: { message: 'thinking level is not supported' } }));
    fetchImpl.mockResolvedValueOnce(gamesBody('{"games":[]}'));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).resolves.toEqual({ games: [] });
    expect(String(fetchImpl.mock.calls[1]?.[1]?.body)).not.toContain('thinkingLevel');

    const rejected = vi.fn();
    rejected.mockResolvedValueOnce(response(400, { error: { message: 'API key not valid' } }));
    await expect(readGamesWithUserKey(SECRET, image, rejected)).rejects.toMatchObject({
      kind: 'invalid',
      message: expect.not.stringContaining(SECRET)
    });
    expect(rejected).toHaveBeenCalledTimes(1);

    const coded = vi.fn();
    coded.mockResolvedValueOnce(response(400, { error: { status: 'API_KEY_INVALID' } }));
    await expect(readGamesWithUserKey(SECRET, image, coded)).rejects.toMatchObject({ kind: 'invalid' });
    expect(coded).toHaveBeenCalledTimes(1);

    const again = vi.fn();
    again.mockResolvedValueOnce(response(400, { error: { message: 'thinkingConfig rejected' } }));
    again.mockResolvedValueOnce(response(400, { error: { message: 'still bad' } }));
    await expect(readGamesWithUserKey(SECRET, image, again)).rejects.toMatchObject({ kind: 'invalid' });
    expect(again).toHaveBeenCalledTimes(2);
  });

  it('moves on after 429, 503, or a slow model, and stops on other failures', async () => {
    const limitedThenOk = vi.fn();
    limitedThenOk.mockResolvedValueOnce(response(429, {}));
    limitedThenOk.mockResolvedValueOnce(gamesBody('{"games":[]}'));
    await expect(readGamesWithUserKey(SECRET, image, limitedThenOk)).resolves.toEqual({ games: [] });

    const limited = vi.fn().mockResolvedValue(response(429, {}));
    await expect(readGamesWithUserKey(SECRET, image, limited)).rejects.toMatchObject({ kind: 'limited' });
    expect(limited).toHaveBeenCalledTimes(3);

    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(401, { error: { message: SECRET } }));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({
      kind: 'invalid',
      message: expect.not.stringContaining(SECRET)
    });

    fetchImpl.mockResolvedValueOnce(response(500, {}));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });

    fetchImpl.mockResolvedValueOnce(response(200, { candidates: [] }));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });

    fetchImpl.mockResolvedValueOnce(response(200, { candidates: [{ content: { parts: [{ text: 'not-json' }] } }] }));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });

    fetchImpl.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => {
        throw new Error('broken');
      }
    } as unknown as Response);
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });

    const unreadable = vi.fn();
    unreadable.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: async () => {
        throw new Error('no body');
      }
    } as unknown as Response);
    unreadable.mockResolvedValueOnce(response(401, {}));
    await expect(readGamesWithUserKey(SECRET, image, unreadable)).rejects.toMatchObject({ kind: 'invalid' });
    expect(unreadable).toHaveBeenCalledTimes(2);
  });

  it('reports offline when the connection drops, and failure when every model is missing', async () => {
    const dropped = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(readGamesWithUserKey(SECRET, image, dropped)).rejects.toMatchObject({ kind: 'offline' });

    const missing = vi.fn().mockResolvedValue(response(404, {}));
    await expect(readGamesWithUserKey(SECRET, image, missing)).rejects.toMatchObject({ kind: 'failed' });
    expect(missing).toHaveBeenCalledTimes(3);

    const overloaded = vi.fn();
    overloaded.mockResolvedValueOnce(response(503, {}));
    overloaded.mockResolvedValueOnce(gamesBody('{"games":[]}'));
    await expect(readGamesWithUserKey(SECRET, image, overloaded)).resolves.toEqual({ games: [] });

    const slow = vi.fn();
    slow.mockImplementationOnce(hangUntilAbort);
    slow.mockResolvedValueOnce(gamesBody('{"games":[]}'));
    await expect(
      readGamesWithUserKey(SECRET, image, slow, { candidateTimeoutMs: 20, clientTimeoutMs: 2_000 })
    ).resolves.toEqual({ games: [] });

    const plainThenOffline = vi.fn();
    plainThenOffline.mockResolvedValueOnce(response(400, { error: { message: 'thinking level is not supported' } }));
    plainThenOffline.mockRejectedValueOnce(new Error('offline'));
    await expect(readGamesWithUserKey(SECRET, image, plainThenOffline)).rejects.toMatchObject({ kind: 'offline' });

    const plainThenSlow = vi.fn();
    plainThenSlow.mockResolvedValueOnce(response(400, { error: { message: 'thinking level is not supported' } }));
    plainThenSlow.mockImplementationOnce(hangUntilAbort);
    plainThenSlow.mockResolvedValueOnce(gamesBody('{"games":[]}'));
    await expect(
      readGamesWithUserKey(SECRET, image, plainThenSlow, { candidateTimeoutMs: 20, clientTimeoutMs: 2_000 })
    ).resolves.toEqual({ games: [] });
  });

  it('stops when the whole wait is already over or the caller aborts', async () => {
    const fetchImpl = vi.fn();
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl, { clientTimeoutMs: 0 })).rejects.toMatchObject({
      kind: 'timeout'
    });
    expect(fetchImpl).not.toHaveBeenCalled();

    const parent = new AbortController();
    parent.abort();
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl, { signal: parent.signal })).rejects.toMatchObject({
      kind: 'timeout'
    });
    expect(fetchImpl).not.toHaveBeenCalled();

    const live = new AbortController();
    const hanging = vi.fn();
    hanging.mockImplementation((_input: unknown, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        setTimeout(() => live.abort(), 15);
      });
    });
    await expect(
      readGamesWithUserKey(SECRET, image, hanging, {
        signal: live.signal,
        candidateTimeoutMs: 5_000,
        clientTimeoutMs: 5_000
      })
    ).rejects.toMatchObject({ kind: 'timeout', message: expect.stringContaining('다시 시도') });
    expect(hanging).toHaveBeenCalledTimes(1);
  });
});
