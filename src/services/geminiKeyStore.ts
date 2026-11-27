import { isNativeShell } from '../utils/nativeShell';

/**
 * The user's own Gemini key. It is not part of the account, the backup JSON, or any request to
 * the BoardLog server. On the Android shell it prefers Capacitor Preferences; otherwise it stays
 * in this WebView's localStorage.
 */
export const GEMINI_KEY_STORAGE_NAME = 'boardlog_gemini_user_key';

type Prefs = {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
};

async function nativePrefs(): Promise<Prefs | null> {
  if (!isNativeShell()) return null;
  try {
    const mod = await import('@capacitor/preferences');
    return mod.Preferences;
  } catch {
    return null;
  }
}

export async function readUserGeminiKey(): Promise<string> {
  const prefs = await nativePrefs();
  if (prefs) {
    try {
      const stored = await prefs.get({ key: GEMINI_KEY_STORAGE_NAME });
      return (stored.value ?? '').trim();
    } catch {
      // The native plugin is not in this build. The WebView copy is still on this device.
    }
  }
  return (localStorage.getItem(GEMINI_KEY_STORAGE_NAME) ?? '').trim();
}

export async function saveUserGeminiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) return;
  const prefs = await nativePrefs();
  if (prefs) {
    try {
      await prefs.set({ key: GEMINI_KEY_STORAGE_NAME, value: trimmed });
      localStorage.removeItem(GEMINI_KEY_STORAGE_NAME);
      return;
    } catch {
      // Fall through to the WebView store.
    }
  }
  localStorage.setItem(GEMINI_KEY_STORAGE_NAME, trimmed);
}

export async function clearUserGeminiKey(): Promise<void> {
  const prefs = await nativePrefs();
  if (prefs) {
    try {
      await prefs.remove({ key: GEMINI_KEY_STORAGE_NAME });
    } catch {
      // Still drop the WebView copy below.
    }
  }
  localStorage.removeItem(GEMINI_KEY_STORAGE_NAME);
}
