import type { Card, CardPosition } from './game';
import { applyGameLogAction, type GameLog, replayGameLog } from './gameLog';

export type GameLogItem = {
  card?: Card;
  drawn: Card[];
  index: number;
  move: string;
  nextPlayer?: string;
  player: string;
  position?: CardPosition;
  secondTarget?: Card;
  target?: Card;
  turn: number;
};

export function summarizeGameLog(log: GameLog): GameLogItem[] {
  const client = replayGameLog(log, 0);

  try {
    return log.actions.map((action, index) => {
      const { ctx, G } = client.getState()!;
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
        move === 'command'
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
        card,
        drawn: ['playEvent', 'discardCard', 'command'].includes(move)
          ? after.G.hands[ctx.currentPlayer].filter(
              (card) => !oldHandIds.has(card.id),
            )
          : [],
        index: index + 1,
        move,
        nextPlayer:
          after.ctx.currentPlayer !== ctx.currentPlayer
            ? after.ctx.currentPlayer
            : undefined,
        player: ctx.currentPlayer,
        position:
          destination && typeof destination === 'object'
            ? (destination as CardPosition)
            : undefined,
        secondTarget:
          move === 'command'
            ? cards.find((card) => card.id === destination)
            : undefined,
        target:
          move === 'command'
            ? cards.find((card) => card.id === args[1])
            : undefined,
        turn: ctx.turn,
      };
    });
  } finally {
    client.stop();
  }
}
