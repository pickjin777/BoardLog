import type {
  GameCondition,
  GameOwnershipStatus,
  PlayParticipant,
  PlayPhoto,
  PlayRecord,
  PriceMeta,
  UserGame
} from '../types';

const OWNERSHIP: readonly GameOwnershipStatus[] = [
  '보유중',
  '하고 싶음',
  '빌려줌',
  '빌림',
  '판매예정',
  '판매완료',
  '분실',
  '처분'
];

const CONDITIONS: readonly GameCondition[] = ['미개봉', '최상', '상', '중', '하'];
const RESULTS = ['승리', '패배', '무승부', '참여'] as const;

/** Thrown when a saved list cannot be parsed. Callers must not replace that value. */
export class StorageDataError extends Error {
  constructor(message = '이 기기에 저장된 기록을 읽지 못했습니다. 잘못된 내용은 덮어쓰지 않았습니다.') {
    super(message);
    this.name = 'StorageDataError';
  }
}

export type ParsedJson = { kind: 'missing' } | { kind: 'corrupt' } | { kind: 'ok'; value: unknown };

export function parseJsonValue(raw: string | null): ParsedJson {
  if (raw == null) return { kind: 'missing' };
  try {
    return { kind: 'ok', value: JSON.parse(raw) };
  } catch {
    return { kind: 'corrupt' };
  }
}

/** A missing key is an empty list. Broken JSON or a non-array is left untouched. */
export function asStoredList(parsed: ParsedJson): unknown[] {
  if (parsed.kind === 'missing') return [];
  if (parsed.kind === 'corrupt' || !Array.isArray(parsed.value)) throw new StorageDataError();
  return parsed.value;
}

export function recordId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const id = (value as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function texts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function ownershipOf(value: unknown): GameOwnershipStatus {
  return OWNERSHIP.includes(value as GameOwnershipStatus) ? (value as GameOwnershipStatus) : '보유중';
}

function conditionOf(value: unknown): GameCondition {
  return CONDITIONS.includes(value as GameCondition) ? (value as GameCondition) : '상';
}

function priceOf(value: unknown): PriceMeta {
  if (!value || typeof value !== 'object') return { source: '', verifiedDate: '', isManual: false };
  const row = value as Partial<PriceMeta>;
  return {
    source: text(row.source),
    verifiedDate: text(row.verifiedDate),
    isManual: row.isManual === true
  };
}

/**
 * Fills the fields the screens read. A row without an id or a title stays out of the list
 * and is not deleted from the device.
 */
export function presentUserGame(value: unknown): UserGame | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<UserGame>;
  if (typeof row.id !== 'string' || row.id.length === 0) return null;
  if (typeof row.title !== 'string') return null;
  return {
    ...row,
    id: row.id,
    title: row.title,
    titleEn: text(row.titleEn),
    imageUrl: text(row.imageUrl),
    genre: texts(row.genre),
    minPlayers: num(row.minPlayers, 1),
    maxPlayers: num(row.maxPlayers, 1),
    bestPlayers: text(row.bestPlayers),
    recommendedAge: num(row.recommendedAge, 0),
    playTime: num(row.playTime, 0),
    weight: num(row.weight, 0),
    publisher: text(row.publisher),
    purchaseDate: text(row.purchaseDate),
    purchasePrice: num(row.purchasePrice, 0),
    originalPrice: num(row.originalPrice, 0),
    marketPrice: num(row.marketPrice, 0),
    storageLocation: text(row.storageLocation),
    condition: conditionOf(row.condition),
    tags: texts(row.tags),
    notes: text(row.notes),
    memo: typeof row.memo === 'string' ? row.memo : undefined,
    ownershipStatus: ownershipOf(row.ownershipStatus),
    playCount: num(row.playCount, 0),
    priceMeta: priceOf(row.priceMeta),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt)
  };
}

function presentParticipant(value: unknown, index: number): PlayParticipant | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<PlayParticipant>;
  return {
    id: text(row.id, `p_${index}`),
    name: text(row.name),
    score: typeof row.score === 'number' && Number.isFinite(row.score) ? row.score : null,
    rank: typeof row.rank === 'number' && Number.isFinite(row.rank) ? row.rank : null,
    isWinner: row.isWinner === true,
    characterOrFaction: text(row.characterOrFaction),
    notes: text(row.notes)
  };
}

function presentPhoto(value: unknown, index: number): PlayPhoto | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<PlayPhoto>;
  if (typeof row.url !== 'string' || row.url.length === 0) return null;
  const rotation = row.rotation === 90 || row.rotation === 180 || row.rotation === 270 ? row.rotation : 0;
  return {
    id: text(row.id, `photo_${index}`),
    url: row.url,
    caption: text(row.caption),
    rotation
  };
}

export function presentPlay(value: unknown): PlayRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<PlayRecord>;
  if (typeof row.id !== 'string' || row.id.length === 0) return null;
  if (typeof row.gameTitle !== 'string') return null;
  const myResult = RESULTS.includes(row.myResult as (typeof RESULTS)[number]) ? row.myResult : '참여';
  return {
    ...row,
    id: row.id,
    gameId: typeof row.gameId === 'string' ? row.gameId : null,
    gameTitle: row.gameTitle,
    gameImageUrl: text(row.gameImageUrl),
    date: text(row.date),
    startTime: text(row.startTime),
    endTime: text(row.endTime),
    durationMinutes: num(row.durationMinutes, 0),
    location: text(row.location),
    participants: Array.isArray(row.participants)
      ? row.participants
          .map((person, index) => presentParticipant(person, index))
          .filter((person): person is PlayParticipant => person !== null)
      : [],
    winnerNames: texts(row.winnerNames),
    myResult: myResult ?? '참여',
    isTeamPlay: row.isTeamPlay === true,
    hasExpansion: row.hasExpansion === true,
    expansionName: text(row.expansionName),
    rating: num(row.rating, 0),
    review: text(row.review),
    photos: Array.isArray(row.photos)
      ? row.photos
          .map((photo, index) => presentPhoto(photo, index))
          .filter((photo): photo is PlayPhoto => photo !== null)
      : [],
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt)
  };
}
