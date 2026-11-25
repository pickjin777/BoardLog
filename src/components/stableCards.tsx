import { memo } from 'react';
import type { PlayRecord, UserGame } from '../types';
import { GameCard } from './GameCard';
import { GameListItem } from './GameListItem';
import { PlayCard } from './PlayCard';

function sameGame(
  prev: { game: UserGame; dense?: boolean; onDelete?: unknown },
  next: { game: UserGame; dense?: boolean; onDelete?: unknown }
): boolean {
  return prev.game === next.game && prev.dense === next.dense && Boolean(prev.onDelete) === Boolean(next.onDelete);
}

/**
 * Skip a row when the same game object is still in state.
 * Click handlers are ignored: they only open that same object.
 */
export const StableGameCard = memo(GameCard, sameGame);
export const StableGameListItem = memo(GameListItem, sameGame);
export const StablePlayCard = memo(
  PlayCard,
  (prev: { play: PlayRecord; variant?: string }, next: { play: PlayRecord; variant?: string }) =>
    prev.play === next.play && prev.variant === next.variant
);
