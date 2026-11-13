import type { PlayRecord, UserGame } from '../types';
import { formatDotDate } from './collectorProgress';

export const WISHLIST_STATUS = '하고 싶음' as const;
export const MEMO_MAX = 80;
export const TAG_MAX = 12;
export const TAG_COUNT_MAX = 8;

export function isWishlist(status: string | undefined): boolean {
  return status === WISHLIST_STATUS;
}

/** One line. Missing and non-strings become an empty memo, which old records already are. */
export function cleanMemo(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, MEMO_MAX);
}

export function cleanTags(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,，]/) : [];
  const tags: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().slice(0, TAG_MAX);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= TAG_COUNT_MAX) break;
  }
  return tags;
}

function dotDate(date: Date): string {
  return formatDotDate(date);
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function playsInLastDays<T extends Pick<PlayRecord, 'date'>>(plays: readonly T[], now: Date, days = 14): T[] {
  const start = dotDate(shiftDays(now, -(days - 1)));
  const end = dotDate(now);
  return plays.filter((play) => play.date >= start && play.date <= end);
}

export function activitySummary(
  plays: readonly Pick<PlayRecord, 'date' | 'participants'>[],
  now: Date
): { plays: number; people: number; line: string } {
  const recent = playsInLastDays(plays, now, 14);
  const people = new Set<string>();
  for (const play of recent) {
    for (const person of play.participants) {
      const name = person.name.trim();
      if (!name || name === '나' || /^(동행|플레이어) \d+$/.test(name)) continue;
      people.add(name);
    }
  }
  return {
    plays: recent.length,
    people: people.size,
    line: `최근 14일 · ${recent.length}회 · 함께한 사람 ${people.size}명`
  };
}

export function ownedGames<T extends Pick<UserGame, 'ownershipStatus'>>(games: readonly T[]): T[] {
  return games.filter((game) => !isWishlist(game.ownershipStatus));
}

/** The owned game with the newest play. A wishlist-only shelf has no treasure yet. */
export function todaysTreasure<T extends Pick<UserGame, 'id' | 'title' | 'ownershipStatus'>>(
  games: readonly T[],
  plays: readonly Pick<PlayRecord, 'gameId' | 'gameTitle' | 'date' | 'startTime'>[]
): T | null {
  const owned = ownedGames(games);
  if (owned.length === 0) return null;
  const ordered = [...plays].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  for (const play of ordered) {
    const match = owned.find((game) => game.id === play.gameId || game.title === play.gameTitle);
    if (match) return match;
  }
  return owned[0];
}

export interface RailItem {
  key: string;
  title: string;
  imageUrl: string;
  gameId: string | null;
}

export function recentPlayRail(
  plays: readonly Pick<PlayRecord, 'id' | 'gameId' | 'gameTitle' | 'gameImageUrl' | 'date' | 'startTime'>[],
  limit = 8
): RailItem[] {
  const ordered = [...plays].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  const items: RailItem[] = [];
  const seen = new Set<string>();
  for (const play of ordered) {
    const key = play.gameId || play.gameTitle.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ key, title: play.gameTitle, imageUrl: play.gameImageUrl, gameId: play.gameId });
    if (items.length >= limit) break;
  }
  return items;
}

/** Owned games last played more than 30 days ago, or never played and added before that. */
export function neglectedGames<T extends Pick<UserGame, 'id' | 'title' | 'imageUrl' | 'ownershipStatus' | 'createdAt'>>(
  games: readonly T[],
  plays: readonly Pick<PlayRecord, 'gameId' | 'date'>[],
  now: Date,
  limit = 8
): T[] {
  const cutoff = dotDate(shiftDays(now, -30));
  const last = new Map<string, string>();
  for (const play of plays) {
    if (!play.gameId || !play.date) continue;
    const prev = last.get(play.gameId);
    if (!prev || play.date > prev) last.set(play.gameId, play.date);
  }
  return ownedGames(games)
    .filter((game) => {
      const played = last.get(game.id);
      if (played) return played < cutoff;
      return !game.createdAt || game.createdAt < cutoff;
    })
    .sort((a, b) => (last.get(a.id) ?? '').localeCompare(last.get(b.id) ?? ''))
    .slice(0, limit);
}

export function mostPlayed<T extends Pick<UserGame, 'id' | 'title' | 'playCount' | 'ownershipStatus'>>(
  games: readonly T[],
  plays: readonly Pick<PlayRecord, 'gameId'>[]
): T | null {
  const counts = new Map<string, number>();
  for (const play of plays) {
    if (!play.gameId) continue;
    counts.set(play.gameId, (counts.get(play.gameId) ?? 0) + 1);
  }
  const owned = ownedGames(games);
  if (owned.length === 0) return null;
  return [...owned].sort((a, b) => (counts.get(b.id) ?? b.playCount ?? 0) - (counts.get(a.id) ?? a.playCount ?? 0))[0];
}
