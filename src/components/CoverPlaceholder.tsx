import type React from 'react';
import { coverInitials } from '../utils/coverInitials';
import { applyImageFallback } from '../utils/imageFallback';

interface CoverPlaceholderProps {
  title: string;
  className?: string;
}

/** Initials on a navy chest. No network request when a seed game has no cover. */
export const CoverPlaceholder: React.FC<CoverPlaceholderProps> = ({ title, className = '' }) => {
  return (
    <div className={`cover-placeholder ${className}`} data-cover="placeholder" aria-hidden="true">
      <svg viewBox="0 0 80 100" className="cover-motif" focusable="false" role="presentation">
        <title>표지 없음</title>
        <rect x="8" y="36" width="64" height="48" rx="6" fill="#243044" />
        <path d="M10 40c8-16 18-22 30-22s22 6 30 22" fill="#E2B657" />
        <rect x="34" y="52" width="12" height="16" rx="2" fill="#C9956A" />
      </svg>
      <span className="cover-initials">{coverInitials(title)}</span>
    </div>
  );
};

interface CoverImageProps {
  title: string;
  imageUrl?: string | null;
  className?: string;
  alt?: string;
}

export const CoverImage: React.FC<CoverImageProps> = ({ title, imageUrl, className = '', alt = '' }) => {
  const trimmed = imageUrl?.trim() ?? '';
  if (!trimmed) return <CoverPlaceholder title={title} className={className} />;
  return (
    <img src={trimmed} alt={alt} referrerPolicy="no-referrer" className={className} onError={applyImageFallback} />
  );
};
