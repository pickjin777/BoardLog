import type React from 'react';

/**
 * Meeple and die on a navy box. Inline so a missing cover never requests a remote image.
 * A remote placeholder re-fires `onError` when it fails too, which loops.
 */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">' +
      '<rect width="600" height="450" fill="#172033"/>' +
      '<rect x="36" y="36" width="528" height="378" rx="28" fill="#243044"/>' +
      '<rect x="150" y="150" width="130" height="130" rx="18" fill="#F6EBD4"/>' +
      '<circle cx="186" cy="186" r="12" fill="#1C160E"/>' +
      '<circle cx="244" cy="186" r="12" fill="#1C160E"/>' +
      '<circle cx="186" cy="244" r="12" fill="#1C160E"/>' +
      '<circle cx="244" cy="244" r="12" fill="#1C160E"/>' +
      '<circle cx="410" cy="168" r="36" fill="#E2B657"/>' +
      '<path d="M352 250c8-40 24-58 58-58s50 18 58 58l12 78c0 12-10 22-22 22h-96c-12 0-22-10-22-22z" fill="#E2B657"/>' +
      '</svg>'
  );

export function coverSrc(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? '';
  return trimmed || PLACEHOLDER_IMAGE;
}

export function applyImageFallback(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = PLACEHOLDER_IMAGE;
}
