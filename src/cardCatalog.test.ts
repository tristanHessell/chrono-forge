import { expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import definitions from './cards';
import type { Card } from './game';

it('registers every individual card file exactly once', () => {
  const modules = import.meta.glob<{ default: Card }>(
    ['./cards/**/*.ts', '!./cards/index.ts'],
    { eager: true },
  );
  const { startingCard, deck } = loadCardCatalog();
  const cards = [startingCard, ...deck];

  expect(Object.keys(modules)).toHaveLength(47);
  expect(cards).toHaveLength(47);
  expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  for (const module of Object.values(modules)) {
    expect(cards).toContainEqual(module.default);
  }
  expect(startingCard).toEqual({ id: 'starting-0', type: 'event', number: 0 });
});

it('preserves the deck order for existing seeds and game logs', () => {
  const { deck } = loadCardCatalog();
  const eventIds = [1, 2, 3].flatMap((copy) =>
    Array.from(
      { length: 10 },
      (_, decade) => `event-${1900 + decade * 10}-${copy}`,
    ),
  );
  const manipulationIds = [
    'time-jump',
    'time-swap',
    'take-control',
    'remove-event',
  ].flatMap((action) => [1, 2, 3, 4].map((copy) => `${action}-${copy}`));

  expect(deck.map((card) => card.id)).toEqual([
    ...eventIds,
    ...manipulationIds,
  ]);
});

it('includes one card per category for every decade and keeps the start neutral', () => {
  const { deck, startingCard } = loadCardCatalog();

  expect(startingCard.category).toBeUndefined();
  expect(deck.filter((card) => card.type === 'event')).toHaveLength(30);
  for (let year = 1900; year <= 1990; year += 10) {
    expect(
      deck
        .filter((card) => card.number === year)
        .map((card) => card.category)
        .sort(),
    ).toEqual(['environmental', 'political', 'technological']);
  }
  expect(
    deck
      .filter((card) => card.number === 1940)
      .every((card) => card.effect === 'draw-one'),
  ).toBe(true);
  expect(
    deck
      .filter((card) => card.number === 1990)
      .every((card) => card.effect === 'timeline-1900-bonus'),
  ).toBe(true);
});

it('loads all listed cards and returns independent copies for each game', () => {
  const first = loadCardCatalog();
  const second = loadCardCatalog();

  expect(first).toEqual(definitions);
  expect(first.deck[0]).not.toBe(second.deck[0]);
  expect(first.startingCard).not.toBe(second.startingCard);

  first.deck[0].number = 9999;
  first.deck.pop();
  first.startingCard.number = 100;
  expect(second).toEqual(definitions);
  expect(loadCardCatalog()).toEqual(definitions);
});

it('lists four of each Manipulation without Event dates or categories', () => {
  const cards = loadCardCatalog().deck.filter(
    (card) => card.type === 'manipulation',
  );

  expect(cards).toHaveLength(16);
  for (const action of [
    'time-jump',
    'time-swap',
    'take-control',
    'remove-event',
  ]) {
    expect(cards.filter((card) => card.action === action)).toHaveLength(4);
  }
  expect(
    cards.every(
      (card) => card.number === undefined && card.category === undefined,
    ),
  ).toBe(true);
});
