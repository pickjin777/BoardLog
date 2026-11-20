import type React from 'react';
import { Database, UserCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TreasureChest } from './TreasureChest';

interface NavbarProps {
  onOpenAuth: () => void;
  chestVariant?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, chestVariant }) => {
  const { user } = useAuth();

  return (
    <header id="top-app-header" className="sticky top-0 z-30 bg-white/90 border-b border-[#E9ECEF]">
      <div className="mx-auto flex min-h-15 max-w-xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-2 md:max-w-3xl md:px-6 lg:max-w-6xl">
        {/* Brand Logo & Title */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#E2B657]">
            <TreasureChest className="h-8 w-8" variant={chestVariant} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black  text-[#1E272E]">보드로그</h1>
              <span className="hidden rounded-full border border-[#E9ECEF] bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-bold text-[#4834D4] sm:inline">
                Board Log
              </span>
            </div>
          </div>
        </div>

        {/* Right action & status */}
        <div className="flex items-center gap-2">
          <div
            title="브라우저 고속 IndexedDB 가동 중 (새로고침 후에도 영구 유지)"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F3F5] border border-[#E9ECEF] text-[11px] text-[#636E72] font-medium"
          >
            <Database className="w-3 h-3 text-[#1B7A43]" />
            <span>로컬 DB</span>
          </div>

          <button
            id="header-user-profile-btn"
            type="button"
            onClick={onOpenAuth}
            title={
              user?.isAnonymous
                ? '이 브라우저에만 있는 계정입니다. 다른 기기와 동기화되지 않습니다.'
                : '이 브라우저에 저장된 계정'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F3F5] hover:bg-[#E9ECEF] active:bg-[#DFE4EA] text-[#2D3436] text-xs font-semibold transition-colors"
          >
            {user?.isAnonymous ? (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#636E72]" />
                <span className="max-w-[70px] truncate">이 기기</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#4834D4]" />
                <span className="max-w-[80px] truncate">{user?.nickname || '내 계정'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
