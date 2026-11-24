import { describe, expect, it } from 'vitest';
import { SEED_GAMES } from '../data/seedGames';
import {
  CHEST_CATALOG,
  CHEST_KINDS,
  COVER_CREAM,
  COVER_INK,
  COVER_NAVY,
  COVER_TEXT_WIDTH,
  TEMPORARY_COVER_NOTICE,
  chestKindFor,
  coverLabels,
  coverDisplayName,
  isForbiddenPurple,
  labelsForGameTitle,
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

  it('wraps long names onto one or two lines and shrinks the type', () => {
    const short = layoutCoverTitle('카탄');
    const long = layoutCoverTitle('로빈슨 크루소: 저주받은 섬의 모험');
    expect(short.lines).toEqual(['카탄']);
    expect(short.fontSize).toBeGreaterThan(long.fontSize);
    expect(long.lines.length).toBeGreaterThanOrEqual(1);
    expect(long.lines.length).toBeLessThanOrEqual(2);
    const rebuilt = long.lines.join(' ').replace('…', '');
    expect(
      long.lines.join(' ') === '로빈슨 크루소: 저주받은 섬의 모험' ||
        rebuilt.length < '로빈슨 크루소: 저주받은 섬의 모험'.length
    ).toBe(true);
    for (const line of long.lines) {
      expect(estimatedCoverWidth(line, long.fontSize)).toBeLessThanOrEqual(COVER_TEXT_WIDTH);
    }
  });

  it('fits every seed title into the temporary cover', () => {
    expect(SEED_GAMES).toHaveLength(300);
    for (const game of SEED_GAMES) {
      const layout = layoutCoverTitle(game.title);
      expect(layout.lines.length, game.title).toBeLessThanOrEqual(2);
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

  it('clips a single very long token onto two lines', () => {
    const layout = layoutCoverTitle('가'.repeat(80));
    expect(layout.lines).toHaveLength(2);
    expect(layout.lines[1].endsWith('…')).toBe(true);
    expect(layout.fontSize).toBe(12);
  });

  it('picks a chest from genre labels and leaves unknown labels on the default', () => {
    expect(chestKindFor(['파티'])).toBe('party');
    expect(chestKindFor(['사회적추리'])).toBe('social');
    expect(chestKindFor(['헤비전략'])).toBe('strategy');
    expect(chestKindFor(['협력'])).toBe('cooperative');
    expect(chestKindFor(['덱빌딩'])).toBe('deck');
    expect(chestKindFor(['일꾼배치'])).toBe('worker');
    expect(chestKindFor(['던전크롤러'])).toBe('dungeon');
    expect(chestKindFor(['철도'])).toBe('train');
    expect(chestKindFor(['가족', '전략'])).toBe('family');
    expect(chestKindFor(['타일배치'])).toBe('abstract');
    expect(chestKindFor(['주사위'])).toBe('dice');
    expect(chestKindFor(['단어'])).toBe('word');
    expect(chestKindFor(['경제'])).toBe('economic');
    expect(chestKindFor(['공포'])).toBe('horror');
    expect(coverLabels({ genre: ['협력'], tags: ['캠페인'] })).toEqual(['협력', '캠페인']);
    expect(labelsForGameTitle('팬데믹', 'g1', [{ id: 'g1', title: '다른 이름', genre: ['협력'] }])).toEqual(['협력']);
    expect(chestKindFor(['고양이'])).toBe('animal');
    expect(chestKindFor(['정치'])).toBe('default');
    expect(chestKindFor([])).toBe('default');
    expect(chestKindFor(undefined)).toBe('default');
    expect(contrast(COVER_INK, COVER_CREAM)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps chest colors out of purple and gives each genre its own emblem', () => {
    const emblems = new Set<string>();
    for (const spec of CHEST_CATALOG) {
      emblems.add(spec.emblem);
      for (const hex of [spec.body, spec.lid, spec.accent]) {
        expect(isForbiddenPurple(hex), `${spec.id} ${hex}`).toBe(false);
      }
    }
    expect(emblems.size).toBe(CHEST_CATALOG.length);
    expect(contrast(COVER_INK, COVER_CREAM)).toBeGreaterThanOrEqual(4.5);
  });

  it('assigns every seed game a known chest', () => {
    const counts = new Map<string, number>();
    for (const game of SEED_GAMES) {
      const kind = chestKindFor(game.genre);
      expect(CHEST_KINDS).toContain(kind);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    expect([...counts.values()].reduce((sum, n) => sum + n, 0)).toBe(300);
    expect(counts.get('default')).toBeGreaterThan(0);
    expect(counts.get('strategy')).toBeGreaterThan(0);
  });
});
