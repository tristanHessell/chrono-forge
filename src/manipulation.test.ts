import { Client } from 'boardgame.io/client';
import { assert, describe, expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import {
  type Card,
  CardGame,
  type CardGameState,
  type PlacedCard,
} from './game';
import { isValidPlacement } from './gameRules';
import {
  applyTimeJump,
  applyTimeSwap,
  getTimeJumpPositions,
  isValidBoard,
} from './manipulationRules';
import { calculateScores } from './scoring';

const board = (): PlacedCard[] => [
  {
    column: 0,
    id: 'start',
    name: 'timeline-origin',
    number: 0,
    owner: 'neutral',
    placedAt: 0,
    row: 0,
    type: 'event',
  },
  {
    column: 1,
    id: 'a',
    name: 'timeline-origin',
    number: 1900,
    owner: '0',
    placedAt: 1,
    row: 0,
    type: 'event',
  },
  {
    column: 0,
    id: 'b',
    name: 'timeline-origin',
    number: 1900,
    owner: '1',
    placedAt: 2,
    row: 1,
    type: 'event',
  },
  {
    column: 2,
    effects: ['draw-one'],
    id: 'c',
    name: 'timeline-origin',
    number: 1940,
    owner: '1',
    placedAt: 3,
    row: 0,
    type: 'event',
  },
  {
    column: 0,
    effects: ['timeline-1900-bonus'],
    id: 'd',
    name: 'timeline-origin',
    number: 1990,
    owner: '0',
    placedAt: 4,
    row: 2,
    type: 'event',
  },
];

function clientFor(
  action: 'time-jump' | 'time-swap',
  overrides: Partial<CardGameState> = {},
) {
  const manipulation: Card = {
    action,
    id: 'manipulation',
    type: 'manipulation',
  };

  return Client({
    game: {
      ...CardGame,
      setup: (context): CardGameState => ({
        ...CardGame.setup!(context),
        deck: [
          {
            id: 'draw',
            name: 'timeline-origin',
            number: 1920,
            type: 'event',
          },
        ],
        nextPlacementOrder: 5,
        played: board(),
        ...overrides,
        hands: {
          ...CardGame.setup!(context).hands,
          '0': [
            manipulation,
            {
              id: 'spare',
              name: 'timeline-origin',
              number: 1950,
              type: 'event',
            },
          ],
          '1': [
            {
              id: 'other',
              name: 'timeline-origin',
              number: 1960,
              type: 'event',
            },
          ],
        },
      }),
    },
    numPlayers: 2,
  });
}

describe('manipulation rules', () => {
  it.each([false, true])(
    'overwrites a removed Event with Time Jump, preserving the moved card status (%s)',
    (removed) => {
      const played = board().map((card) =>
        card.id === 'd'
          ? { ...card, removed: true }
          : card.id === 'c'
            ? { ...card, removed }
            : card,
      );
      const result = applyTimeJump(played, 'c', { column: 0, row: 2 })!;

      expect(result).not.toBeNull();
      expect(getTimeJumpPositions(played, 'c')).toContainEqual({
        column: 0,
        row: 2,
      });
      expect(result.find((card) => card.id === 'd')).toBeUndefined();
      expect(result.find((card) => card.id === 'c')).toMatchObject({
        column: 0,
        effects: ['draw-one'],
        number: 1940,
        owner: '1',
        placedAt: 4,
        removed,
        row: 2,
      });
      expect(result).toHaveLength(played.length - 1);
      expect(isValidBoard(result)).toBe(true);
      expect(played.find((card) => card.id === 'd')).toBeDefined();
    },
  );

  it('rejects active destinations, self-overwrites and overwrites that disconnect the source timeline', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, removed: true } : card,
    );

    expect(applyTimeJump(played, 'c', { column: 0, row: 1 })).toBeNull();
    expect(applyTimeJump(played, 'd', { column: 0, row: 2 })).toBeNull();
    expect(applyTimeJump(played, 'a', { column: 0, row: 2 })).toBeNull();

    const invalidDateBoard = board().map((card) =>
      card.id === 'c' ? { ...card, removed: true } : card,
    );

    expect(
      applyTimeJump(invalidDateBoard, 'b', { column: 2, row: 0 }),
    ).toBeNull();
  });

  it('discards the overwritten Event without triggering play effects, and restores it through undo/redo', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, removed: true } : card,
    );
    const client = clientFor('time-jump', { played });
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'c', { column: 0, row: 2 });

    const after = client.getState()!.G;

    expect(after.played).toHaveLength(before.played.length - 1);
    expect(after.discarded.map((card) => card.id)).toStrictEqual([
      'd',
      'manipulation',
    ]);
    expect(after.discarded[0]).not.toHaveProperty('removed');
    expect(after.hands['0'].map((card) => card.id)).toStrictEqual(['spare']);
    expect(after.deck).toStrictEqual(before.deck);
    expect(after.actionsThisTurn).toBe(1);
    expect(after.played.find((card) => card.id === 'c')?.owner).toBe('1');

    client.moves.undoTest();

    expect(client.getState()!.G.played).toStrictEqual(before.played);
    expect(client.getState()!.G.discarded).toStrictEqual(before.discarded);

    client.moves.redoTest();

    expect(client.getState()!.G.played).toStrictEqual(after.played);
    expect(client.getState()!.G.discarded).toStrictEqual(after.discarded);

    client.stop();
  });

  it('recalculates timeline bonuses after swapping branch cards', () => {
    const original = board();

    original[2].number = 1910;

    expect(calculateScores(original)['0']).toBe(2);

    const swapped = applyTimeSwap(original, 'a', 'b')!;

    expect(calculateScores(swapped)['0']).toBe(3);
  });

  it('moves a card into an empty legal position without changing its metadata', () => {
    const original = board();
    const moved = applyTimeJump(original, 'c', { column: 1, row: -1 })!;

    expect(moved.find((card) => card.id === 'c')).toStrictEqual({
      ...original[3],
      column: 1,
      row: -1,
    });
    expect(original[3].row).toBe(0);
    expect(isValidBoard(moved)).toBe(true);
    expect(getTimeJumpPositions(original, 'c')).toContainEqual({
      column: 1,
      row: -1,
    });
  });

  it('swaps two cards and keeps ownership, placement order and effects', () => {
    const original = board();
    const swapped = applyTimeSwap(original, 'c', 'd')!;

    expect(swapped[3]).toStrictEqual({ ...original[3], column: 0, row: 2 });
    expect(swapped[4]).toStrictEqual({ ...original[4], column: 2, row: 0 });
    expect(calculateScores(swapped)).toStrictEqual(calculateScores(original));
    expect(isValidBoard(swapped)).toBe(true);
  });

  it('reorders placement when a swap changes the valid link direction', () => {
    const original: PlacedCard[] = [
      {
        column: 0,
        id: 'start',
        name: 'timeline-origin',
        number: 0,
        owner: 'neutral',
        placedAt: 0,
        row: 0,
        type: 'event',
      },
      {
        column: -1,
        id: '1900',
        name: 'timeline-origin',
        number: 1900,
        owner: '0',
        placedAt: 1,
        row: 0,
        type: 'event',
      },
      {
        column: -2,
        id: '1990',
        name: 'timeline-origin',
        number: 1990,
        owner: '1',
        placedAt: 2,
        row: 0,
        type: 'event',
      },
      {
        column: 1,
        id: '1920',
        name: 'timeline-origin',
        number: 1920,
        owner: '0',
        placedAt: 3,
        row: 0,
        type: 'event',
      },
    ];
    const swapped = applyTimeSwap(original, '1900', '1920')!;

    expect(swapped.find((card) => card.id === '1900')).toMatchObject({
      column: 1,
      placedAt: 1,
      row: 0,
    });
    expect(swapped.find((card) => card.id === '1920')).toMatchObject({
      column: -1,
      placedAt: 2,
      row: 0,
    });
    expect(isValidBoard(swapped)).toBe(true);
  });

  it.each([
    ['start', { column: 0, row: -1 }],
    ['missing', { column: 0, row: -1 }],
    ['c', { column: 2, row: 0 }],
    ['c', { column: 0, row: 1 }],
    ['c', { column: 10, row: 10 }],
    ['c', { column: 2, row: 0.5 }],
    ['c', { column: 1, row: 1 }],
    ['a', { column: 0, row: -1 }],
  ] as const)('rejects an invalid jump for %s to %j', (target, destination) => {
    expect(applyTimeJump(board(), target, destination)).toBeNull();
  });

  it.each([
    ['start', 'a'],
    ['a', 'a'],
    ['a', 'missing'],
    ['a', 'c'],
  ])('rejects an invalid swap of %s and %s', (first, second) => {
    expect(applyTimeSwap(board(), first, second)).toBeNull();
  });

  it('does not allow a Manipulation card to be placed as an Event', () => {
    expect(
      isValidPlacement(
        board(),
        { column: 0, row: -1 },
        {
          action: 'time-jump',
          id: 'jump',
          type: 'manipulation',
        },
      ),
    ).toBe(false);
  });
});

describe('manipulation game moves', () => {
  it.each(['time-jump', 'time-swap'] as const)(
    'uses %s as one action and supports undo/redo',
    (action) => {
      const client = clientFor(action);
      const before = client.getState()!;

      client.moves.manipulate(
        'manipulation',
        'c',
        action === 'time-jump' ? { column: 1, row: -1 } : 'd',
      );

      const after = client.getState()!;

      expect(after.G.played).not.toStrictEqual(before.G.played);
      expect(after.G.discarded).toStrictEqual([before.G.hands['0'][0]]);
      expect(after.G.hands['0']).toStrictEqual([before.G.hands['0'][1]]);
      expect(after.G.deck).toStrictEqual(before.G.deck); // Moving a 1940 card does not draw again.
      expect(after.G.actionsThisTurn).toBe(1);
      expect(after.G.nextPlacementOrder).toBe(5);
      expect(after.ctx.currentPlayer).toBe('0');

      client.moves.undoTest();

      expect(client.getState()!.G.played).toStrictEqual(before.G.played);
      expect(client.getState()!.G.hands['0']).toStrictEqual(
        before.G.hands['0'],
      );
      expect(client.getState()!.G.actionsThisTurn).toBe(0);

      client.moves.redoTest();

      expect(client.getState()!.G.played).toStrictEqual(after.G.played);
      expect(client.getState()!.G.discarded).toStrictEqual(after.G.discarded);
    },
  );

  it('blocks undo when a second-action manipulation refills the hand', () => {
    const client = clientFor('time-jump', { actionsThisTurn: 1 });

    client.moves.manipulate('manipulation', 'c', { column: 1, row: -1 });

    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.hands['0']).toHaveLength(2);
    expect(client.getState()!.G.deck).toStrictEqual([]);
    expect(client.getState()!.G.undoBlocked).toBe(true);

    const after = client.getState()!.G;

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after);
  });

  it('rejects invalid targets, wrong card kinds, wrong action arguments and other hands without spending an action', () => {
    const client = clientFor('time-jump');
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'a', { column: 0, row: -1 });
    client.moves.manipulate('manipulation', 'c', 'd');
    client.moves.manipulate('spare', 'c', { column: 1, row: -1 });
    client.moves.manipulate('other', 'c', { column: 1, row: -1 });

    expect(client.getState()!.G).toStrictEqual(before);
  });

  it('does not manipulate during an unconfirmed placement or after game end', () => {
    const client = clientFor('time-jump');

    client.moves.playCard('spare', { column: 0, row: -1 });

    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'c', { column: 1, row: -1 });

    expect(client.getState()!.G).toStrictEqual(before);

    const ended = clientFor('time-jump', { roundOver: true });
    const final = ended.getState()!.G;

    ended.moves.manipulate('manipulation', 'c', { column: 1, row: -1 });

    expect(ended.getState()!.G).toStrictEqual(final);
  });

  it.each(['time-jump', 'time-swap'] as const)(
    'lets the computer use %s legally',
    (action) => {
      const client = clientFor(action);
      const state = client.getState()!.G;
      const G = {
        ...state,
        hands: { ...state.hands, '1': [state.hands['0'][0]] },
      };
      const choice = chooseComputerAction(G);

      expect(choice?.type).toBe('manipulate');

      assert(choice?.type === 'manipulate', 'Expected Manipulation');

      expect(choice.cardId).toBe('manipulation');

      const result =
        typeof choice.destination === 'string'
          ? applyTimeSwap(G.played, choice.targetId, choice.destination)
          : choice.destination
            ? applyTimeJump(G.played, choice.targetId, choice.destination)
            : null;

      expect(result).not.toBeNull();
    },
  );
});
