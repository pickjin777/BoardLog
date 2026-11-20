import { describe, expect, it } from 'vitest';
import { PRODUCTION_ORIGIN } from '../config/appIdentity';
import { resolveApiUrl } from './apiOrigin';

describe('resolveApiUrl', () => {
  it('keeps a relative path in the browser', () => {
    expect(resolveApiUrl('/api/scan-games', false, 'http://ignored')).toBe('/api/scan-games');
  });

  it('sends a native shell to the production origin', () => {
    expect(resolveApiUrl('/api/scan-games', true, `${PRODUCTION_ORIGIN}/`)).toBe(
      'https://board-log.vercel.app/api/scan-games'
    );
  });

  it('rejects a relative path that is not rooted, and a native origin that is not https', () => {
    expect(() => resolveApiUrl('api/scan-games', false, PRODUCTION_ORIGIN)).toThrow(/must start with/);
    expect(() => resolveApiUrl('/api/scan-games', true, ' http://localhost ')).toThrow(/https/);
  });
});
