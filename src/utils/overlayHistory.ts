/** Highest last. The back button closes this one and leaves the rest. */
export const OVERLAY_ORDER = [
  'treasure',
  'auth',
  'catalog',
  'kakao',
  'incoming',
  'share',
  'collector',
  'game',
  'play',
  'playForm',
  'gameForm',
  'scan',
  'deleteGame',
  'deletePlay'
] as const;

export type OverlayName = (typeof OVERLAY_ORDER)[number];

export function topOverlay(open: Partial<Record<OverlayName, boolean>>): OverlayName | null {
  for (let index = OVERLAY_ORDER.length - 1; index >= 0; index -= 1) {
    const name = OVERLAY_ORDER[index];
    if (open[name]) return name;
  }
  return null;
}
