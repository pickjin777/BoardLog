import { describe, expect, it } from 'vitest';
import { localStorageNoticeText, recordStorageSentence, storagePlace } from './storageNotice';

describe('storagePlace', () => {
  it('keeps a desktop browser on the browser wording', () => {
    expect(storagePlace(false, 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0')).toBe('browser');
  });

  it('uses device wording for the Android shell, Electron, Android, and Windows', () => {
    expect(storagePlace(true, 'Mozilla/5.0')).toBe('device');
    expect(storagePlace(false, 'Mozilla/5.0 Electron/33.0.0')).toBe('device');
    expect(storagePlace(false, 'Mozilla/5.0 (Linux; Android 14)')).toBe('device');
    expect(storagePlace(false, 'Mozilla/5.0 (Windows NT 10.0)')).toBe('device');
  });
});

describe('local storage copy', () => {
  it('tells an installed app that uninstalling can erase records', () => {
    const text = localStorageNoticeText('device');
    expect(`${text.lead}${text.rest}`).toContain('이 기기에만');
    expect(`${text.lead}${text.rest}`).toContain('앱을 지우면');
    expect(`${text.lead}${text.rest}`).not.toContain('브라우저');
    expect(recordStorageSentence('device')).toContain('JSON 백업');
  });

  it('still names the browser on the website', () => {
    expect(localStorageNoticeText('browser').lead).toContain('브라우저');
  });
});
