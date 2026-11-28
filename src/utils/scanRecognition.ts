import type { SeedGame } from '../types';
import { findSeedMatch, normalizeTitle, type SeedMatch } from './titleMatch';

/** One shelf photo per request. A second file is rejected on the device and on the server. */
export const MAX_SCAN_IMAGES = 1;

/** Enough for a crowded shelf, small enough that a runaway model reply cannot flood the form. */
export const MAX_RECOGNIZED_GAMES = 30;

const MAX_TITLE_LENGTH = 80;

export const ONE_PHOTO_LIMIT_MESSAGE = '사진은 한 장만 보낼 수 있습니다.';

export interface RecognizedGame {
  title: string;
  confidence: number;
}

export interface ScanCandidate {
  id: string;
  detection: RecognizedGame;
  /** Null when the read title is not in the seed list. The caller can still keep the title. */
  match: SeedMatch | null;
}

export type ScanResultKind = 'empty' | 'matched' | 'partial' | 'unmatched';

const SCAN_RESULT_MESSAGE: Record<ScanResultKind, string> = {
  empty: '사진에서 보드게임 이름을 찾지 못했습니다. 제목이 보이게 다시 찍어 주세요.',
  matched: '읽은 이름이 모두 목록과 맞았습니다. 빼거나 고친 뒤 한 번에 추가하세요.',
  partial: '일부만 목록과 맞았습니다. 틀린 항목은 끄고, 빠뜨린 게임은 직접 적으세요.',
  unmatched: '읽은 이름이 목록에 없습니다. 맞는지 확인하고, 빠뜨린 게임은 직접 적으세요.'
};

export function scanResultMessage(kind: ScanResultKind): string {
  return SCAN_RESULT_MESSAGE[kind];
}

export function scanResultKind(candidates: { match: SeedMatch | null }[]): ScanResultKind {
  if (candidates.length === 0) return 'empty';
  const matched = candidates.filter((candidate) => candidate.match !== null).length;
  if (matched === 0) return 'unmatched';
  if (matched === candidates.length) return 'matched';
  return 'partial';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function gameList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record || !Array.isArray(record.games)) return [];
  return record.games;
}

/** Same box read twice, or the same title with different spacing, collapses to one key. */
export function scanTitleKey(title: string): string {
  return normalizeTitle(title) || title.toLowerCase();
}

function readGame(value: unknown): RecognizedGame | null {
  const record = asRecord(value);
  if (!record) return null;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) return null;
  const { confidence } = record;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null;
  return { title, confidence: Math.min(1, Math.max(0, confidence)) };
}

/**
 * Reads the model payload `{ games: [{ title, confidence }] }`.
 * Drops blank, oversized, and non-numeric rows, clamps confidence to 0..1,
 * and keeps one row per title (the higher confidence).
 */
export function parseRecognizedGames(payload: unknown): RecognizedGame[] {
  const result: RecognizedGame[] = [];
  for (const item of gameList(payload)) {
    const game = readGame(item);
    if (!game) continue;
    const key = scanTitleKey(game.title);
    const index = result.findIndex((existing) => scanTitleKey(existing.title) === key);
    if (index === -1) {
      if (result.length >= MAX_RECOGNIZED_GAMES) continue;
      result.push(game);
      continue;
    }
    if (game.confidence > result[index].confidence) result[index] = game;
  }
  return result;
}

function candidateKey(candidate: ScanCandidate): string {
  return candidate.match ? `seed:${candidate.match.game.id}` : `title:${scanTitleKey(candidate.detection.title)}`;
}

/** Matches every read title to the seed catalog and drops a second hit of the same game. */
export function matchRecognizedGames(games: RecognizedGame[], seeds: SeedGame[]): ScanCandidate[] {
  const result: ScanCandidate[] = [];
  games.forEach((game, index) => {
    const match = findSeedMatch(game.title, seeds);
    const candidate: ScanCandidate = {
      id: `scan_${index}_${match ? match.game.id : scanTitleKey(game.title)}`,
      detection: { title: game.title, confidence: game.confidence },
      match
    };
    if (result.some((existing) => candidateKey(existing) === candidateKey(candidate))) return;
    result.push(candidate);
  });
  return result;
}
