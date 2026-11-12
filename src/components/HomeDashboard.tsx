import type React from 'react';
import { Layers, Plus, ArrowRight, Download, MessageCircle } from 'lucide-react';
import type { UserGame, PlayRecord } from '../types';
import { PlayCard } from './PlayCard';
import { GameCard } from './GameCard';
import { LevelTrack } from './LevelTrack';
import { formatDuration } from '../utils/formatters';
import { findRemovableSampleData } from '../services/storage';

export interface QuestTeaser {
  title: string;
  hint: string;
  current: number;
  goal: number;
}

interface HomeDashboardProps {
  games: UserGame[];
  plays: PlayRecord[];
  xp: number;
  questTeaser: QuestTeaser | null;
  onOpenAddPlay: () => void;
  onOpenAddGame: () => void;
  onOpenCatalog?: () => void;
  onOpenKakaoShare?: () => void;
  onOpenLevel: () => void;
  onOpenQuests: () => void;
  onSelectGame: (game: UserGame) => void;
  onSelectPlay: (play: PlayRecord) => void;
  onNavigateTab: (tab: 'games' | 'plays') => void;
  onRemoveSampleData?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  plays,
  xp,
  questTeaser,
  onOpenAddPlay,
  onOpenAddGame,
  onOpenCatalog,
  onOpenKakaoShare,
  onOpenLevel,
  onOpenQuests,
  onSelectGame,
  onSelectPlay,
  onNavigateTab,
  onRemoveSampleData
}) => {
  const removableSample = findRemovableSampleData(games, plays);
  const hasSampleData = removableSample.samplePlays.length + removableSample.sampleGames.length > 0;

  const totalGames = games.length;
  const totalPlays = plays.length;
  const totalMinutes = plays.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
  const winCount = plays.filter((p) => p.myResult === '승리').length;
  const winRate = totalPlays > 0 ? Math.round((winCount / totalPlays) * 100) : 0;

  const recentPlays = plays.slice(0, 3);
  const favoriteGames = [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 4);

  return (
    <div className="space-y-3 pb-4">
      <section className="home-hero rounded-3xl px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#E2B657]">나의 보물 상자</p>
            <h2 className="mt-1 text-xl font-medium leading-snug text-[#F6EBD4]">오늘 플레이한 게임을 기록하세요</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#E4D3B4]">게임과 함께한 시간이 이 기기에 남습니다</p>
          </div>
          <img
            className="home-chest"
            src="/hero/chest-320.webp"
            srcSet="/hero/chest-160.webp 160w, /hero/chest-320.webp 320w, /hero/chest-480.webp 480w"
            sizes="168px"
            alt=""
            width={480}
            height={410}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            id="dashboard-add-play-cta"
            type="button"
            onClick={onOpenAddPlay}
            className="btn-gold inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-center text-sm font-medium"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>새 플레이 기록</span>
          </button>
          <button
            id="dashboard-add-game-cta"
            type="button"
            onClick={onOpenAddGame}
            className="btn-cream inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-center text-sm font-medium"
          >
            <Layers className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>게임 등록</span>
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {onOpenKakaoShare && (
            <button
              id="dashboard-open-kakao-cta"
              type="button"
              onClick={onOpenKakaoShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FEE500] px-3 py-2 text-center text-sm font-medium text-[#191919]"
            >
              <MessageCircle className="h-4 w-4 shrink-0 fill-[#191919]" strokeWidth={1.5} />
              <span>카톡 목록 공유</span>
            </button>
          )}
          {onOpenCatalog && (
            <button
              id="dashboard-open-catalog-cta"
              type="button"
              onClick={onOpenCatalog}
              className="btn-quiet inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-center text-sm font-medium"
            >
              <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>PDF 도록</span>
            </button>
          )}
        </div>
      </section>

      {hasSampleData && onRemoveSampleData && (
        <div className="paper flex items-center gap-3 rounded-2xl px-4 py-3">
          <p className="flex-1 text-xs leading-relaxed text-[#1C160E]">
            처음에 넣어둔 <strong>예시 기록</strong>이 승률과 통계에 섞여 있어요.
          </p>
          <button
            id="dashboard-remove-sample-btn"
            type="button"
            onClick={onRemoveSampleData}
            className="btn-quiet shrink-0 rounded-full px-3 text-xs"
          >
            예시 지우기
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <div id="home-kpi-games" className="paper rounded-2xl p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#5C4632]">보유 게임</span>
          <span className="text-xl font-medium tabular-nums text-[#1C160E]">{totalGames}</span>
          <span className="block text-[12px] text-[#5C4632]">개</span>
        </div>
        <div className="paper rounded-2xl p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#5C4632]">총 플레이</span>
          <span className="text-xl font-medium tabular-nums text-[#1C160E]">{totalPlays}</span>
          <span className="block text-[12px] text-[#5C4632]">회</span>
        </div>
        <div className="paper rounded-2xl p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#5C4632]">승률</span>
          <span id="home-kpi-winrate" className="stat-win text-xl font-medium tabular-nums">
            {winRate}%
          </span>
          <span className="block text-[12px] text-[#5C4632]">{winCount}승</span>
        </div>
        <div className="paper rounded-2xl p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#5C4632]">총 시간</span>
          <span className="mt-1 block text-sm font-medium tabular-nums text-[#1C160E]">
            {formatDuration(totalMinutes)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium text-[#F6EBD4]">최근 플레이 기록</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('plays')}
            className="flex items-center gap-1 text-xs text-[#E4D3B4]"
          >
            <span>전체 보기</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {recentPlays.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentPlays.map((p) => (
              <PlayCard key={p.id} play={p} onClick={() => onSelectPlay(p)} />
            ))}
          </div>
        ) : (
          <div id="home-empty-hint" className="paper rounded-2xl border border-dashed border-[#C6B48A] p-4 text-center">
            <p className="mb-3 text-xs text-[#5C4632]">
              아직 기록이 없어요. 게임이 끝나면 누가 이겼는지만 남겨도 충분해요.
            </p>
            <button
              id="home-empty-add-play-btn"
              type="button"
              onClick={onOpenAddPlay}
              className="btn-gold inline-flex items-center gap-1.5 rounded-full px-4 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>첫 플레이 기록 남기기</span>
            </button>
          </div>
        )}
      </div>

      <LevelTrack xp={xp} onOpen={onOpenLevel} />

      {questTeaser && (
        <section className="paper rounded-2xl px-3 py-3" aria-label="이번 주 문제">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#5C4632]">이번 주 문제</p>
              <p className="mt-1 text-sm font-medium text-[#1C160E]">{questTeaser.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#5C4632]">{questTeaser.hint}</p>
              <p className="mt-1 text-xs text-[#1C160E]">
                {Math.min(questTeaser.current, questTeaser.goal)}/{questTeaser.goal}
              </p>
            </div>
            <button
              id="home-open-quests"
              type="button"
              onClick={onOpenQuests}
              className="btn-quiet shrink-0 rounded-full px-3 text-xs"
            >
              문제 보기
            </button>
          </div>
        </section>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium text-[#F6EBD4]">많이 플레이한 게임</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            className="flex items-center gap-1 text-xs text-[#E4D3B4]"
          >
            <span>내 게임 전체</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {favoriteGames.length > 0 ? (
          <div className="game-shelf grid grid-cols-2 gap-4 md:grid-cols-4">
            {favoriteGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => onSelectGame(g)} />
            ))}
          </div>
        ) : (
          <div className="paper rounded-2xl border border-dashed border-[#C6B48A] p-6 text-center">
            <p className="mb-3 text-xs text-[#5C4632]">등록된 게임이 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAddGame}
              className="btn-cream inline-flex items-center gap-1.5 rounded-full px-4 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>게임 등록</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
