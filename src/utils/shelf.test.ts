import { describe, expect, it } from 'vitest';
import type { PlayRecord, UserGame } from '../types';
import {
  activitySummary,
  cleanMemo,
  cleanTags,
  isWishlist,
  mostPlayed,
  neglectedGames,
  recentPlayRail,
  todaysTreasure
} from './shelf';

const NOW = new Date(2026, 10, 12);

const game = (id: string, title: string, status = '보유중', createdAt = '2026.01.01'): UserGame =>
  ({
    id,
    title,
    ownershipStatus: status,
    createdAt,
    imageUrl: '',
    playCount: 0
  }) as UserGame;

const play = (id: string, gameId: string, title: string, date: string, names: string[] = []): PlayRecord =>
  ({
    id,
    gameId,
    gameTitle: title,
    gameImageUrl: '',
    date,
    startTime: '19:00',
    participants: names.map((name) => ({ name }))
  }) as PlayRecord;

describe('wishlist, tags, and memo', () => {
  it('treats only the wishlist status as not owned', () => {
    expect(isWishlist('하고 싶음')).toBe(true);
    expect(isWishlist('보유중')).toBe(false);
    expect(isWishlist(undefined)).toBe(false);
  });

  it('keeps a one-line memo and drops anything that is not text', () => {
    expect(cleanMemo(undefined)).toBe('');
    expect(cleanMemo(3)).toBe('');
    expect(cleanMemo('  다음엔   확장  ')).toBe('다음엔 확장');
    expect(cleanMemo('가'.repeat(90))).toHaveLength(80);
  });

  it('splits tags, drops blanks, and caps the list', () => {
    expect(cleanTags('전략, 가족，전략')).toEqual(['전략', '가족']);
    expect(cleanTags([' 2인 ', '', 1, '2인'])).toEqual(['2인']);
    expect(cleanTags('가'.repeat(20))[0]).toHaveLength(12);
    expect(cleanTags(Array.from({ length: 12 }, (_, i) => `t${i}`))).toHaveLength(8);
  });
});

describe('home rails and the featured game', () => {
  it('features the owned game from the newest play and ignores a wishlist-only shelf', () => {
    const games = [game('wish', '위시', '하고 싶음'), game('old', '오래'), game('new', '최근')];
    expect(todaysTreasure([game('wish', '위시', '하고 싶음')], [])).toBeNull();
    expect(
      todaysTreasure(games, [play('p1', 'old', '오래', '2026.10.01'), play('p2', 'new', '최근', '2026.11.12')])?.id
    ).toBe('new');
  });

  it('builds a recent cover rail without repeating a game, and hides it when there are no plays', () => {
    expect(recentPlayRail([])).toEqual([]);
    const rail = recentPlayRail([
      play('a', 'g1', '카탄', '2026.11.01'),
      play('b', 'g1', '카탄', '2026.11.12'),
      play('c', 'g2', '스플렌더', '2026.11.02')
    ]);
    expect(rail.map((item) => item.title)).toEqual(['카탄', '스플렌더']);
  });

  it('lists owned games that have been quiet for 30 days and skips a game played this month', () => {
    const games = [
      game('fresh', '오늘', '보유중', '2026.11.12'),
      game('quiet', '묵힌', '보유중', '2026.01.01'),
      game('wish', '사고픔', '하고 싶음', '2026.01.01')
    ];
    const plays = [play('p', 'fresh', '오늘', '2026.11.12'), play('q', 'quiet', '묵힌', '2026.08.01')];
    expect(neglectedGames(games, plays, NOW).map((item) => item.id)).toEqual(['quiet']);
  });

  it('counts the last 14 days from real plays only', () => {
    const plays = [
      play('old', 'g', '카탄', '2026.10.01', ['민수']),
      play('new', 'g', '카탄', '2026.11.10', ['민수', '나', '동행 1']),
      play('new2', 'g', '카탄', '2026.11.12', ['지영'])
    ];
    expect(activitySummary(plays, NOW)).toEqual({
      plays: 2,
      people: 2,
      line: '최근 14일 · 2회 · 함께한 사람 2명'
    });
  });

  it('picks the owned game with the most linked plays', () => {
    const games = [game('a', '적음'), game('b', '많음'), game('w', '위시', '하고 싶음')];
    const plays = [
      play('1', 'a', '적음', '2026.11.01'),
      play('2', 'b', '많음', '2026.11.02'),
      play('3', 'b', '많음', '2026.11.03')
    ];
    expect(mostPlayed(games, plays)?.id).toBe('b');
    expect(mostPlayed([game('w', '위시', '하고 싶음')], [])).toBeNull();
  });
});
