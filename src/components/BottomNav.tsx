import type React from 'react';
import { Home, Layers, Plus, Trophy, User } from 'lucide-react';
import type { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAddPlay: () => void;
}

const tabClass = (active: boolean) =>
  `flex flex-1 flex-col items-center justify-center py-1 transition-colors lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-2.5 ${
    active ? 'font-bold text-[#4834D4] lg:bg-[#4834D4]/10' : 'text-[#636E72] hover:text-[#2D3436] lg:hover:bg-[#F8F9FA]'
  }`;

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onQuickAddPlay }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E9ECEF] bg-white/95 shadow-lg backdrop-blur-md lg:bottom-0 lg:right-auto lg:top-0 lg:w-60 lg:border-r lg:border-t-0 lg:shadow-none"
    >
      <div className="relative mx-auto flex h-16 max-w-xl items-center justify-between px-4 md:max-w-3xl lg:h-full lg:max-w-none lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:px-3 lg:py-5">
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onTabChange('home')}
          className={tabClass(currentTab === 'home')}
        >
          <Home className="mb-0.5 h-5 w-5 lg:mb-0" />
          <span className="text-[10px] lg:text-sm">홈</span>
        </button>

        <button
          id="nav-tab-games"
          type="button"
          onClick={() => onTabChange('games')}
          className={tabClass(currentTab === 'games')}
        >
          <Layers className="mb-0.5 h-5 w-5 lg:mb-0" />
          <span className="text-[10px] lg:text-sm">내 게임</span>
        </button>

        <div className="relative -top-3 flex flex-1 flex-col items-center justify-center lg:top-0 lg:order-first lg:mb-3 lg:flex-none">
          <button
            id="nav-fab-add-play"
            type="button"
            onClick={onQuickAddPlay}
            aria-label="기록 추가"
            className="flex h-13 w-13 items-center justify-center rounded-full bg-[#4834D4] text-white shadow-[0_12px_24px_rgba(72,52,212,0.35)] ring-4 ring-white transition-all hover:scale-105 active:scale-95 lg:h-11 lg:w-full lg:gap-2 lg:rounded-2xl lg:ring-0"
          >
            <Plus className="h-6 w-6 stroke-[2.5] lg:h-5 lg:w-5" />
            <span className="hidden text-sm font-bold lg:inline">기록 추가</span>
          </button>
          <span className="mt-0.5 text-[10px] font-bold text-[#4834D4] lg:hidden">기록 추가</span>
        </div>

        <button
          id="nav-tab-plays"
          type="button"
          onClick={() => onTabChange('plays')}
          className={tabClass(currentTab === 'plays')}
        >
          <Trophy className="mb-0.5 h-5 w-5 lg:mb-0" />
          <span className="text-[10px] lg:text-sm">플레이 기록</span>
        </button>

        <button
          id="nav-tab-mypage"
          type="button"
          onClick={() => onTabChange('mypage')}
          className={tabClass(currentTab === 'mypage')}
        >
          <User className="mb-0.5 h-5 w-5 lg:mb-0" />
          <span className="text-[10px] lg:text-sm">마이</span>
        </button>
      </div>
    </nav>
  );
};
