import type { PlayRecord, UserGame } from '../types';
import { normalizeTitle } from './titleMatch';

/**
 * Plays shown on a game's detail.
 * A play linked by id always belongs to that game. A play with no game id is included only when
 * its title normalizes to this game's title and no other game in the collection shares that
 * title — otherwise the same unlinked play would be listed under two games.
 */
export function playsForGame(
  game: Pick<UserGame, 'id' | 'title'>,
  plays: readonly PlayRecord[],
  games: readonly Pick<UserGame, 'id' | 'title'>[]
): PlayRecord[] {
  const key = normalizeTitle(game.title);
  const catalog = games.length > 0 ? games : [game];
  const titleIsUnique = key.length > 0 && catalog.filter((item) => normalizeTitle(item.title) === key).length === 1;

  return plays
    .filter((play) => {
      if (play.gameId === game.id) return true;
      if (play.gameId) return false;
      return titleIsUnique && normalizeTitle(play.gameTitle) === key;
    })
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
}
