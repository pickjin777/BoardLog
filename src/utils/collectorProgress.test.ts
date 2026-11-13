import { describe, expect, it } from 'vitest';
import { QUESTS, XP } from '../config/collectorXp';
import {
  didLevelUp,
  emptyCollectorState,
  isRealCompanion,
  levelFromXp,
  levelSpaces,
  parseCollectorState,
  reconcileCollector,
  selectChestVariant,
  titleKey,
  totalXp,
  visibleQuestIds,
  xpToReachLevel,
  type ProgressGame,
  type ProgressPlay
} from './collectorProgress';

const NOW = new Date(2026, 10, 12);
const ISO = '2026-11-12T00:00:00.000Z';

const game = (id: string, title: string, createdAt = '2026.01.01'): ProgressGame => ({ id, title, createdAt });

const play = (overrides: Partial<ProgressPlay> & Pick<ProgressPlay, 'id'>): ProgressPlay => ({
  gameTitle: '카탄',
  date: '2026.11.12',
  createdAt: '2026.11.12T10:00:00',
  photoCount: 0,
  participantNames: ['나'],
  ...overrides
});

function run(
  games: ProgressGame[],
  plays: ProgressPlay[],
  previous = null as ReturnType<typeof reconcileCollector> | null,
  now = NOW
) {
  return reconcileCollector({ previous, games, plays, now, nowIso: ISO });
}

describe('level curve', () => {
  it('starts at level 1 and steps up on the triangular totals', () => {
    expect(xpToReachLevel(1)).toBe(0);
    expect(xpToReachLevel(0)).toBe(0);
    expect(xpToReachLevel(2)).toBe(40);
    expect(xpToReachLevel(3)).toBe(120);
    expect(levelFromXp(0)).toMatchObject({ level: 1, into: 0, span: 40 });
    expect(levelFromXp(39).level).toBe(1);
    expect(levelFromXp(40)).toMatchObject({ level: 2, into: 0, floor: 40, next: 120 });
    expect(levelFromXp(119).level).toBe(2);
    expect(levelFromXp(120).level).toBe(3);
    expect(levelFromXp(Number.NaN).level).toBe(1);
    expect(levelFromXp(-5).xp).toBe(0);
  });

  it('does not celebrate a level that was only discovered on the first read', () => {
    expect(didLevelUp(null, 80)).toBe(false);
    expect(didLevelUp(1, 39)).toBe(false);
    expect(didLevelUp(1, 40)).toBe(true);
    expect(didLevelUp(2, 40)).toBe(false);
  });

  it('keeps the current space inside the visible path', () => {
    expect(levelSpaces(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(levelSpaces(10, 5)).toContain(10);
    expect(levelSpaces(40, 5)).toContain(40);
    expect(levelSpaces(3, 0)[0]).toBe(1);
    expect(levelSpaces(3, 0).length).toBeGreaterThanOrEqual(8);
  });
});

describe('reconcileCollector', () => {
  it('derives XP once from existing records and does not change when run again', () => {
    const games = [game('g1', '카탄')];
    const plays = [play({ id: 'p1', photoCount: 1, participantNames: ['나', '민수'] })];
    const first = run(games, plays);
    const second = run(games, plays, first);
    expect(second.grants).toEqual(first.grants);
    expect(second.migratedAt).toBe(first.migratedAt);
    expect(second.claimedDays).toEqual(['2026.11.12']);
    expect(second.claimedTitles).toEqual(['카탄']);
    const kinds = first.grants.map((grant) => grant.kind).sort();
    expect(kinds).toEqual(['first-day', 'game', 'new-game', 'party', 'photo', 'play', 'quest', 'quest'].sort());
    expect(totalXp(first)).toBe(
      XP.gameRegistered +
        XP.firstNewGame +
        XP.playSaved +
        XP.playPhoto +
        XP.playParty +
        XP.firstOfDay +
        XP.quest +
        XP.quest
    );
  });

  it('does not pay the same record twice and drops its XP when the record is gone', () => {
    const games = [game('g1', '카탄')];
    const plays = [play({ id: 'p1', photoCount: 2, participantNames: ['나', '민수'] })];
    const saved = run(games, plays);
    const edited = run(games, [play({ id: 'p1', photoCount: 2, participantNames: ['나', '민수'] })], saved);
    expect(edited.grants.filter((grant) => grant.entityId === 'p1' && grant.kind === 'photo')).toHaveLength(1);
    const removed = run(games, [], saved);
    expect(removed.grants.some((grant) => grant.entityId === 'p1')).toBe(false);
    expect(totalXp(removed)).toBeLessThan(totalXp(saved));
    expect(removed.claimedDays).toEqual(['2026.11.12']);
    const readded = run(games, [play({ id: 'p2', createdAt: '2026.11.12T12:00:00' })], removed);
    expect(readded.grants.some((grant) => grant.kind === 'first-day')).toBe(false);
    expect(readded.grants.some((grant) => grant.kind === 'play' && grant.entityId === 'p2')).toBe(true);
  });

  it('pays the new-title bonus once per title, even if the game is deleted and registered again', () => {
    const first = run([game('g1', ' 카탄 ')], []);
    expect(first.grants.some((grant) => grant.kind === 'new-game')).toBe(true);
    const deleted = run([], [], first);
    expect(deleted.claimedTitles).toEqual(['카탄']);
    expect(deleted.grants.some((grant) => grant.kind === 'new-game')).toBe(false);
    const again = run([game('g2', '카탄', '2026.11.01')], [], deleted);
    expect(again.grants.filter((grant) => grant.kind === 'new-game')).toHaveLength(0);
    expect(again.grants.filter((grant) => grant.kind === 'game')).toHaveLength(1);
  });

  it('ignores placeholder companions and pays a real friend once per play', () => {
    expect(isRealCompanion('나')).toBe(false);
    expect(isRealCompanion('동행 1')).toBe(false);
    expect(isRealCompanion('플레이어 2')).toBe(false);
    expect(isRealCompanion('  ')).toBe(false);
    expect(isRealCompanion('민수')).toBe(true);
    const plain = run([], [play({ id: 'p1', participantNames: ['나', '동행 1'] })]);
    expect(plain.grants.some((grant) => grant.kind === 'party')).toBe(false);
    const named = run([], [play({ id: 'p1', participantNames: ['나', '민수'] })]);
    expect(named.grants.filter((grant) => grant.kind === 'party')).toHaveLength(1);
  });

  it('pays a share once per play id and forgets the share when the play is deleted', () => {
    const base = run([], [play({ id: 'p1' })]);
    const shared = run([], [play({ id: 'p1' })], { ...base, sharedPlayIds: ['p1', 'p1', 'missing'] });
    expect(shared.grants.filter((grant) => grant.kind === 'share')).toEqual([
      { id: 'share:p1', kind: 'share', amount: XP.playShared, entityId: 'p1' }
    ]);
    const again = run([], [play({ id: 'p1' })], shared);
    expect(again.grants.filter((grant) => grant.kind === 'share')).toHaveLength(1);
    const gone = run([], [], shared);
    expect(gone.sharedPlayIds).toEqual([]);
    expect(gone.grants.some((grant) => grant.kind === 'share')).toBe(false);
  });

  it('keeps the first-day bonus on the earliest play of that day', () => {
    const plays = [
      play({ id: 'later', createdAt: '2026.11.12T18:00:00' }),
      play({ id: 'earlier', createdAt: '2026.11.12T09:00:00' })
    ];
    const state = run([], plays);
    expect(state.grants.find((grant) => grant.kind === 'first-day')?.entityId).toBe('earlier');
    const moved = run([], plays, state);
    expect(moved.grants.find((grant) => grant.kind === 'first-day')?.entityId).toBe('earlier');
  });

  it('computes quest progress only from the records that exist', () => {
    const empty = run([], []);
    expect(empty.grants.some((grant) => grant.kind === 'quest')).toBe(false);
    const one = run([game('g1', '카탄')], [play({ id: 'p1', photoCount: 1, participantNames: ['나', '민수'] })]);
    const done = new Set(one.grants.filter((grant) => grant.kind === 'quest').map((grant) => grant.entityId));
    expect(done.has('week-new')).toBe(true);
    expect(done.has('together')).toBe(true);
    expect(done.has('photos')).toBe(false);
    expect(done.has('shelf')).toBe(false);
    expect(done.has('plays')).toBe(false);
    expect(done.has('regular')).toBe(false);

    const photos = run(
      [],
      [
        play({ id: 'a', photoCount: 1, gameTitle: '카탄', date: '2026.11.01' }),
        play({ id: 'b', photoCount: 1, gameTitle: '카탄', date: '2026.11.02' }),
        play({ id: 'c', photoCount: 1, gameTitle: '카탄', date: '2026.11.03' })
      ]
    );
    expect(photos.grants.some((grant) => grant.entityId === 'photos')).toBe(true);
    const dropped = run(
      [],
      [play({ id: 'a', photoCount: 1, date: '2026.11.01' }), play({ id: 'b', photoCount: 0, date: '2026.11.02' })],
      photos
    );
    expect(dropped.grants.some((grant) => grant.entityId === 'photos')).toBe(false);
    expect(totalXp(dropped)).toBeLessThan(totalXp(photos));
  });

  it('counts a regular only when the same friend is on three plays', () => {
    const plays = [1, 2, 3].map((n) =>
      play({
        id: `p${n}`,
        date: `2026.10.0${n}`,
        createdAt: `2026.10.0${n}`,
        participantNames: ['나', '민수', '민수']
      })
    );
    const state = run([], plays);
    expect(state.grants.some((grant) => grant.entityId === 'regular')).toBe(true);
    const different = run(
      [],
      plays.map((item, index) => ({ ...item, participantNames: ['나', index === 2 ? '지영' : '민수'] }))
    );
    expect(different.grants.some((grant) => grant.entityId === 'regular')).toBe(false);
  });

  it('treats a game played before this week as not new', () => {
    const old = play({ id: 'old', gameTitle: '카탄', date: '2026.11.01', createdAt: '2026.11.01' });
    const again = play({ id: 'now', gameTitle: '카탄', date: '2026.11.12', createdAt: '2026.11.12' });
    const repeat = run([], [old, again]);
    expect(repeat.grants.some((grant) => grant.entityId === 'week-new')).toBe(false);
    const fresh = run([], [again, play({ id: 'other', gameTitle: '스플렌더' })]);
    expect(fresh.grants.some((grant) => grant.entityId === 'week-new')).toBe(true);
  });

  it('resets a locked chest variant and keeps an unlocked one', () => {
    const earned = run(
      [game('g1', '카탄'), game('g2', '스플렌더'), game('g3', '아즈울')],
      [1, 2, 3].map((n) =>
        play({
          id: `p${n}`,
          date: `2026.10.0${n}`,
          createdAt: `2026.10.0${n}`,
          photoCount: 1,
          participantNames: ['나', '민수']
        })
      )
    );
    expect(earned.grants.some((grant) => grant.entityId === 'regular')).toBe(true);
    expect(earned.grants.some((grant) => grant.entityId === 'photos')).toBe(true);
    const withCream = { ...earned, chestVariant: 'lock-cream' };
    const kept = run(
      [game('g1', '카탄'), game('g2', '스플렌더'), game('g3', '아즈울')],
      [1, 2, 3].map((n) =>
        play({
          id: `p${n}`,
          date: `2026.10.0${n}`,
          createdAt: `2026.10.0${n}`,
          photoCount: 1,
          participantNames: ['나', '민수']
        })
      ),
      withCream
    );
    expect(kept.chestVariant).toBe('lock-cream');
    const lost = run([], [], withCream);
    expect(lost.chestVariant).toBe('lock-gold');
  });

  it('withholds registration XP while a game is only a wish, then pays it once the game is owned', () => {
    const wished = run(
      [game('g1', '카탄')].map((item) => ({ ...item, ownershipStatus: '하고 싶음' })),
      []
    );
    expect(wished.grants.some((grant) => grant.kind === 'game' || grant.kind === 'new-game')).toBe(false);
    const owned = run([game('g1', '카탄')], [], wished);
    expect(owned.grants.filter((grant) => grant.kind === 'game')).toHaveLength(1);
    expect(owned.grants.filter((grant) => grant.kind === 'new-game')).toHaveLength(1);
  });

  it('gives the new-title bonus to the earliest game when several share a title', () => {
    const state = run([game('late', '카탄', '2026.05.01'), game('early', '카탄', '2026.01.01')], []);
    expect(state.grants.find((grant) => grant.kind === 'new-game')?.entityId).toBe('early');
  });
});

describe('quests and chest variants', () => {
  it('rotates three hints and keeps the example copy', () => {
    const thisWeek = visibleQuestIds(NOW);
    const nextWeek = visibleQuestIds(new Date(2026, 10, 19));
    const sameWeek = visibleQuestIds(new Date(2026, 10, 9));
    expect(thisWeek).toHaveLength(3);
    expect(new Set(thisWeek).size).toBe(3);
    expect(sameWeek).toEqual(thisWeek);
    expect(visibleQuestIds(new Date(2026, 10, 8))).not.toEqual(thisWeek);
    expect(nextWeek).not.toEqual(thisWeek);
    expect(QUESTS.map((quest) => quest.title)).toEqual(
      expect.arrayContaining([
        '이번 주에 처음 해 보는 게임을 기록해 보세요',
        '같은 친구와 세 번 플레이하면 단골 배지',
        '사진을 붙인 기록 3개 만들기'
      ])
    );
  });

  it('refuses a variant the badges do not unlock', () => {
    const state = emptyCollectorState();
    expect(selectChestVariant(state, 'lock-bronze', new Set())).toBe(state);
    expect(selectChestVariant(state, 'nope', new Set(['photos']))).toBe(state);
    expect(selectChestVariant(state, 'lock-gold', new Set()).chestVariant).toBe('lock-gold');
    const bronze = selectChestVariant(state, 'lock-bronze', new Set(['photos']));
    expect(bronze.chestVariant).toBe('lock-bronze');
    expect(selectChestVariant(bronze, 'lock-bronze', new Set(['photos']))).toBe(bronze);
    expect(selectChestVariant(state, 'lock-purple', new Set(['photos'])).chestVariant).toBe('lock-bronze');
  });

  it('normalizes titles only by case and spaces', () => {
    expect(titleKey('  Catan  ')).toBe('catan');
    expect(titleKey('카탄')).not.toBe(titleKey('Catan'));
  });
});

describe('parseCollectorState', () => {
  it('rejects a different version and keeps a partial version-1 blob', () => {
    expect(parseCollectorState(null)).toBeNull();
    expect(parseCollectorState([])).toBeNull();
    expect(parseCollectorState({ version: 2, grants: [] })).toBeNull();
    const parsed = parseCollectorState({
      version: 1,
      claimedDays: ['2026.11.12', 3, ''],
      grants: [{ id: 'play:p1', kind: 'play', amount: 15, entityId: 'p1' }, { id: 'bad' }, null],
      acknowledgedLevel: 2,
      migratedAt: ISO
    });
    expect(parsed?.claimedDays).toEqual(['2026.11.12']);
    expect(parsed?.grants).toHaveLength(1);
    expect(parsed?.acknowledgedLevel).toBe(2);
    expect(parsed?.chestVariant).toBe('lock-gold');
    expect(
      parseCollectorState({ version: 1, acknowledgedLevel: 'soon', chestVariant: '' })?.acknowledgedLevel
    ).toBeNull();
  });
});
