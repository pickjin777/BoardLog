import type React from 'react';
import { Layers, Plus, ArrowRight, Download, MessageCircle } from 'lucide-react';
import type { UserGame, PlayRecord } from '../types';
import { PlayCard } from './PlayCard';
import { GameCard } from './GameCard';
import { formatDuration } from '../utils/formatters';
import { findRemovableSampleData } from '../services/storage';

interface HomeDashboardProps {
  games: UserGame[];
  plays: PlayRecord[];
  onOpenAddPlay: () => void;
  onOpenAddGame: () => void;
  onOpenCatalog?: () => void;
  onOpenKakaoShare?: () => void;
  onSelectGame: (game: UserGame) => void;
  onSelectPlay: (play: PlayRecord) => void;
  onNavigateTab: (tab: 'games' | 'plays') => void;
  onRemoveSampleData?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  plays,
  onOpenAddPlay,
  onOpenAddGame,
  onOpenCatalog,
  onOpenKakaoShare,
  onSelectGame,
  onSelectPlay,
  onNavigateTab,
  onRemoveSampleData
}) => {
  const removableSample = findRemovableSampleData(games, plays);
  const hasSampleData = removableSample.samplePlays.length + removableSample.sampleGames.length > 0;

  // Statistics calculations
  const totalGames = games.length;
  const totalPlays = plays.length;
  const totalMinutes = plays.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
  const winCount = plays.filter((p) => p.myResult === '승리').length;
  const winRate = totalPlays > 0 ? Math.round((winCount / totalPlays) * 100) : 0;

  const recentPlays = plays.slice(0, 3);
  const favoriteGames = [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 4);

  // Collector level: purely derived from plays already in storage, no new persisted state.
  const PLAYS_PER_LEVEL = 5;
  const collectorLevel = Math.floor(totalPlays / PLAYS_PER_LEVEL) + 1;
  const playsIntoLevel = totalPlays % PLAYS_PER_LEVEL;
  const levelProgressPct = Math.round((playsIntoLevel / PLAYS_PER_LEVEL) * 100);
  const playsToNextLevel = PLAYS_PER_LEVEL - playsIntoLevel;

  return (
    <div className="space-y-3 pb-4">
      <div className="treasure-hero relative overflow-hidden rounded-2xl p-3 text-[#F6EBD4]">
        <div className="relative z-10">
          <p className="mb-1 text-[12px] text-[#F3D48A]">오늘의 상자</p>
          <h2 className="mb-1 text-xl font-medium leading-snug">오늘 플레이한 게임을 기록하세요</h2>
          <p className="mb-3 text-[12px] leading-relaxed text-[#E4D3B4]">승패와 같이 한 사람을 이 기기에 남깁니다</p>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <button
              id="dashboard-add-play-cta"
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#E2B657] px-3 py-2 text-[12px] font-medium text-[#1A1408] transition-colors hover:bg-[#C9A24A]"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>새 플레이 기록</span>
            </button>
            <button
              id="dashboard-add-game-cta"
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/25"
            >
              <Layers className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>게임 등록</span>
            </button>
            {onOpenKakaoShare && (
              <button
                id="dashboard-open-kakao-cta"
                type="button"
                onClick={onOpenKakaoShare}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#FEE500] px-3 py-2 text-[12px] font-medium text-[#191919] transition-colors hover:bg-[#F5DC00]"
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/25"
              >
                <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>PDF 도록</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {hasSampleData && onRemoveSampleData && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="flex-1 text-[11px] leading-relaxed text-amber-900">
            처음에 넣어둔 <strong>예시 기록</strong>이 승률과 통계에 섞여 있어요.
          </p>
          <button
            id="dashboard-remove-sample-btn"
            type="button"
            onClick={onRemoveSampleData}
            className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-full text-[11px] font-bold hover:bg-amber-100 transition-colors"
          >
            예시 지우기
          </button>
        </div>
      )}

      {/* Collector Level Strip — derived from plays, no new persisted state */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#E9ECEF] bg-white px-3 py-2">
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-[#F6EBD4]">Lv.{collectorLevel}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] text-[#636E72]">수집가 레벨</span>
            <span className="text-[12px] text-[#636E72]">다음 레벨까지 {playsToNextLevel}회</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#F1F2F6]">
            <div
              className="h-full origin-left rounded-full bg-[#4834D4]"
              style={{ transform: `scaleX(${levelProgressPct / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div id="home-kpi-games" className="rounded-2xl border border-[#E9ECEF] bg-white p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#636E72]">보유 게임</span>
          <span className="text-xl font-medium tabular-nums text-[#F6EBD4]">{totalGames}</span>
          <span className="block text-xs text-[#636E72]">개</span>
        </div>

        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#636E72]">총 플레이</span>
          <span className="text-xl font-medium tabular-nums text-[#E4DCFF]">{totalPlays}</span>
          <span className="block text-xs text-[#636E72]">회</span>
        </div>

        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#636E72]">승률</span>
          <span id="home-kpi-winrate" className="text-xl font-medium tabular-nums text-[#9BE7B8]">
            {winRate}%
          </span>
          <span className="block text-xs text-[#636E72]">{winCount}승</span>
        </div>

        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-2 text-center">
          <span className="mb-1 block whitespace-nowrap text-[12px] text-[#636E72]">총 시간</span>
          <span className="mt-1 block text-sm font-medium tabular-nums text-[#F6EBD4]">
            {formatDuration(totalMinutes)}
          </span>
        </div>
      </div>

      {/* Recent Plays Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-[#F6EBD4]">최근 플레이 기록</h3>

          <button
            type="button"
            onClick={() => onNavigateTab('plays')}
            className="flex items-center gap-2 text-xs text-[#E4D3B4] transition-colors hover:text-[#F6EBD4]"
          >
            <span>전체 보기</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {recentPlays.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentPlays.map((p) => (
              <PlayCard key={p.id} play={p} onClick={() => onSelectPlay(p)} />
            ))}
          </div>
        ) : (
          <div
            id="home-empty-hint"
            className="p-4 bg-white rounded-2xl border border-dashed border-[#E9ECEF] text-center shadow-sm"
          >
            <p className="text-xs text-[#636E72] mb-3">
              아직 기록이 없어요. 게임이 끝나면 누가 이겼는지만 남겨도 충분해요.
            </p>
            <button
              id="home-empty-add-play-btn"
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 플레이 기록 남기기</span>
            </button>
          </div>
        )}
      </div>

      {/* Most Played Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-[#F6EBD4]">많이 플레이한 게임</h3>

          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            className="flex items-center gap-2 text-xs text-[#E4D3B4] transition-colors hover:text-[#F6EBD4]"
          >
            <span>내 게임 전체</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {favoriteGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
            {favoriteGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => onSelectGame(g)} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-[#E9ECEF] text-center shadow-sm">
            <p className="text-xs text-[#636E72] mb-3">등록된 게임이 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>게임 등록</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
