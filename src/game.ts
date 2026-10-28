import type { Game, MoveFn } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';

import { loadCardCatalog } from './cardCatalog';
import { applyCommand } from './commandRules';
import { isValidPlacement, positionKey, withPlacedEvent } from './gameRules';
import { calculateScores } from './scoring';

export {
  areAdjacent,
  getAvailablePositions,
  isValidPlacement,
  positionKey,
  wouldCreateHeadToHeadMerge,
  wouldCreateSquare,
} from './gameRules';

export type CardEffect = 'draw-one' | 'free-action' | 'timeline-1900-bonus';
export type EventCategory = 'environmental' | 'political' | 'technological';
export type EventName =
  | 'assembly-lines'
  | 'atomic-age'
  | 'civil-rights'
  | 'climate-summit'
  | 'cold-war'
  | 'conservation-movement'
  | 'democratic-change'
  | 'detente'
  | 'dust-bowl'
  | 'earth-day'
  | 'european-union'
  | 'global-conflict'
  | 'green-revolution'
  | 'imperial-alliances'
  | 'internet-expansion'
  | 'microprocessor'
  | 'moon-landing'
  | 'national-parks'
  | 'new-deal'
  | 'ozone-hole'
  | 'personal-computers'
  | 'powered-flight'
  | 'radar-discovery'
  | 'radio-age'
  | 'silent-spring'
  | 'smog-crisis'
  | 'space-race'
  | 'suffrage'
  | 'timeline-origin'
  | 'united-nations'
  | 'wildlife-refuges';
export type CommandAction =
  'remove-event' | 'take-control' | 'time-jump' | 'time-swap';

export type EventCard = {
  // Only the neutral starting card has no category.
  category?: EventCategory;
  effects?: readonly CardEffect[];
  id: string;
  /**
   * The id for the intl message corresponding to this event's name.
   */
  name: EventName;
  number: number;
  type: 'event';
};

export type CommandCard = {
  action: CommandAction;
  category?: never;
  effects?: never;
  id: string;
  number?: never;
  type: 'command';
};

export type Card = CommandCard | EventCard;

export type PlayerId = '0' | '1' | '2' | '3';
export type CardOwner = 'neutral' | PlayerId;

export type PlacedCard = EventCard & {
  column: number;
  owner: CardOwner;
  placedAt: number;
  removed?: boolean;
  row: number;
};

export type CardPosition = {
  column: number;
  row: number;
};

export type CardGameState = {
  actionsThisTurn: number;
  deck: Card[];
  discarded: Card[];
  freeActionsEnabled: boolean;
  hands: Record<string, Card[]>;
  moveUndoHistory: CardGameSnapshot[];
  nextPlacementOrder: number;
  pending: null | PlacedCard;
  pendingSnapshot: CardGameSnapshot | null;
  played: PlacedCard[];
  playerIds: PlayerId[];
  round: number;
  roundOver: boolean;
  roundScores: Record<string, number>[];
  startingPlayer: PlayerId;
  testFuture: CardGameSnapshot[];
  testHistory: CardGameSnapshot[];
  undoBlocked: boolean;
};

export const canUndoMove = (G: CardGameState) =>
  !G.pending && !G.undoBlocked && G.moveUndoHistory.length > 0;

type CardGameSnapshot = {
  actionsThisTurn: number;
  currentPlayer: string;
  deck: Card[];
  discarded: Card[];
  freeActionsEnabled: boolean;
  hands: Record<string, Card[]>;
  nextPlacementOrder: number;
  pending: null | PlacedCard;
  played: PlacedCard[];
  round: number;
  roundOver: boolean;
  roundScores: Record<string, number>[];
  startingPlayer: PlayerId;
};

const HAND_SIZE = 5;

const snapshotGame = (
  G: CardGameState,
  currentPlayer: string,
): CardGameSnapshot => ({
  actionsThisTurn: G.actionsThisTurn,
  currentPlayer,
  deck: G.deck.map((card) => ({ ...card })),
  discarded: G.discarded.map((card) => ({ ...card })),
  freeActionsEnabled: G.freeActionsEnabled,
  hands: Object.fromEntries(
    Object.entries(G.hands).map(([id, hand]) => [
      id,
      hand.map((card) => ({ ...card })),
    ]),
  ),
  nextPlacementOrder: G.nextPlacementOrder,
  pending: G.pending ? { ...G.pending } : null,
  played: G.played.map((card) => ({ ...card })),
  round: G.round,
  roundOver: G.roundOver,
  roundScores: G.roundScores.map((scores) => ({ ...scores })),
  startingPlayer: G.startingPlayer,
});

const restoreSnapshot = (G: CardGameState, snapshot: CardGameSnapshot) => {
  G.actionsThisTurn = snapshot.actionsThisTurn;
  G.discarded = snapshot.discarded;
  G.freeActionsEnabled = snapshot.freeActionsEnabled;
  G.hands = snapshot.hands;
  G.round = snapshot.round;
  G.roundScores = snapshot.roundScores.map((scores) => ({ ...scores }));
  G.deck = snapshot.deck;
  G.played = snapshot.played;
  G.pending = snapshot.pending;
  G.startingPlayer = snapshot.startingPlayer;
  G.roundOver = snapshot.roundOver;
  G.nextPlacementOrder = snapshot.nextPlacementOrder;
};

const clearMoveHistory = (G: CardGameState) => {
  G.testFuture = [];
  G.moveUndoHistory = [];
  G.undoBlocked = true;
};

const recordMoveForUndo = (
  G: CardGameState,
  currentPlayer: string,
  snapshot: CardGameSnapshot,
) => {
  G.testFuture = [];
  G.testHistory.push(snapshot);

  if (currentPlayer !== '0') {
    clearMoveHistory(G);

    return;
  }

  G.moveUndoHistory.push(snapshot);
  G.undoBlocked = false;
};

const advanceTurn = (
  G: CardGameState,
  currentPlayer: string,
  endTurn: (options?: { next: string }) => void,
  countsAsAction = true,
) => {
  if (countsAsAction) {
    G.actionsThisTurn += 1;
  }

  const hand = G.hands[currentPlayer];

  if (G.actionsThisTurn < 2 && hand.length > 0) {
    return;
  }

  const drawCount = Math.max(0, HAND_SIZE - hand.length);
  const drawnCards = G.deck.splice(0, drawCount);

  hand.push(...drawnCards);

  if (drawnCards.length > 0) {
    clearMoveHistory(G);
  } else {
    G.undoBlocked = false;
  }

  G.actionsThisTurn = 0;

  if (G.playerIds.every((id) => G.hands[id].length === 0)) {
    G.roundOver = true;

    const scores = calculateScores(G.played);

    G.roundScores.push(
      Object.fromEntries(G.playerIds.map((id) => [id, scores[id] ?? 0])),
    );

    return;
  }

  const currentIndex = G.playerIds.indexOf(currentPlayer as PlayerId);
  const startingIndex = G.playerIds.indexOf(G.startingPlayer);
  const nextPlayer = Array.from(
    { length: G.playerIds.length },
    (_, index) => G.playerIds[(currentIndex + index + 1) % G.playerIds.length],
  ).find((id) => G.hands[id].length > 0)!;
  const currentTurnIndex =
    (currentIndex - startingIndex + G.playerIds.length) % G.playerIds.length;
  const nextTurnIndex =
    (G.playerIds.indexOf(nextPlayer) - startingIndex + G.playerIds.length) %
    G.playerIds.length;

  if (nextTurnIndex <= currentTurnIndex) {
    const scores = calculateScores(G.played);

    G.roundScores.push(
      Object.fromEntries(G.playerIds.map((id) => [id, scores[id] ?? 0])),
    );
    G.round += 1;
  }

  endTurn({ next: nextPlayer });
};

const undoMove: MoveFn<CardGameState> = ({ ctx, events, G }) => {
  if (!canUndoMove(G)) {
    return;
  }

  const previous = G.moveUndoHistory.pop();

  if (!previous) {
    return;
  }

  G.testFuture.unshift(snapshotGame(G, ctx.currentPlayer));
  G.testHistory.pop();
  restoreSnapshot(G, previous);
  G.undoBlocked = false;
  G.pendingSnapshot = null;

  if (previous.currentPlayer !== ctx.currentPlayer) {
    events.endTurn({ next: previous.currentPlayer });
  }
};

const redoMove: MoveFn<CardGameState> = ({ ctx, events, G }) => {
  if (G.pending) {
    return;
  }

  const next = G.testFuture.shift();

  if (!next) {
    return;
  }

  const snapshot = snapshotGame(G, ctx.currentPlayer);

  G.testHistory.push(snapshot);
  G.moveUndoHistory.push(snapshot);
  restoreSnapshot(G, next);
  G.undoBlocked = false;
  G.pendingSnapshot = null;

  if (next.currentPlayer !== ctx.currentPlayer) {
    events.endTurn({ next: next.currentPlayer });
  }
};

export const CardGame: Game<CardGameState> = {
  maxPlayers: 4,
  minPlayers: 2,
  moves: {
    confirmPlacement: ({ ctx, events, G }) => {
      const activeOwner = ctx.currentPlayer as PlayerId;

      if (G.roundOver || !G.pending || G.pending.owner !== activeOwner) {
        return;
      }
      if (!isValidPlacement(G.played, G.pending, G.pending)) {
        return;
      }

      const playedCard = G.pending;
      const beforePlay =
        G.pendingSnapshot ?? snapshotGame(G, ctx.currentPlayer);

      G.hands[activeOwner] = G.hands[activeOwner].filter(
        (card) => card.id !== playedCard.id,
      );

      const overwritten = G.played.find(
        (card) => positionKey(card) === positionKey(playedCard),
      );

      if (overwritten) {
        const { category, effects, id, name, number, type } = overwritten;

        G.discarded.push({
          id,
          name,
          number,
          type,
          ...(category ? { category } : {}),
          ...(effects ? { effects } : {}),
        });
      }

      G.played = withPlacedEvent(G.played, playedCard);
      G.pending = null;
      G.nextPlacementOrder += 1;
      recordMoveForUndo(G, ctx.currentPlayer, beforePlay);
      G.pendingSnapshot = null;

      for (const effect of playedCard.effects ?? []) {
        if (effect === 'draw-one') {
          const drawnCard = G.deck.shift();

          if (drawnCard) {
            G.hands[activeOwner].push(drawnCard);
            G.testFuture = [];
            G.moveUndoHistory = [];
            G.undoBlocked = true;
          }
        }
      }

      advanceTurn(
        G,
        ctx.currentPlayer,
        (options) => {
          events.endTurn(options);
        },
        !playedCard.effects?.includes('free-action') || !G.freeActionsEnabled,
      );
    },
    discardCard: ({ ctx, events, G }, cardId: string) => {
      if (G.roundOver) {
        return;
      }

      const hand = G.hands[ctx.currentPlayer];
      const index = hand.findIndex((card) => card.id === cardId);

      if (index < 0) {
        return;
      }

      const beforeDiscard =
        G.pendingSnapshot ?? snapshotGame(G, ctx.currentPlayer);
      const [card] = hand.splice(index, 1);

      G.discarded.push(card);
      G.pending = null;
      G.pendingSnapshot = null;
      recordMoveForUndo(G, ctx.currentPlayer, beforeDiscard);
      advanceTurn(G, ctx.currentPlayer, (options) => {
        events.endTurn(options);
      });
    },
    manipulate: (
      { ctx, events, G },
      cardId: string,
      targetId: string,
      destination?: CardPosition | string,
    ) => {
      if (G.roundOver || G.pending) {
        return;
      }

      const hand = G.hands[ctx.currentPlayer];
      const index = hand.findIndex((card) => card.id === cardId);

      if (index < 0) {
        return;
      }

      const card = hand[index];

      if (card.type !== 'command') {
        return;
      }

      const played = applyCommand(
        G.played,
        card.action,
        targetId,
        ctx.currentPlayer as PlayerId,
        destination,
      );

      if (!played) {
        return;
      }

      recordMoveForUndo(
        G,
        ctx.currentPlayer,
        snapshotGame(G, ctx.currentPlayer),
      );
      for (const overwritten of G.played.filter(
        (existing) => !played.some((card) => card.id === existing.id),
      )) {
        const { category, effects, id, name, number, type } = overwritten;

        G.discarded.push({
          id,
          name,
          number,
          type,
          ...(category ? { category } : {}),
          ...(effects ? { effects } : {}),
        });
      }
      G.played = played;
      G.nextPlacementOrder = Math.max(
        G.nextPlacementOrder,
        ...played.map((event) => event.placedAt + 1),
      );
      G.discarded.push(...hand.splice(index, 1));
      advanceTurn(G, ctx.currentPlayer, (options) => {
        events.endTurn(options);
      });
    },

    movePendingCard: ({ ctx, G }, position: CardPosition) => {
      const activeOwner = ctx.currentPlayer as PlayerId;

      if (
        !G.pending ||
        G.pending.owner !== activeOwner ||
        G.played.length === 0
      ) {
        return;
      }
      if (G.roundOver) {
        return;
      }

      if (!isValidPlacement(G.played, position, G.pending)) {
        return;
      }

      G.pending.row = position.row;
      G.pending.column = position.column;
    },

    playCard: ({ ctx, G }, cardId: string, position: CardPosition) => {
      const owner = ctx.currentPlayer as PlayerId;
      const sourceHand = G.hands[owner];
      const card = sourceHand.find((candidate) => candidate.id === cardId);

      if (
        G.roundOver ||
        !card ||
        card.type !== 'event' ||
        G.pending ||
        !isValidPlacement(G.played, position, card)
      ) {
        return;
      }

      G.pendingSnapshot = snapshotGame(G, ctx.currentPlayer);
      G.testFuture = [];

      G.pending = {
        ...card,
        column: position.column,
        owner,
        placedAt: G.nextPlacementOrder,
        row: position.row,
      };
    },

    redoTest: redoMove,

    replacePendingCard: (
      { ctx, G },
      cardId: string,
      position?: CardPosition,
    ) => {
      if (G.roundOver || !G.pending) {
        return;
      }

      const owner = ctx.currentPlayer as PlayerId;
      const sourceHand = G.hands[owner];
      const replacement = sourceHand.find((card) => card.id === cardId);

      if (
        !replacement ||
        replacement.type !== 'event' ||
        G.pending.owner !== owner
      ) {
        return;
      }

      if (!isValidPlacement(G.played, position ?? G.pending, replacement)) {
        return;
      }

      G.pending = {
        ...replacement,
        column: position?.column ?? G.pending.column,
        owner,
        placedAt: G.pending.placedAt,
        row: position?.row ?? G.pending.row,
      };
    },

    returnPendingCard: ({ ctx, G }) => {
      const activeOwner = ctx.currentPlayer as PlayerId;

      if (G.roundOver || G.pending?.owner !== activeOwner) {
        return;
      }

      G.pending = null;
      G.pendingSnapshot = null;
    },
    undoTest: undoMove,
  },

  name: 'card-table',

  setup: ({ ctx, random }) => {
    const catalog = loadCardCatalog();
    const deck = random.Shuffle(catalog.deck);
    const numPlayers = ctx.numPlayers;

    if (!Number.isInteger(numPlayers) || numPlayers < 2 || numPlayers > 4) {
      throw new Error('Choose between two and four players.');
    }

    const playerIds = (['0', '1', '2', '3'] as PlayerId[]).slice(0, numPlayers);

    return {
      actionsThisTurn: 0,
      deck,
      discarded: [],
      freeActionsEnabled: true,
      hands: Object.fromEntries(
        playerIds.map((id) => [id, deck.splice(0, HAND_SIZE)]),
      ),
      moveUndoHistory: [],
      nextPlacementOrder: 1,
      pending: null,
      pendingSnapshot: null,
      played: [
        {
          ...catalog.startingCard,
          column: 0,
          owner: 'neutral',
          placedAt: 0,
          row: 0,
        },
      ],
      playerIds,
      round: 1,
      roundOver: false,
      roundScores: [],
      startingPlayer: '0',
      testFuture: [],
      testHistory: [],
      undoBlocked: false,
    };
  },

  turn: {
    activePlayers: { currentPlayer: 'normal', others: 'undoWindow' },
    order: {
      ...TurnOrder.DEFAULT,
      first: ({ G }) => G.playerIds.indexOf(G.startingPlayer),
    },
    stages: {
      normal: {},
      undoWindow: {
        moves: { redoTest: redoMove, undoTest: undoMove },
      },
    },
  },
};

CardGame.turn!.stages!.undoWindow.moves = CardGame.moves;

export function createCardGame(
  startingPlayer: PlayerId,
  freeActionsEnabled = true,
): Game<CardGameState> {
  return {
    ...CardGame,
    setup: (context) => ({
      ...CardGame.setup!(context),
      freeActionsEnabled,
      startingPlayer,
    }),
  };
}
