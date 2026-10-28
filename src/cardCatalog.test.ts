import { describe, expect, it } from 'vitest';

import { loadCardCatalog, readEffects } from './cardCatalog';
import definitions from './cards';
import type { Card } from './game';
import messages from './i18n/en.json';

describe('cardCatalog', () => {
  it('accepts no more than three known effects per Event', () => {
    expect(
      readEffects(
        ['draw-one', 'free-action', 'timeline-1900-bonus'],
        'test-event',
      ),
    ).toStrictEqual(['draw-one', 'free-action', 'timeline-1900-bonus']);
    expect(() =>
      readEffects(
        ['draw-one', 'free-action', 'timeline-1900-bonus', 'draw-one'],
        'test-event',
      ),
    ).toThrow('Invalid effects for Event card: test-event');
    expect(() => readEffects(['unknown'], 'test-event')).toThrow(
      'Invalid effects for Event card: test-event',
    );
  });

  it('registers every individual card file exactly once', () => {
    const modules = import.meta.glob<{ default: Card }>(
      ['./cards/**/*.ts', '!./cards/index.ts'],
      { eager: true },
    );
    const { deck, startingCard } = loadCardCatalog();
    const cards = [startingCard, ...deck];

    expect(Object.keys(modules)).toHaveLength(47);
    expect(cards).toHaveLength(47);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);

    for (const module of Object.values(modules)) {
      expect(cards).toContainEqual(module.default);
    }

    expect(startingCard).toStrictEqual({
      id: 'starting-0',
      name: 'timeline-origin',
      number: 0,
      type: 'event',
    });
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

    expect(deck.map((card) => card.id)).toStrictEqual([
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
      ).toStrictEqual(['environmental', 'political', 'technological']);
    }

    expect(
      deck
        .filter((card) => card.number === 1910)
        .every((card) => card.effects?.includes('free-action')),
    ).toBe(true);
    expect(
      deck
        .filter((card) => card.number === 1940)
        .every((card) => card.effects?.includes('draw-one')),
    ).toBe(true);
    expect(
      deck
        .filter((card) => card.number === 1990)
        .every((card) => card.effects?.includes('timeline-1900-bonus')),
    ).toBe(true);
  });

  it('gives every Event a unique translated name', () => {
    const { deck, startingCard } = loadCardCatalog();
    const events = [startingCard, ...deck].filter(
      (card) => card.type === 'event',
    );
    const names = events.map((card) => card.name);

    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names)).toHaveLength(events.length);

    for (const name of names) {
      expect(messages).toHaveProperty(`card.name.${name}`);
    }
  });

  it('loads all listed cards and returns independent copies for each game', () => {
    const first = loadCardCatalog();
    const second = loadCardCatalog();

    expect(first).toStrictEqual(definitions);
    expect(first.deck[0]).not.toBe(second.deck[0]);
    expect(first.startingCard).not.toBe(second.startingCard);

    first.deck[0].number = 9999;
    first.deck.pop();
    first.startingCard.number = 100;

    expect(second).toStrictEqual(definitions);
    expect(loadCardCatalog()).toStrictEqual(definitions);
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
        (card) =>
          !Object.hasOwn(card, 'number') && !Object.hasOwn(card, 'category'),
      ),
    ).toBe(true);
  });
});
