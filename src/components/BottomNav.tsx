import type React from 'react';
import { Home, Layers, Plus, Trophy, User } from 'lucide-react';
import type { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAddPlay: () => void;
}

const tabClass = (active: boolean) =>
  `flex min-w-0 flex-1 flex-col items-center justify-center py-1 text-[#E4D3B4] lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-2.5 ${
    active ? 'font-medium text-[#E2B657] lg:bg-[#E2B657]/15' : ''
  }`;

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onQuickAddPlay }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2C3C56] bg-[#121A2C] lg:bottom-0 lg:right-auto lg:top-0 lg:w-60 lg:border-r lg:border-t-0"
    >
      <div className="relative mx-auto flex h-[4.75rem] max-w-xl items-end justify-between px-2 pb-1 md:max-w-3xl lg:h-full lg:max-w-none lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:px-3 lg:py-5">
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onTabChange('home')}
          aria-current={currentTab === 'home' ? 'page' : undefined}
          className={tabClass(currentTab === 'home')}
        >
          <Home className="mb-0.5 h-4 w-4 lg:mb-0" strokeWidth={1.5} />
          <span className="text-[12px] lg:text-sm">홈</span>
          <span className={`nav-pip ${currentTab === 'home' ? 'is-on' : ''}`} aria-hidden="true" />
        </button>

        <button
          id="nav-tab-games"
          type="button"
          onClick={() => onTabChange('games')}
          aria-current={currentTab === 'games' ? 'page' : undefined}
          className={tabClass(currentTab === 'games')}
        >
          <Layers className="mb-0.5 h-4 w-4 lg:mb-0" strokeWidth={1.5} />
          <span className="text-[12px] lg:text-sm">내 게임</span>
          <span className={`nav-pip ${currentTab === 'games' ? 'is-on' : ''}`} aria-hidden="true" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-end lg:order-first lg:mb-3 lg:flex-none">
          <button
            id="nav-fab-add-play"
            type="button"
            onClick={onQuickAddPlay}
            aria-label="기록 추가"
            className="btn-gold flex h-12 w-12 items-center justify-center rounded-full lg:h-11 lg:w-full lg:gap-2 lg:rounded-2xl"
          >
            <Plus className="h-5 w-5 lg:h-4 lg:w-4" strokeWidth={1.5} />
            <span className="hidden text-sm font-medium lg:inline">기록 추가</span>
          </button>
          <span className="mt-0.5 text-[12px] font-medium text-[#E2B657] lg:hidden">기록 추가</span>
        </div>

        <button
          id="nav-tab-plays"
          type="button"
          onClick={() => onTabChange('plays')}
          aria-current={currentTab === 'plays' ? 'page' : undefined}
          className={tabClass(currentTab === 'plays')}
        >
          <Trophy className="mb-0.5 h-4 w-4 lg:mb-0" strokeWidth={1.5} />
          <span className="text-[12px] lg:text-sm">플레이 기록</span>
          <span className={`nav-pip ${currentTab === 'plays' ? 'is-on' : ''}`} aria-hidden="true" />
        </button>

        <button
          id="nav-tab-mypage"
          type="button"
          onClick={() => onTabChange('mypage')}
          aria-current={currentTab === 'mypage' ? 'page' : undefined}
          className={tabClass(currentTab === 'mypage')}
        >
          <User className="mb-0.5 h-4 w-4 lg:mb-0" strokeWidth={1.5} />
          <span className="text-[12px] lg:text-sm">마이</span>
          <span className={`nav-pip ${currentTab === 'mypage' ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};
