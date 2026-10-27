import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { CardGame } from './game';

describe('discarding', () => {
  it('discards an unconfirmed card, uses one action, and supports undo/redo', () => {
    const client = Client({
      game: { ...CardGame, seed: 'tests' },
      numPlayers: 2,
    });
    const initial = client.getState()!.G;
    const card = initial.hands['0'].find(
      (candidate) => candidate.type === 'event',
    )!;

    client.moves.playCard(card.id, { row: 0, column: 1 });

    expect(client.getState()!.G.pending?.id).toBe(card.id);

    client.moves.discardCard(card.id);

    const after = client.getState()!;

    expect(after.G.discarded).toStrictEqual([card]);
    expect(after.G.hands['0']).toHaveLength(4);
    expect(after.G.deck).toStrictEqual(initial.deck);
    expect(after.G.played).toStrictEqual(initial.played);
    expect(after.G.pending).toBeNull();
    expect(after.ctx.currentPlayer).toBe('0');
    expect(after.G.actionsThisTurn).toBe(1);

    client.moves.undoTest();

    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.hands['0']).toStrictEqual(initial.hands['0']);
    expect(client.getState()!.G.discarded).toStrictEqual([]);

    client.moves.redoTest();

    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.actionsThisTurn).toBe(1);
    expect(client.getState()!.G.hands['0']).toStrictEqual(after.G.hands['0']);
    expect(client.getState()!.G.discarded).toStrictEqual([card]);
  });

  it('rejects discarding another player’s card or an unknown card', () => {
    const client = Client({
      game: { ...CardGame, seed: 'tests' },
      numPlayers: 2,
    });
    const initial = client.getState()!.G;

    client.moves.discardCard(initial.hands['1'][0].id);
    client.moves.discardCard('missing');

    expect(client.getState()!.G).toStrictEqual(initial);
    expect(client.getState()!.ctx.currentPlayer).toBe('0');
  });

  it('finishes the game after discards exhaust the deck and both hands', () => {
    const client = Client({
      game: { ...CardGame, seed: 'tests' },
      numPlayers: 2,
    });

    for (let count = 1; count <= 46; count += 1) {
      const state = client.getState()!;
      const hand =
        state.ctx.currentPlayer === '0'
          ? state.G.hands['0']
          : state.G.hands['1'];

      client.moves.discardCard(hand[0].id);

      const after = client.getState()!;

      expect(after.G.discarded).toHaveLength(count);
      expect(after.G.played).toHaveLength(1);
    }

    expect(client.getState()!.G.roundOver).toBe(true);

    client.moves.discardCard('missing');

    expect(client.getState()!.G.discarded).toHaveLength(46);
  });
});
