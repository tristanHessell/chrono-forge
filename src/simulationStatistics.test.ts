import { describe, expect, it } from 'vitest';

import {
  countActivelyDiscardedCards,
  playerLabel,
} from '../simulations/statistics';
import type { ComputerAction } from './computer';
import type { Card } from './game';

describe('simulationStatistics', () => {
  it.each(['0', '1', '2', '3'])(
    'labels internal player %s with one-based numbering',
    (id) => {
      expect(playerLabel(id)).toBe(`Player ${Number(id) + 1}`);
    },
  );

  it('counts explicit discards, including unused Commands, but excludes used cards and overwritten Events', () => {
    const discarded: Card[] = [
      {
        id: 'discarded-event',
        name: 'timeline-origin',
        number: 1900,
        type: 'event',
      },
      { action: 'time-swap', id: 'unused-command', type: 'command' },
      { action: 'remove-event', id: 'used-command', type: 'command' },
      {
        id: 'overwritten-event',
        name: 'timeline-origin',
        number: 1910,
        type: 'event',
      },
    ];
    const actions: ComputerAction[] = [
      { cardId: 'discarded-event', type: 'discard' },
      { cardId: 'unused-command', type: 'discard' },
      {
        cardId: 'used-command',
        targetId: 'overwritten-event',
        type: 'manipulate',
      },
      { cardId: 'replacement', position: { column: 1, row: 0 }, type: 'play' },
      { type: 'confirm' },
      { cardId: 'rejected-discard', type: 'discard' },
    ];

    expect(
      countActivelyDiscardedCards(
        discarded,
        actions.map((action) => ({ action })),
      ),
    ).toBe(2);
  });

  it('does not double-count duplicate discard attempts or count attempts that never reached the pile', () => {
    const discarded: Card[] = [
      { id: 'one', name: 'timeline-origin', number: 1900, type: 'event' },
    ];
    const actions: ComputerAction[] = [
      { cardId: 'one', type: 'discard' },
      { cardId: 'one', type: 'discard' },
      { cardId: 'missing', type: 'discard' },
    ];

    expect(
      countActivelyDiscardedCards(
        discarded,
        actions.map((action) => ({ action })),
      ),
    ).toBe(1);
    expect(
      countActivelyDiscardedCards(
        [],
        actions.map((action) => ({ action })),
      ),
    ).toBe(0);
    expect(countActivelyDiscardedCards(discarded, [])).toBe(0);
  });
});
