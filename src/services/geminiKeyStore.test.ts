import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({ native: false, fail: false, value: null as string | null }));

vi.mock('../utils/nativeShell', () => ({
  isNativeShell: () => gate.native
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async () => {
      if (gate.fail) throw new Error('plugin missing');
      return { value: gate.value };
    },
    set: async ({ value }: { value: string }) => {
      if (gate.fail) throw new Error('plugin missing');
      gate.value = value;
    },
    remove: async () => {
      if (gate.fail) throw new Error('plugin missing');
      gate.value = null;
    }
  }
}));

class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}

vi.stubGlobal('localStorage', new MemoryStorage());

const { storage } = await import('./storage');
const { GEMINI_KEY_STORAGE_NAME, clearUserGeminiKey, readUserGeminiKey, saveUserGeminiKey } = await import(
  './geminiKeyStore'
);

const SECRET = 'device-gemini-key-value';

describe('user gemini key store', () => {
  beforeEach(() => {
    gate.native = false;
    gate.fail = false;
    gate.value = null;
    localStorage.clear();
  });

  it('keeps the key in localStorage on the web and out of the backup file', async () => {
    const user = await storage.signUp('gemini-key@example.com', 'secret12', '키');
    await saveUserGeminiKey(`  ${SECRET}  `);
    expect(await readUserGeminiKey()).toBe(SECRET);
    expect(localStorage.getItem(GEMINI_KEY_STORAGE_NAME)).toBe(SECRET);

    const backup = await storage.exportUserDataJson(user.uid);
    expect(backup).not.toContain(SECRET);
    expect(backup).not.toContain(GEMINI_KEY_STORAGE_NAME);

    await clearUserGeminiKey();
    expect(await readUserGeminiKey()).toBe('');
    expect(localStorage.getItem(GEMINI_KEY_STORAGE_NAME)).toBeNull();
  });

  it('ignores an empty save', async () => {
    await saveUserGeminiKey('   ');
    expect(await readUserGeminiKey()).toBe('');
  });

  it('uses Preferences on the shell and does not also leave the key in localStorage', async () => {
    gate.native = true;
    await saveUserGeminiKey(SECRET);
    expect(gate.value).toBe(SECRET);
    expect(localStorage.getItem(GEMINI_KEY_STORAGE_NAME)).toBeNull();
    expect(await readUserGeminiKey()).toBe(SECRET);

    await clearUserGeminiKey();
    expect(gate.value).toBeNull();
    expect(await readUserGeminiKey()).toBe('');
  });

  it('falls back to localStorage when the native plugin is missing', async () => {
    gate.native = true;
    gate.fail = true;
    await saveUserGeminiKey(SECRET);
    expect(localStorage.getItem(GEMINI_KEY_STORAGE_NAME)).toBe(SECRET);
    expect(await readUserGeminiKey()).toBe(SECRET);
    await clearUserGeminiKey();
    expect(await readUserGeminiKey()).toBe('');
  });
});
