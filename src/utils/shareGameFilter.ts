export type SharePlayerPreset = 'all' | 'under4' | 'twoPlayers' | 'party5Plus';
export type ShareWeightPreset = 'all' | 'easy' | 'medium' | 'heavy';

export interface ShareFilterGame {
  title: string;
  titleEn?: string;
  minPlayers: number;
  maxPlayers: number;
  /** Missing or 0 is treated as 2.0, matching the share screen's previous fallback. */
  weight?: number;
  genre: string[];
}

export interface ShareGameFilter {
  player: SharePlayerPreset;
  genre: string;
  weight: ShareWeightPreset;
  search: string;
}

/**
 * One rule for both the visible checklist and the one-tap presets.
 * A preset used to ignore weight and search, so a heavy-only list still selected easy games.
 */
export function gameMatchesShareFilter(game: ShareFilterGame, filter: ShareGameFilter): boolean {
  if (filter.player === 'under4' && game.minPlayers > 4) return false;
  if (filter.player === 'twoPlayers' && (game.minPlayers > 2 || game.maxPlayers < 2)) return false;
  if (filter.player === 'party5Plus' && game.maxPlayers < 5) return false;
  if (filter.genre !== '전체' && !game.genre.includes(filter.genre)) return false;

  const weight = game.weight || 2;
  if (filter.weight === 'easy' && weight > 2.2) return false;
  if (filter.weight === 'medium' && (weight < 2 || weight > 3.2)) return false;
  if (filter.weight === 'heavy' && weight < 3.2) return false;

  const query = filter.search.trim().toLowerCase();
  if (query) {
    const matchesTitle = game.title.toLowerCase().includes(query) || (game.titleEn ?? '').toLowerCase().includes(query);
    const matchesGenre = game.genre.some((genre) => genre.toLowerCase().includes(query));
    if (!matchesTitle && !matchesGenre) return false;
  }

  return true;
}
