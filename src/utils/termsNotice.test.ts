import { describe, expect, it } from 'vitest';
import { shouldAnnounceTermsChange, TERMS_VERSION } from './termsNotice';

describe('shouldAnnounceTermsChange', () => {
  it('stays quiet on the first launch and when the stored version matches', () => {
    expect(shouldAnnounceTermsChange(null)).toBe(false);
    expect(shouldAnnounceTermsChange('')).toBe(false);
    expect(shouldAnnounceTermsChange(TERMS_VERSION)).toBe(false);
  });

  it('announces when a previously stored version is no longer current', () => {
    expect(shouldAnnounceTermsChange('2026-01-01')).toBe(true);
    expect(shouldAnnounceTermsChange('2026-01-01', '2026-11-24')).toBe(true);
    expect(shouldAnnounceTermsChange('2026-11-24', '2026-11-24')).toBe(false);
  });
});
