import type { CardGameState, CardPosition, PlayerId } from './game';
import { getAvailablePositions, withPlacedEvent } from './gameRules';
import { applyManipulation, getTimeJumpPositions } from './manipulationRules';
import { calculateScores } from './scoring';

export type ComputerAction =
  | {
      type: 'manipulate';
      cardId: string;
      targetId: string;
      destination?: CardPosition | string;
    }
  | { type: 'play'; cardId: string; position: CardPosition }
  | { type: 'discard'; cardId: string }
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

  if (!hand?.length) {
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
                type: 'manipulate',
                cardId: card.id,
                targetId: target.id,
                destination,
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
        row: position.row,
        column: position.column,
        owner,
        placedAt: G.nextPlacementOrder,
      });
      const points = calculateScores(played)[owner] - before;
      const remaining = hand.filter((candidate) => candidate.id !== card.id);
      const futurePlays = remaining.filter(
        (candidate) => getAvailablePositions(played, candidate).length > 0,
      ).length;
      const drawValue = card.effect === 'draw-one' && G.deck.length > 0 ? 3 : 0;
      const value =
        points * 10 +
        drawValue +
        futurePlays * 2 -
        (card.number - 1900) / 100 -
        (Math.abs(position.row) + Math.abs(position.column)) * 0.01;

      if (!best || value > best.value) {
        best = { action: { type: 'play', cardId: card.id, position }, value };
      }
    }
  }
  if (best) {
    return best.action;
  }

  const blocked = [...hand].sort(
    (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity),
  )[0];

  return { type: 'discard', cardId: blocked.id };
}
