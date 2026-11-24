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

/** Inner text width in the 240-wide cover view. */
export const COVER_TEXT_WIDTH = 164;
const MAX_LINES = 3;
const MIN_SIZE = 15;
const MAX_SIZE = 34;
const TEXT_BLOCK_HEIGHT = 132;

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
