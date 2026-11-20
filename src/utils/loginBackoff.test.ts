import { describe, expect, it } from 'vitest';
import { loginFailureDelayMs } from './loginBackoff';

describe('loginFailureDelayMs', () => {
  it('does not wait on the first miss', () => {
    expect(loginFailureDelayMs(0)).toBe(0);
    expect(loginFailureDelayMs(-1)).toBe(0);
    expect(loginFailureDelayMs(Number.NaN)).toBe(0);
  });

  it('doubles after each further miss and then stops growing', () => {
    expect(loginFailureDelayMs(1)).toBe(400);
    expect(loginFailureDelayMs(2)).toBe(800);
    expect(loginFailureDelayMs(3)).toBe(1600);
    expect(loginFailureDelayMs(6)).toBe(8000);
    expect(loginFailureDelayMs(12)).toBe(8000);
  });
});
