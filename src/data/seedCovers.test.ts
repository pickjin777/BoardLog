import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEED_GAMES } from './seedGames';

const ROOT = join(import.meta.dirname, '../..');
const BANNED = /unsplash\.com|images\.unsplash/i;

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'dist-ga' || name === 'android') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      sourceFiles(path, found);
      continue;
    }
    if (/\.(ts|tsx|css|html|json|xml)$/.test(name) && !name.endsWith('.test.ts')) found.push(path);
  }
  return found;
}

describe('seed covers', () => {
  it('keeps every seed image empty so the placeholder is drawn locally', () => {
    expect(SEED_GAMES.length).toBeGreaterThan(0);
    for (const game of SEED_GAMES) {
      expect(game.imageUrl, game.title).toBe('');
      expect(game.imageUrl).not.toMatch(/^https?:/i);
    }
  });

  it('has no Unsplash or other external image host in the app source', () => {
    const hits: string[] = [];
    for (const path of sourceFiles(join(ROOT, 'src'))) {
      const text = readFileSync(path, 'utf8');
      if (BANNED.test(text) || /https?:\/\/[^'"\s)]+\.(?:jpg|jpeg|png|webp)/i.test(text)) {
        hits.push(path.replace(`${ROOT}/`, ''));
      }
    }
    expect(hits).toEqual([]);
  });
});
