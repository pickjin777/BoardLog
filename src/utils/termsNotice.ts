/** Bump this when the public terms change, so the next launch can tell people who already had a version. */
export const TERMS_VERSION = '2026-11-24';

/**
 * First launch has no stored version and stays quiet. A different stored version means the terms
 * changed after that person had already opened the app.
 */
export function shouldAnnounceTermsChange(stored: string | null, current = TERMS_VERSION): boolean {
  if (stored === null || stored === '') return false;
  return stored !== current;
}
