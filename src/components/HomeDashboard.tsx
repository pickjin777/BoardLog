import type React from 'react';
import { Layers, Trophy, History, Plus, ArrowRight, Sparkles, Download, MessageCircle, Key } from 'lucide-react';
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
      {/* Top Banner / Quick Action CTA - Editorial Gradient */}
      <div className="treasure-hero relative overflow-hidden rounded-[32px] p-4 text-[#F6EBD4] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
        <div className="relative z-10">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#F3D48A]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>오늘의 상자</span>
          </div>
          <h2 className="mb-1 text-xl font-black italic leading-snug tracking-tight">
            오늘 플레이한 게임을 기록하세요
          </h2>
          <p className="mb-3 text-[11px] font-normal leading-relaxed text-[#E4D3B4]">
            승패와 함께한 사람을 이 기기에 남겨 두세요.
          </p>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <button
              id="dashboard-add-play-cta"
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#E2B657] px-2 py-2 text-[11px] font-bold text-[#1A1408] shadow-[0_4px_12px_rgba(0,0,0,0.28)] transition-all hover:bg-[#C9A24A] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>새 플레이 기록</span>
            </button>
            <button
              id="dashboard-add-game-cta"
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-white/15 hover:bg-white/25 text-white rounded-full text-[11px] font-semibold whitespace-nowrap backdrop-blur-xs transition-colors border border-white/20"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>게임 등록</span>
            </button>
            {onOpenKakaoShare && (
              <button
                id="dashboard-open-kakao-cta"
                type="button"
                onClick={onOpenKakaoShare}
                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] rounded-full text-[11px] font-black whitespace-nowrap transition-transform active:scale-95 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-[#191919] shrink-0" />
                <span>카톡 목록 공유</span>
              </button>
            )}
            {onOpenCatalog && (
              <button
                id="dashboard-open-catalog-cta"
                type="button"
                onClick={onOpenCatalog}
                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-white/15 hover:bg-white/25 text-white rounded-full text-[11px] font-semibold whitespace-nowrap backdrop-blur-xs transition-colors border border-white/20"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>PDF 도록</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative subtle background accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {hasSampleData && onRemoveSampleData && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-[24px] border border-amber-200">
          <p className="flex-1 text-[11px] leading-relaxed text-amber-900">
            처음에 넣어둔 <strong>예시 기록</strong>이 승률과 통계에 섞여 있어요.
          </p>
          <button
            id="dashboard-remove-sample-btn"
            type="button"
            onClick={onRemoveSampleData}
            className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-full text-[11px] font-bold hover:bg-amber-100 active:scale-95 transition-all"
          >
            예시 지우기
          </button>
        </div>
      )}

      {/* Collector Level Strip — derived from plays, no new persisted state */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm">
        <div className="w-9 h-9 rounded-full bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center shrink-0 font-black italic text-xs">
          Lv.{collectorLevel}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#636E72]">수집가 레벨</span>
            <span className="text-[10px] font-medium text-[#636E72]">
              {playsToNextLevel === PLAYS_PER_LEVEL ? '기록 시작!' : `다음 레벨까지 ${playsToNextLevel}회`}
            </span>
          </div>
          <div className="h-1.5 bg-[#F1F2F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#686DE0] to-[#4834D4] rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>
        <Key
          className={`w-4 h-4 shrink-0 transition-colors ${
            levelProgressPct >= 80 ? 'text-[#B8860B]' : 'text-[#636E72]'
          }`}
          strokeWidth={2}
        />
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        <div
          id="home-kpi-games"
          className="p-2.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center"
        >
          <span className="text-[10px] text-[#636E72] font-bold block mb-0.5 whitespace-nowrap">보유 게임</span>
          <span className="text-xl font-black italic text-[#1E272E]">{totalGames}</span>
          <span className="text-[10px] text-[#636E72] font-medium block">개</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#636E72] font-bold block mb-0.5 whitespace-nowrap">총 플레이</span>
          <span className="text-xl font-black italic text-[#4834D4]">{totalPlays}</span>
          <span className="text-[10px] text-[#636E72] font-medium block">회</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#636E72] font-bold block mb-0.5 whitespace-nowrap">승률</span>
          <span id="home-kpi-winrate" className="text-xl font-black italic text-[#1B7A43]">
            {winRate}%
          </span>
          <span className="text-[10px] text-[#636E72] font-medium block">{winCount}승</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#636E72] font-bold block mb-0.5 whitespace-nowrap">총 시간</span>
          <span className="text-xs font-black italic text-[#1E272E] block mt-1.5">{formatDuration(totalMinutes)}</span>
        </div>
      </div>

      {/* Recent Plays Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black italic text-[#1E272E]">최근 플레이 기록</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('plays')}
            className="text-xs font-bold text-[#4834D4] hover:text-[#3c2ab9] flex items-center gap-1 transition-colors"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPlays.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {recentPlays.map((p) => (
              <PlayCard key={p.id} play={p} onClick={() => onSelectPlay(p)} />
            ))}
          </div>
        ) : (
          <div
            id="home-empty-hint"
            className="p-4 bg-white rounded-[28px] border border-dashed border-[#E9ECEF] text-center shadow-sm"
          >
            <p className="text-xs text-[#636E72] mb-3">
              아직 기록이 없어요. 게임이 끝나면 누가 이겼는지만 남겨도 충분해요.
            </p>
            <button
              id="home-empty-add-play-btn"
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 플레이 기록 남기기</span>
            </button>
          </div>
        )}
      </div>

      {/* Most Played Games Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black italic text-[#1E272E]">많이 플레이한 게임</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            className="text-xs font-bold text-[#4834D4] hover:text-[#3c2ab9] flex items-center gap-1 transition-colors"
          >
            <span>내 게임 전체</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {favoriteGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 lg:grid-cols-4">
            {favoriteGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => onSelectGame(g)} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-[28px] border border-dashed border-[#E9ECEF] text-center shadow-sm">
            <p className="text-xs text-[#636E72] mb-3">등록된 게임이 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>인기 게임 등록하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
