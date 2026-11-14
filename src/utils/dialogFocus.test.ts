import { describe, expect, it } from 'vitest';
import { cycleIndex } from './dialogFocus';

describe('cycleIndex', () => {
  it('wraps forward and backward', () => {
    expect(cycleIndex(3, 0, false)).toBe(1);
    expect(cycleIndex(3, 2, false)).toBe(0);
    expect(cycleIndex(3, -1, false)).toBe(0);
    expect(cycleIndex(3, 0, true)).toBe(2);
    expect(cycleIndex(3, -1, true)).toBe(2);
    expect(cycleIndex(3, 2, true)).toBe(1);
  });

  it('has nowhere to go when the dialog has no controls', () => {
    expect(cycleIndex(0, 0, false)).toBe(-1);
  });
});
