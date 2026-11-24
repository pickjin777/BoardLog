/**
 * Temporary cover until a publisher allows their art.
 * Drawn in the app. Do not download or ship a publisher image without permission.
 */
export const TEMPORARY_COVER_NOTICE =
  '임시 표지다. 출판사가 허락한 그림이 오기 전까지 이름만 그린다. 허락 없이 출판사 이미지를 넣지 않는다.';

export const COVER_NAVY = '#0E1628';
export const COVER_BROWN = '#3A2C22';
export const COVER_LID = '#5C4632';
export const COVER_GOLD = '#E2B657';
export const COVER_CREAM = '#F6EBD4';
export const COVER_INK = '#1C160E';

/** Nameplate width inside the chest body, in the 240-wide cover view. */
export const COVER_TEXT_WIDTH = 124;
const MAX_LINES = 2;
const MIN_SIZE = 12;
const MAX_SIZE = 26;
const TEXT_BLOCK_HEIGHT = 56;

export type ChestShape =
  | 'dome'
  | 'gift'
  | 'crate'
  | 'ammo'
  | 'scroll'
  | 'capsule'
  | 'barrel'
  | 'basket'
  | 'case'
  | 'toy'
  | 'mail'
  | 'cage'
  | 'satchel'
  | 'board'
  | 'wedge'
  | 'temple'
  | 'book'
  | 'sleeve'
  | 'cube'
  | 'alarm'
  | 'column';

export interface ChestSpec {
  id: string;
  /** Korean name of the genre bucket. */
  label: string;
  /** Lower numbers win when one game has several labels. */
  priority: number;
  /** Null only for the fallback chest. */
  test: RegExp | null;
  shape: ChestShape;
  /** Main body color. Not purple. */
  body: string;
  lid: string;
  accent: string;
  emblem: string;
  /** Cartoon blood drips. No wounds or body parts. */
  stain: boolean;
  /** Confetti and extra colors. Party only. */
  flashy: boolean;
}

/**
 * More specific genres come first. A label that matches nothing uses the default chest.
 * Blood tones are stylized drips for horror, crime, and hidden-role play, kept cartoon-simple
 * because the app is also used by players under 14.
 */
export const CHEST_CATALOG: readonly ChestSpec[] = [
  {
    id: 'horror',
    label: '공포',
    priority: 10,
    test: /공포|스릴러|크툴루|좀비|유니버설몬스터/,
    shape: 'cage',
    body: '#7A1E1E',
    lid: '#4E1212',
    accent: '#F3D48A',
    emblem: 'lantern',
    stain: true,
    flashy: false
  },
  {
    id: 'social',
    label: '정체숨김',
    priority: 20,
    test: /마피아|정체|배신|사회적추리|숨기/,
    shape: 'mail',
    body: '#9B2C3A',
    lid: '#6E1A24',
    accent: '#F6EBD4',
    emblem: 'masks',
    stain: true,
    flashy: false
  },
  {
    id: 'mystery',
    label: '추리',
    priority: 30,
    test: /추리|디덕션|추론|범죄|방탈출|암호|살인/,
    shape: 'case',
    body: '#8E1F24',
    lid: '#5C1418',
    accent: '#F3D48A',
    emblem: 'glass',
    stain: true,
    flashy: false
  },
  {
    id: 'trivia',
    label: '퀴즈',
    priority: 40,
    test: /퀴즈/,
    shape: 'book',
    body: '#E07A2F',
    lid: '#A85216',
    accent: '#1C160E',
    emblem: 'quiz',
    stain: false,
    flashy: false
  },
  {
    id: 'word',
    label: '단어',
    priority: 50,
    test: /단어|연상/,
    shape: 'satchel',
    body: '#1F8A70',
    lid: '#146454',
    accent: '#F6EBD4',
    emblem: 'speech',
    stain: false,
    flashy: false
  },
  {
    id: 'educational',
    label: '학습',
    priority: 60,
    test: /수리|숫자|교육/,
    shape: 'board',
    body: '#2E7D32',
    lid: '#1B5E20',
    accent: '#F6EBD4',
    emblem: 'plus',
    stain: false,
    flashy: false
  },
  {
    id: 'memory',
    label: '기억',
    priority: 70,
    test: /기억/,
    shape: 'crate',
    body: '#5C6B7A',
    lid: '#3E4A56',
    accent: '#F6EBD4',
    emblem: 'pair',
    stain: false,
    flashy: false
  },
  {
    id: 'dexterity',
    label: '손맛',
    priority: 80,
    test: /딕스터리티|손맛|물리피지컬|균형감각/,
    shape: 'alarm',
    body: '#E67E22',
    lid: '#B85E10',
    accent: '#1C160E',
    emblem: 'balance',
    stain: false,
    flashy: false
  },
  {
    id: 'realtime',
    label: '실시간',
    priority: 90,
    test: /실시간|순발력/,
    shape: 'wedge',
    body: '#D64545',
    lid: '#A32E2E',
    accent: '#F6EBD4',
    emblem: 'bolt',
    stain: false,
    flashy: false
  },
  {
    id: 'legacy',
    label: '캠페인',
    priority: 100,
    test: /레거시|캠페인/,
    shape: 'dome',
    body: '#8A5A2B',
    lid: '#5E3C1C',
    accent: '#F3D48A',
    emblem: 'seal',
    stain: false,
    flashy: false
  },
  {
    id: 'narrative',
    label: '이야기',
    priority: 110,
    test: /스토리텔링|시나리오/,
    shape: 'scroll',
    body: '#C4A574',
    lid: '#8C6A3E',
    accent: '#1C160E',
    emblem: 'scroll',
    stain: false,
    flashy: false
  },
  {
    id: 'pirate',
    label: '바다',
    priority: 120,
    test: /해적|항해/,
    shape: 'barrel',
    body: '#8C5A3C',
    lid: '#5C3A24',
    accent: '#F3D48A',
    emblem: 'anchor',
    stain: false,
    flashy: false
  },
  {
    id: 'train',
    label: '철도',
    priority: 130,
    test: /철도|기차/,
    shape: 'wedge',
    body: '#4A6274',
    lid: '#2E4150',
    accent: '#F6EBD4',
    emblem: 'train',
    stain: false,
    flashy: false
  },
  {
    id: 'farm',
    label: '농사',
    priority: 140,
    test: /농장|농사|와이너리/,
    shape: 'basket',
    body: '#6B8F3C',
    lid: '#4C6828',
    accent: '#F6EBD4',
    emblem: 'wheat',
    stain: false,
    flashy: false
  },
  {
    id: 'animal',
    label: '자연',
    priority: 150,
    test: /동물|자연|곤충|고양이/,
    shape: 'basket',
    body: '#3E8F4A',
    lid: '#246832',
    accent: '#F6EBD4',
    emblem: 'leaf',
    stain: false,
    flashy: false
  },
  {
    id: 'racing',
    label: '레이스',
    priority: 160,
    test: /레이싱/,
    shape: 'wedge',
    body: '#F08A24',
    lid: '#C56A10',
    accent: '#1C160E',
    emblem: 'chevron',
    stain: false,
    flashy: false
  },
  {
    id: 'sports',
    label: '스포츠',
    priority: 170,
    test: /스포츠/,
    shape: 'toy',
    body: '#2F9E44',
    lid: '#1E7030',
    accent: '#F6EBD4',
    emblem: 'ball',
    stain: false,
    flashy: false
  },
  {
    id: 'dungeon',
    label: '던전',
    priority: 180,
    test: /던전/,
    shape: 'cage',
    body: '#6B2E2E',
    lid: '#3E1A1A',
    accent: '#F3D48A',
    emblem: 'key',
    stain: false,
    flashy: false
  },
  {
    id: 'rpg',
    label: '롤플레잉',
    priority: 190,
    test: /RPG|롤플레잉/,
    shape: 'satchel',
    body: '#6A3E2A',
    lid: '#432616',
    accent: '#F3D48A',
    emblem: 'gem',
    stain: false,
    flashy: false
  },
  {
    id: 'fantasy',
    label: '판타지',
    priority: 200,
    test: /판타지|신화|모험/,
    shape: 'dome',
    body: '#1F7A4D',
    lid: '#145536',
    accent: '#F3D48A',
    emblem: 'tower',
    stain: false,
    flashy: false
  },
  {
    id: 'scifi',
    label: 'SF',
    priority: 210,
    test: /SF|우주/,
    shape: 'capsule',
    body: '#2BB3C7',
    lid: '#187E8E',
    accent: '#0E1628',
    emblem: 'planet',
    stain: false,
    flashy: false
  },
  {
    id: 'war',
    label: '전쟁',
    priority: 220,
    test: /전쟁|워게임|전투/,
    shape: 'ammo',
    body: '#6B7030',
    lid: '#45481C',
    accent: '#F3D48A',
    emblem: 'shield',
    stain: false,
    flashy: false
  },
  {
    id: 'area',
    label: '영역',
    priority: 230,
    test: /영역/,
    shape: 'crate',
    body: '#3D6F99',
    lid: '#274864',
    accent: '#F6EBD4',
    emblem: 'flag',
    stain: false,
    flashy: false
  },
  {
    id: 'civ',
    label: '문명',
    priority: 240,
    test: /문명/,
    shape: 'temple',
    body: '#C4A36A',
    lid: '#8E7040',
    accent: '#1C160E',
    emblem: 'pillar',
    stain: false,
    flashy: false
  },
  {
    id: 'history',
    label: '역사',
    priority: 250,
    test: /역사/,
    shape: 'book',
    body: '#A67C52',
    lid: '#6E5034',
    accent: '#F6EBD4',
    emblem: 'book',
    stain: false,
    flashy: false
  },
  {
    id: 'worker',
    label: '일꾼',
    priority: 260,
    test: /일꾼/,
    shape: 'crate',
    body: '#C47B2B',
    lid: '#8E5618',
    accent: '#1C160E',
    emblem: 'meeple',
    stain: false,
    flashy: false
  },
  {
    id: 'deck',
    label: '덱빌딩',
    priority: 270,
    test: /덱빌딩/,
    shape: 'sleeve',
    body: '#C4453C',
    lid: '#8E2E28',
    accent: '#F6EBD4',
    emblem: 'stack',
    stain: false,
    flashy: false
  },
  {
    id: 'draft',
    label: '드래프트',
    priority: 280,
    test: /드래프트/,
    shape: 'sleeve',
    body: '#3A7CA5',
    lid: '#245674',
    accent: '#F6EBD4',
    emblem: 'pick',
    stain: false,
    flashy: false
  },
  {
    id: 'rollwrite',
    label: '기록',
    priority: 290,
    test: /플립앤라이트|롤앤라이트/,
    shape: 'board',
    body: '#7D8B6A',
    lid: '#556048',
    accent: '#F6EBD4',
    emblem: 'pencil',
    stain: false,
    flashy: false
  },
  {
    id: 'negotiation',
    label: '협상',
    priority: 300,
    test: /협상|외교/,
    shape: 'case',
    body: '#C6A15B',
    lid: '#8E7038',
    accent: '#1C160E',
    emblem: 'hands',
    stain: false,
    flashy: false
  },
  {
    id: 'dice',
    label: '주사위',
    priority: 310,
    test: /주사위|푸시유어럭|러시안룰렛/,
    shape: 'cube',
    body: '#C23B3B',
    lid: '#8A2424',
    accent: '#F6EBD4',
    emblem: 'die',
    stain: false,
    flashy: false
  },
  {
    id: 'party',
    label: '파티',
    priority: 320,
    test: /파티|블러핑|눈치|유머/,
    shape: 'gift',
    body: '#E23B5A',
    lid: '#F0C14A',
    accent: '#2BB3C7',
    emblem: 'bow',
    stain: false,
    flashy: true
  },
  {
    id: 'cooperative',
    label: '협력',
    priority: 330,
    test: /협력|팀전/,
    shape: 'dome',
    body: '#2E8B57',
    lid: '#1C5C38',
    accent: '#F6EBD4',
    emblem: 'chain',
    stain: false,
    flashy: false
  },
  {
    id: 'duel',
    label: '2인',
    priority: 340,
    test: /2인/,
    shape: 'cube',
    body: '#3E6FB5',
    lid: '#274E84',
    accent: '#F6EBD4',
    emblem: 'duel',
    stain: false,
    flashy: false
  },
  {
    id: 'solo',
    label: '솔로',
    priority: 350,
    test: /솔로/,
    shape: 'column',
    body: '#5E6A75',
    lid: '#3C4650',
    accent: '#F6EBD4',
    emblem: 'one',
    stain: false,
    flashy: false
  },
  {
    id: 'route',
    label: '경로',
    priority: 360,
    test: /네트워크|경로|탐험/,
    shape: 'scroll',
    body: '#1F7A6B',
    lid: '#14564C',
    accent: '#F6EBD4',
    emblem: 'path',
    stain: false,
    flashy: false
  },
  {
    id: 'abstract',
    label: '추상',
    priority: 370,
    test: /추상|퍼즐|타일|패턴|폴리오미노|틱택토|만칼라|색깔/,
    shape: 'cube',
    body: '#C9A24A',
    lid: '#8E7030',
    accent: '#1C160E',
    emblem: 'shapes',
    stain: false,
    flashy: false
  },
  {
    id: 'card',
    label: '카드',
    priority: 380,
    test: /카드|트릭테이킹|LCG|핸드관리/,
    shape: 'sleeve',
    body: '#B23A48',
    lid: '#7A2430',
    accent: '#F6EBD4',
    emblem: 'fan',
    stain: false,
    flashy: false
  },
  {
    id: 'economic',
    label: '경제',
    priority: 390,
    test: /경제|무역|경매|주식|경영|거래|화폐|시장|자원/,
    shape: 'case',
    body: '#C9A227',
    lid: '#8E7010',
    accent: '#1C160E',
    emblem: 'coins',
    stain: false,
    flashy: false
  },
  {
    id: 'family',
    label: '가족',
    priority: 400,
    test: /가족|유아/,
    shape: 'toy',
    body: '#E2B657',
    lid: '#C4923A',
    accent: '#1C160E',
    emblem: 'star',
    stain: false,
    flashy: false
  },
  {
    id: 'strategy',
    label: '전략',
    priority: 410,
    test: /전략|엔진|4X|건축|테크|셋컬렉션/,
    shape: 'dome',
    body: '#6B4423',
    lid: '#3E2814',
    accent: '#F3D48A',
    emblem: 'crown',
    stain: false,
    flashy: false
  },
  {
    id: 'default',
    label: '기본',
    priority: 999,
    test: null,
    shape: 'dome',
    body: '#3A2C22',
    lid: '#241910',
    accent: '#E2B657',
    emblem: 'clasp',
    stain: false,
    flashy: false
  }
];

export const CHEST_KINDS = CHEST_CATALOG.map((spec) => spec.id);
export type ChestKind = (typeof CHEST_CATALOG)[number]['id'];

const DEFAULT_CHEST = CHEST_CATALOG[CHEST_CATALOG.length - 1];

export function chestSpecFor(labels: readonly string[] | null | undefined): ChestSpec {
  const text = (labels ?? []).join(' ');
  for (const spec of CHEST_CATALOG) {
    if (spec.test?.test(text)) return spec;
  }
  return DEFAULT_CHEST;
}

export function chestKindFor(labels: readonly string[] | null | undefined): ChestKind {
  return chestSpecFor(labels).id;
}

/** Hue in degrees, or null when the color is too gray to call a hue. */
export function srgbHue(hex: string): number | null {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.08 || max < 0.12 || delta / max < 0.18) return null;
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

/** Purple and violet, about 260° to 320°. Those hues stay out of the chests. */
export function isForbiddenPurple(hex: string): boolean {
  const hue = srgbHue(hex);
  return hue !== null && hue >= 260 && hue <= 320;
}

export function coverLabels(
  source: { genre?: readonly string[] | null; tags?: readonly string[] | null } | null | undefined
): string[] {
  if (!source) return [];
  return [...(source.genre ?? []), ...(source.tags ?? [])];
}

export function labelsForGameTitle(
  title: string,
  gameId: string | null | undefined,
  games: readonly { id: string; title: string; genre?: readonly string[] | null; tags?: readonly string[] | null }[]
): string[] {
  const linked = (gameId && games.find((game) => game.id === gameId)) || games.find((game) => game.title === title);
  return coverLabels(linked);
}

const HANGUL = /[가-힣]/;

/** Korean name when we have one. Otherwise the title already stored on the game. */
export function coverDisplayName(title: string, koreanName?: string | null): string {
  const korean = (koreanName ?? '').trim();
  if (korean && HANGUL.test(korean)) return korean;
  const existing = title.trim();
  if (existing) return existing;
  if (korean) return korean;
  return '이름 없음';
}

function unitWidth(ch: string): number {
  if (ch === ' ') return 0.33;
  if (HANGUL.test(ch)) return 1;
  if (/[A-Z]/.test(ch)) return 0.72;
  if (/[0-9a-z]/.test(ch)) return 0.56;
  return 0.7;
}

export function estimatedCoverWidth(line: string, fontSize: number): number {
  let width = 0;
  for (const ch of line) width += unitWidth(ch) * fontSize;
  return width;
}

function wrap(text: string, fontSize: number): string[] | null {
  const parts = text.split(/(\s+)/).filter((part) => part.length > 0);
  const chunks: string[] = [];
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      chunks.push(' ');
      continue;
    }
    if (estimatedCoverWidth(part, fontSize) <= COVER_TEXT_WIDTH) {
      chunks.push(part);
      continue;
    }
    let buf = '';
    for (const ch of part) {
      const next = buf + ch;
      if (buf && estimatedCoverWidth(next, fontSize) > COVER_TEXT_WIDTH) {
        chunks.push(buf);
        buf = ch;
      } else {
        buf = next;
      }
    }
    if (buf) chunks.push(buf);
  }

  const lines: string[] = [];
  let line = '';
  for (const chunk of chunks) {
    if (chunk === ' ') {
      if (line && estimatedCoverWidth(`${line} `, fontSize) <= COVER_TEXT_WIDTH) line = `${line} `;
      continue;
    }
    const candidate = line ? `${line}${chunk}` : chunk;
    if (estimatedCoverWidth(candidate.trimEnd(), fontSize) <= COVER_TEXT_WIDTH) {
      line = candidate.trimEnd();
      continue;
    }
    if (line.trim()) lines.push(line.trim());
    line = chunk;
    if (lines.length >= MAX_LINES) return null;
  }
  if (line.trim()) lines.push(line.trim());
  if (lines.length === 0 || lines.length > MAX_LINES) return null;
  if (lines.length * fontSize * 1.28 > TEXT_BLOCK_HEIGHT) return null;
  return lines;
}

function ellipsis(text: string): string[] {
  const lines: string[] = [];
  let rest = text;
  for (let index = 0; index < MAX_LINES; index += 1) {
    const last = index === MAX_LINES - 1;
    let take = '';
    for (const ch of rest) {
      const next = take + ch;
      const withMark = last ? `${next}…` : next;
      if (estimatedCoverWidth(withMark, MIN_SIZE) > COVER_TEXT_WIDTH) break;
      take = next;
    }
    if (!take) break;
    rest = rest.slice(take.length).trimStart();
    lines.push(last && rest ? `${take}…` : take);
    if (!rest) break;
  }
  return lines.length > 0 ? lines : ['이름 없음'];
}

export interface CoverTitleLayout {
  name: string;
  lines: string[];
  fontSize: number;
}

export function layoutCoverTitle(title: string, koreanName?: string | null): CoverTitleLayout {
  const name = coverDisplayName(title, koreanName);
  for (let fontSize = MAX_SIZE; fontSize >= MIN_SIZE; fontSize -= 1) {
    const lines = wrap(name, fontSize);
    if (lines) return { name, lines, fontSize };
  }
  return { name, lines: ellipsis(name), fontSize: MIN_SIZE };
}
