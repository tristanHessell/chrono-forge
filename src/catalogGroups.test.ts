import { describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import { catalogGroups } from './catalogGroups';

describe(catalogGroups, () => {
  it('groups every configured copy without changing the original deck order', () => {
    const { deck } = loadCardCatalog();
    const original = structuredClone(deck);
    const groups = catalogGroups(deck);
    const ids = groups.flatMap((group) => group.cards.map((card) => card.id));

    expect(ids.sort()).toStrictEqual(deck.map((card) => card.id).sort());
    expect(new Set(ids).size).toBe(deck.length);
    expect(groups.map((group) => group.id)).toStrictEqual([
      'event:politics',
      'event:tech',
      'event:nature',
      'command:time-jump',
      'command:time-swap',
      'command:take-control',
      'command:remove-event',
    ]);
    expect(deck).toStrictEqual(original);
  });

  it('reflects changed distributions and sorts Events by date', () => {
    const { deck } = loadCardCatalog();
    const event = deck.find((card) => card.type === 'event')!;
    const groups = catalogGroups([
      { ...event, id: 'later', number: 1990 },
      { ...event, id: 'earlier', number: 1900 },
      { ...event, id: 'extra', number: 1900 },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].cards.map((card) => card.id)).toStrictEqual([
      'earlier',
      'extra',
      'later',
    ]);
    expect(catalogGroups([])).toStrictEqual([]);
  });
});
