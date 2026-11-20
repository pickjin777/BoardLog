import type React from 'react';
import { levelFromXp, levelSpaces } from '../utils/collectorProgress';

function Meeple() {
  return (
    <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false">
      <circle cx="16" cy="8" r="6" fill="#E2B657" />
      <path d="M6 20c1-7 4-10 10-10s9 3 10 10l2 14c0 2-2 4-4 4H8c-2 0-4-2-4-4l2-14z" fill="#E2B657" />
    </svg>
  );
}

export function LevelPath({ level, count }: { level: number; count: number }) {
  const spaces = levelSpaces(level, count);
  return (
    <ol className="level-path">
      {spaces.map((space) => {
        const current = space === level;
        return (
          <li key={space} className="level-space" aria-current={current ? 'step' : undefined}>
            <span className="level-space-num">{space}</span>
            {current ? (
              <span className="level-meeple">
                <Meeple />
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export const LevelTrack: React.FC<{ xp: number; onOpen: () => void }> = ({ xp, onOpen }) => {
  const info = levelFromXp(xp);
  const remaining = info.span - info.into;
  return (
    <section
      id="home-level-track"
      aria-label={`수집가 레벨 ${info.level}, 경험치 ${info.xp}`}
      className="paper rounded-2xl px-3 py-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1C160E]">Lv.{info.level} 수집가</p>
          <p className="text-xs text-[#5C4632]">
            지금 {info.level}칸 · 다음 칸까지 {remaining} XP
          </p>
        </div>
        <button
          id="home-open-level"
          type="button"
          onClick={onOpen}
          className="btn-quiet shrink-0 rounded-full px-3 text-xs"
        >
          경로 보기
        </button>
      </div>
      <LevelPath level={info.level} count={5} />
    </section>
  );
};
