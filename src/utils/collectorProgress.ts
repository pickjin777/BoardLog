import {
  CHEST_VARIANTS,
  DEFAULT_CHEST_VARIANT,
  MAX_LEVEL,
  QUESTS,
  XP,
  XP_STEP,
  type QuestDef
} from '../config/collectorXp';
import type { PlayRecord, UserGame } from '../types';

export type GrantKind = 'game' | 'new-game' | 'play' | 'photo' | 'party' | 'share' | 'first-day' | 'quest';

export interface Grant {
  id: string;
  kind: GrantKind;
  amount: number;
  entityId: string;
}

/** Local collector state. Stored under its own key. It does not replace games or plays. */
export interface CollectorState {
  version: 1;
  grants: Grant[];
  /** Dates that already paid the first-play bonus. Kept after the play is deleted so it cannot be farmed. */
  claimedDays: string[];
  /** Titles that already paid the first-registration bonus. Kept after the game is deleted. */
  claimedTitles: string[];
  sharedPlayIds: string[];
  chestVariant: string;
  /** Null until the first reconcile has shown the player their starting level without a reward animation. */
  acknowledgedLevel: number | null;
  migratedAt: string | null;
}

export interface ProgressGame {
  id: string;
  title: string;
  createdAt: string;
}

export interface ProgressPlay {
  id: string;
  gameTitle: string;
  date: string;
  createdAt: string;
  photoCount: number;
  participantNames: string[];
}

export function progressGames(games: readonly UserGame[]): ProgressGame[] {
  return games.map((item) => ({ id: item.id, title: item.title, createdAt: item.createdAt }));
}

export function progressPlays(plays: readonly PlayRecord[]): ProgressPlay[] {
  return plays.map((item) => ({
    id: item.id,
    gameTitle: item.gameTitle,
    date: item.date,
    createdAt: item.createdAt,
    photoCount: item.photos.length,
    participantNames: item.participants.map((person) => person.name)
  }));
}

export interface QuestSnapshot extends QuestDef {
  current: number;
  done: boolean;
}

export interface LevelInfo {
  level: number;
  xp: number;
  floor: number;
  next: number;
  into: number;
  span: number;
}

const GRANT_KINDS = new Set<GrantKind>(['game', 'new-game', 'play', 'photo', 'party', 'share', 'first-day', 'quest']);

export function emptyCollectorState(): CollectorState {
  return {
    version: 1,
    grants: [],
    claimedDays: [],
    claimedTitles: [],
    sharedPlayIds: [],
    chestVariant: DEFAULT_CHEST_VARIANT,
    acknowledgedLevel: null,
    migratedAt: null
  };
}

export function titleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, '');
}

/** A named friend. The form's own seat and its empty "동행 1" slot do not count. */
export function isRealCompanion(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed === '나') return false;
  return !/^(동행|플레이어) \d+$/.test(trimmed);
}

export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  const n = Math.min(level, MAX_LEVEL + 1);
  return (XP_STEP * (n - 1) * n) / 2;
}

export function levelFromXp(xp: number): LevelInfo {
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let level = 1;
  while (level < MAX_LEVEL && xpToReachLevel(level + 1) <= safe) level += 1;
  const floor = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  return { level, xp: safe, floor, next, into: safe - floor, span: next - floor };
}

export function totalXp(state: CollectorState): number {
  return state.grants.reduce((sum, grant) => sum + grant.amount, 0);
}

/** The first run only records the level. A later increase is the level-up moment. */
export function didLevelUp(acknowledged: number | null, xp: number): boolean {
  if (acknowledged == null) return false;
  return levelFromXp(xp).level > acknowledged;
}

export function levelSpaces(level: number, count: number): number[] {
  if (count <= 0) {
    const end = Math.max(8, Math.min(MAX_LEVEL, level + 3));
    return Array.from({ length: end }, (_, index) => index + 1);
  }
  const span = Math.min(count, MAX_LEVEL);
  const centered = level - Math.floor((span - 1) / 2);
  const start = Math.max(1, Math.min(centered, MAX_LEVEL - span + 1));
  return Array.from({ length: span }, (_, index) => start + index);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDotDate(date: Date): string {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function isoMonday(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function isoWeekIndex(date: Date): number {
  const monday = isoMonday(date);
  const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const weekYear = thursday.getFullYear();
  const week1 = isoMonday(new Date(weekYear, 0, 4));
  const diffDays = Math.round((monday.getTime() - week1.getTime()) / 86_400_000);
  return weekYear * 100 + (1 + Math.floor(diffDays / 7));
}

export function visibleQuestIds(now: Date): string[] {
  const count = QUESTS.length;
  const start = isoWeekIndex(now) % count;
  return [0, 1, 2].map((offset) => QUESTS[(start + offset) % count].id);
}

function questCurrent(id: string, games: ProgressGame[], plays: ProgressPlay[], now: Date): number {
  if (id === 'week-new') {
    const monday = isoMonday(now);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    const start = formatDotDate(monday);
    const end = formatDotDate(sunday);
    const seenBefore = new Set(
      plays.filter((play) => play.date && play.date < start).map((play) => titleKey(play.gameTitle))
    );
    const fresh = plays.some((play) => {
      const key = titleKey(play.gameTitle);
      return Boolean(key) && play.date >= start && play.date <= end && !seenBefore.has(key);
    });
    return fresh ? 1 : 0;
  }
  if (id === 'regular') {
    const counts = new Map<string, number>();
    for (const play of plays) {
      const names = new Set(play.participantNames.map((name) => name.trim()).filter(isRealCompanion));
      for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let best = 0;
    for (const count of counts.values()) best = Math.max(best, count);
    return best;
  }
  if (id === 'photos') return plays.filter((play) => play.photoCount > 0).length;
  if (id === 'shelf') return games.length;
  if (id === 'plays') return plays.length;
  if (id === 'together') return plays.some((play) => play.participantNames.some(isRealCompanion)) ? 1 : 0;
  return 0;
}

export function questSnapshots(games: ProgressGame[], plays: ProgressPlay[], now: Date): QuestSnapshot[] {
  return QUESTS.map((quest) => {
    const current = questCurrent(quest.id, games, plays, now);
    return { ...quest, current, done: current >= quest.goal };
  });
}

function byCreated<T extends { createdAt: string; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

function hasGrant(grants: Grant[], kind: GrantKind, entityId: string): boolean {
  return grants.some((grant) => grant.kind === kind && grant.entityId === entityId);
}

export interface ReconcileInput {
  previous: CollectorState | null;
  games: ProgressGame[];
  plays: ProgressPlay[];
  now: Date;
  nowIso: string;
}

/**
 * Rebuilds XP from the records that exist right now.
 * The same records produce the same grants. Deleting a record drops its grants.
 * Day and title bonuses stay claimed, so deleting and recreating does not pay them again.
 */
export function reconcileCollector(input: ReconcileInput): CollectorState {
  const previous = input.previous;
  const previousGrants = previous?.grants ?? [];
  const grants: Grant[] = [];

  const titles = new Set(previous?.claimedTitles ?? []);
  for (const [title, games] of groupBy(input.games, (game) => titleKey(game.title))) {
    const existing = games.find((game) => hasGrant(previousGrants, 'new-game', game.id));
    if (existing) {
      grants.push({
        id: `new-game:${existing.id}`,
        kind: 'new-game',
        amount: XP.firstNewGame,
        entityId: existing.id
      });
      titles.add(title);
      continue;
    }
    if (titles.has(title)) continue;
    const earliest = byCreated(games)[0];
    grants.push({ id: `new-game:${earliest.id}`, kind: 'new-game', amount: XP.firstNewGame, entityId: earliest.id });
    titles.add(title);
  }

  for (const game of input.games) {
    grants.push({ id: `game:${game.id}`, kind: 'game', amount: XP.gameRegistered, entityId: game.id });
  }

  const days = new Set(previous?.claimedDays ?? []);
  for (const [day, plays] of groupBy(input.plays, (play) => play.date.trim())) {
    const existing = plays.find((play) => hasGrant(previousGrants, 'first-day', play.id));
    if (existing) {
      grants.push({ id: `first-day:${existing.id}`, kind: 'first-day', amount: XP.firstOfDay, entityId: existing.id });
      days.add(day);
      continue;
    }
    if (days.has(day)) continue;
    const earliest = byCreated(plays)[0];
    grants.push({ id: `first-day:${earliest.id}`, kind: 'first-day', amount: XP.firstOfDay, entityId: earliest.id });
    days.add(day);
  }

  const livePlayIds = new Set(input.plays.map((play) => play.id));
  for (const play of input.plays) {
    grants.push({ id: `play:${play.id}`, kind: 'play', amount: XP.playSaved, entityId: play.id });
    if (play.photoCount > 0) {
      grants.push({ id: `photo:${play.id}`, kind: 'photo', amount: XP.playPhoto, entityId: play.id });
    }
    if (play.participantNames.some(isRealCompanion)) {
      grants.push({ id: `party:${play.id}`, kind: 'party', amount: XP.playParty, entityId: play.id });
    }
  }

  const sharedPlayIds = [...new Set((previous?.sharedPlayIds ?? []).filter((id) => livePlayIds.has(id)))].sort();
  for (const id of sharedPlayIds) {
    grants.push({ id: `share:${id}`, kind: 'share', amount: XP.playShared, entityId: id });
  }

  const snapshots = questSnapshots(input.games, input.plays, input.now);
  const doneQuestIds = new Set(snapshots.filter((quest) => quest.done).map((quest) => quest.id));
  for (const quest of snapshots) {
    if (!quest.done) continue;
    grants.push({ id: `quest:${quest.id}`, kind: 'quest', amount: XP.quest, entityId: quest.id });
  }

  grants.sort((a, b) => a.id.localeCompare(b.id));
  const requested = normalizeChestVariant(previous?.chestVariant ?? DEFAULT_CHEST_VARIANT);
  const chestVariant = chestVariantUnlocked(requested, doneQuestIds) ? requested : DEFAULT_CHEST_VARIANT;

  return {
    version: 1,
    grants,
    claimedDays: [...days].sort(),
    claimedTitles: [...titles].sort(),
    sharedPlayIds,
    chestVariant,
    acknowledgedLevel: previous?.acknowledgedLevel ?? null,
    migratedAt: previous?.migratedAt ?? input.nowIso
  };
}

/** The purple lock shipped briefly. Keep its unlock as bronze. */
export function normalizeChestVariant(variantId: string): string {
  return variantId === 'lock-purple' ? 'lock-bronze' : variantId;
}

export function chestVariantUnlocked(variantId: string, doneQuestIds: ReadonlySet<string>): boolean {
  const id = normalizeChestVariant(variantId);
  const variant = CHEST_VARIANTS.find((item) => item.id === id);
  if (!variant) return false;
  return variant.badgeId == null || doneQuestIds.has(variant.badgeId);
}

export function selectChestVariant(
  state: CollectorState,
  variantId: string,
  doneQuestIds: ReadonlySet<string>
): CollectorState {
  const id = normalizeChestVariant(variantId);
  if (!chestVariantUnlocked(id, doneQuestIds)) return state;
  if (state.chestVariant === id) return state;
  return { ...state, chestVariant: id };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function parseGrant(value: unknown): Grant | null {
  if (!value || typeof value !== 'object') return null;
  const grant = value as Record<string, unknown>;
  if (typeof grant.id !== 'string' || typeof grant.entityId !== 'string') return null;
  if (typeof grant.kind !== 'string' || !GRANT_KINDS.has(grant.kind as GrantKind)) return null;
  if (typeof grant.amount !== 'number' || !Number.isFinite(grant.amount)) return null;
  return { id: grant.id, kind: grant.kind as GrantKind, amount: grant.amount, entityId: grant.entityId };
}

/** Rejects a blob that is not this version. A partial blob keeps the anti-farm lists it does have. */
export function parseCollectorState(value: unknown): CollectorState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return null;
  const grants = Array.isArray(raw.grants)
    ? raw.grants.map(parseGrant).filter((grant): grant is Grant => grant != null)
    : [];
  const acknowledged = raw.acknowledgedLevel;
  return {
    version: 1,
    grants,
    claimedDays: stringList(raw.claimedDays),
    claimedTitles: stringList(raw.claimedTitles),
    sharedPlayIds: stringList(raw.sharedPlayIds),
    chestVariant:
      typeof raw.chestVariant === 'string' && raw.chestVariant
        ? normalizeChestVariant(raw.chestVariant)
        : DEFAULT_CHEST_VARIANT,
    acknowledgedLevel: typeof acknowledged === 'number' && Number.isFinite(acknowledged) ? acknowledged : null,
    migratedAt: typeof raw.migratedAt === 'string' ? raw.migratedAt : null
  };
}
