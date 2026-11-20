/**
 * A memory card is a view of a play already stored on the device.
 * Nothing here is uploaded, and nothing is written back to IndexedDB.
 */

export interface MemorySource {
  date: string;
  gameTitle: string;
  gameImageUrl?: string;
  startTime?: string;
  participants: { name: string; score: number | null; isWinner: boolean }[];
  winnerNames?: string[];
  myResult: string;
  photos?: { url: string }[];
}

export interface MemoryFace {
  imageUrl: string | null;
  imageKind: 'photo' | 'game' | 'none';
  dateLabel: string;
  playerLabel: string;
  winnerLabel: string;
  summary: string;
}

export interface MonthCell {
  key: string;
  year: number;
  month: number;
  day: number;
  inMonth: boolean;
  playCount: number;
}

const DATE_KEY = /^(\d{4})\.(\d{2})\.(\d{2})$/;

export function parsePlayDate(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_KEY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  return { year, month, day };
}

function firstPhotoUrl(photos: { url: string }[] | undefined): string | null {
  const photo = photos?.find((item) => item.url.trim() !== '');
  return photo ? photo.url : null;
}

/** Attached photo, otherwise the game image, otherwise nothing. */
export function memoryImage(play: Pick<MemorySource, 'photos' | 'gameImageUrl'>): {
  url: string | null;
  kind: 'photo' | 'game' | 'none';
} {
  const photoUrl = firstPhotoUrl(play.photos);
  if (photoUrl) return { url: photoUrl, kind: 'photo' };
  const gameUrl = play.gameImageUrl?.trim() ?? '';
  if (gameUrl) return { url: gameUrl, kind: 'game' };
  return { url: null, kind: 'none' };
}

export function playerLine(play: Pick<MemorySource, 'participants'>): string {
  if (play.participants.length === 0) return '참여자 없음';
  return `참여 ${play.participants.map((person) => person.name).join(', ')}`;
}

export function winnerLine(play: Pick<MemorySource, 'participants' | 'winnerNames' | 'myResult'>): string {
  const winners = play.participants.filter((person) => person.isWinner);
  if (winners.length > 0) {
    const parts = winners.map((person) => (person.score === null ? person.name : `${person.name} ${person.score}점`));
    return `승자 ${parts.join(', ')}`;
  }
  const named = (play.winnerNames ?? []).map((name) => name.trim()).filter((name) => name.length > 0);
  if (named.length > 0) return `승자 ${named.join(', ')}`;
  return play.myResult;
}

export function memoryFace(play: MemorySource): MemoryFace {
  const image = memoryImage(play);
  const playerLabel = playerLine(play);
  const winnerLabel = winnerLine(play);
  return {
    imageUrl: image.url,
    imageKind: image.kind,
    dateLabel: play.date,
    playerLabel,
    winnerLabel,
    summary: `${play.gameTitle}, ${play.date}, ${playerLabel}, ${winnerLabel}`
  };
}

function startKey(play: { startTime?: string }): string {
  return play.startTime ?? '';
}

export function playsOnDate<T extends { date: string; startTime?: string }>(plays: readonly T[], dateKey: string): T[] {
  return plays
    .filter((play) => play.date === dateKey)
    .slice()
    .sort((a, b) => startKey(b).localeCompare(startKey(a)));
}

/** Latest play that day that actually has an attached photo. Game art is not a calendar thumbnail. */
export function dayPhotoUrl(plays: readonly MemorySource[], dateKey: string): string | null {
  for (const play of playsOnDate(plays, dateKey)) {
    const photoUrl = firstPhotoUrl(play.photos);
    if (photoUrl) return photoUrl;
  }
  return null;
}

export function countPlaysByDate(plays: readonly { date: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const play of plays) {
    if (!parsePlayDate(play.date)) continue;
    counts.set(play.date, (counts.get(play.date) ?? 0) + 1);
  }
  return counts;
}

function cellFromDate(date: Date, inMonth: boolean, counts: ReadonlyMap<string, number>): MonthCell {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const key = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
  return { key, year, month, day, inMonth, playCount: counts.get(key) ?? 0 };
}

/** Sunday-first month grid, including the leading and trailing days needed to fill the weeks. */
export function monthGrid(year: number, month: number, counts: ReadonlyMap<string, number>): MonthCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: MonthCell[] = [];
  for (let offset = firstWeekday; offset > 0; offset -= 1) {
    cells.push(cellFromDate(new Date(year, month - 1, 1 - offset), false, counts));
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(cellFromDate(new Date(year, month - 1, day), true, counts));
  }
  let cursor = new Date(year, month - 1, daysInMonth);
  while (cells.length % 7 !== 0) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    cells.push(cellFromDate(cursor, false, counts));
  }
  return cells;
}

/**
 * The day number is also the visible label, so it has to be its own word.
 * Screen readers still hear the full date, for example "12 11월 12일, 게임 2판".
 */
export function dayAriaLabel(month: number, day: number, playCount: number): string {
  const detail = playCount > 0 ? `게임 ${playCount}판` : '기록 없음';
  return `${day} ${month}월 ${day}일, ${detail}`;
}

export function dayHeading(dateKey: string): string {
  const parsed = parsePlayDate(dateKey);
  if (!parsed) return dateKey;
  return `${parsed.month}월 ${parsed.day}일`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function anchorMonth(
  plays: readonly { date: string }[],
  today: { year: number; month: number }
): { year: number; month: number } {
  let best: string | null = null;
  for (const play of plays) {
    if (!parsePlayDate(play.date)) continue;
    if (best === null || play.date > best) best = play.date;
  }
  if (best === null) return { year: today.year, month: today.month };
  return { year: Number(best.slice(0, 4)), month: Number(best.slice(5, 7)) };
}
