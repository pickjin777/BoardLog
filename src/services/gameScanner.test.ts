import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/imageCompressor', () => ({
  compressImage: vi.fn(async () => ({
    dataUrl: 'data:image/jpeg;base64,QQ==',
    sizeBytes: 1,
    width: 1,
    height: 1
  }))
}));

class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}

vi.stubGlobal('localStorage', new MemoryStorage());
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { storage } = await import('./storage');
const {
  errorForScanResponse,
  fetchScanAvailable,
  scanGamePhotos,
  ScanConsentRequiredError,
  ScanDisabledError,
  ScanFailedError,
  ONE_PHOTO_LIMIT_MESSAGE
} = await import('./gameScanner');
const { SEED_GAMES } = await import('../data/seedGames');

const file = {} as File;

describe('scan consent gate', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    storage.revokePhotoScanConsent();
    storage.setPhotoRecognitionEnabled(true);
  });

  it('does not call the network before consent or while recognition is off', async () => {
    expect(await fetchScanAvailable()).toBe(false);
    await expect(scanGamePhotos([file])).rejects.toBeInstanceOf(ScanConsentRequiredError);
    storage.grantPhotoScanConsent();
    storage.setPhotoRecognitionEnabled(false);
    expect(await fetchScanAvailable()).toBe(false);
    await expect(scanGamePhotos([file])).rejects.toBeInstanceOf(ScanDisabledError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('replaces provider text and model lists with one friendly message', () => {
    const failed = errorForScanResponse({
      error: 'gemini-2.5-flash not found\n쓸 수 있는 모델:\ngemini-x'
    });
    expect(failed).toBeInstanceOf(ScanFailedError);
    expect(failed.message).not.toMatch(/gemini|모델/);
    expect(errorForScanResponse({ code: 'VALIDATION', error: '사진은 한 장만 보낼 수 있습니다.' }).message).toBe(
      '사진은 한 장만 보낼 수 있습니다.'
    );
    expect(errorForScanResponse({ code: 'VALIDATION', error: '모델 목록 gemini-x' })).toBeInstanceOf(ScanFailedError);
  });
});

describe('one photo, many games', () => {
  const seeds = SEED_GAMES.filter((game) => game.title === '카탄' || game.title === '스플렌더');

  beforeEach(() => {
    fetchMock.mockReset();
    storage.setPhotoRecognitionEnabled(true);
    storage.grantPhotoScanConsent();
  });

  it('rejects a second photo before compressing or calling the server', async () => {
    await expect(scanGamePhotos([file, file], seeds)).rejects.toThrow(ONE_PHOTO_LIMIT_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the one photo to the server when the server key is on', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ available: true }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          games: [
            { title: '카탄', confidence: 0.91 },
            { title: 'Splendor', confidence: 0.8 },
            { title: '없는게임', confidence: 0.4 },
            { title: '카탄!', confidence: 0.2 }
          ]
        })
      });

    const found = await scanGamePhotos([file], seeds);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/api/scan-games');
    const body = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(body.images).toHaveLength(1);
    expect(body.images[0].mimeType).toBe('image/jpeg');
    expect(found.map((candidate) => candidate.match?.game.title ?? candidate.detection.title)).toEqual([
      '카탄',
      '스플렌더',
      '없는게임'
    ]);
    expect(found.filter((candidate) => candidate.match === null)).toHaveLength(1);
  });

  it('uses the device key when the server answers 405, and never puts that key in the url', async () => {
    const secret = 'device-key-not-a-server-secret';
    localStorage.setItem('boardlog_gemini_user_key', secret);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 405, json: async () => ({}) }).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ games: [{ title: '카탄', confidence: 0.9 }] }) }] } }
        ]
      })
    });

    const found = await scanGamePhotos([file], seeds);
    const googleCall = fetchMock.mock.calls[1];
    const url = String(googleCall?.[0]);
    const headers = googleCall?.[1]?.headers as Record<string, string>;
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).not.toContain(secret);
    expect(headers['x-goog-api-key']).toBe(secret);
    expect(String(googleCall?.[1]?.body)).not.toContain(secret);
    expect(found.map((candidate) => candidate.match?.game.title)).toEqual(['카탄']);
    expect(log.mock.calls.flat().join(' ')).not.toContain(secret);
    log.mockRestore();
    localStorage.removeItem('boardlog_gemini_user_key');
  });
});
