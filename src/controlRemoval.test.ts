import { Client } from 'boardgame.io/client';
import { assert, describe, expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import {
  canUndoMove,
  CardGame,
  type CardGameState,
  type ManipulationAction,
  type PlacedCard,
} from './game';
import {
  getAvailablePositions,
  isValidBoard,
  isValidPlacement,
} from './gameRules';
import {
  applyManipulation,
  applyTimeJump,
  applyTimeSwap,
} from './manipulationRules';
import { calculateScoreBreakdown } from './scoring';

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
    id: 'source',
    name: 'timeline-origin',
    number: 1900,
    owner: '1',
    placedAt: 1,
    row: 0,
    type: 'event',
  },
  {
    column: 2,
    effects: ['timeline-1900-bonus'],
    id: 'bonus',
    name: 'timeline-origin',
    number: 1990,
    owner: '1',
    placedAt: 2,
    row: 0,
    type: 'event',
  },
  {
    column: 0,
    effects: ['draw-one'],
    id: 'draw',
    name: 'timeline-origin',
    number: 1940,
    owner: '2',
    placedAt: 3,
    row: 1,
    type: 'event',
  },
];

function clientFor(
  action: ManipulationAction,
  played = board(),
  actionsThisTurn = 0,
  replacementNumber = 1940,
) {
  return Client({
    game: {
      ...CardGame,
      setup: (context): CardGameState => ({
        ...CardGame.setup!(context),
        actionsThisTurn,
        deck: [
          {
            id: 'drawn',
            name: 'timeline-origin',
            number: 1980,
            type: 'event',
          },
        ],
        hands: {
          '0': [
            { action, id: 'manipulation', type: 'manipulation' },
            {
              effects: ['draw-one'],
              id: 'replacement',
              name: 'timeline-origin',
              number: replacementNumber,
              type: 'event',
            },
          ],
          '1': [
            {
              id: 'other',
              name: 'timeline-origin',
              number: 1950,
              type: 'event',
            },
          ],
          '2': [],
          '3': [],
        },
        nextPlacementOrder: 4,
        played,
      }),
    },
    numPlayers: 4,
  });
}

describe('take Control and Remove Event', () => {
  it.each(['bonus', 'draw'])(
    'takes control of %s, including its valid points, without triggering a draw',
    (target) => {
      const client = clientFor('take-control');
      const before = client.getState()!.G;

      client.moves.manipulate('manipulation', target);

      const after = client.getState()!.G;
      const original = before.played.find((card) => card.id === target)!;

      expect(after.played.find((card) => card.id === target)).toStrictEqual({
        ...original,
        owner: '0',
      });
      expect(after.deck).toStrictEqual(before.deck);
      expect(after.discarded.map((card) => card.id)).toStrictEqual([
        'manipulation',
      ]);
      expect(after.actionsThisTurn).toBe(1);
      expect(calculateScoreBreakdown(after.played)['0']?.total ?? 0).toBe(
        target === 'bonus' ? 2 : 1,
      );

      client.moves.undoTest();

      expect(client.getState()!.G.played).toStrictEqual(before.played);
      expect(client.getState()!.G.hands).toStrictEqual(before.hands);

      client.moves.redoTest();

      expect(client.getState()!.G.played).toStrictEqual(after.played);
    },
  );

  it.each(['source', 'bonus'])(
    'removes %s without deleting it, and excludes removed cards from all scoring',
    (target) => {
      const client = clientFor('remove-event');
      const before = client.getState()!.G;

      client.moves.manipulate('manipulation', target);

      const after = client.getState()!.G;

      expect(after.played).toHaveLength(before.played.length);
      expect(after.played.find((card) => card.id === target)).toStrictEqual({
        ...before.played.find((card) => card.id === target),
        removed: true,
      });
      expect(calculateScoreBreakdown(after.played)['1']).toStrictEqual({
        base: 1,
        bonus: 0,
        total: 1,
      });
      expect(isValidBoard(after.played)).toBe(true);
      expect(after.deck).toStrictEqual(before.deck);

      client.moves.undoTest();

      expect(client.getState()!.G.played).toStrictEqual(before.played);

      client.moves.redoTest();

      expect(client.getState()!.G.played).toStrictEqual(after.played);
    },
  );

  it('keeps a removed Event removed when control changes', () => {
    const removed = applyManipulation(board(), 'remove-event', 'bonus', '0')!;
    const controlled = applyManipulation(
      removed,
      'take-control',
      'bonus',
      '3',
    )!;

    expect(controlled.find((card) => card.id === 'bonus')).toMatchObject({
      owner: '3',
      removed: true,
    });
    expect(calculateScoreBreakdown(controlled)['3']?.total ?? 0).toBe(0);
  });

  it('protects the start and rejects invalid take-controls targets', () => {
    const action = 'take-control';
    const client = clientFor(action);
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'start');
    client.moves.manipulate('manipulation', 'unknown');
    client.moves.manipulate('other', 'bonus');

    expect(client.getState()!.G).toStrictEqual(before);

    expect(applyManipulation(board(), action, 'bonus', '1')).toBeNull();
  });

  it('protects the start and rejects invalid remove-events targets', () => {
    const action = 'remove-event';
    const client = clientFor(action);
    const before = client.getState()!.G;

    client.moves.manipulate('manipulation', 'start');
    client.moves.manipulate('manipulation', 'unknown');
    client.moves.manipulate('other', 'bonus');

    expect(client.getState()!.G).toStrictEqual(before);

    const removed = applyManipulation(board(), action, 'bonus', '0')!;

    expect(applyManipulation(removed, action, 'bonus', '0')).toBeNull();
  });

  it('moves and swaps removed Events, preserving their status and identity', () => {
    const removed = applyManipulation(board(), 'remove-event', 'bonus', '0')!;
    const moved = applyTimeJump(removed, 'bonus', { column: 1, row: -1 })!;
    const swapped = applyTimeSwap(removed, 'bonus', 'draw')!;

    expect(moved.find((card) => card.id === 'bonus')).toMatchObject({
      column: 1,
      owner: '1',
      removed: true,
      row: -1,
    });
    expect(swapped.find((card) => card.id === 'bonus')).toMatchObject({
      column: 0,
      removed: true,
      row: 1,
    });
    expect(isValidBoard(moved)).toBe(true);
    expect(isValidBoard(swapped)).toBe(true);
  });

  it('restores turn ownership and the removed status across second-action undo/redo', () => {
    const client = clientFor('remove-event', board(), 1);

    client.moves.manipulate('manipulation', 'bonus');

    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(canUndoMove(client.getState()!.G)).toBe(false);

    const after = client.getState()!.G;

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after);
  });
});

describe('overwriting removed Events', () => {
  const removedBoard = () =>
    applyManipulation(board(), 'remove-event', 'bonus', '0')!;

  it('offers the removed position, confirms an overwrite, discards the old Event, and supports history', () => {
    const client = clientFor('take-control', removedBoard());
    const before = client.getState()!.G;
    const replacement = before.hands['0'][1];

    expect(getAvailablePositions(before.played, replacement)).toContainEqual({
      column: 2,
      row: 0,
    });

    client.moves.playCard('replacement', { column: 2, row: 0 });

    expect(client.getState()!.G.pending?.id).toBe('replacement');
    expect(
      client.getState()!.G.played.find((card) => card.id === 'bonus')?.removed,
    ).toBe(true);

    client.moves.confirmPlacement();

    const after = client.getState()!.G;

    expect(after.played).toHaveLength(before.played.length);
    expect(after.played.find((card) => card.id === 'bonus')).toBeUndefined();
    expect(
      after.played.find((card) => card.id === 'replacement'),
    ).toMatchObject({
      column: 2,
      owner: '0',
      placedAt: 2,
      row: 0,
    });
    expect(
      after.played.find((card) => card.id === 'replacement')?.removed,
    ).toBeUndefined();
    expect(after.discarded.map((card) => card.id)).toStrictEqual(['bonus']);
    expect(after.hands['0'].map((card) => card.id)).toStrictEqual([
      'manipulation',
      'drawn',
    ]);
    expect(isValidBoard(after.played)).toBe(true);
    expect(
      new Set(
        [
          ...after.played,
          ...Object.values(after.hands).flat(),
          ...after.deck,
          ...after.discarded,
        ].map((card) => card.id),
      ).size,
    ).toBe(8);
    expect(canUndoMove(after)).toBe(false);

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after);
  });

  it('cancels an unconfirmed overwrite without discarding the old Event', () => {
    const client = clientFor('take-control', removedBoard());
    const before = client.getState()!.G;

    client.moves.playCard('replacement', { column: 2, row: 0 });
    client.moves.returnPendingCard();

    expect(client.getState()!.G.played).toStrictEqual(before.played);
    expect(client.getState()!.G.discarded).toStrictEqual([]);
    expect(client.getState()!.G.hands).toStrictEqual(before.hands);
    expect(client.getState()!.G.actionsThisTurn).toBe(0);
  });

  it('rejects occupied active cards and overwrites with invalid upstream or downstream dates', () => {
    const event = {
      id: 'new',
      name: 'timeline-origin' as const,
      number: 1990,
      type: 'event' as const,
    };
    const bridge = board()
      .slice(0, 3)
      .map((card) =>
        card.id === 'source'
          ? { ...card, removed: true }
          : card.id === 'bonus'
            ? { ...card, column: 1, number: 1950, row: -1 }
            : card,
      );

    expect(isValidPlacement(board(), { column: 2, row: 0 }, event)).toBe(false);
    expect(
      isValidPlacement(
        removedBoard(),
        { column: 2, row: 0 },
        { ...event, number: 1900 },
      ),
    ).toBe(false);
    expect(isValidPlacement(bridge, { column: 1, row: 0 }, event)).toBe(false);
    expect(getAvailablePositions(bridge, event)).not.toContainEqual({
      column: 1,
      row: 0,
    });
  });

  it.each([1900, 1940, 1980])(
    'allows a valid %s Event to overwrite a removed card in the middle of a timeline',
    (number) => {
      const played = applyManipulation(board(), 'remove-event', 'source', '0')!;
      const client = clientFor('take-control', played, 0, number);
      const replacement = client.getState()!.G.hands['0'][1];

      expect(isValidPlacement(played, { column: 1, row: 0 }, replacement)).toBe(
        true,
      );
      expect(getAvailablePositions(played, replacement)).toContainEqual({
        column: 1,
        row: 0,
      });

      client.moves.playCard('replacement', { column: 1, row: 0 });
      client.moves.confirmPlacement();

      const after = client.getState()!.G;

      expect(
        after.played.find((card) => card.id === 'replacement'),
      ).toMatchObject({
        number,
        owner: '0',
        placedAt: 1,
      });
      expect(after.discarded.map((card) => card.id)).toStrictEqual(['source']);
      expect(isValidBoard(after.played)).toBe(true);

      expect(canUndoMove(after)).toBe(false);

      client.moves.undoTest();

      expect(client.getState()!.G).toStrictEqual(after);
    },
  );

  it('ignores removed Events in date checks but treats their positions as open for squares', () => {
    const removed = applyManipulation(board(), 'remove-event', 'source', '0')!;
    const event = {
      id: 'new',
      name: 'timeline-origin' as const,
      number: 1990,
      type: 'event' as const,
    };

    expect(isValidPlacement(removed, { column: 1, row: 1 }, event)).toBe(true);
    expect(
      isValidPlacement(
        removed,
        { column: 1, row: -1 },
        { ...event, number: 1900 },
      ),
    ).toBe(true);
  });

  it('allows a 1970 Event below New Deal beside a removed 1990 Event', () => {
    const played = board().map((card) =>
      card.id === 'start'
        ? { ...card, column: -2, row: 0 }
        : card.id === 'source'
          ? {
              ...card,
              column: -2,
              name: 'new-deal' as const,
              number: 1930,
              row: 1,
            }
          : card.id === 'draw'
            ? { ...card, column: -1, number: 1950, placedAt: 2, row: 1 }
            : { ...card, column: -1, placedAt: 3, removed: true, row: 2 },
    );
    const position = { column: -2, row: 2 };

    const event = {
      id: 'event-1970',
      name: 'timeline-origin' as const,
      number: 1970,
      type: 'event' as const,
    };

    expect(isValidBoard(played)).toBe(true);
    expect(isValidPlacement(played, position, event)).toBe(true);
    expect(getAvailablePositions(played, event)).toContainEqual(position);
    expect(
      isValidBoard([
        ...played,
        { ...event, ...position, owner: '0' as const, placedAt: 4 },
      ]),
    ).toBe(true);
  });

  it('allows placements beside removed Events while keeping overwrites and existing links valid', () => {
    const played = applyManipulation(board(), 'remove-event', 'source', '0')!;
    const event = {
      id: 'new',
      name: 'timeline-origin' as const,
      number: 1940,
      type: 'event' as const,
    };
    const position = { column: 1, row: -1 };

    expect(isValidPlacement(board(), position, event)).toBe(true);
    expect(isValidPlacement(played, position, event)).toBe(true);
    expect(isValidPlacement(played, position)).toBe(true);
    expect(getAvailablePositions(played, event)).toContainEqual(position);
    expect(getAvailablePositions(played)).toContainEqual(position);
    expect(isValidPlacement(played, { column: 1, row: 0 }, event)).toBe(true);
    expect(isValidPlacement(played, { column: 0, row: -1 }, event)).toBe(true);
    expect(isValidBoard(played)).toBe(true);
  });

  it('allows a card beside the 1900 Event beside a removed 1920 Event', () => {
    const played: PlacedCard[] = [
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
        column: 0,
        id: 'event-1900',
        name: 'timeline-origin',
        number: 1900,
        owner: '0',
        placedAt: 1,
        row: -1,
        type: 'event',
      },
      {
        column: -1,
        id: 'event-1920',
        name: 'timeline-origin',
        number: 1920,
        owner: '1',
        placedAt: 2,
        removed: true,
        row: 0,
        type: 'event',
      },
    ];
    const position = { column: -1, row: -1 };
    const event = {
      id: 'event-1940',
      name: 'timeline-origin' as const,
      number: 1940,
      type: 'event' as const,
    };

    expect(isValidPlacement(played, position, event)).toBe(true);
    expect(getAvailablePositions(played, event)).toContainEqual(position);
  });

  it('allows empty placements beside a removed Event when they also touch an active Event', () => {
    const played = board()
      .slice(0, 2)
      .map((card) =>
        card.id === 'source' ? { ...card, removed: true } : card,
      );

    played.push({ ...board()[2], column: 0, number: 1910, row: -1 });

    const event = {
      id: 'new',
      name: 'timeline-origin' as const,
      number: 1940,
      type: 'event' as const,
    };
    const position = { column: 1, row: -1 };
    const client = clientFor('take-control', played);
    const before = client.getState()!.G;

    expect(isValidPlacement(played, position, event)).toBe(true);

    client.moves.playCard('replacement', position);

    expect(client.getState()!.G.pending).toMatchObject({
      column: 1,
      id: 'replacement',
      row: -1,
    });
    expect(client.getState()!.G.played).toStrictEqual(before.played);
  });
});

describe('computer control/removal decisions', () => {
  it.each(['take-control', 'remove-event'] as const)(
    'can use %s against a scoring rival',
    (action) => {
      const state = clientFor(action).getState()!.G;
      const G = {
        ...state,
        hands: { ...state.hands, '0': [state.hands['0'][0]] },
      };
      const choice = chooseComputerAction(G, '0');

      expect(choice?.type).toBe('manipulate');

      assert(choice?.type === 'manipulate', 'Expected a Manipulation');

      expect(
        applyManipulation(
          G.played,
          action,
          choice.targetId,
          '0',
          choice.destination,
        ),
      ).not.toBeNull();
      expect(
        G.played.find((card) => card.id === choice.targetId)?.owner,
      ).not.toBe('0');
    },
  );
});
