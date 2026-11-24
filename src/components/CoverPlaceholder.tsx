import { useState, type FC, type ReactNode } from 'react';
import { chestKindFor, layoutCoverTitle, TEMPORARY_COVER_NOTICE, type ChestKind } from '../utils/temporaryCover';

interface CoverPlaceholderProps {
  title: string;
  /** Korean name when the stored title is not already Korean. */
  koreanName?: string | null;
  /** Genre and tag labels. They pick the chest only when there is no case image. */
  labels?: readonly string[] | null;
  className?: string;
}

const INK = '#1C160E';
const CREAM = '#F6EBD4';
const GOLD = '#E2B657';
const GOLD_HI = '#F3D48A';

function ChestEmblem({ kind }: { kind: ChestKind }) {
  if (kind === 'party') {
    return (
      <g>
        <rect x="114" y="96" width="12" height="52" fill="#C4453C" />
        <rect x="70" y="112" width="100" height="10" fill="#C4453C" />
        <path d="M92 112c-16-18-8-28 8-18 10-12 26-2 12 16" fill={GOLD_HI} />
        <path d="M148 112c16-18 8-28-8-18-10-12-26-2-12 16" fill={GOLD} />
      </g>
    );
  }
  if (kind === 'mystery') {
    return (
      <text x="120" y="128" textAnchor="middle" fill={GOLD} fontSize="28" fontWeight="700">
        ?
      </text>
    );
  }
  if (kind === 'strategy') {
    return (
      <g fill={GOLD_HI} transform="translate(58 112)">
        <path d="M0 14h40l-6 12H6z" />
        <rect x="14" y="0" width="12" height="14" rx="2" />
        <rect x="0" y="26" width="40" height="6" rx="1" />
      </g>
    );
  }
  if (kind === 'cooperative') {
    return (
      <g fill="none" stroke={GOLD} strokeWidth="4">
        <circle cx="100" cy="122" r="10" />
        <circle cx="140" cy="122" r="10" />
        <path d="M110 122h20" />
      </g>
    );
  }
  if (kind === 'card') {
    return (
      <g>
        <rect x="96" y="104" width="22" height="32" rx="2" fill={CREAM} transform="rotate(-16 107 120)" />
        <rect x="109" y="102" width="22" height="32" rx="2" fill={GOLD_HI} />
        <rect x="122" y="104" width="22" height="32" rx="2" fill={CREAM} transform="rotate(16 133 120)" />
      </g>
    );
  }
  if (kind === 'family') {
    return (
      <polygon points="120,100 126,114 142,116 130,126 134,142 120,134 106,142 110,126 98,116 114,114" fill={GOLD} />
    );
  }
  if (kind === 'abstract') {
    return (
      <g>
        <rect x="96" y="108" width="16" height="16" fill={GOLD} />
        <polygon points="132,108 148,108 140,124" fill={GOLD_HI} />
        <circle cx="120" cy="132" r="8" fill={CREAM} />
      </g>
    );
  }
  if (kind === 'dice') {
    return (
      <g>
        <rect x="104" y="104" width="32" height="32" rx="4" fill={CREAM} />
        <circle cx="112" cy="112" r="2.2" fill={INK} />
        <circle cx="128" cy="112" r="2.2" fill={INK} />
        <circle cx="120" cy="120" r="2.2" fill={INK} />
        <circle cx="112" cy="128" r="2.2" fill={INK} />
        <circle cx="128" cy="128" r="2.2" fill={INK} />
      </g>
    );
  }
  if (kind === 'word') {
    return (
      <g>
        <rect x="92" y="104" width="56" height="28" rx="8" fill={CREAM} />
        <polygon points="108,132 118,132 110,142" fill={CREAM} />
      </g>
    );
  }
  if (kind === 'economic') {
    return (
      <g>
        <circle cx="108" cy="122" r="14" fill={GOLD} />
        <circle cx="132" cy="122" r="14" fill={GOLD_HI} />
        <circle cx="108" cy="122" r="6" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="132" cy="122" r="6" fill="none" stroke={INK} strokeWidth="2" />
      </g>
    );
  }
  if (kind === 'horror') {
    return (
      <g>
        <rect x="114" y="100" width="12" height="18" rx="2" fill={GOLD} />
        <polygon points="108,118 132,118 128,140 112,140" fill={GOLD_HI} />
        <circle cx="120" cy="126" r="4" fill="#C4453C" />
      </g>
    );
  }
  return null;
}

function ChestFrame({ kind, children }: { kind: ChestKind; children: ReactNode }) {
  const horror = kind === 'horror';
  const soft = kind === 'family';
  const body = horror ? '#241910' : '#3A2C22';
  const lid = horror ? '#1A140C' : '#5C4632';
  return (
    <g>
      <path
        d={soft ? 'M58 150c0-40 124-40 124 0v14H58z' : 'M46 148c0-40 148-40 148 0v14H46z'}
        fill={lid}
        stroke={GOLD}
        strokeWidth="5"
      />
      <rect x="40" y="154" width="160" height="14" fill={GOLD} />
      <rect x="108" y="138" width="24" height="34" rx="5" fill={GOLD_HI} stroke={GOLD} strokeWidth="2" />
      <circle cx="120" cy="154" r="3.5" fill={INK} />
      <rect x="36" y="168" width="168" height="118" rx={soft ? 28 : 12} fill={body} stroke="#C9A24A" strokeWidth="3" />
      <ChestEmblem kind={kind} />
      {children}
    </g>
  );
}

/**
 * Temporary chest cover. The Korean name sits on a cream nameplate on the chest front.
 * Publisher art stays out until they allow it. See TEMPORARY_COVER_NOTICE.
 */
export const CoverPlaceholder: FC<CoverPlaceholderProps> = ({ title, koreanName, labels, className = '' }) => {
  const layout = layoutCoverTitle(title, koreanName);
  const kind = chestKindFor(labels);
  const lineHeight = layout.fontSize * 1.25;
  const block = layout.lines.length * lineHeight;
  const firstBaseline = 214 - block / 2 + layout.fontSize * 0.8;
  const rows: { key: string; line: string; dy: number }[] = [];
  let prefix = '';
  layout.lines.forEach((line, index) => {
    prefix = `${prefix}/${line}`;
    rows.push({ key: prefix, line, dy: index === 0 ? 0 : lineHeight });
  });
  return (
    <div
      className={`cover-placeholder ${className}`}
      data-cover="temporary"
      data-placeholder="true"
      data-temporary-cover="true"
      data-chest={kind}
      title={TEMPORARY_COVER_NOTICE}
    >
      <svg
        viewBox="0 0 240 320"
        className="cover-art"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={layout.name}
      >
        <rect width="240" height="320" fill="#0E1628" />
        <rect x="10" y="10" width="220" height="300" rx="18" fill="none" stroke={GOLD} strokeWidth="6" />
        <ChestFrame kind={kind}>
          <rect x="52" y="186" width="136" height="78" rx="8" fill={CREAM} stroke={GOLD} strokeWidth="3" />
          <text
            x="120"
            y={firstBaseline}
            textAnchor="middle"
            fill={INK}
            fontSize={layout.fontSize}
            fontWeight="700"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif"
          >
            {rows.map((row) => (
              <tspan key={row.key} x="120" dy={row.dy}>
                {row.line}
              </tspan>
            ))}
          </text>
        </ChestFrame>
      </svg>
    </div>
  );
};

interface CoverImageProps {
  title: string;
  koreanName?: string | null;
  imageUrl?: string | null;
  labels?: readonly string[] | null;
  className?: string;
  alt?: string;
}

export const CoverImage: FC<CoverImageProps> = ({ title, koreanName, imageUrl, labels, className = '', alt = '' }) => {
  const trimmed = imageUrl?.trim() ?? '';
  const [failedSrc, setFailedSrc] = useState('');
  if (!trimmed || failedSrc === trimmed) {
    return <CoverPlaceholder title={title} koreanName={koreanName} labels={labels} className={className} />;
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
