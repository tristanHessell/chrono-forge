import type { CardGameState, CardPosition, PlayerId } from './game';
import { getAvailablePositions, withPlacedEvent } from './gameRules';
import { applyManipulation, getTimeJumpPositions } from './manipulationRules';
import { calculateScores } from './scoring';

export type ComputerAction =
  | {
      cardId: string;
      destination?: CardPosition | string;
      targetId: string;
      type: 'manipulate';
    }
  | { cardId: string; position: CardPosition; type: 'play' }
  | { cardId: string; type: 'discard' }
  | { type: 'confirm' };

// Uses only the public board and this player's hand, never the other hand or deck order.
export function chooseComputerAction(
  G: CardGameState,
  owner: PlayerId = '1',
): ComputerAction | null {
  if (G.roundOver) {
    return null;
  }
  if (G.pending) {
    return G.pending.owner === owner ? { type: 'confirm' } : null;
  }

  const hand = G.hands[owner];

  if (!hand.length) {
    return null;
  }

  const before = calculateScores(G.played)[owner] ?? 0;
  let best: { action: ComputerAction; value: number } | null = null;

  for (const card of hand) {
    if (card.type === 'manipulation') {
      const rivals = G.playerIds.filter((id) => id !== owner);
      const beforeRival = rivals.reduce(
        (total, id) => total + (calculateScores(G.played)[id] ?? 0),
        0,
      );

      for (const target of G.played.filter(
        (candidate) => candidate.owner !== 'neutral',
      )) {
        const destinations: (CardPosition | string | undefined)[] =
          card.action === 'time-jump'
            ? getTimeJumpPositions(G.played, target.id)
            : card.action === 'time-swap'
              ? G.played
                  .filter((candidate) => candidate.id > target.id)
                  .map((candidate) => candidate.id)
              : [undefined];

        for (const destination of destinations) {
          const played = applyManipulation(
            G.played,
            card.action,
            target.id,
            owner,
            destination,
          );

          if (!played) {
            continue;
          }

          const scores = calculateScores(played);
          const futurePlays = hand.filter(
            (candidate) =>
              candidate.id !== card.id &&
              getAvailablePositions(played, candidate).length,
          ).length;
          const value =
            ((scores[owner] ?? 0) -
              before -
              rivals.reduce((total, id) => total + (scores[id] ?? 0), 0) +
              beforeRival) *
              10 +
            futurePlays * 2;

          if (value >= 0 && (!best || value > best.value)) {
            best = {
              action: {
                cardId: card.id,
                destination,
                targetId: target.id,
                type: 'manipulate',
              },
              value,
            };
          }
        }
      }
      continue;
    }

    for (const position of getAvailablePositions(G.played, card)) {
      const played = withPlacedEvent(G.played, {
        ...card,
        column: position.column,
        owner,
        placedAt: G.nextPlacementOrder,
        row: position.row,
      });
      const points = (calculateScores(played)[owner] ?? 0) - before;
      const remaining = hand.filter((candidate) => candidate.id !== card.id);
      const futurePlays = remaining.filter(
        (candidate) => getAvailablePositions(played, candidate).length > 0,
      ).length;
      const drawValue =
        Math.min(
          G.deck.length,
          card.effects?.filter((effect) => effect === 'draw-one').length ?? 0,
        ) * 3;
      const freeActionValue = card.effects?.includes('free-action') ? 3 : 0;
      const value =
        points * 10 +
        drawValue +
        freeActionValue +
        futurePlays * 2 -
        (card.number - 1900) / 100 -
        (Math.abs(position.row) + Math.abs(position.column)) * 0.01;

      if (!best || value > best.value) {
        best = { action: { cardId: card.id, position, type: 'play' }, value };
      }
    }
  }

  if (best) {
    return best.action;
  }

  const blocked = [...hand].sort(
    (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity),
  )[0];

  return { cardId: blocked.id, type: 'discard' };
}
