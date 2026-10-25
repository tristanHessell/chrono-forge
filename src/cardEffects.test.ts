import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import type { Card, EventCard, PlacedCard } from './game';
import { canUndoMove, CardGame } from './game';

const event = (id: string): EventCard => {
  const card = loadCardCatalog().deck.find((card) => card.id === id)!;

  if (card.type !== 'event') {
    throw new Error(`Card ${id} is not an Event.`);
  }

  return card;
};

function effectClient(
  player: '0' | '1' = '0',
  deck: Card[] = [event('event-1900-1')],
  extraCard = false,
) {
  const client = Client({
    game: {
      ...CardGame,
      setup: (context) => ({
        ...CardGame.setup!(context),
        deck,
        hands: {
          ...CardGame.setup!(context).hands,
          '0': [
            event(player === '0' ? 'event-1940-1' : 'event-1980-1'),
            ...(extraCard ? [event('event-1950-1')] : []),
          ],
          '1': [event(player === '1' ? 'event-1940-1' : 'event-1980-1')],
        },
      }),
    },
    numPlayers: 2,
  });

  if (player === '1') {
    client.events.endTurn!({ next: '1' });
  }

  return client;
}

describe('draw one effect', () => {
  it('is defined on all three 1940 cards and no other cards', () => {
    const cards = loadCardCatalog().deck;

    expect(
      cards.filter((card) => card.effects?.includes('draw-one')),
    ).toHaveLength(3);
    for (const card of cards) {
      expect(Boolean(card.effects?.includes('draw-one'))).toBe(
        card.number === 1940,
      );
    }
  });

  it.each(['0', '1'] as const)(
    'draws for player %s only on confirmation',
    (player) => {
      const client = effectClient(player);
      const before = client.getState()!.G;

      client.moves.playCard('event-1940-1', { row: 0, column: 1 });
      client.moves.movePendingCard({ row: 1, column: 0 });
      expect(client.getState()!.G.deck).toEqual(before.deck);
      client.moves.confirmPlacement();

      const after = client.getState()!;
      const hand = player === '0' ? after.G.hands['0'] : after.G.hands['1'];
      const otherHand =
        player === '0' ? after.G.hands['1'] : after.G.hands['0'];

      expect(hand).toEqual([event('event-1900-1')]);
      expect(otherHand).toEqual([event('event-1980-1')]);
      expect(after.G.deck).toHaveLength(0);
      expect(after.G.played).toHaveLength(2);
      expect(after.ctx.currentPlayer).toBe(player);
      expect(after.G.actionsThisTurn).toBe(1);

      expect(canUndoMove(after.G)).toBe(false);
      client.moves.undoTest();
      expect(client.getState()!.G).toEqual(after.G);
      client.moves.redoTest();
      expect(client.getState()!.G).toEqual(after.G);
    },
  );

  it('allows confirmation when the deck is empty', () => {
    const client = effectClient('0', []);

    client.moves.playCard('event-1940-1', { row: 0, column: 1 });
    client.moves.confirmPlacement();

    const after = client.getState()!;

    expect(after.G.hands['0']).toEqual([]);
    expect(after.G.deck).toEqual([]);
    expect(after.G.played).toHaveLength(2);
    expect(after.ctx.currentPlayer).toBe('1');
  });

  it('does not draw when discarding or returning a pending card', () => {
    const client = effectClient('0', [event('event-1900-1')], true);
    const before = client.getState()!.G.deck;

    client.moves.playCard('event-1940-1', { row: 0, column: 1 });
    client.moves.returnPendingCard();
    expect(client.getState()!.G.deck).toEqual(before);
    client.moves.discardCard('event-1940-1');
    expect(client.getState()!.G.deck).toEqual(before);
    expect(client.getState()!.G.hands['0']).toEqual([event('event-1950-1')]);
  });
});

describe('free action effect', () => {
  it('is defined on all three 1910 cards and no other cards', () => {
    const cards = loadCardCatalog().deck;

    expect(
      cards.filter((card) => card.effects?.includes('free-action')),
    ).toHaveLength(3);
    for (const card of cards) {
      expect(Boolean(card.effects?.includes('free-action'))).toBe(
        card.number === 1910,
      );
    }
  });

  it('allows two other actions and supports undo and redo', () => {
    const catalog = loadCardCatalog().deck;
    const hand = ['event-1910-1', 'event-1920-1', 'event-1930-1'].map((id) =>
      catalog.find((card) => card.id === id)!,
    );
    const otherHand = [event('event-1950-1')];
    const reservedIds = new Set([...hand, ...otherHand].map((card) => card.id));
    const deck = catalog.filter((card) => !reservedIds.has(card.id));
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => {
          const initial = CardGame.setup!(context);

          return {
            ...initial,
            deck,
            hands: { ...initial.hands, '0': hand, '1': otherHand },
          };
        },
      },
      numPlayers: 2,
    });

    client.moves.playCard(hand[0].id, { row: 0, column: 1 });
    client.moves.confirmPlacement();

    const afterFreeAction = client.getState()!;

    expect(afterFreeAction.ctx.currentPlayer).toBe('0');
    expect(afterFreeAction.G.actionsThisTurn).toBe(0);
    expect(canUndoMove(afterFreeAction.G)).toBe(true);
    client.moves.undoTest();
    expect(client.getState()!.G.hands['0']).toEqual(hand);
    expect(client.getState()!.G.actionsThisTurn).toBe(0);
    client.moves.redoTest();
    expect(client.getState()!.G).toEqual(afterFreeAction.G);

    client.moves.playCard(hand[1].id, { row: 0, column: 2 });
    client.moves.confirmPlacement();
    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.actionsThisTurn).toBe(1);

    client.moves.playCard(hand[2].id, { row: 0, column: 3 });
    client.moves.confirmPlacement();

    const afterTurn = client.getState()!;

    expect(afterTurn.ctx.currentPlayer).toBe('1');
    expect(afterTurn.G.actionsThisTurn).toBe(0);
    expect(afterTurn.G.played).toHaveLength(4);
  });
});

it('applies three different effects from one Event card', () => {
  const cards = loadCardCatalog();
  const playedCard = {
    ...event('event-1990-1'),
    effects: ['draw-one', 'free-action', 'timeline-1900-bonus'] as const,
  };
  const earlierCard: PlacedCard = {
    ...event('event-1900-1'),
    row: 0,
    column: 1,
    owner: '1',
    placedAt: 1,
  };
  const startingCard: PlacedCard = {
    ...cards.startingCard,
    row: 0,
    column: 0,
    owner: 'neutral' as const,
    placedAt: 0,
  };
  const drawnCard = event('event-1920-1');
  const client = Client({
    game: {
      ...CardGame,
      setup: (context) => {
        const initial = CardGame.setup!(context);

        return {
          ...initial,
          deck: [drawnCard],
          played: [startingCard, earlierCard],
          nextPlacementOrder: 2,
          hands: {
            ...initial.hands,
            '0': [playedCard],
          },
        };
      },
    },
    numPlayers: 2,
  });

  client.moves.playCard(playedCard.id, { row: 0, column: 2 });
  client.moves.confirmPlacement();

  const after = client.getState()!;

  expect(after.G.hands['0']).toEqual([drawnCard]);
  expect(after.G.actionsThisTurn).toBe(0);
  expect(after.ctx.currentPlayer).toBe('0');
  expect(after.G.played.at(-1)?.effects).toEqual(playedCard.effects);
});
