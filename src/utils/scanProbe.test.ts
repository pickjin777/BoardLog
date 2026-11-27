import { describe, expect, it, vi } from 'vitest';
import { SCAN_PROBE_TIMEOUT_MS, probeScanServer, settleWithin } from './scanProbe';

const url = 'https://board-log.vercel.app/api/scan-games';

function response(status: number, body: unknown, jsonHang = false): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => (jsonHang ? new Promise(() => undefined) : Promise.resolve(body))
  } as unknown as Response;
}

describe('settleWithin', () => {
  it('returns the value, the fallback on rejection, and the fallback on a stall', async () => {
    await expect(settleWithin(Promise.resolve('ok'), 50, 'late')).resolves.toBe('ok');
    await expect(settleWithin(Promise.reject(new Error('no')), 50, 'down')).resolves.toBe('down');
    const started = Date.now();
    await expect(settleWithin(new Promise(() => undefined), 40, 'down')).resolves.toBe('down');
    expect(Date.now() - started).toBeLessThan(500);
  });
});

describe('probeScanServer', () => {
  it('uses the documented timeout', () => {
    expect(SCAN_PROBE_TIMEOUT_MS).toBe(5000);
  });

  it('reads a normal available response and treats 405 as off', async () => {
    const fetchImpl = vi.fn(async () => response(200, { available: true }));
    await expect(probeScanServer(url, { fetchImpl })).resolves.toBe(true);

    const denied = vi.fn(async () => response(405, { error: '허용되지 않은 요청입니다.' }));
    await expect(probeScanServer(url, { fetchImpl: denied, timeoutMs: 200 })).resolves.toBe(false);
  });

  it('does not wait when CapacitorHttp never settles', async () => {
    const nativeRequest = vi.fn(() => new Promise<never>(() => undefined));
    const fetchImpl = vi.fn();
    const started = Date.now();
    await expect(probeScanServer(url, { nativeRequest, fetchImpl, timeoutMs: 40 })).resolves.toBe(false);
    expect(Date.now() - started).toBeLessThan(500);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('treats a native 405 as off and a native available body as on', async () => {
    await expect(
      probeScanServer(url, {
        nativeRequest: async () => ({ status: 405, data: { error: 'no' } })
      })
    ).resolves.toBe(false);
    await expect(
      probeScanServer(url, {
        nativeRequest: async () => ({ status: 200, data: { available: true } })
      })
    ).resolves.toBe(true);
    await expect(probeScanServer(url, { nativeRequest: async () => ({ data: { available: true } }) })).resolves.toBe(
      false
    );
    await expect(
      probeScanServer(url, {
        nativeRequest: async () => {
          throw new Error('bridge');
        }
      })
    ).resolves.toBe(false);
  });

  it('treats a thrown fetch, a non-JSON body, and a json() that never returns as off', async () => {
    await expect(
      probeScanServer(url, {
        fetchImpl: async () => {
          throw new Error('down');
        },
        timeoutMs: 50
      })
    ).resolves.toBe(false);
    await expect(
      probeScanServer(url, {
        fetchImpl: async () => response(405, null),
        timeoutMs: 50
      })
    ).resolves.toBe(false);
    await expect(
      probeScanServer(url, {
        fetchImpl: async () =>
          ({
            status: 405,
            json: async () => {
              throw new Error('not json');
            }
          }) as unknown as Response,
        timeoutMs: 50
      })
    ).resolves.toBe(false);
    const started = Date.now();
    await expect(
      probeScanServer(url, {
        fetchImpl: async () => response(405, null, true),
        timeoutMs: 40
      })
    ).resolves.toBe(false);
    expect(Date.now() - started).toBeLessThan(500);
    await expect(
      probeScanServer(url, {
        fetchImpl: () => new Promise(() => undefined),
        timeoutMs: 40
      })
    ).resolves.toBe(false);
  });
});
