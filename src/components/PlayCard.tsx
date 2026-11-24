import type React from 'react';
import type { PlayRecord } from '../types';
import { applyImageFallback } from '../utils/imageFallback';
import { memoryFace } from '../utils/memoryCard';
import { CoverPlaceholder } from './CoverPlaceholder';

interface PlayCardProps {
  play: PlayRecord;
  onClick?: () => void;
  variant?: 'list' | 'sheet';
}

function MemoryPhoto({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return <CoverPlaceholder title={title} className="h-full w-full" />;
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
            ? 'h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#172033]'
            : 'h-40 w-full overflow-hidden rounded-lg bg-[#172033]'
        }
      >
        <MemoryPhoto url={face.imageUrl} title={play.gameTitle} />
      </div>
      <div className={variant === 'sheet' ? 'min-w-0 flex-1 space-y-1' : 'mt-3 min-w-0 space-y-1.5'}>
        <p className="text-xs font-medium text-[#1C160E]">추억 카드</p>
        <p className="text-sm text-[#1C160E]">{face.dateLabel}</p>
        <p className="break-words text-base font-medium text-[#1C160E]">{play.gameTitle}</p>
        <p className="break-words text-sm text-[#5C4632]">{face.playerLabel}</p>
        <p className="break-words text-sm font-medium text-[#1C160E]">{face.winnerLabel}</p>
      </div>
    </>
  );

  if (variant === 'sheet') {
    return (
      <article
        id="saved-memory-card"
        data-image-kind={face.imageKind}
        className="memory-card paper mb-4 flex gap-4 rounded-3xl p-4"
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
      className="memory-card paper w-full min-w-0 rounded-3xl p-4 text-left"
    >
      {body}
    </button>
  );
};
