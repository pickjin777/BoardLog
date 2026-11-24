import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  ScanFailedError
} = await import('./gameScanner');

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
    expect(
      errorForScanResponse({ code: 'VALIDATION', error: '사진은 한 번에 4장까지 보낼 수 있습니다.' }).message
    ).toBe('사진은 한 번에 4장까지 보낼 수 있습니다.');
    expect(errorForScanResponse({ code: 'VALIDATION', error: '모델 목록 gemini-x' })).toBeInstanceOf(ScanFailedError);
  });
});
