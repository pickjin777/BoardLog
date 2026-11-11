interface CapacitorBridge {
  isNativePlatform?: () => boolean;
}

function hasCapacitor(scope: object): scope is { Capacitor?: CapacitorBridge } {
  return 'Capacitor' in scope;
}

/**
 * True only when the Capacitor native bridge injected `window.Capacitor`.
 * `https://localhost` is also the Vite preview origin, so the URL alone is not enough.
 */
export function isNativeShell(scope: object = globalThis): boolean {
  if (!hasCapacitor(scope)) return false;
  return scope.Capacitor?.isNativePlatform?.() === true;
}

/** The offline worker caches the web origin. Inside the native shell the APK is the shell. */
export function shouldRegisterOfflineShell(production: boolean, native: boolean): boolean {
  return production && !native;
}
