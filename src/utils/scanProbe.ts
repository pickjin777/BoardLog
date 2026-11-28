import { scanAvailableFromResponse } from './scanAvailability';

/** Long enough for a slow phone, short enough that a stuck native proxy cannot trap the sheet. */
export const SCAN_PROBE_TIMEOUT_MS = 5000;

export interface NativeHttpResult {
  status?: number;
  data?: unknown;
}

/**
 * Resolves with `fallback` if `work` does not settle in time.
 * Aborting the request is not enough: Capacitor's GET proxy can ignore abort and never settle.
 */
export function settleWithin<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

export interface ScanProbeOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Set on the Android shell. Bypasses the WebView GET interceptor, which can hang on a 405. */
  nativeRequest?: (url: string) => Promise<NativeHttpResult>;
}

/** True only for HTTP 200 `{ available: true }`. 405, a bad body, a throw, or a timeout are all off. */
export async function probeScanServer(url: string, options: ScanProbeOptions = {}): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? SCAN_PROBE_TIMEOUT_MS;
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (options.nativeRequest) {
      const native = await settleWithin(options.nativeRequest(url), timeoutMs, null);
      if (!native || typeof native.status !== 'number') return false;
      return scanAvailableFromResponse(native.status, native.data ?? null);
    }
    const fetchImpl = options.fetchImpl ?? fetch;
    const response = await settleWithin(fetchImpl(url, { method: 'GET', signal: controller.signal }), timeoutMs, null);
    if (!response) return false;
    const body = await settleWithin(
      response.json().then(
        (value) => value as unknown,
        () => null
      ),
      timeoutMs,
      null
    );
    return scanAvailableFromResponse(response.status, body);
  } catch {
    return false;
  } finally {
    clearTimeout(abortTimer);
    controller.abort();
  }
}
