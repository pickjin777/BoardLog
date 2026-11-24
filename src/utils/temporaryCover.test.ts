import { describe, expect, it } from 'vitest';
import { SEED_GAMES } from '../data/seedGames';
import {
  COVER_CREAM,
  COVER_NAVY,
  COVER_TEXT_WIDTH,
  TEMPORARY_COVER_NOTICE,
  coverDisplayName,
  estimatedCoverWidth,
  layoutCoverTitle
} from './temporaryCover';

function contrast(hex: string, on: string): number {
  const lum = (value: string) => {
    const n = Number.parseInt(value.slice(1), 16);
    const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((channel) => {
      const s = channel / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const lighter = Math.max(lum(hex), lum(on));
  const darker = Math.min(lum(hex), lum(on));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('temporary cover names', () => {
  it('states that the art is temporary and not a publisher image', () => {
    expect(TEMPORARY_COVER_NOTICE).toContain('임시 표지');
    expect(TEMPORARY_COVER_NOTICE).toContain('허락');
  });

  it('uses a Korean name, then the stored title', () => {
    expect(coverDisplayName('Wingspan', '윙스팬')).toBe('윙스팬');
    expect(coverDisplayName('  카탄  ')).toBe('카탄');
    expect(coverDisplayName('Wingspan', '   ')).toBe('Wingspan');
    expect(coverDisplayName('Wingspan', 'Board Game')).toBe('Wingspan');
    expect(coverDisplayName('   ', 'Board Game')).toBe('Board Game');
    expect(coverDisplayName('  ', '  ')).toBe('이름 없음');
  });

  it('keeps cream on navy at WCAG AA', () => {
    expect(contrast(COVER_CREAM, COVER_NAVY)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#E2B657', COVER_NAVY)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(COVER_CREAM, '#3A2C22')).toBeGreaterThanOrEqual(4.5);
  });

  it('wraps long names onto two or three lines and shrinks the type', () => {
    const short = layoutCoverTitle('카탄');
    const long = layoutCoverTitle('로빈슨 크루소: 저주받은 섬의 모험');
    expect(short.lines).toEqual(['카탄']);
    expect(short.fontSize).toBeGreaterThan(long.fontSize);
    expect(long.lines.length).toBeGreaterThanOrEqual(2);
    expect(long.lines.length).toBeLessThanOrEqual(3);
    expect(long.lines.join(' ')).toBe('로빈슨 크루소: 저주받은 섬의 모험');
    for (const line of long.lines) {
      expect(estimatedCoverWidth(line, long.fontSize)).toBeLessThanOrEqual(COVER_TEXT_WIDTH);
    }
  });

  it('fits every seed title into the temporary cover', () => {
    expect(SEED_GAMES).toHaveLength(300);
    for (const game of SEED_GAMES) {
      const layout = layoutCoverTitle(game.title);
      expect(layout.lines.length, game.title).toBeLessThanOrEqual(3);
      expect(layout.lines.length, game.title).toBeGreaterThan(0);
      const shown = layout.lines.join('').replace(/\s/g, '');
      const compact = game.title.replace(/\s/g, '');
      expect(shown.startsWith(compact.slice(0, 4)) || layout.lines.some((line) => line.includes('…')), game.title).toBe(
        true
      );
      for (const line of layout.lines) {
        expect(estimatedCoverWidth(line.replace('…', ''), layout.fontSize), game.title).toBeLessThanOrEqual(
          COVER_TEXT_WIDTH + 1
        );
      }
    }
  });

  it('clips a single very long token onto three lines', () => {
    const layout = layoutCoverTitle('가'.repeat(80));
    expect(layout.lines).toHaveLength(3);
    expect(layout.lines[2].endsWith('…')).toBe(true);
    expect(layout.fontSize).toBe(15);
  });
});
