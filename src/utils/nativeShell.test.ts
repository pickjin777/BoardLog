import { describe, expect, it } from 'vitest';
import { isNativeShell, shouldRegisterOfflineShell } from './nativeShell';

describe('native shell detection', () => {
  it('is native only when the Capacitor bridge says so', () => {
    expect(isNativeShell()).toBe(false);
    expect(isNativeShell({})).toBe(false);
    expect(isNativeShell({ Capacitor: {} })).toBe(false);
    expect(isNativeShell({ Capacitor: { isNativePlatform: () => false } })).toBe(false);
    expect(isNativeShell({ Capacitor: { isNativePlatform: () => true } })).toBe(true);
  });

  it('registers the offline worker only for a production web build', () => {
    expect(shouldRegisterOfflineShell(true, false)).toBe(true);
    expect(shouldRegisterOfflineShell(true, true)).toBe(false);
    expect(shouldRegisterOfflineShell(false, false)).toBe(false);
    expect(shouldRegisterOfflineShell(false, true)).toBe(false);
  });
});
