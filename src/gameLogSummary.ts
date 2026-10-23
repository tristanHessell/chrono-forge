import type { Card, CardPosition } from './game';
import { applyGameLogAction, type GameLog, replayGameLog } from './gameLog';

export type GameLogItem = {
  index: number;
  player: string;
  turn: number;
  move: string;
  card?: Card;
  target?: Card;
  secondTarget?: Card;
  position?: CardPosition;
  drawn: Card[];
  nextPlayer?: string;
};

export function summarizeGameLog(log: GameLog): GameLogItem[] {
  const client = replayGameLog(log, 0);

  try {
    return log.actions.map((action, index) => {
      const { G, ctx } = client.getState()!;
      const args: unknown[] = Array.isArray(action.payload.args)
        ? action.payload.args
        : [];
      const cards = [
        ...Object.values(G.hands).flat(),
        ...G.played,
        ...G.deck,
        ...G.discarded,
      ];
      const move =
        action.type === 'MAKE_MOVE' || action.type === 'GAME_EVENT'
          ? action.payload.type
          : action.type;
      const card = [
        'confirmPlacement',
        'movePendingCard',
        'returnPendingCard',
      ].includes(move)
        ? (G.pending ?? undefined)
        : cards.find((card) => card.id === args[0]);
      const destination =
        move === 'manipulate'
          ? args[2]
          : move === 'movePendingCard'
            ? args[0]
            : args[1];

      applyGameLogAction(client, action);

      const after = client.getState()!;
      const oldHandIds = new Set(
        G.hands[ctx.currentPlayer].map((card) => card.id),
      );

      return {
        index: index + 1,
        player: ctx.currentPlayer,
        turn: ctx.turn,
        move,
        card,
        target:
          move === 'manipulate'
            ? cards.find((card) => card.id === args[1])
            : undefined,
        secondTarget:
          move === 'manipulate'
            ? cards.find((card) => card.id === destination)
            : undefined,
        position:
          destination && typeof destination === 'object'
            ? (destination as CardPosition)
            : undefined,
        drawn: ['playEvent', 'discardCard', 'manipulate'].includes(move)
          ? after.G.hands[ctx.currentPlayer].filter(
              (card) => !oldHandIds.has(card.id),
            )
          : [],
        nextPlayer:
          after.ctx.currentPlayer !== ctx.currentPlayer
            ? after.ctx.currentPlayer
            : undefined,
      };
    });
  } finally {
    client.stop();
  }
}
