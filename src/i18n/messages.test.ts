import { createIntl } from 'react-intl';
import { describe, expect, it } from 'vitest';

import messages from './en.json';

describe('English messages', () => {
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
          owner: '0',
          reason: 'Invalid log',
          player: 'Player 1',
          card: '1940 Political Event',
          target: '1950 Political Event',
          second: '1960 Environmental Event',
          date: '1940',
          cards: '1940 Political Event',
          action: 'endTurn',
          category: 'political',
          count: 5,
          base: 3,
          bonus: 1,
          total: 4,
          winner: '0',
          players: 'You, Computer 1',
          row: -1,
          column: 2,
          pending: 'yes',
          number: 10,
          name: 'Sample Event',
          latest: 'yes',
          theme: 'dark',
        },
      );

      expect(text).not.toBe(id);
    }
    expect(errors).toEqual([]);
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
        { name: 'Sally', count: 1 },
      ),
    ).toBe("Sally's turn — 1 card remains in the deck");
  });
});
