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
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body
  } as unknown as Response;
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
    for (const kind of ['invalid', 'limited', 'offline', 'failed'] as const) {
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
    expect(body).toContain('one photograph');
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

describe('readGamesWithUserKey', () => {
  it('retries a missing model and returns the parsed games', async () => {
    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(404, {}));
    fetchImpl.mockResolvedValueOnce(
      response(200, {
        candidates: [{ content: { parts: [{ text: '{"games":[{"title":"카탄","confidence":0.9}]}' }] } }]
      })
    );
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).resolves.toEqual({
      games: [{ title: '카탄', confidence: 0.9 }]
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).not.toContain(SECRET);
    expect(String(fetchImpl.mock.calls[1]?.[1]?.body)).not.toContain(SECRET);
  });

  it('stops on a bad key, a quota, a server error, bad json, and an empty read', async () => {
    const fetchImpl = vi.fn();
    fetchImpl.mockResolvedValueOnce(response(401, { error: { message: SECRET } }));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({
      kind: 'invalid',
      message: expect.not.stringContaining(SECRET)
    });

    fetchImpl.mockResolvedValueOnce(response(429, {}));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'limited' });

    fetchImpl.mockResolvedValueOnce(response(500, {}));
    await expect(readGamesWithUserKey(SECRET, image, fetchImpl)).rejects.toMatchObject({ kind: 'failed' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);

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
  });

  it('reports offline when the connection drops, and failure when every model is missing', async () => {
    const dropped = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(readGamesWithUserKey(SECRET, image, dropped)).rejects.toMatchObject({ kind: 'offline' });

    const missing = vi.fn().mockResolvedValue(response(404, {}));
    await expect(readGamesWithUserKey(SECRET, image, missing)).rejects.toMatchObject({ kind: 'failed' });
    expect(missing).toHaveBeenCalledTimes(3);

    const overloaded = vi.fn();
    overloaded.mockResolvedValueOnce(response(503, {}));
    overloaded.mockResolvedValueOnce(
      response(200, { candidates: [{ content: { parts: [{ text: '{"games":[]}' }] } }] })
    );
    await expect(readGamesWithUserKey(SECRET, image, overloaded)).resolves.toEqual({ games: [] });
  });
});
