import type { SeedGame } from '../types';
import { PRODUCTION_ORIGIN } from '../config/appIdentity';
import { SEED_GAMES } from '../data/seedGames';
import { storage } from './storage';
import { resolveApiUrl } from '../utils/apiOrigin';
import { compressImage } from '../utils/imageCompressor';
import { isNativeShell } from '../utils/nativeShell';
import { PUBLIC_SCAN_ERROR } from '../utils/publicScanError';
import { scanAvailableFromResponse } from '../utils/scanAvailability';
import { findSeedMatch, type SeedMatch } from '../utils/titleMatch';

export const MAX_SCAN_IMAGES = 4;

export type TitleOrientation = 'horizontal' | 'vertical' | 'rotated';

export interface ScanDetection {
  title: string;
  titleEn?: string;
  orientation: TitleOrientation;
  confidence: number;
}

export interface ScanCandidate {
  id: string;
  detection: ScanDetection;
  /** Null when the photographed title is not in the seed list; registered under its read title. */
  match: SeedMatch | null;
}

export class ScanNotConfiguredError extends Error {
  constructor() {
    super('사진 인식 기능이 아직 설정되지 않았습니다. 관리자에게 문의해주세요.');
    this.name = 'ScanNotConfiguredError';
  }
}

export class ScanConsentRequiredError extends Error {
  constructor() {
    super('사진 인식 동의가 필요합니다.');
    this.name = 'ScanConsentRequiredError';
  }
}

export class ScanDisabledError extends Error {
  constructor() {
    super('사진 인식이 꺼져 있습니다.');
    this.name = 'ScanDisabledError';
  }
}

export class ScanFailedError extends Error {
  constructor() {
    super(PUBLIC_SCAN_ERROR);
    this.name = 'ScanFailedError';
  }
}

function looksLikeProviderDump(text: string): boolean {
  return /gemini|model|모델|쓸 수 있는/i.test(text);
}

/** Validation text we wrote may be shown. Provider text and model lists never are. */
export function errorForScanResponse(payload: { code?: unknown; error?: unknown }): Error {
  if (payload.code === 'NOT_CONFIGURED') return new ScanNotConfiguredError();
  if (payload.code === 'VALIDATION' && typeof payload.error === 'string' && !looksLikeProviderDump(payload.error)) {
    return new Error(payload.error);
  }
  return new ScanFailedError();
}

function assertScanAllowed(): void {
  if (!storage.isPhotoRecognitionEnabled()) throw new ScanDisabledError();
  if (!storage.hasPhotoScanConsent()) throw new ScanConsentRequiredError();
}

function toInlineImage(dataUrl: string): { data: string; mimeType: string } {
  const separator = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, separator);
  const mimeType = header.slice(header.indexOf(':') + 1, header.indexOf(';'));
  return { data: dataUrl.slice(separator + 1), mimeType };
}

function isDetection(value: unknown): value is ScanDetection {
  if (typeof value !== 'object' || value === null) return false;
  const { title, orientation, confidence } = value as Record<string, unknown>;
  return (
    typeof title === 'string' &&
    title.trim().length > 0 &&
    (orientation === 'horizontal' || orientation === 'vertical' || orientation === 'rotated') &&
    typeof confidence === 'number'
  );
}

/**
 * Asks the server whether a scan key is configured. A missing route, a 503, or a network
 * error all mean "off", so the form can explain that instead of opening a broken scan.
 * No image is sent and Gemini is not called.
 */
function scanApiUrl(): string {
  return resolveApiUrl('/api/scan-games', isNativeShell(), PRODUCTION_ORIGIN);
}

export async function fetchScanAvailable(): Promise<boolean> {
  if (!storage.isPhotoRecognitionEnabled() || !storage.hasPhotoScanConsent()) return false;
  try {
    const response = await fetch(scanApiUrl(), { method: 'GET' });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return scanAvailableFromResponse(response.status, body);
  } catch {
    return false;
  }
}

export async function scanGamePhotos(files: File[], seeds: SeedGame[] = SEED_GAMES): Promise<ScanCandidate[]> {
  assertScanAllowed();
  if (files.length === 0) return [];
  if (files.length > MAX_SCAN_IMAGES) {
    throw new Error(`사진은 한 번에 ${MAX_SCAN_IMAGES}장까지 인식할 수 있습니다.`);
  }

  const compressed = await Promise.all(files.map((file) => compressImage(file)));
  const images = compressed.map((result) => toInlineImage(result.dataUrl));

  const response = await fetch(scanApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images })
  });

  let payload: { detections?: unknown; error?: unknown; code?: unknown; available?: unknown } = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error('사진 인식 서버 응답을 읽지 못했습니다.');
  }

  if (!response.ok) throw errorForScanResponse(payload);

  const raw = Array.isArray(payload.detections) ? payload.detections : [];
  const seen = new Set<string>();
  const candidates: ScanCandidate[] = [];

  raw.filter(isDetection).forEach((detection, index) => {
    const match = findSeedMatch(detection.title, seeds);
    // One shelf photo can show the same box twice from different angles.
    const key = match ? match.game.id : detection.title.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ id: `scan_${index}_${key}`, detection, match });
  });

  return candidates;
}
