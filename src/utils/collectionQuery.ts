function text(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export interface GameQuery {
  query: string;
  ownership: string;
  tag: string | null;
}

/** Search that stays up when an older row is missing a string or a list. */
export function gameMatchesFilters(
  game: {
    title?: unknown;
    titleEn?: unknown;
    publisher?: unknown;
    storageLocation?: unknown;
    genre?: unknown;
    tags?: unknown;
    ownershipStatus?: unknown;
  },
  input: GameQuery
): boolean {
  const query = input.query.trim().toLowerCase();
  const matchesSearch =
    query.length === 0 ||
    text(game.title).includes(query) ||
    text(game.titleEn).includes(query) ||
    text(game.publisher).includes(query) ||
    text(game.storageLocation).includes(query) ||
    list(game.genre).some((tag) => text(tag).includes(query));
  const matchesOwnership = input.ownership === '전체' || game.ownershipStatus === input.ownership;
  const matchesTag = input.tag === null || list(game.tags).includes(input.tag);
  return matchesSearch && matchesOwnership && matchesTag;
}

export interface PlayQuery {
  query: string;
  result: string;
  date: string | null;
}

export function playMatchesFilters(
  play: {
    gameTitle?: unknown;
    location?: unknown;
    participants?: unknown;
    myResult?: unknown;
    date?: unknown;
  },
  input: PlayQuery
): boolean {
  const query = input.query.trim().toLowerCase();
  const matchesSearch =
    query.length === 0 ||
    text(play.gameTitle).includes(query) ||
    text(play.location).includes(query) ||
    list(play.participants).some((person) => text((person as { name?: unknown } | null)?.name).includes(query));
  const matchesResult = input.result === '전체' || play.myResult === input.result;
  const matchesDate = input.date === null || play.date === input.date;
  return matchesSearch && matchesResult && matchesDate;
}
