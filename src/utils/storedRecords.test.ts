import { describe, expect, it } from 'vitest';
import { progressPlays } from './collectorProgress';
import { asStoredList, parseJsonValue, presentPlay, presentUserGame, StorageDataError } from './storedRecords';

describe('stored JSON', () => {
  it('treats a missing key as empty and refuses to replace a broken value', () => {
    expect(asStoredList(parseJsonValue(null))).toEqual([]);
    expect(parseJsonValue('{').kind).toBe('corrupt');
    expect(() => asStoredList(parseJsonValue('{'))).toThrow(StorageDataError);
    expect(() => asStoredList(parseJsonValue('{"title":"카탄"}'))).toThrow(StorageDataError);
    expect(asStoredList(parseJsonValue('[]'))).toEqual([]);
  });

  it('fills the fields the screens read and drops a row with no title', () => {
    const game = presentUserGame({ id: 'g1', title: '카탄' });
    expect(game?.genre).toEqual([]);
    expect(game?.tags).toEqual([]);
    expect(game?.publisher).toBe('');
    expect(game?.priceMeta.source).toBe('');
    expect(presentUserGame({ title: '이름만' })).toBeNull();
    expect(presentUserGame(null)).toBeNull();

    const play = presentPlay({ id: 'p1', gameTitle: '카탄' });
    expect(play?.participants).toEqual([]);
    expect(play?.photos).toEqual([]);
    expect(play?.location).toBe('');
    expect(play && progressPlays([play])[0]?.photoCount).toBe(0);
    expect(presentPlay({ id: 'p2' })).toBeNull();
    expect(
      presentPlay({ id: 'p3', gameTitle: '카탄', photos: [{ url: '' }, { url: 'data:x', caption: 1 }] })?.photos
    ).toEqual([{ id: 'photo_1', url: 'data:x', caption: '', rotation: 0 }]);
  });
});
