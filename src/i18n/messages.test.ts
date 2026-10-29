/* eslint-disable formatjs/enforce-default-message -- TODO this file will likely be removed */
import { createIntl } from 'react-intl';
import { describe, expect, it } from 'vitest';

import messages from './en.json';

describe('english messages', () => {
  it('formats every catalog message without missing values or invalid ICU syntax', () => {
    const errors: unknown[] = [];
    const intl = createIntl({
      locale: 'en',
      messages,
      onError: (error) => errors.push(error),
    });

    for (const id of Object.keys(messages)) {
      const text = intl.formatMessage(
        { id },
        {
          action: 'endTurn',
          base: 3,
          bonus: 1,
          card: '1940 politics Event',
          cards: '1940 politics Event',
          category: 'politics',
          column: 2,
          count: 5,
          date: '1940',
          latest: 'yes',
          name: 'Sample Event',
          number: 10,
          owner: '0',
          pending: 'yes',
          player: 'Player 1',
          players: 'You, Computer 1',
          reason: 'Invalid log',
          row: -1,
          second: '1960 Nature Event',
          target: '1950 politics Event',
          theme: 'dark',
          total: 4,
          type: 'computer',
          winner: '0',
        },
      );

      expect(text).not.toBe(id);
    }

    expect(errors).toStrictEqual([]);
  });

  it('uses singular and plural deck counts', () => {
    const intl = createIntl({ locale: 'en', messages });

    expect(intl.formatMessage({ id: 'deck.label' }, { count: 1 })).toBe(
      '1 card remaining in the deck',
    );
    expect(intl.formatMessage({ id: 'deck.label' }, { count: 2 })).toBe(
      '2 cards remaining in the deck',
    );
    expect(
      intl.formatMessage(
        { id: 'status.playerTurn' },
        { count: 1, name: 'Sally' },
      ),
    ).toBe("Sally's turn — 1 card remains in the deck");
  });
});
