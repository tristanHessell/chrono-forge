import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';

import { CardGame } from './game';

it('returns control to the player who placed the card and lets them play again', () => {
  const client = Client({
    game: { ...CardGame, seed: 'tests' },
    numPlayers: 2,
  });
  const card = client
    .getState()!
    .G.hands['0'].find((candidate) => candidate.type === 'event')!;

  client.moves.discardCard(
    client
      .getState()!
      .G.hands['0'].find((candidate) => candidate.id !== card.id)!.id,
  );
  client.moves.playCard(card.id, { row: 0, column: 1 });
  client.moves.confirmPlacement();
  expect(client.getState()!.ctx.currentPlayer).toBe('1');

  client.moves.undoTest();
  expect(client.getState()!.ctx.currentPlayer).toBe('0');
  expect(client.getState()!.G.actionsThisTurn).toBe(1);
  expect(client.getState()!.G.played).toHaveLength(1);
  client.moves.redoTest();
  expect(client.getState()!.ctx.currentPlayer).toBe('1');
  expect(client.getState()!.G.played).toHaveLength(2);

  client.moves.undoTest();
  client.moves.playCard(card.id, { row: 1, column: 0 });
  expect(client.getState()!.G.pending?.id).toBe(card.id);
  client.moves.confirmPlacement();
  expect(client.getState()!.ctx.currentPlayer).toBe('1');
  expect(client.getState()!.G.played[1]).toMatchObject({
    id: card.id,
    row: 1,
    column: 0,
  });
  expect(client.getState()!.G.testFuture).toEqual([]);
});

it('restores the action counter, player, hands, and deck across a refill', () => {
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

  client.moves.undoTest();

  const undone = client.getState()!;

  expect(undone.ctx.currentPlayer).toBe(before.ctx.currentPlayer);
  expect(undone.G.startingPlayer).toBe(before.G.startingPlayer);
  expect(undone.G.actionsThisTurn).toBe(before.G.actionsThisTurn);
  expect(undone.G.hands['0']).toEqual(before.G.hands['0']);
  expect(undone.G.hands['1']).toEqual(before.G.hands['1']);
  expect(undone.G.deck).toEqual(before.G.deck);

  client.moves.redoTest();

  const redone = client.getState()!;

  expect(redone.ctx.currentPlayer).toBe(after.ctx.currentPlayer);
  expect(redone.G.startingPlayer).toBe(after.G.startingPlayer);
  expect(redone.G.actionsThisTurn).toBe(after.G.actionsThisTurn);
  expect(redone.G.hands['0']).toEqual(after.G.hands['0']);
  expect(redone.G.hands['1']).toEqual(after.G.hands['1']);
  expect(redone.G.deck).toEqual(after.G.deck);
});
