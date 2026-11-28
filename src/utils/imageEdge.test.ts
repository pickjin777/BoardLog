import { describe, expect, it } from 'vitest';
import { SCAN_IMAGE_MAX_EDGE } from './imageCompressor';

describe('scan image edge', () => {
  it('stays at 1600px', () => {
    expect(SCAN_IMAGE_MAX_EDGE).toBe(1600);
  });
});
