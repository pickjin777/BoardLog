import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { isScanConfigured, nativeShellAllowOrigin } from '../../api/scan-games';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' },
  GoogleGenAI: class {
    models = {
      generateContent,
      list: async function* list() {
        yield* [];
      }
    };
  }
}));

const ORIGINAL = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIGINAL;
});

function capture() {
  const state: { status: number; body: unknown; headers: Record<string, string>; ended: boolean } = {
    status: 0,
    body: null,
    headers: {},
    ended: false
  };
  const res = {
    status(code: number) {
      state.status = code;
      return res;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    },
    json(payload: unknown) {
      state.body = payload;
    },
    end() {
      state.ended = true;
    }
  };
  return { state, res };
}

describe('scan-games availability', () => {
  it('treats a blank key as not configured', () => {
    expect(isScanConfigured(undefined)).toBe(false);
    expect(isScanConfigured('')).toBe(false);
    expect(isScanConfigured('   ')).toBe(false);
    expect(isScanConfigured('present')).toBe(true);
  });

  it('GET reports availability and does not echo the key', async () => {
    delete process.env.GEMINI_API_KEY;
    const off = capture();
    await handler({ method: 'GET' }, off.res);
    expect(off.state.status).toBe(200);
    expect(off.state.body).toEqual({ available: false });
    expect(off.state.headers).toEqual({});

    process.env.GEMINI_API_KEY = 'not-a-real-key';
    const on = capture();
    await handler({ method: 'GET' }, on.res);
    expect(on.state.status).toBe(200);
    expect(on.state.body).toEqual({ available: true });
    expect(JSON.stringify(on.state.body)).not.toContain('not-a-real-key');
  });

  it('POST without a key still stops before any photo is required', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = capture();
    await handler({ method: 'POST', body: {} }, res.res);
    expect(res.state.status).toBe(503);
    expect(res.state.body).toMatchObject({ code: 'NOT_CONFIGURED' });
  });
});

const oneImage = { data: 'QQ==', mimeType: 'image/jpeg' };

describe('one photo limit and multi-game parse', () => {
  afterEach(() => {
    generateContent.mockReset();
  });

  it('rejects a second photo before Gemini is called', async () => {
    process.env.GEMINI_API_KEY = 'not-a-real-key';
    const res = capture();
    await handler({ method: 'POST', body: { images: [oneImage, oneImage] } }, res.res);
    expect(res.state.status).toBe(400);
    expect(res.state.body).toEqual({ error: '사진은 한 장만 보낼 수 있습니다.', code: 'VALIDATION' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('parses every game from the one photo and drops a bad or duplicate row', async () => {
    process.env.GEMINI_API_KEY = 'not-a-real-key';
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        games: [
          { title: '카탄', confidence: 0.4 },
          { title: '카탄', confidence: 0.9 },
          { title: '스플렌더', confidence: 0.7 },
          { title: '', confidence: 1 },
          { title: '확신없음', confidence: '높음' }
        ]
      })
    });
    const res = capture();
    await handler({ method: 'POST', body: { images: [oneImage] } }, res.res);
    expect(res.state.status).toBe(200);
    expect(res.state.body).toEqual({
      games: [
        { title: '카탄', confidence: 0.9 },
        { title: '스플렌더', confidence: 0.7 }
      ]
    });
    expect(JSON.stringify(res.state.body)).not.toContain('not-a-real-key');
    const request = generateContent.mock.calls[0]?.[0] as {
      contents: { parts: { text?: string; inlineData?: unknown }[] }[];
      config: { responseSchema: { required: string[]; properties: { games: { items: { required: string[] } } } } };
    };
    const prompt = request.contents[0]?.parts[0]?.text ?? '';
    expect(prompt).toContain('one photograph');
    expect(prompt).toContain('"games"');
    expect(prompt).toContain('confidence');
    expect(request.contents[0]?.parts.filter((part) => part.inlineData)).toHaveLength(1);
    expect(request.config.responseSchema.required).toEqual(['games']);
    expect(request.config.responseSchema.properties.games.items.required).toEqual(['title', 'confidence']);
    expect(JSON.stringify(request.config.responseSchema)).not.toContain('orientation');
  });
});

describe('native shell CORS', () => {
  it('allows only the Capacitor local origins', () => {
    expect(nativeShellAllowOrigin(undefined)).toBeNull();
    expect(nativeShellAllowOrigin('https://evil.example')).toBeNull();
    expect(nativeShellAllowOrigin('https://localhost:3000')).toBeNull();
    expect(nativeShellAllowOrigin('https://localhost')).toBe('https://localhost');
    expect(nativeShellAllowOrigin('http://localhost')).toBe('http://localhost');
    expect(nativeShellAllowOrigin('capacitor://localhost')).toBe('capacitor://localhost');
    expect(nativeShellAllowOrigin(['https://localhost', 'https://evil.example'])).toBe('https://localhost');
  });

  it('answers a native preflight and leaves other origins untouched', async () => {
    const allowed = capture();
    await handler({ method: 'OPTIONS', headers: { origin: 'capacitor://localhost' } }, allowed.res);
    expect(allowed.state.status).toBe(204);
    expect(allowed.state.ended).toBe(true);
    expect(allowed.state.headers['Access-Control-Allow-Origin']).toBe('capacitor://localhost');
    expect(allowed.state.headers['Access-Control-Allow-Methods']).toContain('POST');

    const blocked = capture();
    await handler({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } }, blocked.res);
    expect(blocked.state.status).toBe(405);
    expect(blocked.state.headers).toEqual({});
  });

  it('adds the allow header on a native GET without changing the body', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = capture();
    await handler({ method: 'GET', headers: { origin: 'https://localhost' } }, res.res);
    expect(res.state.status).toBe(200);
    expect(res.state.body).toEqual({ available: false });
    expect(res.state.headers['Access-Control-Allow-Origin']).toBe('https://localhost');
    expect(res.state.headers.Vary).toBe('Origin');
  });
});
