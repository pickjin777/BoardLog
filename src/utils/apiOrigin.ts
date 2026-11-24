/**
 * The web app calls `/api` on its own origin. A Capacitor shell is served from
 * `https://localhost` (Android) or `capacitor://localhost` (iOS), so a relative
 * `/api` never reaches the Vercel function. Native calls use the production origin.
 */
export function resolveApiUrl(path: string, native: boolean, origin: string): string {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with /');
  }
  if (!native) return path;
  const base = origin.trim().replace(/\/+$/, '');
  if (!base.startsWith('https://')) {
    throw new Error('Native API origin must use https');
  }
  return `${base}${path}`;
}
