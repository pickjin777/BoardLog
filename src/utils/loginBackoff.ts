/**
 * Wait grows after each failed local sign-in. The first miss is immediate.
 * There is no separate PIN; this covers the local email password.
 */
export function loginFailureDelayMs(priorFailures: number): number {
  if (!Number.isFinite(priorFailures) || priorFailures < 1) return 0;
  const step = Math.min(Math.floor(priorFailures), 6);
  return Math.min(8000, 400 * 2 ** (step - 1));
}

export function waitMs(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
