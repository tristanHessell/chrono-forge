import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import { type Card, CardGame } from './game';

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
  expect(second.G.hands['1']).toEqual(initial.hands['1']);
});

it('counts a confirmed play and a discard as the two actions', () => {
  const client = Client({
    game: { ...CardGame, seed: 'tests' },
    numPlayers: 2,
  });
  const card = client
    .getState()!
    .G.hands['0'].find((card) => card.type === 'event' && !card.effect)!;

  client.moves.playCard(card.id, { row: 0, column: 1 });
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
  const hand = [1900, 1910, 1920, 1930, 1950].map((date) =>
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

  client.moves.playCard(hand[0].id, { row: 0, column: 1 });
  client.moves.confirmPlacement();
  expect(client.getState()!.ctx.currentPlayer).toBe('0');
  expect(client.getState()!.G.actionsThisTurn).toBe(1);
  client.moves.playCard(hand[1].id, { row: 0, column: 2 });
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
      type: 'event',
      number: 1900,
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
    expect(client.getState()!.G.deck).toEqual([]);
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
  expect(client.getState()!.G.hands['0']).toEqual([]);
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

  client.moves.playCard(effect.id, { row: 0, column: 1 });
  client.moves.confirmPlacement();
  expect(client.getState()!.G.hands['0']).toHaveLength(5);
  expect(client.getState()!.G.deck).toHaveLength(deck.length - 1);
  expect(client.getState()!.G.actionsThisTurn).toBe(1);
  client.moves.discardCard(client.getState()!.G.hands['0'][0].id);
  expect(client.getState()!.G.hands['0']).toHaveLength(5);
  expect(client.getState()!.G.deck).toHaveLength(deck.length - 2);
  expect(client.getState()!.ctx.currentPlayer).toBe('1');
});
