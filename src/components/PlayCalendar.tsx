import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlayRecord } from '../types';
import {
  anchorMonth,
  countPlaysByDate,
  dayAriaLabel,
  dayPhotoUrl,
  monthGrid,
  parsePlayDate,
  shiftMonth,
  type MonthCell
} from '../utils/memoryCard';
import { canDownscaleLocally, downscaleDataUrl } from '../utils/thumbnail';

interface PlayCalendarProps {
  plays: PlayRecord[];
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function DayThumb({ url, selected }: { url: string | null; selected: boolean }) {
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

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={22}
        height={22}
        className="calendar-thumb h-[22px] w-[22px] rounded-md object-cover"
      />
    );
  }
  return <span className={`calendar-day-mark h-2 w-2 rounded-full ${selected ? 'bg-white' : 'bg-[#F3D48A]'}`} />;
}

function dayClass(cell: MonthCell, selected: boolean, today: boolean): string {
  const base =
    'flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border px-0 py-1 text-xs font-bold leading-none';
  if (selected) return `${base} border-[#F3D48A] bg-[#4834D4] text-white`;
  if (today) return `${base} border-[#F3D48A] bg-[#2A241C] text-[#F6EBD4] shadow-[inset_0_0_0_2px_#F3D48A]`;
  if (cell.inMonth) return `${base} border-[#5C4C38] bg-[#2A241C] text-[#F6EBD4]`;
  return `${base} border-[#5C4C38] bg-[#100E0B] text-[#E4D3B4]`;
}

export function PlayCalendar({ plays, selectedDate, onSelectDate }: PlayCalendarProps) {
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
    <section
      id="play-calendar"
      aria-label="플레이 달력"
      className="play-calendar rounded-3xl border border-[#C6A36A] bg-[#1C1812] p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          id="calendar-prev-month"
          type="button"
          aria-label="이전 달"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#4834D4] text-white"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h3 className="min-w-0 flex-1 text-center text-base font-black text-[#F6EBD4]">
          {cursor.year}년 {cursor.month}월
        </h3>
        <button
          id="calendar-next-month"
          type="button"
          aria-label="다음 달"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#4834D4] text-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="play-calendar-scroll">
        <div className="play-calendar-grid">
          {WEEKDAYS.map((label) => (
            <span key={label} aria-hidden="true" className="py-1 text-center text-xs font-bold text-[#E4D3B4]">
              {label}
            </span>
          ))}
          {cells.map((cell) => {
            const selected = selectedDate === cell.key;
            const isToday = cell.year === today.year && cell.month === today.month && cell.day === today.day;
            const photo = dayPhotoUrl(plays, cell.key);
            return (
              <button
                key={cell.key}
                type="button"
                aria-label={dayAriaLabel(cell.month, cell.day, cell.playCount)}
                aria-pressed={selected}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => onSelectDate(cell.key)}
                className={dayClass(cell, selected, isToday)}
              >
                <DayThumb url={photo} selected={selected} />
                <span aria-hidden="true">{cell.day}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
