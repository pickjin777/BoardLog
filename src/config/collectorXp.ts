/**
 * Starting values for the local collector game. They are fixed on purpose:
 * a record cannot be worth more the second time it is saved.
 */
export const XP = {
  gameRegistered: 10,
  firstNewGame: 12,
  playSaved: 15,
  playPhoto: 8,
  playParty: 6,
  playShared: 8,
  firstOfDay: 10,
  quest: 20
} as const;

/** Cumulative XP to reach level 2 is `XP_STEP`. Later levels grow by one more step each time. */
export const XP_STEP = 40;

export const MAX_LEVEL = 40;

export interface QuestDef {
  id: string;
  title: string;
  hint: string;
  badge: string;
  goal: number;
}

export const QUESTS: readonly QuestDef[] = [
  {
    id: 'week-new',
    title: '이번 주에 처음 해 보는 게임을 기록해 보세요',
    hint: '이번 주 기록의 게임 이름이 그 전 기록에 없으면 한 칸이에요.',
    badge: '이번 주의 새 게임',
    goal: 1
  },
  {
    id: 'regular',
    title: '같은 친구와 세 번 플레이하면 단골 배지',
    hint: '참여자 이름이 같은 기록이 세 장이면 배지를 받아요.',
    badge: '단골',
    goal: 3
  },
  {
    id: 'photos',
    title: '사진을 붙인 기록 3개 만들기',
    hint: '기록에 사진을 한 장만 붙여도 한 칸이 채워져요.',
    badge: '사진 세 장',
    goal: 3
  },
  {
    id: 'shelf',
    title: '게임을 세 개 등록해 보세요',
    hint: '컬렉션에 게임이 세 개 있으면 끝나요.',
    badge: '선반',
    goal: 3
  },
  {
    id: 'plays',
    title: '플레이를 다섯 번 남겨 보세요',
    hint: '저장한 기록이 다섯 장이면 돼요.',
    badge: '다섯 판',
    goal: 5
  },
  {
    id: 'together',
    title: '함께한 친구 이름을 기록해 보세요',
    hint: '나 외에 실제 이름을 한 명 적으면 돼요.',
    badge: '함께한 판',
    goal: 1
  }
];

export interface ChestVariant {
  id: string;
  label: string;
  /** Null is the default lock, available before any badge. */
  badgeId: string | null;
}

export const CHEST_VARIANTS: readonly ChestVariant[] = [
  { id: 'lock-gold', label: '금색 미플 잠금', badgeId: null },
  { id: 'lock-cream', label: '크림 미플 잠금', badgeId: 'regular' },
  { id: 'lock-purple', label: '보라 미플 잠금', badgeId: 'photos' }
];

export const DEFAULT_CHEST_VARIANT = 'lock-gold';
