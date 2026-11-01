import { Client } from 'boardgame.io/client';
import { assert, describe, expect, it } from 'vitest';

import {
  applyCommand,
  applyEventReclaim,
  applyTimeJump,
  applyTimeSwap,
  getTimeJumpPositions,
  isValidBoard,
} from './commandRules';
import { chooseComputerAction } from './computer';
import {
  type Card,
  CardGame,
  type CardGameState,
  type PlacedCard,
} from './game';
import { currentGameLog } from './gameLog';
import { isValidPlacement } from './gameRules';
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
  action: 'event-reclaim' | 'time-jump' | 'time-swap',
  overrides: Partial<CardGameState> = {},
) {
  const command: Card = {
    action,
    id: 'command',
    type: 'command',
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
        hands: overrides.hands ?? {
          ...CardGame.setup!(context).hands,
          '0': [
            command,
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

describe('command rules', () => {
  it('replaces an Event from hand or restores a removed Event', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, removed: true } : card,
    );
    const replacement = {
      effects: ['draw-one'] as const,
      id: 'replacement',
      name: 'timeline-origin' as const,
      number: 1950,
      type: 'event' as const,
    };
    const replaced = applyEventReclaim(played, 'c', '0', replacement);

    expect(replaced).not.toBeNull();
    expect(replaced?.find((card) => card.id === 'c')).toBeUndefined();
    expect(replaced?.find((card) => card.id === 'replacement')).toMatchObject({
      column: 2,
      effects: ['draw-one'],
      owner: '0',
      placedAt: 3,
      row: 0,
    });
    expect(
      applyEventReclaim(played, 'c', '0', { ...replacement, number: 1900 }),
    ).toBeNull();

    const restored = applyEventReclaim(played, 'd', '0');

    expect(restored?.find((card) => card.id === 'd')).not.toHaveProperty(
      'removed',
    );
    expect(applyEventReclaim(played, 'c', '0')).toBeNull();
    expect(
      applyEventReclaim(
        [
          ...played,
          {
            column: 0,
            id: 'later-earlier-event',
            name: 'timeline-origin',
            number: 1950,
            owner: '1',
            placedAt: 5,
            row: 3,
            type: 'event',
          },
        ],
        'd',
        '0',
      ),
    ).toBeNull();
  });

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

    client.moves.command('command', 'c', { column: 0, row: 2 });

    const after = client.getState()!.G;

    expect(after.played).toHaveLength(before.played.length - 1);
    expect(after.discarded.map((card) => card.id)).toStrictEqual([
      'd',
      'command',
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

  it('does not allow a Command card to be placed as an Event', () => {
    expect(
      isValidPlacement(
        board(),
        { column: 0, row: -1 },
        {
          action: 'time-jump',
          id: 'jump',
          type: 'command',
        },
      ),
    ).toBe(false);
  });
});

describe('command game moves', () => {
  it('undoes and redoes Event Reclaim replacements', () => {
    const client = clientFor('event-reclaim', {
      hands: {
        '0': [
          { action: 'event-reclaim', id: 'command', type: 'command' },
          {
            id: 'spare',
            name: 'timeline-origin',
            number: 1950,
            type: 'event',
          },
          {
            id: 'reserve',
            name: 'timeline-origin',
            number: 1960,
            type: 'event',
          },
        ],
        '1': [
          {
            id: 'other',
            name: 'timeline-origin',
            number: 1970,
            type: 'event',
          },
        ],
      },
    });
    const before = client.getState()!.G;

    client.moves.command('command', 'c', 'spare');

    const after = client.getState()!.G;

    client.moves.undoTest();

    expect(client.getState()!.G.played).toStrictEqual(before.played);
    expect(client.getState()!.G.hands['0']).toStrictEqual(before.hands['0']);
    expect(client.getState()!.G.discarded).toStrictEqual(before.discarded);

    client.moves.redoTest();

    expect(client.getState()!.G.played).toStrictEqual(after.played);
    expect(client.getState()!.G.hands['0']).toStrictEqual(after.hands['0']);
    expect(client.getState()!.G.discarded).toStrictEqual(after.discarded);

    client.stop();
  });

  it('replaces an Event, triggers its effect, and records the replacement in the game log', () => {
    const eventWithDraw = {
      effects: ['draw-one', 'free-action'] as const,
      id: 'spare',
      name: 'timeline-origin' as const,
      number: 1950,
      type: 'event' as const,
    };
    const client = clientFor('event-reclaim', {
      hands: {
        '0': [
          { action: 'event-reclaim', id: 'command', type: 'command' },
          eventWithDraw,
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
    });

    client.moves.command('command', 'c', 'spare');

    const after = client.getState()!.G;

    expect(after.played.find((card) => card.id === 'spare')).toMatchObject({
      number: 1950,
      owner: '0',
    });
    expect(after.played.find((card) => card.id === 'c')).toBeUndefined();
    expect(after.discarded.map((card) => card.id)).toStrictEqual([
      'c',
      'command',
    ]);
    expect(after.hands['0'].map((card) => card.id)).toStrictEqual(['draw']);
    expect(after.deck).toStrictEqual([]);
    expect(after.undoBlocked).toBe(true);
    expect(after.actionsThisTurn).toBe(0);
    expect(
      currentGameLog('event-reclaim-test', after, '0').actions[0],
    ).toMatchObject({
      payload: {
        args: ['command', 'c', 'spare'],
        type: 'command',
      },
    });

    client.stop();
  });

  it('restores a removed Event without changing its owner', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, removed: true } : card,
    );
    const client = clientFor('event-reclaim', { played });

    client.moves.command('command', 'd');

    expect(
      client.getState()!.G.played.find((card) => card.id === 'd'),
    ).toMatchObject({
      owner: '0',
    });
    expect(
      client.getState()!.G.played.find((card) => card.id === 'd'),
    ).not.toHaveProperty('removed');
    expect(client.getState()!.G.discarded.map((card) => card.id)).toStrictEqual(
      ['command'],
    );

    client.stop();
  });

  it('lets the computer restore a removed Event', () => {
    const played = board().map((card) =>
      card.id === 'd' ? { ...card, owner: '1' as const, removed: true } : card,
    );
    const client = clientFor('event-reclaim', { played });
    const G = client.getState()!.G;
    const computerState = {
      ...G,
      hands: { ...G.hands, '1': [G.hands['0'][0]] },
    };
    const choice = chooseComputerAction(computerState);

    expect(choice?.type).toBe('command');

    assert(choice?.type === 'command', 'Expected Command');

    expect(choice.cardId).toBe('command');
    expect(choice.destination).toBeUndefined();
    expect(
      applyCommand(computerState.played, 'event-reclaim', choice.targetId, '1'),
    ).not.toBeNull();

    client.stop();
  });

  it.each(['time-jump', 'time-swap'] as const)(
    'uses %s as one action and supports undo/redo',
    (action) => {
      const client = clientFor(action);
      const before = client.getState()!;

      client.moves.command(
        'command',
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

  it('blocks undo when a second-action command refills the hand', () => {
    const client = clientFor('time-jump', { actionsThisTurn: 1 });

    client.moves.command('command', 'c', { column: 1, row: -1 });

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

    client.moves.command('command', 'a', { column: 0, row: -1 });
    client.moves.command('command', 'c', 'd');
    client.moves.command('spare', 'c', { column: 1, row: -1 });
    client.moves.command('other', 'c', { column: 1, row: -1 });

    expect(client.getState()!.G).toStrictEqual(before);
  });

  it('does not command during an unconfirmed placement or after game end', () => {
    const client = clientFor('time-jump');

    client.moves.playCard('spare', { column: 0, row: -1 });

    const before = client.getState()!.G;

    client.moves.command('command', 'c', { column: 1, row: -1 });

    expect(client.getState()!.G).toStrictEqual(before);

    const ended = clientFor('time-jump', { roundOver: true });
    const final = ended.getState()!.G;

    ended.moves.command('command', 'c', { column: 1, row: -1 });

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

      expect(choice?.type).toBe('command');

      assert(choice?.type === 'command', 'Expected Command');

      expect(choice.cardId).toBe('command');

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
