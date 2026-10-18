import { expect, it } from 'vitest';

import {
  countActivelyDiscardedCards,
  playerLabel,
} from '../simulations/statistics';
import type { ComputerAction } from './computer';
import type { Card } from './game';

it.each(['0', '1', '2', '3'])(
  'labels internal player %s with one-based numbering',
  (id) => {
    expect(playerLabel(id)).toBe(`Player ${Number(id) + 1}`);
  },
);

it('counts explicit discards, including unused Manipulations, but excludes used cards and overwritten Events', () => {
  const discarded: Card[] = [
    { id: 'discarded-event', type: 'event', number: 1900 },
    { id: 'unused-manipulation', type: 'manipulation', action: 'time-swap' },
    { id: 'used-manipulation', type: 'manipulation', action: 'remove-event' },
    { id: 'overwritten-event', type: 'event', number: 1910 },
  ];
  const actions: ComputerAction[] = [
    { type: 'discard', cardId: 'discarded-event' },
    { type: 'discard', cardId: 'unused-manipulation' },
    {
      type: 'manipulate',
      cardId: 'used-manipulation',
      targetId: 'overwritten-event',
    },
    { type: 'play', cardId: 'replacement', position: { row: 0, column: 1 } },
    { type: 'confirm' },
    { type: 'discard', cardId: 'rejected-discard' },
  ];

  expect(
    countActivelyDiscardedCards(
      discarded,
      actions.map((action) => ({ action })),
    ),
  ).toBe(2);
});

it('does not double-count duplicate discard attempts or count attempts that never reached the pile', () => {
  const discarded: Card[] = [{ id: 'one', type: 'event', number: 1900 }];
  const actions: ComputerAction[] = [
    { type: 'discard', cardId: 'one' },
    { type: 'discard', cardId: 'one' },
    { type: 'discard', cardId: 'missing' },
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
