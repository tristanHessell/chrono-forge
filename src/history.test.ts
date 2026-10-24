import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';

import { canUndoMove, CardGame } from './game';

it('lets the human undo a move until new information appears', () => {
  const client = Client({
    game: { ...CardGame, seed: 'tests' },
    numPlayers: 2,
  });
  const card = client
    .getState()!
    .G.hands['0'].find(
      (candidate) => candidate.type === 'event' && !candidate.effect,
    )!;

  client.moves.playCard(card.id, { row: 0, column: 1 });
  client.moves.confirmPlacement();
  expect(canUndoMove(client.getState()!.G)).toBe(true);

  client.moves.undoTest();
  expect(client.getState()!.ctx.currentPlayer).toBe('0');
  expect(client.getState()!.G.actionsThisTurn).toBe(0);
  expect(client.getState()!.G.played).toHaveLength(1);
  client.moves.redoTest();
  expect(client.getState()!.ctx.currentPlayer).toBe('0');
  expect(client.getState()!.G.played).toHaveLength(2);

  client.moves.undoTest();
  client.moves.playCard(card.id, { row: 1, column: 0 });
  client.moves.confirmPlacement();
  expect(client.getState()!.G.played[1]).toMatchObject({
    id: card.id,
    row: 1,
    column: 0,
  });
  expect(client.getState()!.G.testFuture).toEqual([]);
});

it('does not undo a move after a refill reveals new cards', () => {
  const client = Client({
    game: { ...CardGame, seed: 'tests' },
    numPlayers: 2,
  });

  for (let count = 0; count < 9; count += 1) {
    const state = client.getState()!;
    const hand =
      state.ctx.currentPlayer === '0' ? state.G.hands['0'] : state.G.hands['1'];

    client.moves.discardCard(hand[0].id);
  }

  const before = client.getState()!;
  const hand =
    before.ctx.currentPlayer === '0'
      ? before.G.hands['0']
      : before.G.hands['1'];

  client.moves.discardCard(hand[0].id);

  const after = client.getState()!;

  expect(after.G.actionsThisTurn).toBe(0);
  expect(before.G.actionsThisTurn).toBe(1);
  expect(after.G.hands['0']).toHaveLength(5);
  expect(canUndoMove(after.G)).toBe(false);
  client.moves.undoTest();
  expect(client.getState()!.G).toEqual(after.G);
});

it('does not undo a human move after an opponent acts', () => {
  const client = Client({
    game: {
      ...CardGame,
      setup: (context) => ({
        ...CardGame.setup!(context),
        deck: [],
      }),
    },
    numPlayers: 2,
  });

  for (let count = 0; count < 2; count += 1) {
    client.moves.discardCard(client.getState()!.G.hands['0'][0].id);
  }
  expect(canUndoMove(client.getState()!.G)).toBe(true);
  expect(client.getState()!.ctx.currentPlayer).toBe('1');

  client.moves.discardCard(client.getState()!.G.hands['1'][0].id);

  const afterOpponentMove = client.getState()!;

  expect(canUndoMove(afterOpponentMove.G)).toBe(false);
  client.moves.undoTest();
  expect(client.getState()!.G).toEqual(afterOpponentMove.G);
});
