import { describe, expect, it } from 'vitest';
import { gameMatchesShareFilter, type ShareFilterGame } from './shareGameFilter';

const light: ShareFilterGame = {
  title: '라이트합성',
  titleEn: 'Light',
  minPlayers: 2,
  maxPlayers: 4,
  weight: 1.2,
  genre: ['파티']
};

const heavy: ShareFilterGame = {
  title: '헤비합성',
  titleEn: 'Heavy',
  minPlayers: 2,
  maxPlayers: 4,
  weight: 4.2,
  genre: ['전략']
};

const party: ShareFilterGame = {
  title: '단체합성',
  minPlayers: 5,
  maxPlayers: 8,
  weight: 2,
  genre: ['파티']
};

describe('gameMatchesShareFilter', () => {
  it('keeps a player preset from dropping the weight and search the user already set', () => {
    const filter = { player: 'twoPlayers' as const, genre: '전체', weight: 'heavy' as const, search: '' };
    expect(gameMatchesShareFilter(heavy, filter)).toBe(true);
    expect(gameMatchesShareFilter(light, filter)).toBe(false);
  });

  it('applies the search on top of the player preset', () => {
    const filter = { player: 'twoPlayers' as const, genre: '전체', weight: 'all' as const, search: '헤비' };
    expect(gameMatchesShareFilter(heavy, filter)).toBe(true);
    expect(gameMatchesShareFilter(light, filter)).toBe(false);
    expect(gameMatchesShareFilter(heavy, { ...filter, search: 'heavy' })).toBe(true);
  });

  it('filters genre, party size, and a blank weight as the old 2.0 fallback', () => {
    expect(gameMatchesShareFilter(light, { player: 'all', genre: '파티', weight: 'all', search: '' })).toBe(true);
    expect(gameMatchesShareFilter(heavy, { player: 'all', genre: '파티', weight: 'all', search: '' })).toBe(false);
    expect(gameMatchesShareFilter(party, { player: 'party5Plus', genre: '전체', weight: 'all', search: '' })).toBe(
      true
    );
    expect(gameMatchesShareFilter(light, { player: 'party5Plus', genre: '전체', weight: 'all', search: '' })).toBe(
      false
    );
    expect(
      gameMatchesShareFilter(
        { ...light, weight: 0 },
        { player: 'all', genre: '전체', weight: 'medium', search: '없는이름' }
      )
    ).toBe(false);
    expect(
      gameMatchesShareFilter({ ...light, weight: 0 }, { player: 'all', genre: '전체', weight: 'medium', search: '' })
    ).toBe(true);
    expect(gameMatchesShareFilter(heavy, { player: 'all', genre: '전체', weight: 'medium', search: '' })).toBe(false);
    expect(gameMatchesShareFilter(heavy, { player: 'all', genre: '전체', weight: 'easy', search: '' })).toBe(false);
    expect(
      gameMatchesShareFilter(
        { ...party, minPlayers: 6 },
        { player: 'under4', genre: '전체', weight: 'all', search: '' }
      )
    ).toBe(false);
    expect(
      gameMatchesShareFilter(
        { ...light, maxPlayers: 1 },
        { player: 'twoPlayers', genre: '전체', weight: 'all', search: '' }
      )
    ).toBe(false);
    expect(gameMatchesShareFilter(light, { player: 'all', genre: '전체', weight: 'all', search: '파티' })).toBe(true);
  });
});
