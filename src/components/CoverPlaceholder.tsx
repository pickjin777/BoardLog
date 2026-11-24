import { useState, type FC, type ReactNode } from 'react';
import { chestSpecFor, layoutCoverTitle, TEMPORARY_COVER_NOTICE, type ChestSpec } from '../utils/temporaryCover';

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

function ChestBody({ spec }: { spec: ChestSpec }) {
  const { shape, body, lid, accent } = spec;
  if (shape === 'gift') {
    return (
      <g>
        <rect x="48" y="118" width="144" height="150" rx="8" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="108" y="96" width="24" height="172" fill={lid} />
        <rect x="48" y="150" width="144" height="22" fill={lid} />
        <path d="M84 118c-20-28 8-40 24-16 16-24 44-8 24 16" fill={accent} />
      </g>
    );
  }
  if (shape === 'crate') {
    return (
      <g>
        <rect x="44" y="96" width="152" height="172" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M44 96 L120 132 L196 96" fill={lid} stroke={accent} strokeWidth="6" />
      </g>
    );
  }
  if (shape === 'ammo') {
    return (
      <g>
        <rect x="36" y="118" width="168" height="140" rx="4" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="36" y="108" width="168" height="28" fill={lid} />
        <rect x="58" y="108" width="14" height="150" fill={accent} />
        <rect x="168" y="108" width="14" height="150" fill={accent} />
      </g>
    );
  }
  if (shape === 'scroll') {
    return (
      <g>
        <rect x="46" y="118" width="148" height="120" rx="18" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="36" y="108" width="28" height="140" rx="14" fill={lid} />
        <rect x="176" y="108" width="28" height="140" rx="14" fill={lid} />
      </g>
    );
  }
  if (shape === 'capsule') {
    return (
      <g>
        <rect x="70" y="78" width="100" height="190" rx="50" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="70" y="150" width="100" height="18" fill={lid} />
      </g>
    );
  }
  if (shape === 'barrel') {
    return (
      <g>
        <path d="M58 108c0 90 0 120 62 150 62-30 62-60 62-150z" fill={body} stroke={accent} strokeWidth="6" />
        <ellipse cx="120" cy="108" rx="62" ry="22" fill={lid} stroke={accent} strokeWidth="5" />
      </g>
    );
  }
  if (shape === 'basket') {
    return (
      <g>
        <path d="M58 140h124l-16 120H74z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M70 140c10-40 90-40 100 0" fill="none" stroke={lid} strokeWidth="8" />
      </g>
    );
  }
  if (shape === 'case') {
    return (
      <g>
        <rect x="40" y="120" width="160" height="140" rx="10" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M78 120v-24h84v24" fill="none" stroke={lid} strokeWidth="8" />
      </g>
    );
  }
  if (shape === 'toy') {
    return (
      <g>
        <path d="M48 150c8-48 136-48 144 0v110H48z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M48 150h144" stroke={lid} strokeWidth="12" />
      </g>
    );
  }
  if (shape === 'mail') {
    return (
      <g>
        <rect x="46" y="130" width="148" height="130" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M46 130 L120 188 L194 130" fill={lid} />
      </g>
    );
  }
  if (shape === 'cage') {
    return (
      <g>
        <path d="M52 128h136l-12 132H64z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M78 128v132 M110 128v132 M150 128v132" stroke={lid} strokeWidth="8" />
      </g>
    );
  }
  if (shape === 'satchel') {
    return (
      <g>
        <path d="M56 150c0-36 128-36 128 0v110H56z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M86 150v-28h68v28" fill="none" stroke={lid} strokeWidth="8" />
      </g>
    );
  }
  if (shape === 'board') {
    return (
      <g>
        <rect x="58" y="78" width="124" height="190" rx="8" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="100" y="64" width="40" height="22" rx="6" fill={lid} />
      </g>
    );
  }
  if (shape === 'wedge') {
    return (
      <g>
        <path d="M28 170 L120 96 L212 170 L196 260 H44z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M44 170h152" stroke={lid} strokeWidth="10" />
      </g>
    );
  }
  if (shape === 'temple') {
    return (
      <g>
        <path d="M48 130 L120 78 L192 130v130H48z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M78 150v90 M120 140v100 M162 150v90" stroke={lid} strokeWidth="8" />
      </g>
    );
  }
  if (shape === 'book') {
    return (
      <g>
        <path d="M46 110h70c8 16 8 150 0 160H46z" fill={lid} stroke={accent} strokeWidth="5" />
        <path d="M194 110h-70c-8 16-8 150 0 160h70z" fill={body} stroke={accent} strokeWidth="5" />
      </g>
    );
  }
  if (shape === 'sleeve') {
    return (
      <g>
        <rect x="78" y="70" width="84" height="200" rx="8" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="78" y="148" width="84" height="18" fill={lid} />
      </g>
    );
  }
  if (shape === 'cube') {
    return (
      <g>
        <path d="M48 124 L120 86 L192 124 V248 L120 286 L48 248z" fill={body} stroke={accent} strokeWidth="6" />
        <path d="M120 156 V286 M48 124 L120 156 L192 124" stroke={lid} strokeWidth="6" />
      </g>
    );
  }
  if (shape === 'alarm') {
    return (
      <g>
        <circle cx="120" cy="170" r="78" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="70" y="86" width="22" height="28" rx="4" fill={lid} transform="rotate(-28 81 100)" />
        <rect x="148" y="86" width="22" height="28" rx="4" fill={lid} transform="rotate(28 159 100)" />
      </g>
    );
  }
  if (shape === 'column') {
    return (
      <g>
        <rect x="86" y="78" width="68" height="190" fill={body} stroke={accent} strokeWidth="6" />
        <rect x="70" y="66" width="100" height="22" fill={lid} />
        <rect x="70" y="248" width="100" height="22" fill={lid} />
      </g>
    );
  }
  return (
    <g>
      <path d="M46 150c0-42 148-42 148 0v16H46z" fill={lid} stroke={accent} strokeWidth="5" />
      <rect x="36" y="174" width="168" height="112" rx="12" fill={body} stroke={accent} strokeWidth="5" />
    </g>
  );
}

function Mark({ spec }: { spec: ChestSpec }) {
  const fill = spec.accent;
  const ink = INK;
  if (spec.emblem === 'lantern') {
    return (
      <g>
        <rect x="108" y="86" width="24" height="22" rx="4" fill={fill} />
        <path d="M100 108h40l-6 40h-28z" fill={CREAM} />
      </g>
    );
  }
  if (spec.emblem === 'masks') {
    return (
      <g>
        <ellipse cx="96" cy="118" rx="22" ry="28" fill={CREAM} />
        <ellipse cx="146" cy="118" rx="22" ry="28" fill={fill} />
      </g>
    );
  }
  if (spec.emblem === 'glass') {
    return (
      <g fill="none" stroke={CREAM} strokeWidth="8">
        <circle cx="108" cy="112" r="24" />
        <path d="M126 130 L158 162" />
      </g>
    );
  }
  if (spec.emblem === 'quiz') {
    return (
      <text x="120" y="150" textAnchor="middle" fill={ink} fontSize="78" fontWeight="700">
        ?
      </text>
    );
  }
  if (spec.emblem === 'speech') {
    return (
      <g fill={CREAM}>
        <rect x="74" y="96" width="92" height="48" rx="16" />
        <polygon points="96,144 120,144 104,166" />
      </g>
    );
  }
  if (spec.emblem === 'plus') return <path d="M108 92h24v30h30v24h-30v30h-24v-30H78v-24h30z" fill={CREAM} />;
  if (spec.emblem === 'pair') {
    return (
      <g>
        <rect x="74" y="96" width="40" height="56" rx="4" fill={CREAM} />
        <rect x="126" y="96" width="40" height="56" rx="4" fill={fill} />
      </g>
    );
  }
  if (spec.emblem === 'balance') {
    return (
      <g stroke={ink} strokeWidth="8" fill={CREAM}>
        <path d="M64 128h112 M120 96v64" fill="none" />
        <circle cx="72" cy="128" r="16" />
        <circle cx="168" cy="128" r="16" />
      </g>
    );
  }
  if (spec.emblem === 'bolt') return <polygon points="136,84 92,140 118,140 100,188 160,120 130,120" fill={CREAM} />;
  if (spec.emblem === 'seal') {
    return (
      <g>
        <circle cx="120" cy="118" r="30" fill={fill} />
        <circle cx="120" cy="118" r="12" fill={ink} />
      </g>
    );
  }
  if (spec.emblem === 'scroll') return <rect x="72" y="104" width="96" height="40" rx="20" fill={CREAM} />;
  if (spec.emblem === 'anchor') {
    return (
      <g fill="none" stroke={fill} strokeWidth="8">
        <circle cx="120" cy="96" r="14" />
        <path d="M120 110v56 M88 140c10 32 54 32 64 0" />
      </g>
    );
  }
  if (spec.emblem === 'train') return <rect x="64" y="112" width="112" height="40" rx="10" fill={CREAM} />;
  if (spec.emblem === 'wheat') {
    return (
      <g stroke={CREAM} strokeWidth="7" fill="none">
        <path d="M120 92v80" />
        <path d="M120 112c-18-8-18 10 0 4 M120 132c18-8 18 10 0 4 M120 152c-18-8-18 10 0 4" />
      </g>
    );
  }
  if (spec.emblem === 'leaf')
    return <ellipse cx="120" cy="124" rx="30" ry="44" fill={CREAM} transform="rotate(-25 120 124)" />;
  if (spec.emblem === 'chevron') return <path d="M64 112 L120 168 L176 112 L152 112 L120 144 L88 112z" fill={ink} />;
  if (spec.emblem === 'ball') return <circle cx="120" cy="124" r="36" fill={CREAM} stroke={ink} strokeWidth="6" />;
  if (spec.emblem === 'key') {
    return (
      <g fill={fill}>
        <circle cx="96" cy="120" r="22" />
        <rect x="112" y="110" width="60" height="18" />
      </g>
    );
  }
  if (spec.emblem === 'gem') return <polygon points="120,88 164,128 120,172 76,128" fill={fill} />;
  if (spec.emblem === 'tower') return <path d="M92 164h56V128L120 92 92 128z" fill={fill} />;
  if (spec.emblem === 'planet') {
    return (
      <g>
        <circle cx="120" cy="124" r="28" fill={fill} />
        <ellipse cx="120" cy="124" rx="46" ry="14" fill="none" stroke={CREAM} strokeWidth="7" />
      </g>
    );
  }
  if (spec.emblem === 'shield') return <path d="M80 96h80v40c0 32-40 52-40 52s-40-20-40-52z" fill={fill} />;
  if (spec.emblem === 'pillar') return <rect x="100" y="92" width="40" height="76" fill={ink} />;
  if (spec.emblem === 'book') return <path d="M78 104h36v64H78z M126 104h36v64h-36z" fill={CREAM} />;
  if (spec.emblem === 'meeple' || spec.emblem === 'one') {
    return (
      <g fill={CREAM}>
        <circle cx="120" cy="100" r="18" />
        <path d="M92 164c6-32 14-42 28-42s22 10 28 42z" />
      </g>
    );
  }
  if (spec.emblem === 'duel') {
    return (
      <g fill={CREAM}>
        <circle cx="92" cy="104" r="14" />
        <circle cx="150" cy="104" r="14" />
        <path d="M70 160c6-26 12-34 22-34s16 8 22 34z M126 160c6-26 12-34 22-34s16 8 22 34z" />
      </g>
    );
  }
  if (spec.emblem === 'stack') {
    return (
      <g fill={CREAM}>
        <rect x="80" y="132" width="80" height="18" />
        <rect x="80" y="108" width="80" height="18" />
        <rect x="80" y="84" width="80" height="18" />
      </g>
    );
  }
  if (spec.emblem === 'pick') return <polygon points="156,88 92,140 118,150 104,184 176,124" fill={CREAM} />;
  if (spec.emblem === 'pencil')
    return <rect x="108" y="84" width="20" height="90" rx="3" transform="rotate(28 118 128)" fill={CREAM} />;
  if (spec.emblem === 'hands') {
    return (
      <g fill="none" stroke={ink} strokeWidth="8">
        <circle cx="92" cy="124" r="22" />
        <circle cx="148" cy="124" r="22" />
      </g>
    );
  }
  if (spec.emblem === 'die') {
    return (
      <g>
        <rect x="84" y="92" width="72" height="72" rx="10" fill={CREAM} />
        <circle cx="106" cy="114" r="6" fill={ink} />
        <circle cx="134" cy="142" r="6" fill={ink} />
        <circle cx="120" cy="128" r="6" fill={ink} />
      </g>
    );
  }
  if (spec.emblem === 'bow') {
    return (
      <g>
        <path d="M70 112c24-36 40 8 50 18-12 14-30 40-50 16 18-8 18-26 0-34z" fill="#F08A24" />
        <path d="M170 112c-24-36-40 8-50 18 12 14 30 40 50 16-18-8-18-26 0-34z" fill="#2BB3C7" />
        <rect x="110" y="96" width="20" height="64" fill={CREAM} />
      </g>
    );
  }
  if (spec.emblem === 'chain') {
    return (
      <g fill="none" stroke={CREAM} strokeWidth="8">
        <circle cx="92" cy="124" r="22" />
        <circle cx="148" cy="124" r="22" />
      </g>
    );
  }
  if (spec.emblem === 'path')
    return <path d="M64 156 C100 96 140 168 184 100" fill="none" stroke={CREAM} strokeWidth="12" />;
  if (spec.emblem === 'shapes') {
    return (
      <g>
        <rect x="74" y="96" width="36" height="36" fill={ink} />
        <polygon points="156,96 188,156 124,156" fill={CREAM} />
        <circle cx="100" cy="156" r="16" fill={fill} />
      </g>
    );
  }
  if (spec.emblem === 'fan') {
    return (
      <g>
        <rect x="82" y="100" width="32" height="60" rx="4" fill={CREAM} transform="rotate(-20 98 130)" />
        <rect x="104" y="92" width="32" height="60" rx="4" fill={fill} />
        <rect x="126" y="100" width="32" height="60" rx="4" fill={CREAM} transform="rotate(20 142 130)" />
      </g>
    );
  }
  if (spec.emblem === 'coins') {
    return (
      <g>
        <circle cx="100" cy="124" r="30" fill={fill} />
        <circle cx="142" cy="124" r="30" fill={CREAM} />
      </g>
    );
  }
  if (spec.emblem === 'star') {
    return <polygon points="120,84 136,118 172,122 144,146 154,182 120,162 86,182 96,146 68,122 104,118" fill={ink} />;
  }
  if (spec.emblem === 'crown') return <path d="M70 156 L96 96 L120 136 L148 84 L174 156z" fill={fill} />;
  return <rect x="100" y="100" width="40" height="44" rx="8" fill={fill} />;
}

function Stain() {
  return (
    <g fill="#9B1B2E">
      <path d="M66 168c7 0 9 12 0 24-9-12-7-24 0-24z" />
      <path d="M166 184c5 0 7 9 0 18-7-9-5-18 0-18z" />
      <ellipse cx="92" cy="176" rx="9" ry="5" />
    </g>
  );
}

function Confetti() {
  const bits: Array<[number, number, string]> = [
    [30, 64, '#F0C14A'],
    [190, 58, '#2BB3C7'],
    [24, 150, '#3E8F4A'],
    [198, 160, '#F08A24'],
    [40, 230, '#F6EBD4'],
    [188, 220, '#E23B5A']
  ];
  return (
    <g>
      {bits.map(([x, y, color]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="16" height="8" rx="2" fill={color} />
      ))}
    </g>
  );
}

function ChestArt({ spec, children }: { spec: ChestSpec; children: ReactNode }) {
  return (
    <g>
      <ChestBody spec={spec} />
      <Mark spec={spec} />
      {spec.stain ? <Stain /> : null}
      {spec.flashy ? <Confetti /> : null}
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
  const spec = chestSpecFor(labels);
  const lineHeight = layout.fontSize * 1.25;
  const block = layout.lines.length * lineHeight;
  const firstBaseline = 240 - block / 2 + layout.fontSize * 0.72;
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
      data-chest={spec.id}
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
        <ChestArt spec={spec}>
          <rect x="52" y="206" width="136" height="68" rx="8" fill={CREAM} stroke={spec.accent} strokeWidth="3" />
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
        </ChestArt>
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
