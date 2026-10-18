import type { ComputerAction } from '../src/computer';
import type { Card } from '../src/game';

export function playerLabel(playerId: string): string {
  return `Player ${Number(playerId) + 1}`;
}

export function countActivelyDiscardedCards(
  discarded: readonly Card[],
  moves: readonly { action: ComputerAction }[],
): number {
  const activelyDiscardedIds = new Set(
    moves.flatMap(({ action }) =>
      action.type === 'discard' ? [action.cardId] : [],
    ),
  );

  return discarded.filter((card) => activelyDiscardedIds.has(card.id)).length;
}
