import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import { type Card, CardGame, createCardGame } from './game';

describe('turnFlow', () => {
  it('starts with the player selected when the game is created', () => {
    const client = Client({
      game: { ...createCardGame('1'), seed: 'selected-start' },
      numPlayers: 2,
    });

    expect(client.getState()!.G.startingPlayer).toBe('1');
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('advances the round when play returns to a non-zero starting player', () => {
    const client = Client({
      game: { ...createCardGame('2'), seed: 'selected-round-start' },
      numPlayers: 3,
    });

    for (const playerId of ['2', '0', '1']) {
      expect(client.getState()!.ctx.currentPlayer).toBe(playerId);

      for (let action = 0; action < 2; action += 1) {
        client.moves.discardCard(client.getState()!.G.hands[playerId][0].id);
      }
    }

    expect(client.getState()!.ctx.currentPlayer).toBe('2');
    expect(client.getState()!.G.round).toBe(2);
  });

  it('keeps the first action on the same turn and refills only after the second', () => {
    const client = Client({
      game: { ...CardGame, seed: 'tests' },
      numPlayers: 2,
    });
    const initial = client.getState()!.G;

    client.moves.discardCard(initial.hands['0'][0].id);

    const first = client.getState()!;

    expect(first.ctx.currentPlayer).toBe('0');
    expect(first.G.actionsThisTurn).toBe(1);
    expect(first.G.hands['0']).toHaveLength(4);
    expect(first.G.deck).toHaveLength(36);

    client.moves.discardCard(first.G.hands['0'][0].id);

    const second = client.getState()!;

    expect(second.ctx.currentPlayer).toBe('1');
    expect(second.G.actionsThisTurn).toBe(0);
    expect(second.G.hands['0']).toHaveLength(5);
    expect(second.G.deck).toHaveLength(34);
    expect(second.G.hands['1']).toStrictEqual(initial.hands['1']);
  });

  it('counts a confirmed play and a discard as the two actions', () => {
    const client = Client({
      game: { ...CardGame, seed: 'tests' },
      numPlayers: 2,
    });
    const card = client
      .getState()!
      .G.hands['0'].find(
        (card) => card.type === 'event' && !card.effects?.length,
      )!;

    client.moves.playCard(card.id, { column: 1, row: 0 });

    expect(client.getState()!.G.actionsThisTurn).toBe(0);

    client.moves.confirmPlacement();

    expect(client.getState()!.G.actionsThisTurn).toBe(1);
    expect(client.getState()!.ctx.currentPlayer).toBe('0');

    client.moves.discardCard(client.getState()!.G.hands['0'][0].id);

    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.hands['0']).toHaveLength(5);
  });

  it('allows two confirmed plays before handing control to the opponent', () => {
    const catalog = loadCardCatalog().deck;
    const hand = [1900, 1920, 1930, 1950, 1960].map((date) =>
      catalog.find((card) => card.number === date)!,
    );
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          hands: { ...CardGame.setup!(context).hands, '0': hand },
        }),
      },
      numPlayers: 2,
    });

    client.moves.playCard(hand[0].id, { column: 1, row: 0 });
    client.moves.confirmPlacement();

    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.actionsThisTurn).toBe(1);

    client.moves.playCard(hand[1].id, { column: 2, row: 0 });
    client.moves.confirmPlacement();

    expect(client.getState()!.G.played).toHaveLength(3);
    expect(client.getState()!.G.hands['0']).toHaveLength(5);
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.actionsThisTurn).toBe(0);
  });

  it.each([0, 1, 2])(
    'draws only available cards when the deck has %i left',
    (count) => {
      const deck: Card[] = Array.from({ length: count }, (_, index) => ({
        id: `last-${index}`,
        name: 'timeline-origin',
        number: 1900,
        type: 'event',
      }));
      const client = Client({
        game: {
          ...CardGame,
          setup: (context) => ({ ...CardGame.setup!(context), deck }),
        },
        numPlayers: 2,
      });

      client.moves.discardCard(client.getState()!.G.hands['0'][0].id);
      client.moves.discardCard(client.getState()!.G.hands['0'][0].id);

      expect(client.getState()!.G.hands['0']).toHaveLength(3 + count);
      expect(client.getState()!.G.deck).toStrictEqual([]);
      expect(client.getState()!.G.roundOver).toBe(false);
      expect(client.getState()!.ctx.currentPlayer).toBe('1');
    },
  );

  it('ends a short turn and skips empty hands once the deck is exhausted', () => {
    const card = loadCardCatalog().deck[0];
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          deck: [],
          hands: { ...CardGame.setup!(context).hands, '0': [card], '1': [] },
        }),
      },
      numPlayers: 2,
    });

    client.moves.discardCard(card.id);

    expect(client.getState()!.G.roundOver).toBe(true);
    expect(client.getState()!.G.hands['0']).toStrictEqual([]);
  });

  it('applies draw effects immediately, then tops up the hand at turn end', () => {
    const catalog = loadCardCatalog().deck;
    const effect = catalog.find((card) => card.id === 'event-1940-1')!;
    const hand = [
      effect,
      ...catalog.filter((card) => card.id !== effect.id).slice(0, 4),
    ];
    const deck = catalog.filter(
      (card) => !hand.some((candidate) => candidate.id === card.id),
    );
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          deck,
          hands: { ...CardGame.setup!(context).hands, '0': hand },
        }),
      },
      numPlayers: 2,
    });

    client.moves.playCard(effect.id, { column: 1, row: 0 });
    client.moves.confirmPlacement();

    expect(client.getState()!.G.hands['0']).toHaveLength(5);
    expect(client.getState()!.G.deck).toHaveLength(deck.length - 1);
    expect(client.getState()!.G.actionsThisTurn).toBe(1);

    client.moves.discardCard(client.getState()!.G.hands['0'][0].id);

    expect(client.getState()!.G.hands['0']).toHaveLength(5);
    expect(client.getState()!.G.deck).toHaveLength(deck.length - 2);
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('records player points for each round as turns cycle', () => {
    const catalog = loadCardCatalog().deck;
    const p0Cards = [1920, 1930].map((date) =>
      catalog.find((card) => card.number === date)!,
    );
    const p1Cards = [1950, 1960].map((date) =>
      catalog.find((card) => card.number === date)!,
    );
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          hands: {
            ...CardGame.setup!(context).hands,
            '0': p0Cards,
            '1': p1Cards,
          },
        }),
      },
      numPlayers: 2,
    });

    expect(client.getState()!.G.round).toBe(1);
    expect(client.getState()!.G.roundScores).toStrictEqual([]);

    client.moves.playCard(p0Cards[0].id, { column: 1, row: 0 });
    client.moves.confirmPlacement();
    client.moves.playCard(p0Cards[1].id, { column: 2, row: 0 });
    client.moves.confirmPlacement();

    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.round).toBe(1);
    expect(client.getState()!.G.roundScores).toStrictEqual([]);

    client.moves.playCard(p1Cards[0].id, { column: 0, row: 1 });
    client.moves.confirmPlacement();
    client.moves.playCard(p1Cards[1].id, { column: 0, row: 2 });
    client.moves.confirmPlacement();

    const stateAfterRound1 = client.getState()!.G;

    expect(stateAfterRound1.round).toBe(2);
    expect(stateAfterRound1.roundScores).toHaveLength(1);
    expect(stateAfterRound1.roundScores[0]).toStrictEqual({ '0': 2, '1': 2 });

    const after = client.getState()!;

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after.G);
  });
});
