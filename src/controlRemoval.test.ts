import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import {
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
    id: 'start',
    type: 'event',
    number: 0,
    row: 0,
    column: 0,
    owner: 'neutral',
    placedAt: 0,
  },
  {
    id: 'source',
    type: 'event',
    number: 1900,
    row: 0,
    column: 1,
    owner: '1',
    placedAt: 1,
  },
  {
    id: 'bonus',
    type: 'event',
    number: 1990,
    effect: 'timeline-1900-bonus',
    row: 0,
    column: 2,
    owner: '1',
    placedAt: 2,
  },
  {
    id: 'draw',
    type: 'event',
    number: 1940,
    effect: 'draw-one',
    row: 1,
    column: 0,
    owner: '2',
    placedAt: 3,
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
        played,
        actionsThisTurn,
        nextPlacementOrder: 4,
        hands: {
          '0': [
            { id: 'manipulation', type: 'manipulation', action },
            {
              id: 'replacement',
              type: 'event',
              number: replacementNumber,
              effect: 'draw-one',
            },
          ],
          '1': [{ id: 'other', type: 'event', number: 1950 }],
          '2': [],
          '3': [],
        },
        deck: [{ id: 'drawn', type: 'event', number: 1980 }],
      }),
    },
    numPlayers: 4,
  });
}

describe('Take Control and Remove Event', () => {
  it.each(['bonus', 'draw'])(
    'takes control of %s, including its valid points, without triggering a draw',
    (target) => {
      const client = clientFor('take-control');
      const before = client.getState()!.G;

      client.moves.manipulate('manipulation', target);

      const after = client.getState()!.G;
      const original = before.played.find((card) => card.id === target)!;

      expect(after.played.find((card) => card.id === target)).toEqual({
        ...original,
        owner: '0',
      });
      expect(after.deck).toEqual(before.deck);
      expect(after.discarded.map((card) => card.id)).toEqual(['manipulation']);
      expect(after.actionsThisTurn).toBe(1);
      expect(calculateScoreBreakdown(after.played)['0'].total).toBe(
        target === 'bonus' ? 2 : 1,
      );
      client.moves.undoTest();
      expect(client.getState()!.G.played).toEqual(before.played);
      expect(client.getState()!.G.hands).toEqual(before.hands);
      client.moves.redoTest();
      expect(client.getState()!.G.played).toEqual(after.played);
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
      expect(after.played.find((card) => card.id === target)).toEqual({
        ...before.played.find((card) => card.id === target),
        removed: true,
      });
      expect(calculateScoreBreakdown(after.played)['1']).toEqual({
        base: 1,
        bonus: 0,
        total: 1,
      });
      expect(isValidBoard(after.played)).toBe(true);
      expect(after.deck).toEqual(before.deck);
      client.moves.undoTest();
      expect(client.getState()!.G.played).toEqual(before.played);
      client.moves.redoTest();
      expect(client.getState()!.G.played).toEqual(after.played);
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

  it.each(['take-control', 'remove-event'] as const)(
    'protects the start and rejects invalid %s targets',
    (action) => {
      const client = clientFor(action);
      const before = client.getState()!.G;

      client.moves.manipulate('manipulation', 'start');
      client.moves.manipulate('manipulation', 'unknown');
      client.moves.manipulate('other', 'bonus');
      expect(client.getState()!.G).toEqual(before);
      if (action === 'take-control') {
        expect(applyManipulation(board(), action, 'bonus', '1')).toBeNull();
      } else {
        const removed = applyManipulation(board(), action, 'bonus', '0')!;

        expect(applyManipulation(removed, action, 'bonus', '0')).toBeNull();
      }
    },
  );

  it('moves and swaps removed Events, preserving their status and identity', () => {
    const removed = applyManipulation(board(), 'remove-event', 'bonus', '0')!;
    const moved = applyTimeJump(removed, 'bonus', { row: -1, column: 1 })!;
    const swapped = applyTimeSwap(removed, 'bonus', 'draw')!;

    expect(moved.find((card) => card.id === 'bonus')).toMatchObject({
      removed: true,
      row: -1,
      column: 1,
      owner: '1',
    });
    expect(swapped.find((card) => card.id === 'bonus')).toMatchObject({
      removed: true,
      row: 1,
      column: 0,
    });
    expect(isValidBoard(moved)).toBe(true);
    expect(isValidBoard(swapped)).toBe(true);
  });

  it('restores turn ownership and the removed status across second-action undo/redo', () => {
    const client = clientFor('remove-event', board(), 1);

    client.moves.manipulate('manipulation', 'bonus');
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    client.moves.undoTest();
    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.actionsThisTurn).toBe(1);
    expect(
      client.getState()!.G.played.find((card) => card.id === 'bonus')?.removed,
    ).toBeUndefined();
    client.moves.redoTest();
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(
      client.getState()!.G.played.find((card) => card.id === 'bonus')?.removed,
    ).toBe(true);
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
      row: 0,
      column: 2,
    });
    client.moves.playCard('replacement', { row: 0, column: 2 });
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
      row: 0,
      column: 2,
      owner: '0',
      placedAt: 2,
    });
    expect(
      after.played.find((card) => card.id === 'replacement')?.removed,
    ).toBeUndefined();
    expect(after.discarded.map((card) => card.id)).toEqual(['bonus']);
    expect(after.hands['0'].map((card) => card.id)).toEqual([
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
    client.moves.undoTest();
    expect(client.getState()!.G.played).toEqual(before.played);
    expect(client.getState()!.G.hands).toEqual(before.hands);
    expect(client.getState()!.G.deck).toEqual(before.deck);
    client.moves.redoTest();
    expect(client.getState()!.G.played).toEqual(after.played);
    expect(client.getState()!.G.discarded).toEqual(after.discarded);
  });

  it('cancels an unconfirmed overwrite without discarding the old Event', () => {
    const client = clientFor('take-control', removedBoard());
    const before = client.getState()!.G;

    client.moves.playCard('replacement', { row: 0, column: 2 });
    client.moves.returnPendingCard();
    expect(client.getState()!.G.played).toEqual(before.played);
    expect(client.getState()!.G.discarded).toEqual([]);
    expect(client.getState()!.G.hands).toEqual(before.hands);
    expect(client.getState()!.G.actionsThisTurn).toBe(0);
  });

  it('rejects occupied active cards and overwrites with invalid upstream or downstream dates', () => {
    const event = { id: 'new', type: 'event' as const, number: 1990 };
    const bridge = board()
      .slice(0, 3)
      .map((card) =>
        card.id === 'source'
          ? { ...card, removed: true }
          : card.id === 'bonus'
            ? { ...card, number: 1950, row: -1, column: 1 }
            : card,
      );

    expect(isValidPlacement(board(), { row: 0, column: 2 }, event)).toBe(false);
    expect(
      isValidPlacement(
        removedBoard(),
        { row: 0, column: 2 },
        { ...event, number: 1900 },
      ),
    ).toBe(false);
    expect(isValidPlacement(bridge, { row: 0, column: 1 }, event)).toBe(false);
    expect(getAvailablePositions(bridge, event)).not.toContainEqual({
      row: 0,
      column: 1,
    });
  });

  it.each([1900, 1940, 1980])(
    'allows a valid %s Event to overwrite a removed card in the middle of a timeline',
    (number) => {
      const played = applyManipulation(board(), 'remove-event', 'source', '0')!;
      const client = clientFor('take-control', played, 0, number);
      const replacement = client.getState()!.G.hands['0'][1];

      expect(isValidPlacement(played, { row: 0, column: 1 }, replacement)).toBe(
        true,
      );
      expect(getAvailablePositions(played, replacement)).toContainEqual({
        row: 0,
        column: 1,
      });
      client.moves.playCard('replacement', { row: 0, column: 1 });
      client.moves.confirmPlacement();

      const after = client.getState()!.G;

      expect(
        after.played.find((card) => card.id === 'replacement'),
      ).toMatchObject({
        number,
        placedAt: 1,
        owner: '0',
      });
      expect(after.discarded.map((card) => card.id)).toEqual(['source']);
      expect(isValidBoard(after.played)).toBe(true);
      client.moves.undoTest();
      expect(client.getState()!.G.played).toEqual(played);
      client.moves.redoTest();
      expect(client.getState()!.G.played).toEqual(after.played);
    },
  );

  it('still counts removed dates and spaces in adjacency and square constraints', () => {
    const removed = applyManipulation(board(), 'remove-event', 'source', '0')!;
    const event = { id: 'new', type: 'event' as const, number: 1990 };

    expect(isValidPlacement(removed, { row: 1, column: 1 }, event)).toBe(false);
    expect(
      isValidPlacement(
        removed,
        { row: -1, column: 1 },
        { ...event, number: 1900 },
      ),
    ).toBe(false);
  });

  it('blocks empty positions touching a removed Event, but keeps overwrites and existing links valid', () => {
    const played = applyManipulation(board(), 'remove-event', 'source', '0')!;
    const event = { id: 'new', type: 'event' as const, number: 1940 };
    const position = { row: -1, column: 1 };

    expect(isValidPlacement(board(), position, event)).toBe(true);
    expect(isValidPlacement(played, position, event)).toBe(false);
    expect(isValidPlacement(played, position)).toBe(false);
    expect(getAvailablePositions(played, event)).not.toContainEqual(position);
    expect(getAvailablePositions(played)).not.toContainEqual(position);
    expect(isValidPlacement(played, { row: 0, column: 1 }, event)).toBe(true);
    expect(isValidPlacement(played, { row: -1, column: 0 }, event)).toBe(true);
    expect(isValidBoard(played)).toBe(true);
  });

  it('rejects empty placements even if they also touch an active Event', () => {
    const played = board()
      .slice(0, 2)
      .map((card) =>
        card.id === 'source' ? { ...card, removed: true } : card,
      );

    played.push({ ...board()[2], row: -1, column: 0, number: 1910 });

    const event = { id: 'new', type: 'event' as const, number: 1940 };
    const position = { row: -1, column: 1 };
    const client = clientFor('take-control', played);
    const before = client.getState()!.G;

    expect(isValidPlacement(played, position, event)).toBe(false);
    client.moves.playCard('replacement', position);
    expect(client.getState()!.G).toEqual(before);
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
      if (choice?.type !== 'manipulate') {
        throw new Error('Expected a Manipulation');
      }
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
