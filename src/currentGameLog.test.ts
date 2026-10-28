import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import setup from './fixtures/removed-time-jump.json';
import { canUndoMove, CardGame } from './game';
import { currentGameLog, parseGameLog, replayGameLog } from './gameLog';

describe(currentGameLog, () => {
  it('keeps replay history when Undo is blocked by new information', () => {
    const client = replayGameLog(parseGameLog(JSON.stringify(setup)));
    const log = () =>
      currentGameLog(
        setup.seed,
        client.getState()!.G,
        client.getState()!.ctx.currentPlayer,
      );

    const before = log();

    expect(before.actions).toHaveLength(4);
    expect(canUndoMove(client.getState()!.G)).toBe(false);

    client.moves.undoTest();

    expect(log()).toStrictEqual(before);

    client.stop();
  });

  it.each([2, 3, 4] as const)(
    'recreates all current card uses in a complete %i-player game',
    (numPlayers) => {
      const seed = `current-history-${numPlayers}`;
      const client = Client({
        debug: false,
        game: { ...CardGame, seed },
        numPlayers,
      });

      for (
        let index = 0;
        index < 150 && !client.getState()!.G.roundOver;
        index += 1
      ) {
        const { ctx, G } = client.getState()!;
        const action = chooseComputerAction(G, ctx.currentPlayer as '0')!;

        if (action.type === 'play') {
          client.moves.playCard(action.cardId, action.position);
        } else if (action.type === 'confirm') {
          client.moves.confirmPlacement();
        } else if (action.type === 'discard') {
          client.moves.discardCard(action.cardId);
        } else {
          client.moves.manipulate(
            action.cardId,
            action.targetId,
            action.destination,
          );
        }
      }

      const state = client.getState()!;
      const log = currentGameLog(seed, state.G, state.ctx.currentPlayer);
      const replay = replayGameLog(log);

      expect(state.G.roundOver).toBe(true);
      expect(log.actions).toHaveLength(state.G.testHistory.length);
      expect(
        log.actions.every(
          (action) =>
            action.type === 'MAKE_MOVE' &&
            ['playEvent', 'discardCard', 'manipulate'].includes(
              action.payload.type,
            ),
        ),
      ).toBe(true);
      expect(replay.getState()!.G).toStrictEqual(state.G);
      expect(replay.getState()!.ctx.currentPlayer).toBe(
        state.ctx.currentPlayer,
      );

      client.stop();
      replay.stop();
    },
    20000,
  );
});
