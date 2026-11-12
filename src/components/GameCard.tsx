import type React from 'react';
import { Users, Clock, Flame, MapPin, CheckSquare, Trash2 } from 'lucide-react';
import type { UserGame, GameOwnershipStatus } from '../types';
import { applyImageFallback, coverSrc } from '../utils/imageFallback';

export const getOwnershipBadgeColor = (status: GameOwnershipStatus): string => {
  switch (status) {
    case '보유중':
      return 'bg-[#EBFAEF] text-[#1B7A43] border-[#1B7A43]/30';
    case '빌려줌':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case '빌림':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case '판매예정':
      return 'bg-[#4834D4]/10 text-[#4834D4] border-[#4834D4]/30';
    case '판매완료':
      return 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF] line-through';
    case '분실':
    case '처분':
      return 'bg-[#FEEBEC] text-[#EB4D4B] border-[#EB4D4B]/30';
    default:
      return 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF]';
  }
};

interface GameCardProps {
  game: UserGame;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onQuickRecord?: (e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick, onDelete }) => {
  return (
    <div id={`game-card-${game.id}`} className="game-box group relative flex flex-col rounded-2xl">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${game.title} 열기`}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        {/* Top Image & Floating Badges */}
        <div className="relative w-full aspect-4/3 bg-[#F8F9FA] overflow-hidden rounded-t-2xl">
          <img
            src={coverSrc(game.imageUrl)}
            alt={game.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300"
            onError={applyImageFallback}
          />

          {/* Ownership Status Pill */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${getOwnershipBadgeColor(
                game.ownershipStatus
              )}`}
            >
              {game.ownershipStatus}
            </span>
          </div>

          {/* Play count badge & Action overlay */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
            <div className="bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
              <CheckSquare className="h-4 w-4" strokeWidth={1.5} />
              <span>{game.playCount || 0}회</span>
            </div>

            {onDelete && (
              <button
                type="button"
                aria-label="게임 삭제"
                title="게임 삭제"
                onClick={onDelete}
                className="pointer-events-auto relative z-20 w-6 h-6 rounded-full bg-black/60 hover:bg-[#EB4D4B] text-white flex items-center justify-center transition-colors shadow-xs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Condition pill */}
          {game.condition && (
            <div className="absolute bottom-2.5 left-2.5 bg-white/90 text-[#2D3436] px-2 py-0.5 rounded-full text-[9px] font-bold border border-[#E9ECEF]">
              상태: {game.condition}
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="paper flex flex-1 flex-col justify-between rounded-b-2xl p-3">
          <div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <h3 className="text-sm font-black text-[#1E272E] line-clamp-1 group-hover:text-[#4834D4] transition-colors">
                {game.title}
              </h3>
              {game.titleEn && <span className="text-[10px] text-[#636E72] line-clamp-1 truncate">{game.titleEn}</span>}
            </div>

            {/* Genre tags */}
            {game.genre && game.genre.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {game.genre.slice(0, 2).map((g) => (
                  <span key={g} className="px-2 py-0.5 bg-[#F1F3F5] text-[#636E72] rounded-full text-[9px] font-medium">
                    {g}
                  </span>
                ))}
                {game.genre.length > 2 && (
                  <span className="text-[9px] text-[#636E72] self-center">+{game.genre.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Meta badges */}
          <div className="pt-2 border-t border-[#E9ECEF] flex items-center justify-between text-[11px] text-[#636E72]">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#636E72]" />
              <span>
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers}인`
                  : `${game.minPlayers}~${game.maxPlayers}인`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#636E72]" />
              <span>{game.playTime}분</span>
            </div>

            {game.weight > 0 && (
              <div className="flex items-center gap-1 text-[#636E72]">
                <Flame className="h-4 w-4" strokeWidth={1.5} />
                <span className="tabular-nums">{game.weight.toFixed(1)}</span>
              </div>
            )}
          </div>

          {game.storageLocation && (
            <div className="mt-2 text-[10px] text-[#636E72] flex items-center gap-1 truncate">
              <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{game.storageLocation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
