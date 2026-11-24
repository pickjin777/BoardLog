import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlayRecord, UserGame } from '../types';
import { labelsForGameTitle } from '../utils/temporaryCover';
import { CoverPlaceholder } from './CoverPlaceholder';
import {
  anchorMonth,
  countPlaysByDate,
  dayAriaLabel,
  dayCoverTitle,
  dayPhotoUrl,
  playsOnDate,
  monthGrid,
  parsePlayDate,
  shiftMonth,
  type MonthCell
} from '../utils/memoryCard';
import { canDownscaleLocally, downscaleDataUrl } from '../utils/thumbnail';

interface PlayCalendarProps {
  plays: PlayRecord[];
  games?: readonly Pick<UserGame, 'id' | 'title' | 'genre' | 'tags'>[];
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function DayThumb({ url }: { url: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !canDownscaleLocally(url)) {
      setSrc(null);
      return;
    }
    let live = true;
    void downscaleDataUrl(url).then((next) => {
      if (!live) return;
      setSrc(next.length < url.length ? next : null);
    });
    return () => {
      live = false;
    };
  }, [url]);

  if (!src) return null;
  return <img src={src} alt="" className="calendar-thumb absolute inset-0 h-full w-full rounded-lg object-cover" />;
}

function dayClass(cell: MonthCell, selected: boolean, today: boolean, hasPhoto: boolean): string {
  const base =
    'calendar-day relative flex w-full items-center justify-center overflow-hidden rounded-md text-xs font-medium leading-none';
  const todayMark = today ? ' calendar-today' : '';
  const selectedMark = selected ? ' calendar-selected' : '';
  if (!cell.inMonth) return `${base}${todayMark}${selectedMark} bg-[#E4D3B4] text-[#5C4632]`;
  if (hasPhoto) return `${base}${todayMark}${selectedMark} bg-[#1C160E] text-[#F6EBD4]`;
  return `${base}${todayMark}${selectedMark} bg-[#F6EBD4] text-[#1C160E]`;
}

export function PlayCalendar({ plays, games = [], selectedDate, onSelectDate }: PlayCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return anchorMonth(plays, { year: now.getFullYear(), month: now.getMonth() + 1 });
  });

  useEffect(() => {
    if (!selectedDate) return;
    const parsed = parsePlayDate(selectedDate);
    if (!parsed) return;
    setCursor({ year: parsed.year, month: parsed.month });
  }, [selectedDate]);

  const counts = useMemo(() => countPlaysByDate(plays), [plays]);
  const cells = useMemo(() => monthGrid(cursor.year, cursor.month, counts), [cursor, counts]);
  const now = new Date();
  const today = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

  return (
    <section id="play-calendar" aria-label="플레이 달력" className="play-calendar logbook rounded-3xl px-1 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          id="calendar-prev-month"
          type="button"
          aria-label="이전 달"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
          className="btn-gold inline-flex shrink-0 items-center justify-center gap-0.5 rounded-full px-2 text-xs"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          <span>이전</span>
        </button>
        <h3 className="min-w-0 flex-1 text-center text-base font-medium text-[#1C160E]">
          {cursor.year}년 {cursor.month}월
        </h3>
        <button
          id="calendar-next-month"
          type="button"
          aria-label="다음 달"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
          className="btn-gold inline-flex shrink-0 items-center justify-center gap-0.5 rounded-full px-2 text-xs"
        >
          <span>다음</span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="play-calendar-grid">
        {WEEKDAYS.map((label) => (
          <span key={label} aria-hidden="true" className="py-1 text-center text-xs font-medium text-[#5C4632]">
            {label}
          </span>
        ))}
        {cells.map((cell) => {
          const selected = selectedDate === cell.key;
          const isToday = cell.year === today.year && cell.month === today.month && cell.day === today.day;
          const photo = cell.playCount > 0 ? dayPhotoUrl(plays, cell.key) : null;
          const coverTitle = photo ? null : dayCoverTitle(plays, cell.key);
          const coverPlay = coverTitle
            ? playsOnDate(plays, cell.key).find((play) => play.gameTitle.trim() === coverTitle)
            : undefined;
          const filled = Boolean(photo || coverTitle);
          return (
            <button
              key={cell.key}
              type="button"
              aria-label={dayAriaLabel(cell.month, cell.day, cell.playCount)}
              aria-pressed={selected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onSelectDate(cell.key)}
              className={dayClass(cell, selected, isToday, filled)}
            >
              <DayThumb url={photo} />
              {coverTitle && (
                <CoverPlaceholder
                  title={coverTitle}
                  labels={labelsForGameTitle(coverTitle, coverPlay?.gameId, games)}
                  className="absolute inset-0"
                />
              )}
              {cell.playCount > 0 && !photo && !coverTitle && <span className="calendar-day-mark" aria-hidden="true" />}
              <span
                aria-hidden="true"
                className={
                  filled
                    ? 'absolute inset-x-0 bottom-0 bg-[#F6EBD4] py-0.5 text-center text-[11px] font-medium text-[#1C160E]'
                    : 'relative'
                }
              >
                {cell.day}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
