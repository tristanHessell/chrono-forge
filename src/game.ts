import type { Game } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';

import { loadCardCatalog } from './cardCatalog';
import { isValidPlacement, positionKey, withPlacedEvent } from './gameRules';
import { applyManipulation } from './manipulationRules';
import { calculateScores } from './scoring';

export {
  areAdjacent,
  getAvailablePositions,
  isValidPlacement,
  positionKey,
  wouldCreateHeadToHeadMerge,
  wouldCreateSquare,
} from './gameRules';

export type CardEffect = 'draw-one' | 'timeline-1900-bonus';
export type EventCategory = 'political' | 'technological' | 'environmental';
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
export type ManipulationAction =
  'time-jump' | 'time-swap' | 'take-control' | 'remove-event';

export type EventCard = {
  id: string;
  type: 'event';
  // Only the neutral starting card has no category.
  category?: EventCategory;
  /**
   * The id for the intl message corresponding to this event's name.
   */
  name?: EventName;
  number: number;
  effect?: CardEffect;
};

export type ManipulationCard = {
  id: string;
  type: 'manipulation';
  action: ManipulationAction;
  number?: never;
  category?: never;
  effect?: never;
};

export type Card = EventCard | ManipulationCard;

export type PlayerId = '0' | '1' | '2' | '3';
export type CardOwner = PlayerId | 'neutral';

export type PlacedCard = EventCard & {
  row: number;
  column: number;
  owner: CardOwner;
  placedAt: number;
  removed?: boolean;
};

export type CardPosition = {
  row: number;
  column: number;
};

export type CardGameState = {
  actionsThisTurn: number;
  discarded: Card[];
  hands: Record<string, Card[]>;
  playerIds: PlayerId[];
  round: number;
  roundScores: Record<string, number>[];
  deck: Card[];
  played: PlacedCard[];
  pending: PlacedCard | null;
  startingPlayer: PlayerId;
  roundOver: boolean;
  nextPlacementOrder: number;
  testHistory: CardGameSnapshot[];
  testFuture: CardGameSnapshot[];
  pendingSnapshot: CardGameSnapshot | null;
};

type CardGameSnapshot = {
  actionsThisTurn: number;
  currentPlayer: string;
  discarded: Card[];
  hands: Record<string, Card[]>;
  round: number;
  roundScores: Record<string, number>[];
  deck: Card[];
  played: PlacedCard[];
  pending: PlacedCard | null;
  startingPlayer: PlayerId;
  roundOver: boolean;
  nextPlacementOrder: number;
};

const HAND_SIZE = 5;

const snapshotGame = (
  G: CardGameState,
  currentPlayer: string,
): CardGameSnapshot => ({
  actionsThisTurn: G.actionsThisTurn,
  currentPlayer,
  discarded: G.discarded.map((card) => ({ ...card })),
  hands: Object.fromEntries(
    Object.entries(G.hands).map(([id, hand]) => [
      id,
      hand.map((card) => ({ ...card })),
    ]),
  ),
  round: G.round,
  roundScores: (G.roundScores ?? []).map((scores) => ({ ...scores })),
  deck: G.deck.map((card) => ({ ...card })),
  played: G.played.map((card) => ({ ...card })),
  pending: G.pending ? { ...G.pending } : null,
  startingPlayer: G.startingPlayer,
  roundOver: G.roundOver,
  nextPlacementOrder: G.nextPlacementOrder,
});

const restoreSnapshot = (G: CardGameState, snapshot: CardGameSnapshot) => {
  G.actionsThisTurn = snapshot.actionsThisTurn;
  G.discarded = snapshot.discarded;
  G.hands = snapshot.hands;
  G.round = snapshot.round;
  G.roundScores = (snapshot.roundScores ?? []).map((scores) => ({ ...scores }));
  G.deck = snapshot.deck;
  G.played = snapshot.played;
  G.pending = snapshot.pending;
  G.startingPlayer = snapshot.startingPlayer;
  G.roundOver = snapshot.roundOver;
  G.nextPlacementOrder = snapshot.nextPlacementOrder;
};

const advanceTurn = (
  G: CardGameState,
  currentPlayer: string,
  endTurn: (options?: { next: string }) => void,
) => {
  G.actionsThisTurn += 1;

  const hand = G.hands[currentPlayer];

  if (G.actionsThisTurn < 2 && hand.length > 0) {
    return;
  }

  const drawCount = Math.max(0, HAND_SIZE - hand.length);

  hand.push(...G.deck.splice(0, drawCount));
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
  const nextPlayer = Array.from(
    { length: G.playerIds.length },
    (_, index) => G.playerIds[(currentIndex + index + 1) % G.playerIds.length],
  ).find((id) => G.hands[id].length > 0)!;

  if (G.playerIds.indexOf(nextPlayer) <= currentIndex) {
    const scores = calculateScores(G.played);

    G.roundScores.push(
      Object.fromEntries(G.playerIds.map((id) => [id, scores[id] ?? 0])),
    );
    G.round += 1;
  }

  endTurn({ next: nextPlayer });
};

export const CardGame: Game<CardGameState> = {
  name: 'card-table',
  minPlayers: 2,
  maxPlayers: 4,

  setup: ({ random, ctx }) => {
    const catalog = loadCardCatalog();
    const deck = random.Shuffle(catalog.deck);
    const numPlayers = ctx?.numPlayers ?? 2;

    if (!Number.isInteger(numPlayers) || numPlayers < 2 || numPlayers > 4) {
      throw new Error('Choose between two and four players.');
    }

    const playerIds = (['0', '1', '2', '3'] as PlayerId[]).slice(0, numPlayers);

    return {
      actionsThisTurn: 0,
      discarded: [],
      hands: Object.fromEntries(
        playerIds.map((id) => [id, deck.splice(0, HAND_SIZE)]),
      ),
      playerIds,
      round: 1,
      roundScores: [],
      deck,
      played: [
        {
          ...catalog.startingCard,
          row: 0,
          column: 0,
          owner: 'neutral',
          placedAt: 0,
        },
      ],
      pending: null,
      startingPlayer: '0',
      roundOver: false,
      nextPlacementOrder: 1,
      testHistory: [],
      testFuture: [],
      pendingSnapshot: null,
    };
  },

  moves: {
    manipulate: (
      { G, ctx, events },
      cardId: string,
      targetId: string,
      destination?: CardPosition | string,
    ) => {
      if (G.roundOver || G.pending) {
        return;
      }

      const hand = G.hands[ctx.currentPlayer];
      const index = hand.findIndex((card) => card.id === cardId);
      const card = hand[index];

      if (card?.type !== 'manipulation') {
        return;
      }

      const played = applyManipulation(
        G.played,
        card.action,
        targetId,
        ctx.currentPlayer as PlayerId,
        destination,
      );

      if (!played) {
        return;
      }

      G.testHistory.push(snapshotGame(G, ctx.currentPlayer));
      G.testFuture = [];
      for (const overwritten of G.played.filter(
        (existing) => !played.some((card) => card.id === existing.id),
      )) {
        const { id, type, number, category, effect } = overwritten;

        G.discarded.push({
          id,
          type,
          number,
          ...(category ? { category } : {}),
          ...(effect ? { effect } : {}),
        });
      }
      G.played = played;
      G.nextPlacementOrder = Math.max(
        G.nextPlacementOrder,
        ...played.map((event) => event.placedAt + 1),
      );
      G.discarded.push(...hand.splice(index, 1));
      advanceTurn(G, ctx.currentPlayer, events.endTurn);
    },
    discardCard: ({ G, ctx, events }, cardId: string) => {
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
      G.testHistory.push(beforeDiscard);
      G.testFuture = [];
      advanceTurn(G, ctx.currentPlayer, events.endTurn);
    },
    playCard: ({ G, ctx }, cardId: string, position: CardPosition) => {
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
        row: position.row,
        column: position.column,
        owner,
        placedAt: G.nextPlacementOrder,
      };
    },

    replacePendingCard: (
      { G, ctx },
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
        owner,
        row: position?.row ?? G.pending.row,
        column: position?.column ?? G.pending.column,
        placedAt: G.pending.placedAt,
      };
    },

    movePendingCard: ({ G, ctx }, position: CardPosition) => {
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

    returnPendingCard: ({ G, ctx }) => {
      const activeOwner = ctx.currentPlayer as PlayerId;

      if (G.roundOver || G.pending?.owner !== activeOwner) {
        return;
      }

      G.pending = null;
      G.pendingSnapshot = null;
    },

    confirmPlacement: ({ G, ctx, events }) => {
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
        const { id, type, number, category, effect } = overwritten;

        G.discarded.push({
          id,
          type,
          number,
          ...(category ? { category } : {}),
          ...(effect ? { effect } : {}),
        });
      }

      G.played = withPlacedEvent(G.played, playedCard);
      G.pending = null;
      G.nextPlacementOrder += 1;
      G.testHistory.push(beforePlay);
      G.testFuture = [];
      G.pendingSnapshot = null;

      if (playedCard.effect === 'draw-one') {
        const drawnCard = G.deck.shift();

        if (drawnCard) {
          const hand = G.hands[activeOwner];

          hand.push(drawnCard);
        }
      }

      advanceTurn(G, ctx.currentPlayer, events.endTurn);
    },

    undoTest: ({ G, ctx, events }) => {
      const previous = G.testHistory.pop();

      if (!previous) {
        return;
      }

      G.testFuture.unshift(snapshotGame(G, ctx.currentPlayer));
      restoreSnapshot(G, previous);
      G.pendingSnapshot = null;

      if (previous.currentPlayer !== ctx.currentPlayer) {
        events.endTurn({ next: previous.currentPlayer });
      }
    },

    redoTest: ({ G, ctx, events }) => {
      const next = G.testFuture.shift();

      if (!next) {
        return;
      }

      G.testHistory.push(snapshotGame(G, ctx.currentPlayer));
      restoreSnapshot(G, next);
      G.pendingSnapshot = null;

      if (next.currentPlayer !== ctx.currentPlayer) {
        events.endTurn({ next: next.currentPlayer });
      }
    },
  },

  turn: {
    order: TurnOrder.DEFAULT,
  },
};
