import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import setup from './fixtures/removed-time-jump.json';
import { CardGame } from './game';
import { currentGameLog, parseGameLog, replayGameLog } from './gameLog';

it('builds the current log from applied history after repeated undo, redo, and a new branch', () => {
  const client = replayGameLog(parseGameLog(JSON.stringify(setup)));
  const log = () =>
    currentGameLog(
      setup.seed,
      client.getState()!.G,
      client.getState()!.ctx.currentPlayer,
    );

  expect(log().actions).toHaveLength(4);
  client.moves.undoTest();
  expect(log().actions).toHaveLength(3);
  expect(JSON.stringify(log())).not.toContain('remove-event-4');
  client.moves.undoTest();
  expect(log().actions).toHaveLength(2);
  expect(JSON.stringify(log())).not.toContain('event-1940-3');
  client.moves.redoTest();
  expect(log().actions).toHaveLength(3);

  const state = client.getState()!;
  const replacement = state.G.hands[state.ctx.currentPlayer].find(
    (card) => card.id !== 'remove-event-4',
  )!;

  client.moves.discardCard(replacement.id);
  client.moves.redoTest();

  const current = log();
  const replay = replayGameLog(current);
  const after = client.getState()!;

  expect(current.actions).toHaveLength(4);
  expect(JSON.stringify(current)).not.toContain('remove-event-4');
  expect(current.actions[3].payload).toMatchObject({
    type: 'discardCard',
    args: [replacement.id],
  });
  expect(replay.getState()!.G.played).toEqual(after.G.played);
  expect(replay.getState()!.G.hands).toEqual(after.G.hands);
  expect(replay.getState()!.G.deck).toEqual(after.G.deck);
  expect(replay.getState()!.G.discarded).toEqual(after.G.discarded);
  expect(replay.getState()!.ctx.currentPlayer).toBe(after.ctx.currentPlayer);
  while (client.getState()!.G.testHistory.length) {
    client.moves.undoTest();
  }
  expect(log().actions).toEqual([]);
  client.stop();
  replay.stop();
});

it.each([2, 3, 4] as const)(
  'recreates all current card uses in a complete %i-player game',
  (numPlayers) => {
    const seed = `current-history-${numPlayers}`;
    const client = Client({
      game: { ...CardGame, seed },
      numPlayers,
      debug: false,
    });

    for (
      let index = 0;
      index < 150 && !client.getState()!.G.roundOver;
      index += 1
    ) {
      const { G, ctx } = client.getState()!;
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
    expect(replay.getState()!.G).toEqual(state.G);
    expect(replay.getState()!.ctx.currentPlayer).toBe(state.ctx.currentPlayer);
    client.stop();
    replay.stop();
  },
);
