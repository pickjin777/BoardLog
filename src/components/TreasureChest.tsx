import type React from 'react';

/**
 * Original chest mark. Closed until a parent `.treasure-reveal.is-open` runs the CSS.
 * No external art: shapes are drawn here.
 */
export const TreasureChest: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="-8 -12 96 92" aria-hidden="true" focusable="false">
    <ellipse className="treasure-glow" cx="40" cy="28" rx="28" ry="18" fill="#F3D48A" opacity="0" />
    <g className="treasure-rays" opacity="0">
      <polygon points="40,2 44,26 36,26" fill="#FFF6DC" />
      <polygon points="18,8 34,28 30,32" fill="#F3D48A" />
      <polygon points="62,8 46,28 50,32" fill="#F3D48A" />
      <polygon points="8,22 30,32 28,36" fill="#E4DCFF" />
      <polygon points="72,22 50,32 52,36" fill="#E4DCFF" />
    </g>
    <g className="treasure-lid">
      <path
        d="M12 36C12 20 24 12 40 12C56 12 68 20 68 36L62 40H18L12 36Z"
        fill="#F3D48A"
        stroke="#8A5A18"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 34H60" stroke="#C4922A" strokeWidth="2" strokeLinecap="round" />
    </g>
    <rect x="14" y="38" width="52" height="28" rx="6" fill="#E2B657" stroke="#8A5A18" strokeWidth="2" />
    <rect x="14" y="48" width="52" height="6" fill="#C4922A" />
    <circle cx="40" cy="51" r="5" fill="#E4DCFF" stroke="#4834D4" strokeWidth="1.6" />
    <circle cx="40" cy="51" r="2.2" fill="#4834D4" />
  </svg>
);
