import { describe, expect, it } from 'vitest';
import { gameMatchesFilters, playMatchesFilters } from './collectionQuery';

describe('collection filters', () => {
  it('matches a game even when text fields are missing', () => {
    const broken = { title: '카탄', genre: undefined, tags: undefined, titleEn: undefined };
    expect(gameMatchesFilters(broken, { query: '카', ownership: '전체', tag: null })).toBe(true);
    expect(gameMatchesFilters(broken, { query: '없는말', ownership: '전체', tag: null })).toBe(false);
    expect(
      gameMatchesFilters({ title: '카탄', ownershipStatus: '보유중' }, { query: '', ownership: '빌림', tag: null })
    ).toBe(false);
    expect(gameMatchesFilters({ title: '카탄', tags: ['파티'] }, { query: '', ownership: '전체', tag: '파티' })).toBe(
      true
    );
    expect(gameMatchesFilters({ title: '카탄', tags: ['파티'] }, { query: '', ownership: '전체', tag: '전략' })).toBe(
      false
    );
  });

  it('matches a play even when participants are missing', () => {
    const play = { gameTitle: '카탄', location: '집', participants: undefined, myResult: '승리', date: '2026.11.01' };
    expect(playMatchesFilters(play, { query: '집', result: '전체', date: null })).toBe(true);
    expect(playMatchesFilters(play, { query: '없는', result: '전체', date: null })).toBe(false);
    expect(playMatchesFilters(play, { query: '', result: '패배', date: null })).toBe(false);
    expect(playMatchesFilters(play, { query: '', result: '전체', date: '2026.11.02' })).toBe(false);
    expect(
      playMatchesFilters(
        { ...play, participants: [{ name: '민수' }] },
        { query: '민수', result: '승리', date: '2026.11.01' }
      )
    ).toBe(true);
  });
});
