import type React from 'react';
import { useEffect, useRef } from 'react';
import { TreasureChest } from './TreasureChest';

const ENTER_MS = 2200;
const REDUCED_MS = 800;

export type TreasureMoment = 'enter' | 'acquire';

const COPY: Record<TreasureMoment, string> = {
  enter: '보물상자가 열립니다',
  acquire: '새 게임이 들어왔습니다'
};

/**
 * Lightweight entrance. CSS animates the SVG; nothing is fetched.
 * The veil does not take clicks, so the page underneath stays usable.
 * Escape and the skip button dismiss it. Reduced motion shows the open chest still.
 */
export const TreasureReveal: React.FC<{ kind: TreasureMoment; onDone: () => void }> = ({ kind, onDone }) => {
  const skipRef = useRef<HTMLButtonElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    skipRef.current?.focus();
    const finish = () => onDoneRef.current();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    const timer = window.setTimeout(finish, reduced ? REDUCED_MS : ENTER_MS);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  const message = COPY[kind];

  return (
    <div
      id="treasure-reveal"
      className="treasure-reveal is-open pointer-events-none fixed inset-0 z-[45] no-print"
      data-reduced={reduced ? 'true' : 'false'}
      data-kind={kind}
    >
      <div className="treasure-stage">
        <TreasureChest className="treasure-chest-svg" />
        {/* The picture is decorative. The skip button name carries the moment, because focus moves here. */}
        <p className="treasure-caption" aria-hidden="true">
          {message}
        </p>
        <button
          id="treasure-skip-btn"
          ref={skipRef}
          type="button"
          className="treasure-skip pointer-events-auto"
          aria-label={`${message}. 건너뛰기`}
          onClick={onDone}
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
};
