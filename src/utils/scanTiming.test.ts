import { describe, expect, it } from 'vitest';
import { SCAN_CANDIDATE_TIMEOUT_MS, SCAN_CLIENT_TIMEOUT_MS } from './scanPrompt';
import { isThinkingRejection, withCandidateTimeout } from './scanTiming';

describe('scan timing', () => {
  it('keeps the measured waits', () => {
    expect(SCAN_CANDIDATE_TIMEOUT_MS).toBe(10_000);
    expect(SCAN_CLIENT_TIMEOUT_MS).toBe(20_000);
  });

  it('returns the model result or a timeout, and still surfaces a real failure', async () => {
    await expect(withCandidateTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok');
    await expect(withCandidateTimeout(Promise.reject(new Error('not found')), 50)).rejects.toThrow('not found');
    const started = Date.now();
    await expect(withCandidateTimeout(new Promise(() => undefined), 20)).rejects.toThrow('timeout');
    expect(Date.now() - started).toBeLessThan(500);
  });

  it('treats an unsupported thinking block as retryable and a bad key as not', () => {
    expect(isThinkingRejection(Object.assign(new Error('thinking level is not supported'), { status: 400 }))).toBe(
      true
    );
    expect(isThinkingRejection(Object.assign(new Error('bad request'), { status: 400 }))).toBe(true);
    expect(isThinkingRejection(Object.assign(new Error('API key not valid'), { status: 400 }))).toBe(false);
    expect(isThinkingRejection(new Error('API_KEY_INVALID'))).toBe(false);
    expect(isThinkingRejection(new Error('invalid api key'))).toBe(false);
    expect(isThinkingRejection(Object.assign(new Error('overloaded'), { status: 503 }))).toBe(false);
    expect(isThinkingRejection('thinking level is not supported')).toBe(true);
  });
});
