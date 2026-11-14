import { describe, expect, it } from 'vitest';
import { coverInitials } from './coverInitials';

describe('coverInitials', () => {
  it('uses the first syllable of a Korean title', () => {
    expect(coverInitials('스플렌더')).toBe('스');
    expect(coverInitials('  카탄 ')).toBe('카');
  });

  it('uses up to two Latin initials', () => {
    expect(coverInitials('Wingspan')).toBe('W');
    expect(coverInitials('terraforming mars')).toBe('TM');
  });

  it('falls back when the title is blank', () => {
    expect(coverInitials('   ')).toBe('보');
  });
});
