import { useState, type FC } from 'react';
import { layoutCoverTitle, TEMPORARY_COVER_NOTICE } from '../utils/temporaryCover';

interface CoverPlaceholderProps {
  title: string;
  /** Korean name when the stored title is not already Korean. */
  koreanName?: string | null;
  className?: string;
}

/**
 * Temporary treasure-chest cover. The full Korean name (or the stored title)
 * is drawn in the app. Publisher art stays out until they allow it.
 * See TEMPORARY_COVER_NOTICE.
 */
export const CoverPlaceholder: FC<CoverPlaceholderProps> = ({ title, koreanName, className = '' }) => {
  const layout = layoutCoverTitle(title, koreanName);
  const fontSize = `${(layout.fontSize / 320) * 100}cqh`;
  const rows: { key: string; line: string }[] = [];
  let prefix = '';
  for (const line of layout.lines) {
    prefix = `${prefix}/${line}`;
    rows.push({ key: prefix, line });
  }
  return (
    <div
      className={`cover-placeholder ${className}`}
      data-cover="temporary"
      data-placeholder="true"
      data-temporary-cover="true"
      title={TEMPORARY_COVER_NOTICE}
    >
      <svg viewBox="0 0 240 320" className="cover-art" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="240" height="320" fill="#0E1628" />
        <rect x="10" y="10" width="220" height="300" rx="18" fill="none" stroke="#E2B657" strokeWidth="6" />
        <path d="M46 132c0-36 148-36 148 0v16H46z" fill="#5C4632" stroke="#E2B657" strokeWidth="5" />
        <rect x="40" y="140" width="160" height="16" fill="#E2B657" />
        <rect x="104" y="124" width="32" height="40" rx="6" fill="#F3D48A" stroke="#E2B657" strokeWidth="3" />
        <circle cx="120" cy="144" r="4" fill="#1C160E" />
        <rect x="36" y="156" width="168" height="130" rx="10" fill="#3A2C22" stroke="#C9A24A" strokeWidth="3" />
      </svg>
      <p className="cover-name" style={{ fontSize, lineHeight: 1.28 }}>
        {rows.map((row) => (
          <span key={row.key}>{row.line}</span>
        ))}
      </p>
    </div>
  );
};

interface CoverImageProps {
  title: string;
  koreanName?: string | null;
  imageUrl?: string | null;
  className?: string;
  alt?: string;
}

export const CoverImage: FC<CoverImageProps> = ({ title, koreanName, imageUrl, className = '', alt = '' }) => {
  const trimmed = imageUrl?.trim() ?? '';
  const [failedSrc, setFailedSrc] = useState('');
  if (!trimmed || failedSrc === trimmed) {
    return <CoverPlaceholder title={title} koreanName={koreanName} className={className} />;
  }
  return (
    <img
      src={trimmed}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailedSrc(trimmed)}
    />
  );
};
