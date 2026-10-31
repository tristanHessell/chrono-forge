import { describe, expect, it } from 'vitest';

import type { Card } from './game';
import { moveHandCard, restoreHandOrder } from './handOrder';

const cards: Card[] = [
  { id: 'event-a-1950', name: 'timeline-origin', number: 1950, type: 'event' },
  { id: 'event-c-1990', name: 'timeline-origin', number: 1990, type: 'event' },
  { id: 'event-b-1900', name: 'timeline-origin', number: 1900, type: 'event' },
  { id: 'event-c-1900', name: 'timeline-origin', number: 1900, type: 'event' },
];

describe('hand ordering', () => {
  it('moves a card before or after another without mutating the hand', () => {
    const original = cards.map((card) => card.id);

    expect(moveHandCard(cards, cards[3].id, cards[0].id, true)).toStrictEqual([
      cards[3],
      cards[0],
      cards[1],
      cards[2],
    ]);
    expect(moveHandCard(cards, cards[0].id, cards[2].id, false)).toStrictEqual([
      cards[1],
      cards[2],
      cards[0],
      cards[3],
    ]);
    expect(cards.map((card) => card.id)).toStrictEqual(original);
    expect(moveHandCard(cards, cards[0].id, cards[0].id, true)).toStrictEqual(
      cards,
    );
    expect(moveHandCard(cards, 'missing', cards[0].id, true)).toStrictEqual(
      cards,
    );
  });

  it('keeps manual order when cards leave or enter the hand', () => {
    const ids = [cards[2].id, cards[0].id, cards[1].id];

    expect(restoreHandOrder(cards, ids)).toStrictEqual([
      cards[2],
      cards[0],
      cards[1],
      cards[3],
    ]);
    expect(restoreHandOrder([cards[0], cards[3]], ids)).toStrictEqual([
      cards[0],
      cards[3],
    ]);
  });
});
