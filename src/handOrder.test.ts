import { describe, expect, it } from 'vitest';

import type { Card } from './game';
import { moveHandCard, orderHand, restoreHandOrder } from './handOrder';

const cards: Card[] = [
  { id: 'event-a-1950', type: 'event', number: 1950 },
  { id: 'event-c-1990', type: 'event', number: 1990 },
  { id: 'event-b-1900', type: 'event', number: 1900 },
  { id: 'event-c-1900', type: 'event', number: 1900 },
];

describe('hand ordering', () => {
  it('moves a card before or after another without mutating the hand', () => {
    const original = cards.map((card) => card.id);

    expect(moveHandCard(cards, cards[3].id, cards[0].id, true)).toEqual([
      cards[3],
      cards[0],
      cards[1],
      cards[2],
    ]);
    expect(moveHandCard(cards, cards[0].id, cards[2].id, false)).toEqual([
      cards[1],
      cards[2],
      cards[0],
      cards[3],
    ]);
    expect(cards.map((card) => card.id)).toEqual(original);
    expect(moveHandCard(cards, cards[0].id, cards[0].id, true)).toEqual(cards);
    expect(moveHandCard(cards, 'missing', cards[0].id, true)).toEqual(cards);
  });

  it('keeps manual order when cards leave or enter the hand', () => {
    const ids = [cards[2].id, cards[0].id, cards[1].id];

    expect(restoreHandOrder(cards, ids)).toEqual([
      cards[2],
      cards[0],
      cards[1],
      cards[3],
    ]);
    expect(restoreHandOrder([cards[0], cards[3]], ids)).toEqual([
      cards[0],
      cards[3],
    ]);
    expect(
      orderHand(restoreHandOrder(cards, ids), 'date').map(
        (card) => card.number,
      ),
    ).toEqual([1900, 1900, 1950, 1990]);
  });
  it('orders by date ascending, preserving dealt order for matching dates', () => {
    expect(orderHand(cards, 'date').map((card) => card.id)).toEqual([
      'event-b-1900',
      'event-c-1900',
      'event-a-1950',
      'event-c-1990',
    ]);
  });

  it('preserves the dealt order and original card objects', () => {
    const before = [...cards];

    orderHand(cards, 'date');
    expect(cards).toEqual(before);
    expect(orderHand(cards, null)).toEqual(before);
    expect(orderHand(cards, 'date')[0]).toBe(cards[2]);
  });
});
