import { useEffect, useRef } from 'react';
import { CHEST_VARIANTS } from '../config/collectorXp';
import {
  chestVariantUnlocked,
  levelFromXp,
  questSnapshots,
  totalXp,
  visibleQuestIds,
  type CollectorState,
  type ProgressGame,
  type ProgressPlay,
  type QuestSnapshot
} from '../utils/collectorProgress';
import { LevelPath } from './LevelTrack';

export type CollectorMode = 'badges' | 'track' | 'quests';

interface CollectorBoardProps {
  mode: CollectorMode;
  sheet?: boolean;
  games: ProgressGame[];
  plays: ProgressPlay[];
  state: CollectorState;
  now: Date;
  onClose?: () => void;
  onSelectVariant: (variantId: string) => void;
}

function QuestRow({ quest }: { quest: QuestSnapshot }) {
  const shown = Math.min(quest.current, quest.goal);
  return (
    <li
      data-quest={quest.id}
      data-quest-state={quest.done ? 'done' : 'open'}
      className="on-navy rounded-2xl bg-[#172033] px-3 py-3 text-[#F6EBD4]"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium">{quest.title}</p>
        <span className="is-ink shrink-0 rounded-full bg-[#F6EBD4] px-2 py-1 text-xs font-medium text-[#1C160E]">
          {quest.done ? '완료' : '진행 중'}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[#E4D3B4]">{quest.hint}</p>
      <p className="mt-2 text-xs text-[#F6EBD4]">
        {shown}/{quest.goal}
        {quest.done ? ` · ${quest.badge} 배지` : ''}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0E1628]" aria-hidden="true">
        <div className="h-full rounded-full bg-[#E2B657]" style={{ width: `${(shown / quest.goal) * 100}%` }} />
      </div>
    </li>
  );
}

function BoardBody({
  mode,
  games,
  plays,
  state,
  now,
  onSelectVariant
}: Omit<CollectorBoardProps, 'sheet' | 'onClose'>) {
  const xp = totalXp(state);
  const info = levelFromXp(xp);
  const snapshots = questSnapshots(games, plays, now);
  const visible = new Set(visibleQuestIds(now));
  const weekQuests = snapshots.filter((quest) => visible.has(quest.id));
  const finishedElsewhere = snapshots.filter((quest) => quest.done && !visible.has(quest.id));
  const doneIds = new Set(snapshots.filter((quest) => quest.done).map((quest) => quest.id));

  if (mode === 'track') {
    return (
      <section id="level-track-detail" aria-label="레벨 경로">
        <h2 className="text-lg font-medium text-[#1C160E]">레벨 경로</h2>
        <p className="mt-1 text-sm text-[#5C4632]">
          Lv.{info.level} · {info.xp} XP · 이 칸에서 {info.into}/{info.span}
        </p>
        <div className="mt-3">
          <LevelPath level={info.level} count={0} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#5C4632]">
          말은 지금 칸 위에 있습니다. 번호만으로도 칸을 알 수 있어요.
        </p>
      </section>
    );
  }

  if (mode === 'quests') {
    return (
      <section id="quest-list" aria-label="이번 주 문제">
        <h2 className="text-lg font-medium text-[#1C160E]">이번 주 문제</h2>
        <p className="mt-1 text-sm text-[#5C4632]">기록에 있는 것만 셉니다.</p>
        <ul className="mt-3 space-y-2">
          {weekQuests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
        </ul>
        {finishedElsewhere.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-medium text-[#1C160E]">이미 푼 문제</h3>
            <ul className="mt-2 space-y-2">
              {finishedElsewhere.map((quest) => (
                <QuestRow key={quest.id} quest={quest} />
              ))}
            </ul>
          </>
        )}
      </section>
    );
  }

  return (
    <section id="badge-shelf" aria-label="배지">
      <h2 className="text-lg font-medium text-[#1C160E]">배지</h2>
      <p className="mt-1 text-sm text-[#5C4632]">
        {snapshots.filter((quest) => quest.done).length}/{snapshots.length}개 획득
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {snapshots.map((quest) => (
          <li
            key={quest.id}
            data-badge={quest.id}
            data-badge-state={quest.done ? 'earned' : 'locked'}
            className="on-navy rounded-2xl bg-[#172033] px-3 py-3"
          >
            <p className="text-sm font-medium">{quest.badge}</p>
            <p className="mt-1 text-xs text-[#E4D3B4]">{quest.done ? '획득' : '아직'}</p>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-sm font-medium text-[#1C160E]">상자 잠금</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#5C4632]">모양만 바뀝니다. 기록은 그대로예요.</p>
      <div className="mt-2 flex flex-col gap-2">
        {CHEST_VARIANTS.map((variant) => {
          const unlocked = chestVariantUnlocked(variant.id, doneIds);
          const selected = state.chestVariant === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              disabled={!unlocked}
              aria-pressed={selected}
              onClick={() => onSelectVariant(variant.id)}
              className="on-navy flex items-center justify-between gap-2 rounded-full bg-[#172033] px-4 text-left text-sm disabled:text-[#E4D3B4]"
            >
              <span>{variant.label}</span>
              <span className="text-xs">{!unlocked ? '잠김' : selected ? '사용 중' : '고르기'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CollectorBoard(props: CollectorBoardProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (props.sheet) closeRef.current?.focus();
  }, [props.sheet]);

  const body = <BoardBody {...props} />;
  if (!props.sheet) {
    return <div className="paper mb-4 rounded-3xl px-4 py-4">{body}</div>;
  }

  return (
    <div
      id="collector-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collector-sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape') props.onClose?.();
      }}
    >
      <div className="paper max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p id="collector-sheet-title" className="text-sm text-[#5C4632]">
            수집가
          </p>
          <button
            id="collector-close"
            ref={closeRef}
            type="button"
            onClick={props.onClose}
            className="btn-quiet rounded-full px-4 text-sm"
          >
            닫기
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}
