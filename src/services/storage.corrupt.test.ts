import { beforeEach, describe, expect, it, vi } from 'vitest';

/** This file forces the LocalStorage backend so a broken list cannot be hidden by IndexedDB. */
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

const memory = new MemoryStorage();
vi.stubGlobal('localStorage', memory);
vi.stubGlobal('indexedDB', {
  open() {
    throw new Error('indexedDB blocked');
  }
});

const { storage, StorageDataError } = await import('./storage');

describe('storage keeps a corrupt local list', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('does not replace a broken game list with an empty one', async () => {
    const user = await storage.signInAnonymously();
    const key = `boardlog_games_${user.uid}`;
    localStorage.setItem(key, '{');
    await expect(storage.getUserGames(user.uid)).rejects.toBeInstanceOf(StorageDataError);
    await expect(storage.addUserGame(user.uid, { title: '새 게임' } as never)).rejects.toBeInstanceOf(StorageDataError);
    expect(localStorage.getItem(key)).toBe('{');
  });

  it('still shows a game whose genre list was never saved', async () => {
    const user = await storage.signInAnonymously();
    const key = `boardlog_games_${user.uid}`;
    localStorage.setItem(key, JSON.stringify([{ id: 'g1', title: '카탄' }]));
    const games = await storage.getUserGames(user.uid);
    expect(games).toHaveLength(1);
    expect(games[0]?.genre).toEqual([]);
    expect(games[0]?.title).toBe('카탄');
  });

  it('does not replace a broken account map', async () => {
    localStorage.setItem('boardlog_all_users', '{');
    await expect(storage.signUp('keep@example.com', 'secret12', '유지')).rejects.toBeInstanceOf(StorageDataError);
    expect(localStorage.getItem('boardlog_all_users')).toBe('{');
  });
});
