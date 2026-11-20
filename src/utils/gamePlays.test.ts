import { describe, expect, it } from 'vitest';
import type { PlayRecord, UserGame } from '../types';
import { playsForGame } from './gamePlays';

const game = (id: string, title: string): Pick<UserGame, 'id' | 'title'> => ({ id, title });

const play = (id: string, gameId: string | null, gameTitle: string, date = '2026.10.01'): PlayRecord =>
  ({
    id,
    gameId,
    gameTitle,
    date,
    startTime: '19:00',
    location: id
  }) as PlayRecord;

describe('playsForGame', () => {
  const catan = game('game_catan', '카탄');
  const games = [catan, game('game_splendor', '스플렌더')];

  it('includes a play linked by id even when the title differs', () => {
    const linked = play('linked', 'game_catan', '다른 이름');
    expect(playsForGame(catan, [linked], games).map((item) => item.id)).toEqual(['linked']);
  });

  it('includes an unlinked play whose title matches the only game of that name', () => {
    const unlinked = play('cafe', null, '카 탄!');
    expect(playsForGame(catan, [unlinked], games).map((item) => item.id)).toEqual(['cafe']);
  });

  it('treats an empty game id as unlinked', () => {
    const unlinked = play('blank', '', '카탄');
    expect(playsForGame(catan, [unlinked], games).map((item) => item.id)).toEqual(['blank']);
  });

  it('hides a play linked to a different game even when the title matches', () => {
    const other = play('other', 'game_splendor', '카탄');
    expect(playsForGame(catan, [other], games)).toEqual([]);
  });

  it('does not attach an unlinked play when two games share the title', () => {
    const twin = game('game_catan_2', '카탄');
    const unlinked = play('cafe', null, '카탄');
    expect(playsForGame(catan, [unlinked], [catan, twin])).toEqual([]);
    expect(playsForGame(twin, [unlinked], [catan, twin])).toEqual([]);
  });

  it('does not match plays when the game title normalizes to nothing', () => {
    const blank = game('game_blank', '!!!');
    expect(playsForGame(blank, [play('x', null, '!!!')], [blank])).toEqual([]);
  });

  it('sorts newest date and start time first', () => {
    const older = play('older', 'game_catan', '카탄', '2026.09.01');
    const newer = { ...play('newer', null, '카탄', '2026.11.01'), startTime: '12:00' };
    const sameDayLater = { ...play('later', 'game_catan', '카탄', '2026.11.01'), startTime: '21:00' };
    expect(playsForGame(catan, [older, newer, sameDayLater], games).map((item) => item.id)).toEqual([
      'later',
      'newer',
      'older'
    ]);
  });

  it('uses the open game alone when the collection list is empty', () => {
    expect(playsForGame(catan, [play('cafe', null, '카탄')], []).map((item) => item.id)).toEqual(['cafe']);
  });
});
