import { describe, expect, it } from 'vitest';
import { ageBandLabel, allowsOffDeviceCollection, parseAgeBand } from './ageGate';

describe('parseAgeBand', () => {
  it('keeps the two real bands and treats everything else as unset', () => {
    expect(parseAgeBand('under_14')).toBe('under_14');
    expect(parseAgeBand('14_or_over')).toBe('14_or_over');
    expect(parseAgeBand(null)).toBe('unset');
    expect(parseAgeBand(undefined)).toBe('unset');
    expect(parseAgeBand('')).toBe('unset');
    expect(parseAgeBand('adult')).toBe('unset');
    expect(parseAgeBand(14)).toBe('unset');
  });
});

describe('allowsOffDeviceCollection', () => {
  it('allows transmission only for 14 or older', () => {
    expect(allowsOffDeviceCollection('14_or_over')).toBe(true);
    expect(allowsOffDeviceCollection('under_14')).toBe(false);
    expect(allowsOffDeviceCollection('unset')).toBe(false);
  });
});

describe('ageBandLabel', () => {
  it('uses the words shown on the age screen', () => {
    expect(ageBandLabel('14_or_over')).toBe('만 14세 이상');
    expect(ageBandLabel('under_14')).toBe('만 14세 미만');
    expect(ageBandLabel('unset')).toBe('아직 선택하지 않음');
  });
});
