import { describe, expect, it } from 'vitest';

import type { Card, CardGameState, CardPosition, PlacedCard } from './game';
import { CardGame } from './game';
import {
  getAvailablePositions,
  isValidPlacement,
  wouldCreateHeadToHeadMerge,
  wouldCreateSquare,
} from './gameRules';

type MoveContext = { ctx: { currentPlayer: string }; G: CardGameState };
type PlayCardMove = (
  context: MoveContext,
  cardId: string,
  position: CardPosition,
) => void;
type EndTurnOptions = { next?: string };
type ConfirmMove = (
  context: MoveContext & {
    events: { endTurn: (options?: EndTurnOptions) => void };
  },
) => void;
type HistoryMove = ConfirmMove;

const card = (id: string, row: number, column: number): PlacedCard => ({
  column,
  id,
  name: 'timeline-origin',
  number: 1,
  owner: '0',
  placedAt: Number(id.replace(/\D/g, '')) || 1,
  row,
  type: 'event',
});

describe('placement rules', () => {
  it('requires a later date than every adjacent card, including duplicate Event cards', () => {
    const played = [{ ...card('a', 0, 0), number: 1950 }];
    const position = { column: 1, row: 0 };

    for (const number of [1900, 1950]) {
      expect(
        isValidPlacement(played, position, {
          id: 'red',
          name: 'timeline-origin',
          number,
          type: 'event',
        }),
      ).toBe(false);
    }

    const later = {
      id: 'red',
      name: 'timeline-origin' as const,
      number: 1960,
      type: 'event' as const,
    };

    expect(isValidPlacement(played, position, later)).toBe(true);

    const merge = [...played, { ...card('b', -1, 1), number: 1970 }];

    expect(isValidPlacement(merge, position, later)).toBe(false);
    expect(
      getAvailablePositions(played, { ...later, number: 1950 }),
    ).not.toContainEqual(position);
  });

  it('allows each side of the initial card', () => {
    const played = [card('center', 0, 0)];

    expect(getAvailablePositions(played)).toStrictEqual(
      expect.arrayContaining([
        { column: 0, row: -1 },
        { column: -1, row: 0 },
        { column: 1, row: 0 },
        { column: 0, row: 1 },
      ]),
    );
  });

  it('allows a perpendicular merge but blocks a head-to-head merge', () => {
    const perpendicular = [card('top', -1, 0), card('left', 0, -1)];
    const opposing = [card('top', -1, 0), card('bottom', 1, 0)];

    expect(
      wouldCreateHeadToHeadMerge(perpendicular, { column: 0, row: 0 }),
    ).toBe(false);
    expect(isValidPlacement(perpendicular, { column: 0, row: 0 })).toBe(true);
    expect(wouldCreateHeadToHeadMerge(opposing, { column: 0, row: 0 })).toBe(
      true,
    );
    expect(isValidPlacement(opposing, { column: 0, row: 0 })).toBe(false);
  });

  it('blocks completing a 2×2 square', () => {
    const played = [card('a', 0, 0), card('b', 1, 0), card('c', 0, 1)];

    expect(wouldCreateSquare(played, { column: 1, row: 1 })).toBe(true);
    expect(isValidPlacement(played, { column: 1, row: 1 })).toBe(false);
  });
});

describe('card game state transitions', () => {
  it('deals five cards to each player and leaves thirty-six in the deck', () => {
    const G = CardGame.setup!({
      ctx: { numPlayers: 2 },
      random: {
        Shuffle: <T>(cards: T[]) => cards,
      },
    } as never);

    expect(G.hands['0']).toHaveLength(5);
    expect(G.hands['1']).toHaveLength(5);
    expect(G.deck).toHaveLength(36);
    expect(G.startingPlayer).toBe('0');
    expect(G.played).toStrictEqual([
      expect.objectContaining({
        id: 'starting-0',
        number: 0,
        owner: 'neutral',
      }),
    ]);
    expect(new Set([...G.hands['0'], ...G.hands['1'], ...G.deck]).size).toBe(
      46,
    );

    const deck = [...G.hands['0'], ...G.hands['1'], ...G.deck];

    expect(deck.filter((card) => card.type === 'event')).toHaveLength(30);
    expect(deck.filter((card) => card.type === 'command')).toHaveLength(16);
    expect(new Set(deck.map((card) => card.id)).size).toBe(46);

    for (let date = 1900; date <= 1990; date += 10) {
      expect(deck.filter((card) => card.number === date)).toHaveLength(3);
    }
  });

  const makeState = (): CardGameState => ({
    actionsThisTurn: 0,
    deck: [
      {
        id: 'event-c-3',
        name: 'timeline-origin',
        number: 3,
        type: 'event' as const,
      },
    ],
    discarded: [],
    freeActionsEnabled: true,
    hands: {
      '0': [
        {
          id: 'event-a-1',
          name: 'timeline-origin',
          number: 1,
          type: 'event' as const,
        },
        {
          id: 'event-b-2',
          name: 'timeline-origin',
          number: 2,
          type: 'event' as const,
        },
      ],
      '1': [] as Card[],
    },
    moveUndoHistory: [],
    nextPlacementOrder: 1,
    pending: null,
    pendingSnapshot: null,
    played: [
      {
        ...card('start', 0, 0),
        id: 'starting-0',
        number: 0,
        owner: 'neutral' as const,
        placedAt: 0,
      },
    ],
    playerIds: ['0', '1'],
    round: 1,
    roundOver: false,
    roundScores: [],
    startingPlayer: '0',
    testFuture: [],
    testHistory: [],
    undoBlocked: false,
  });

  it('keeps a played card pending until confirmation without drawing', () => {
    const G = makeState();
    const playCard = CardGame.moves!.playCard as unknown as PlayCardMove;
    const confirmPlacement = CardGame.moves!
      .confirmPlacement as unknown as ConfirmMove;
    let endedTurn = false;

    playCard({ ctx: { currentPlayer: '0' }, G }, 'event-a-1', {
      column: 1,
      row: 0,
    });

    expect(G.pending?.id).toBe('event-a-1');
    expect(G.hands['0']).toHaveLength(2);

    confirmPlacement({
      ctx: { currentPlayer: '0' },
      events: {
        endTurn: () => {
          endedTurn = true;
        },
      },
      G,
    });

    expect(G.pending).toBeNull();
    expect(G.played).toHaveLength(2);
    expect(G.hands['0'].map((item) => item.id)).toStrictEqual(['event-b-2']);
    expect(G.deck).toHaveLength(1);
    expect(endedTurn).toBe(false);
    expect(G.actionsThisTurn).toBe(1);
  });

  it('restores a confirmed play with undo and redo', () => {
    const G = makeState();
    const playCard = CardGame.moves!.playCard as unknown as PlayCardMove;
    const confirmPlacement = CardGame.moves!
      .confirmPlacement as unknown as ConfirmMove;
    const undoTest = CardGame.moves!.undoTest as unknown as HistoryMove;
    const redoTest = CardGame.moves!.redoTest as unknown as HistoryMove;
    const events = { endTurn: () => undefined };

    playCard({ ctx: { currentPlayer: '0' }, G }, 'event-a-1', {
      column: 1,
      row: 0,
    });
    confirmPlacement({ ctx: { currentPlayer: '0' }, events, G });

    expect(G.played).toHaveLength(2);

    undoTest({ ctx: { currentPlayer: '1' }, events, G });

    expect(G.played).toHaveLength(1);
    expect(G.deck).toHaveLength(1);

    redoTest({ ctx: { currentPlayer: '0' }, events, G });

    expect(G.played).toHaveLength(2);
    expect(G.deck).toHaveLength(1);
  });

  it('skips an empty hand when choosing the next player', () => {
    const G = makeState();

    G.deck = [];
    G.hands['0'] = [
      { id: 'event-a-1', name: 'timeline-origin', number: 1, type: 'event' },
    ];
    G.hands['1'] = [
      { id: 'event-b-2', name: 'timeline-origin', number: 2, type: 'event' },
    ];

    const playCard = CardGame.moves!.playCard as unknown as PlayCardMove;
    const confirmPlacement = CardGame.moves!
      .confirmPlacement as unknown as ConfirmMove;
    let nextTurn: EndTurnOptions | undefined;

    playCard({ ctx: { currentPlayer: '1' }, G }, 'event-b-2', {
      column: 1,
      row: 0,
    });
    confirmPlacement({
      ctx: { currentPlayer: '1' },
      events: {
        endTurn: (options) => {
          nextTurn = options;
        },
      },
      G,
    });

    expect(G.hands['1']).toHaveLength(0);
    expect(G.hands['0']).toHaveLength(1);
    expect(nextTurn).toStrictEqual({ next: '0' });
  });
});
