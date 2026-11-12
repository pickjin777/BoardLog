import { describe, expect, it } from 'vitest';
import { topOverlay } from './overlayHistory';

describe('topOverlay', () => {
  it('is empty when nothing is open', () => {
    expect(topOverlay({})).toBeNull();
    expect(topOverlay({ treasure: false, gameForm: false })).toBeNull();
  });

  it('picks the front-most layer', () => {
    expect(topOverlay({ treasure: true })).toBe('treasure');
    expect(topOverlay({ game: true, gameForm: true })).toBe('gameForm');
    expect(topOverlay({ game: true, deleteGame: true })).toBe('deleteGame');
    expect(topOverlay({ play: true, deletePlay: true, deleteGame: true })).toBe('deletePlay');
    expect(topOverlay({ gameForm: true, scan: true })).toBe('scan');
  });
});
