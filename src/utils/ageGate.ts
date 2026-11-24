/** Self-declared age band. Stored only on the device. Never send this value. */
export type AgeBand = 'unset' | 'under_14' | '14_or_over';

export const AGE_BAND_EVENT = 'boardlog-age-band';

/** Unknown or tampered values stay unset, which blocks anything that leaves the device. */
export function parseAgeBand(value: unknown): AgeBand {
  if (value === 'under_14' || value === '14_or_over') return value;
  return 'unset';
}

/**
 * Photo recognition, Google Analytics, and Vercel Web Analytics may run only after
 * the person says they are 14 or older. Under 14, and "not chosen yet", stay off.
 */
export function allowsOffDeviceCollection(band: AgeBand): boolean {
  return band === '14_or_over';
}

export function ageBandLabel(band: AgeBand): string {
  if (band === '14_or_over') return '만 14세 이상';
  if (band === 'under_14') return '만 14세 미만';
  return '아직 선택하지 않음';
}
