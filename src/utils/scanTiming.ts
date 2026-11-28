import { SCAN_CANDIDATE_TIMEOUT_MS } from './scanPrompt';

/**
 * Stops waiting on one model. The loser keeps running, but the caller moves on.
 * The rejected error message is the word "timeout" so the server can classify it.
 */
export function withCandidateTimeout<T>(work: Promise<T>, ms = SCAN_CANDIDATE_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error('timeout'), { status: 504 }));
    }, ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** A 400 from an unsupported thinking block. A bad key is not this, and must not be retried as one. */
export function isThinkingRejection(err: unknown): boolean {
  const text = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (text.includes('api key') || text.includes('api_key_invalid') || text.includes('invalid api key')) return false;
  if (text.includes('thinking')) return true;
  const status = (err as { status?: unknown }).status;
  return status === 400;
}
