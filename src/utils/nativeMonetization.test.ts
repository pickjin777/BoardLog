import { describe, expect, it } from 'vitest';
import {
  assertGoogleSampleAdId,
  GOOGLE_TEST_ADMOB_APP_ID,
  GOOGLE_TEST_ADMOB_BANNER_ID,
  shouldPrepareNativeFeature
} from './nativeMonetization';

describe('native monetization flags', () => {
  it('stays off unless the shell is native and the flag is the string true', () => {
    expect(shouldPrepareNativeFeature(false, 'true')).toBe(false);
    expect(shouldPrepareNativeFeature(true, undefined)).toBe(false);
    expect(shouldPrepareNativeFeature(true, 'false')).toBe(false);
    expect(shouldPrepareNativeFeature(true, 'TRUE')).toBe(false);
    expect(shouldPrepareNativeFeature(true, 'true')).toBe(true);
  });

  it('accepts only Google sample ad ids', () => {
    expect(() => assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_APP_ID)).not.toThrow();
    expect(() => assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_BANNER_ID)).not.toThrow();
    expect(() => assertGoogleSampleAdId('not-a-google-sample')).toThrow(/Google sample/);
  });
});
