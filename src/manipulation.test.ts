import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

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
    id: 'start',
    type: 'event',
    number: 0,
    row: 0,
    column: 0,
    owner: 'neutral',
    placedAt: 0,
  },
  {
    id: 'a',
    type: 'event',
    number: 1900,
    row: 0,
    column: 1,
    owner: '0',
    placedAt: 1,
  },
  {
    id: 'b',
    type: 'event',
    number: 1900,
    row: 1,
    column: 0,
    owner: '1',
    placedAt: 2,
  },
  {
    id: 'c',
    type: 'event',
    number: 1940,
    effect: 'draw-one',
    row: 0,
    column: 2,
    owner: '1',
    placedAt: 3,
  },
  {
    id: 'd',
    type: 'event',
    number: 1990,
    effect: 'timeline-1900-bonus',
    row: 2,
    column: 0,
    owner: '0',
    placedAt: 4,
  },
];

function clientFor(
  action: 'time-jump' | 'time-swap',
  overrides: Partial<CardGameState> = {},
) {
  const manipulation: Card = {
    id: 'manipulation',
    type: 'manipulation',
    action,
  };

  return Client({
    game: {
      ...CardGame,
      setup: (context): CardGameState => ({
        ...CardGame.setup!(context),
        played: board(),
        deck: [{ id: 'draw', type: 'event', number: 1920 }],
        nextPlacementOrder: 5,
        ...overrides,
        hands: {
          ...CardGame.setup!(context).hands,
          '0': [manipulation, { id: 'spare', type: 'event', number: 1950 }],
          '1': [{ id: 'other', type: 'event', number: 1960 }],
        },
      }),
    },
    numPlayers: 2,
  });
}

describe('Manipulation rules', () => {
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
      const result = applyTimeJump(played, 'c', { row: 2, column: 0 })!;

      expect(result).not.toBeNull();
      expect(getTimeJumpPositions(played, 'c')).toContainEqual({
        row: 2,
        column: 0,
      });
      expect(result.find((card) => card.id === 'd')).toBeUndefined();
      expect(result.find((card) => card.id === 'c')).toMatchObject({
        number: 1940,
        owner: '1',
        effect: 'draw-one',
        removed,
        row: 2,
        column: 0,
        placedAt: 4,
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

    expect(applyTimeJump(played, 'c', { row: 1, column: 0 })).toBeNull();
    expect(applyTimeJump(played, 'd', { row: 2, column: 0 })).toBeNull();
    expect(applyTimeJump(played, 'a', { row: 2, column: 0 })).toBeNull();

    const invalidDateBoard = board().map((card) =>
      card.id === 'c' ? { ...card, removed: true } : card,
    );

    expect(
      applyTimeJump(invalidDateBoard, 'b', { row: 0, column: 2 }),
    ).toBeNull();
  });

  it('discards the overwritten Event without triggering play effects, and restores it through undo/redo', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, removed: true } : card,
    );
    const client = clientFor('time-jump', { played });
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'c', { row: 2, column: 0 });

    const after = client.getState()!.G;

    expect(after.played).toHaveLength(before.played.length - 1);
    expect(after.discarded.map((card) => card.id)).toEqual([
      'd',
      'manipulation',
    ]);
    expect(after.discarded[0]).not.toHaveProperty('removed');
    expect(after.hands['0'].map((card) => card.id)).toEqual(['spare']);
    expect(after.deck).toEqual(before.deck);
    expect(after.actionsThisTurn).toBe(1);
    expect(after.played.find((card) => card.id === 'c')?.owner).toBe('1');
    client.moves.undoTest();
    expect(client.getState()!.G.played).toEqual(before.played);
    expect(client.getState()!.G.discarded).toEqual(before.discarded);
    client.moves.redoTest();
    expect(client.getState()!.G.played).toEqual(after.played);
    expect(client.getState()!.G.discarded).toEqual(after.discarded);
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
    const moved = applyTimeJump(original, 'c', { row: -1, column: 1 })!;

    expect(moved.find((card) => card.id === 'c')).toEqual({
      ...original[3],
      row: -1,
      column: 1,
    });
    expect(original[3].row).toBe(0);
    expect(isValidBoard(moved)).toBe(true);
    expect(getTimeJumpPositions(original, 'c')).toContainEqual({
      row: -1,
      column: 1,
    });
  });

  it('swaps two cards and keeps ownership, placement order and effects', () => {
    const original = board();
    const swapped = applyTimeSwap(original, 'c', 'd')!;

    expect(swapped[3]).toEqual({ ...original[3], row: 2, column: 0 });
    expect(swapped[4]).toEqual({ ...original[4], row: 0, column: 2 });
    expect(calculateScores(swapped)).toEqual(calculateScores(original));
    expect(isValidBoard(swapped)).toBe(true);
  });

  it.each([
    ['start', { row: -1, column: 0 }],
    ['missing', { row: -1, column: 0 }],
    ['c', { row: 0, column: 2 }],
    ['c', { row: 1, column: 0 }],
    ['c', { row: 10, column: 10 }],
    ['c', { row: 0.5, column: 2 }],
    ['c', { row: 1, column: 1 }],
    ['a', { row: -1, column: 0 }],
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
        { row: -1, column: 0 },
        {
          id: 'jump',
          type: 'manipulation',
          action: 'time-jump',
        },
      ),
    ).toBe(false);
  });
});

describe('Manipulation game moves', () => {
  it.each(['time-jump', 'time-swap'] as const)(
    'uses %s as one action and supports undo/redo',
    (action) => {
      const client = clientFor(action);
      const before = client.getState()!;

      client.moves.manipulate(
        'manipulation',
        'c',
        action === 'time-jump' ? { row: -1, column: 1 } : 'd',
      );

      const after = client.getState()!;

      expect(after.G.played).not.toEqual(before.G.played);
      expect(after.G.discarded).toEqual([before.G.hands['0'][0]]);
      expect(after.G.hands['0']).toEqual([before.G.hands['0'][1]]);
      expect(after.G.deck).toEqual(before.G.deck); // Moving a 1940 card does not draw again.
      expect(after.G.actionsThisTurn).toBe(1);
      expect(after.G.nextPlacementOrder).toBe(5);
      expect(after.ctx.currentPlayer).toBe('0');
      client.moves.undoTest();
      expect(client.getState()!.G.played).toEqual(before.G.played);
      expect(client.getState()!.G.hands['0']).toEqual(before.G.hands['0']);
      expect(client.getState()!.G.actionsThisTurn).toBe(0);
      client.moves.redoTest();
      expect(client.getState()!.G.played).toEqual(after.G.played);
      expect(client.getState()!.G.discarded).toEqual(after.G.discarded);
    },
  );

  it('refills and passes the turn after a second-action manipulation, with history restoring control', () => {
    const client = clientFor('time-jump', { actionsThisTurn: 1 });
    const before = client.getState()!;

    client.moves.manipulate('manipulation', 'c', { row: -1, column: 1 });
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.hands['0']).toHaveLength(2);
    expect(client.getState()!.G.deck).toEqual([]);
    client.moves.undoTest();
    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.actionsThisTurn).toBe(1);
    expect(client.getState()!.G.hands['0']).toEqual(before.G.hands['0']);
    expect(client.getState()!.G.played).toEqual(before.G.played);
    client.moves.redoTest();
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('rejects invalid targets, wrong card kinds, wrong action arguments and other hands without spending an action', () => {
    const client = clientFor('time-jump');
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'a', { row: -1, column: 0 });
    client.moves.manipulate('manipulation', 'c', 'd');
    client.moves.manipulate('spare', 'c', { row: -1, column: 1 });
    client.moves.manipulate('other', 'c', { row: -1, column: 1 });
    expect(client.getState()!.G).toEqual(before);
  });

  it('does not manipulate during an unconfirmed placement or after game end', () => {
    const client = clientFor('time-jump');

    client.moves.playCard('spare', { row: -1, column: 0 });

    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'c', { row: -1, column: 1 });
    expect(client.getState()!.G).toEqual(before);

    const ended = clientFor('time-jump', { roundOver: true });
    const final = ended.getState()!.G;

    ended.moves.manipulate('manipulation', 'c', { row: -1, column: 1 });
    expect(ended.getState()!.G).toEqual(final);
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

      if (choice?.type !== 'manipulate') {
        throw new Error('Expected Manipulation');
      }

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
