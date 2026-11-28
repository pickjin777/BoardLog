import { describe, expect, it } from 'vitest';
import type { SeedGame } from '../types';
import { SEED_GAMES } from '../data/seedGames';
import {
  MAX_RECOGNIZED_GAMES,
  MAX_SCAN_IMAGES,
  ONE_PHOTO_LIMIT_MESSAGE,
  matchRecognizedGames,
  parseRecognizedGames,
  scanResultKind,
  scanResultMessage,
  scanTitleKey
} from './scanRecognition';

const seed = (id: string, title: string, titleEn = ''): SeedGame => ({
  ...SEED_GAMES[0],
  id,
  title,
  titleEn
});

const seeds = [seed('seed-catan', '카탄', 'Catan'), seed('seed-splendor', '스플렌더', 'Splendor')];

describe('scan photo limit', () => {
  it('allows a single photo and names the rejection', () => {
    expect(MAX_SCAN_IMAGES).toBe(1);
    expect(ONE_PHOTO_LIMIT_MESSAGE).toContain('한 장');
    expect(ONE_PHOTO_LIMIT_MESSAGE).not.toContain('4');
  });
});

describe('parseRecognizedGames', () => {
  it('reads a games array and an object wrapper, and ignores anything else', () => {
    const games = [{ title: '카탄', confidence: 0.8 }];
    expect(parseRecognizedGames(games)).toEqual(games);
    expect(parseRecognizedGames({ games, model: 'hidden' })).toEqual(games);
    expect(parseRecognizedGames(null)).toEqual([]);
    expect(parseRecognizedGames('카탄')).toEqual([]);
    expect(parseRecognizedGames({ games: 'nope' })).toEqual([]);
    expect(parseRecognizedGames({ detections: games })).toEqual([]);
  });

  it('drops rows that are not a title plus a finite confidence', () => {
    const parsed = parseRecognizedGames({
      games: [
        null,
        [],
        { title: '   ', confidence: 1 },
        { title: 'x'.repeat(81), confidence: 1 },
        { title: 3, confidence: 1 },
        { title: '확신없음', confidence: '0.9' },
        { title: '무한', confidence: Number.POSITIVE_INFINITY },
        { title: '비숫자', confidence: Number.NaN },
        { confidence: 0.5 },
        { title: '  카탄  ', confidence: 0.5, orientation: 'vertical', titleEn: 'Catan' }
      ]
    });
    expect(parsed).toEqual([{ title: '카탄', confidence: 0.5 }]);
  });

  it('clamps confidence and keeps the higher duplicate, including spacing variants', () => {
    expect(scanTitleKey('!!')).toBe('!!');
    expect(scanTitleKey('카탄!')).toBe(scanTitleKey('카탄'));
    const parsed = parseRecognizedGames([
      { title: '카탄', confidence: 0.4 },
      { title: '카탄!', confidence: 0.95 },
      { title: '카탄', confidence: 0.2 },
      { title: '낮은확신', confidence: -0.4 },
      { title: '높은확신', confidence: 1.8 },
      { title: '!!', confidence: 0.3 },
      { title: '!!', confidence: 0.3 }
    ]);
    expect(parsed).toEqual([
      { title: '카탄!', confidence: 0.95 },
      { title: '낮은확신', confidence: 0 },
      { title: '높은확신', confidence: 1 },
      { title: '!!', confidence: 0.3 }
    ]);
  });

  it('stops after the cap and still upgrades a title already kept', () => {
    const games = Array.from({ length: MAX_RECOGNIZED_GAMES + 2 }, (_, index) => ({
      title: `게임${index}`,
      confidence: 0.2
    }));
    games.push({ title: '게임0', confidence: 0.9 });
    const parsed = parseRecognizedGames(games);
    expect(parsed).toHaveLength(MAX_RECOGNIZED_GAMES);
    expect(parsed[0]).toEqual({ title: '게임0', confidence: 0.9 });
    expect(parsed.some((game) => game.title === `게임${MAX_RECOGNIZED_GAMES}`)).toBe(false);
  });
});

describe('matchRecognizedGames', () => {
  it('matches each title, prefers the seed name path, and drops a second hit of the same game', () => {
    const matched = matchRecognizedGames(
      [
        { title: '카탄', confidence: 0.9 },
        { title: 'CATAN', confidence: 0.4 },
        { title: 'Splendor', confidence: 0.8 },
        { title: '없는 게임', confidence: 0.6 },
        { title: '없는게임', confidence: 0.7 }
      ],
      seeds
    );
    expect(matched.map((candidate) => candidate.detection.title)).toEqual(['카탄', 'Splendor', '없는 게임']);
    expect(matched[0]?.match?.game.id).toBe('seed-catan');
    expect(matched[1]?.match?.game.title).toBe('스플렌더');
    expect(matched[2]?.match).toBeNull();
    expect(matched[0]?.id).toBe('scan_0_seed-catan');
    expect(matched[2]?.id).toBe('scan_3_없는게임');
  });

  it('returns nothing for an empty read', () => {
    expect(matchRecognizedGames([], seeds)).toEqual([]);
  });
});

describe('scan result copy', () => {
  const row = (matched: boolean) => ({ match: matched ? { game: seeds[0], score: 1 } : null });

  it('names empty, full, partial, and unmatched shelves', () => {
    expect(scanResultKind([])).toBe('empty');
    expect(scanResultKind([row(true), row(true)])).toBe('matched');
    expect(scanResultKind([row(true), row(false)])).toBe('partial');
    expect(scanResultKind([row(false)])).toBe('unmatched');
    expect(scanResultMessage('empty')).toContain('찾지 못했습니다');
    expect(scanResultMessage('partial')).toContain('일부만');
    expect(scanResultMessage('matched')).toContain('모두');
    expect(scanResultMessage('unmatched')).toContain('목록에 없습니다');
  });
});
