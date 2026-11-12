import type React from 'react';

const LOCK_FILL: Record<string, string> = {
  'lock-gold': '#E2B657',
  'lock-cream': '#F6EBD4',
  'lock-purple': '#4834D4'
};

/**
 * Navy board-game box used for the opening moment and the small mark.
 * The home hero is the separate WebP. This drawing stays in the bundle so the lid can move.
 */
export const TreasureChest: React.FC<{ className?: string; variant?: string }> = ({
  className,
  variant = 'lock-gold'
}) => {
  const lock = LOCK_FILL[variant] ?? LOCK_FILL['lock-gold'];
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true" focusable="false" data-chest-variant={variant}>
      <ellipse className="treasure-glow" cx="60" cy="46" rx="34" ry="16" fill="#F3D48A" opacity="0" />
      <g className="treasure-rays" opacity="0">
        <polygon points="60,14 66,44 54,44" fill="#FFF6DC" />
        <polygon points="28,22 50,46 44,50" fill="#F3D48A" />
        <polygon points="92,22 70,46 76,50" fill="#F3D48A" />
      </g>
      <g className="treasure-lid">
        <path d="M22 50 L32 26 H88 L98 50 Z" fill="#1A2B4A" stroke="#E2B657" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 40 C48 32, 62 46, 84 34" fill="none" stroke="#E2B657" strokeWidth="3" strokeLinecap="round" />
        <circle cx="84" cy="34" r="3.2" fill="#C4453C" />
      </g>
      <rect x="18" y="48" width="84" height="40" rx="6" fill="#1A2B4A" stroke="#E2B657" strokeWidth="3" />
      <path d="M26 74 H46" stroke="#E2B657" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 74 H68" stroke="#3D8F5A" strokeWidth="5" strokeLinecap="round" />
      <path d="M70 74 H94" stroke="#3A6FD8" strokeWidth="5" strokeLinecap="round" />
      <rect x="28" y="56" width="14" height="14" rx="3" fill="#F6EBD4" />
      <circle cx="32" cy="60" r="1.2" fill="#1C160E" />
      <circle cx="38" cy="66" r="1.2" fill="#1C160E" />
      <g transform="translate(60 62)">
        <circle cx="0" cy="-8" r="6" fill={lock} stroke="#8A5A18" strokeWidth="1.4" />
        <path d="M-9 2c1.2-7 4.2-10 9-10s7.8 3 9 10l2 12H-11Z" fill={lock} stroke="#8A5A18" strokeWidth="1.4" />
      </g>
    </svg>
  );
};
