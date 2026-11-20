import type React from 'react';
import type { PlayRecord } from '../types';
import { applyImageFallback } from '../utils/imageFallback';
import { memoryFace } from '../utils/memoryCard';

function Meeple({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <circle cx="32" cy="16" r="12" fill="#F3D48A" />
      <path d="M12 42c2-12 8-18 20-18s18 6 20 18l4 28c0 4-4 8-8 8H16c-4 0-8-4-8-8l4-28z" fill="#F3D48A" />
    </svg>
  );
}

interface PlayCardProps {
  play: PlayRecord;
  onClick?: () => void;
  variant?: 'list' | 'sheet';
}

function MemoryPhoto({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#4834D4]" data-placeholder="true">
        <Meeple className="h-16 w-14" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="h-full w-full object-cover"
      referrerPolicy="no-referrer"
      onError={applyImageFallback}
    />
  );
}

export const PlayCard: React.FC<PlayCardProps> = ({ play, onClick, variant = 'list' }) => {
  const face = memoryFace(play);
  const body = (
    <>
      <div
        className={
          variant === 'sheet'
            ? 'h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#4834D4]'
            : 'h-40 w-full overflow-hidden rounded-2xl bg-[#4834D4]'
        }
      >
        <MemoryPhoto url={face.imageUrl} />
      </div>
      <div className={variant === 'sheet' ? 'min-w-0 flex-1 space-y-1' : 'mt-3 min-w-0 space-y-1.5'}>
        <p className="text-xs font-bold text-[#F3D48A]">추억 카드</p>
        <p className="text-sm text-[#F6EBD4]">{face.dateLabel}</p>
        <p className="break-words text-base font-black text-[#F6EBD4]">{play.gameTitle}</p>
        <p className="break-words text-sm text-[#E4D3B4]">{face.playerLabel}</p>
        <p className="break-words text-sm font-bold text-[#F6EBD4]">{face.winnerLabel}</p>
      </div>
    </>
  );

  if (variant === 'sheet') {
    return (
      <article
        id="saved-memory-card"
        data-image-kind={face.imageKind}
        className="memory-card mb-3 flex gap-4 rounded-2xl border border-[#C6A36A] bg-[#100E0B] p-4"
      >
        {body}
      </article>
    );
  }

  return (
    <button
      id={`play-card-${play.id}`}
      type="button"
      onClick={onClick}
      data-image-kind={face.imageKind}
      className="memory-card w-full min-w-0 rounded-3xl border border-[#C6A36A] bg-[#1C1812] p-4 text-left"
    >
      {body}
    </button>
  );
};
