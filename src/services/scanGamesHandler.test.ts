import { afterEach, describe, expect, it } from 'vitest';
import handler, { isScanConfigured } from '../../api/scan-games';

const ORIGINAL = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIGINAL;
});

function capture() {
  const state: { status: number; body: unknown } = { status: 0, body: null };
  const res = {
    status(code: number) {
      state.status = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
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
    expect(off.state).toEqual({ status: 200, body: { available: false } });

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
