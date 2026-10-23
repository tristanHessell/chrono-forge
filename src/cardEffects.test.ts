import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import type { Card } from './game';
import { canUndoMove, CardGame } from './game';

const event = (id: string) =>
  loadCardCatalog().deck.find((card) => card.id === id)!;

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

    expect(cards.filter((card) => card.effect === 'draw-one')).toHaveLength(3);
    for (const card of cards) {
      expect(card.effect === 'draw-one').toBe(card.number === 1940);
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
