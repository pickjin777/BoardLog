import { describe, expect, it } from 'vitest';
import {
  anchorMonth,
  countPlaysByDate,
  dayAriaLabel,
  dayHeading,
  dayPhotoUrl,
  memoryFace,
  memoryImage,
  monthGrid,
  parsePlayDate,
  playerLine,
  playsOnDate,
  shiftMonth,
  winnerLine,
  type MemorySource
} from './memoryCard';

const person = (name: string, score: number | null, isWinner: boolean) => ({ name, score, isWinner });

const play = (overrides: Partial<MemorySource> = {}): MemorySource => ({
  date: '2026.11.12',
  gameTitle: '카탄',
  gameImageUrl: 'https://example.test/game.jpg',
  startTime: '19:00',
  participants: [person('나', 7, false), person('민수', 10, true)],
  winnerNames: [],
  myResult: '패배',
  photos: [],
  ...overrides
});

describe('memory card face', () => {
  it('prefers an attached photo over the game image', () => {
    const face = memoryFace(
      play({
        photos: [{ url: '  ' }, { url: 'data:image/jpeg;base64,abc' }],
        gameImageUrl: 'https://example.test/game.jpg'
      })
    );
    expect(face.imageKind).toBe('photo');
    expect(face.imageUrl).toBe('data:image/jpeg;base64,abc');
    expect(face.playerLabel).toBe('참여 나, 민수');
    expect(face.winnerLabel).toBe('승자 민수 10점');
    expect(face.summary).toContain('카탄, 2026.11.12');
  });

  it('uses the game image when no photo is attached', () => {
    expect(memoryImage(play({ photos: undefined, gameImageUrl: ' https://example.test/g.jpg ' })).kind).toBe('game');
    expect(memoryImage({ photos: [], gameImageUrl: '' }).kind).toBe('none');
    expect(memoryImage({ photos: [{ url: '' }], gameImageUrl: '   ' }).kind).toBe('none');
    expect(memoryImage({}).kind).toBe('none');
  });

  it('describes players and winners without inventing a score', () => {
    expect(playerLine({ participants: [] })).toBe('참여자 없음');
    expect(
      winnerLine({
        participants: [person('민수', null, true), person('지영', 0, true)],
        winnerNames: [],
        myResult: '패배'
      })
    ).toBe('승자 민수, 지영 0점');
    expect(winnerLine({ participants: [], winnerNames: ['  ', '하나'], myResult: '참여' })).toBe('승자 하나');
    expect(winnerLine({ participants: [], winnerNames: undefined, myResult: '무승부' })).toBe('무승부');
    expect(winnerLine({ participants: [], winnerNames: [' '], myResult: '참여' })).toBe('참여');
  });
});

describe('calendar days', () => {
  it('rejects dates that are not real calendar days', () => {
    expect(parsePlayDate('2026.11.12')).toEqual({ year: 2026, month: 11, day: 12 });
    expect(parsePlayDate('2024.02.29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parsePlayDate('2026-11-12')).toBeNull();
    expect(parsePlayDate('2026.13.01')).toBeNull();
    expect(parsePlayDate('2026.00.10')).toBeNull();
    expect(parsePlayDate('2026.11.31')).toBeNull();
    expect(parsePlayDate('2026.02.29')).toBeNull();
    expect(parsePlayDate('2026.11.00')).toBeNull();
    expect(parsePlayDate('2026.01.32')).toBeNull();
  });

  it('groups plays, ignores bad dates, and labels the day for a screen reader', () => {
    const counts = countPlaysByDate([
      { date: '2026.11.12' },
      { date: '2026.11.12' },
      { date: 'nope' },
      { date: '2026.11.02' }
    ]);
    expect(counts.get('2026.11.12')).toBe(2);
    expect(counts.has('nope')).toBe(false);
    expect(dayAriaLabel(11, 12, 2)).toBe('12 11월 12일, 게임 2판');
    expect(dayAriaLabel(11, 2, 0)).toBe('2 11월 2일, 기록 없음');
    expect(dayAriaLabel(11, 2, -1)).toBe('2 11월 2일, 기록 없음');
    expect(dayHeading('2026.11.12')).toBe('11월 12일');
    expect(dayHeading('soon')).toBe('soon');
  });

  it('builds a Sunday-first month and steps across years', () => {
    const february = monthGrid(2026, 2, new Map([['2026.02.01', 1]]));
    expect(february).toHaveLength(28);
    expect(february.every((cell) => cell.inMonth)).toBe(true);
    expect(february[0]).toMatchObject({ key: '2026.02.01', playCount: 1 });
    expect(february[1].playCount).toBe(0);

    const october = monthGrid(2026, 10, new Map());
    expect(october).toHaveLength(35);
    expect(october[0]).toMatchObject({ key: '2026.09.27', inMonth: false, day: 27 });
    expect(october[4]).toMatchObject({ key: '2026.10.01', inMonth: true, day: 1 });
    expect(october[october.length - 1].inMonth).toBe(true);

    const november = monthGrid(2026, 11, new Map([['2026.11.12', 2]]));
    expect(november[0].key).toBe('2026.11.01');
    expect(november.find((cell) => cell.key === '2026.11.12')?.playCount).toBe(2);
    expect(november[november.length - 1]).toMatchObject({ key: '2026.12.05', inMonth: false });

    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(anchorMonth([], { year: 2026, month: 11 })).toEqual({ year: 2026, month: 11 });
    expect(
      anchorMonth([{ date: 'bad' }, { date: '2026.10.01' }, { date: '2026.09.30' }], { year: 2026, month: 1 })
    ).toEqual({
      year: 2026,
      month: 10
    });
  });

  it('orders a day by start time and picks the latest attached photo', () => {
    const plays = [
      play({ startTime: '18:00', photos: [{ url: 'data:early' }] }),
      play({ startTime: '21:00', photos: [{ url: ' ' }] }),
      play({ startTime: undefined, date: '2026.11.12', photos: undefined }),
      play({ date: '2026.11.02', photos: [{ url: 'data:other' }] })
    ];
    expect(playsOnDate(plays, '2026.11.12').map((item) => item.startTime)).toEqual(['21:00', '18:00', undefined]);
    expect(dayPhotoUrl(plays, '2026.11.12')).toBe('data:early');
    expect(dayPhotoUrl(plays, '2026.11.03')).toBeNull();
    expect(dayPhotoUrl([play({ photos: [{ url: 'data:only' }] })], '2026.11.12')).toBe('data:only');
  });
});
