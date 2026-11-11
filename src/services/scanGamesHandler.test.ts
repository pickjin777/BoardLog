import { afterEach, describe, expect, it } from 'vitest';
import handler, { isScanConfigured, nativeShellAllowOrigin } from '../../api/scan-games';

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
