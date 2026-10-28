import type { LogEntry } from 'boardgame.io';
import { Client } from 'boardgame.io/client';

import {
  CardGame,
  type CardGameState,
  createCardGame,
  type PlayerId,
} from './game';
import type { PlayerCount } from './playerCount';

const RULES_VERSION = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCardPosition(
  value: unknown,
): value is { column: number; row: number } {
  return (
    isRecord(value) &&
    Number.isInteger(value.row) &&
    Number.isInteger(value.column)
  );
}

export type GameLog = {
  actions: LogEntry['action'][];
  numPlayers: PlayerCount;
  rulesVersion: 2 | typeof RULES_VERSION;
  seed: string;
  startingPlayer: PlayerId;
  version: 2;
};

export function currentGameLog(
  seed: string,
  G: CardGameState,
  currentPlayer: string,
): GameLog {
  const states = [...G.testHistory, { ...G, currentPlayer }];
  const actions: LogEntry['action'][] = [];

  for (let index = 0; index < states.length - 1; index += 1) {
    const before = states[index];
    const after = states[index + 1];
    const used = before.hands[before.currentPlayer].find(
      (card) =>
        !after.hands[before.currentPlayer].some(
          (remaining) => remaining.id === card.id,
        ),
    );

    if (!used) {
      throw new Error(
        'Cannot identify the card used in the current game history.',
      );
    }

    let type = 'discardCard';
    let args: unknown[] = [used.id];

    if (used.type === 'event') {
      const placed = after.played.find((card) => card.id === used.id);

      if (placed) {
        type = 'playEvent';
        args = [used.id, { column: placed.column, row: placed.row }];
      }
    } else {
      const changed = before.played.filter((card) => {
        const next = after.played.find((candidate) => candidate.id === card.id);

        return (
          next &&
          (card.row !== next.row ||
            card.column !== next.column ||
            card.owner !== next.owner ||
            card.removed !== next.removed)
        );
      });

      // A discarded Manipulation leaves the board unchanged.
      if (changed.length) {
        const target = changed[0];
        const moved = after.played.find((card) => card.id === target.id)!;

        type = 'manipulate';
        args = [used.id, target.id];

        if (used.action === 'time-jump') {
          args.push({ column: moved.column, row: moved.row });
        } else if (used.action === 'time-swap') {
          args.push(changed[1].id);
        }
      }
    }

    actions.push({
      payload: { args, playerID: before.currentPlayer, type },
      type: 'MAKE_MOVE',
    });
  }

  return {
    actions,
    numPlayers: G.playerIds.length as PlayerCount,
    rulesVersion: G.freeActionsEnabled ? RULES_VERSION : 2,
    seed,
    startingPlayer: G.startingPlayer,
    version: 2,
  };
}

type ReplayClient = ReturnType<typeof Client<CardGameState>>;

const draftMoves = [
  'playCard',
  'replacePendingCard',
  'movePendingCard',
  'returnPendingCard',
];

export function applyGameLogAction(
  client: ReplayClient,
  action: LogEntry['action'],
) {
  if (action.type === 'MAKE_MOVE' && action.payload.type === 'playEvent') {
    if (action.payload.playerID !== client.getState()!.ctx.currentPlayer) {
      throw new Error('Confirmed Event belongs to a different player turn.');
    }

    const [cardId, position] = action.payload.args as unknown[];

    if (typeof cardId !== 'string' || !isCardPosition(position)) {
      throw new Error('Invalid confirmed Event placement.');
    }

    client.moves.playCard(cardId, position);

    if (client.getState()!.G.pending?.id !== cardId) {
      throw new Error('Confirmed Event placement was rejected.');
    }

    client.moves.confirmPlacement();

    if (
      client.getState()!.G.pending ||
      !client.getState()!.G.played.some((card) => card.id === cardId)
    ) {
      throw new Error('Event confirmation was rejected.');
    }
  } else {
    client.store.dispatch(action);
  }
}

function confirmedActions(
  seed: string,
  numPlayers: PlayerCount,
  actions: LogEntry['action'][],
  startingPlayer: PlayerId,
  rulesVersion: GameLog['rulesVersion'] = RULES_VERSION,
): LogEntry['action'][] {
  const client = Client({
    debug: false,
    game: { ...createCardGame(startingPlayer, rulesVersion !== 2), seed },
    numPlayers,
  });
  const result: LogEntry['action'][] = [];
  const future: LogEntry['action'][] = [];

  try {
    for (const action of actions) {
      const before = client.getState()!;
      const pending = before.G.pending;

      applyGameLogAction(client, action);

      const isUndo =
        action.type === 'UNDO' ||
        (action.type === 'MAKE_MOVE' && action.payload.type === 'undoTest');
      const isRedo =
        action.type === 'REDO' ||
        (action.type === 'MAKE_MOVE' && action.payload.type === 'redoTest');

      if (isUndo || isRedo) {
        const after = client.getState()!;
        const changed =
          JSON.stringify([
            before.G.played,
            before.G.hands,
            before.G.deck,
            before.G.discarded,
            before.G.actionsThisTurn,
          ]) !==
          JSON.stringify([
            after.G.played,
            after.G.hands,
            after.G.deck,
            after.G.discarded,
            after.G.actionsThisTurn,
          ]);

        if (changed && isUndo) {
          const undone = result.pop();

          if (undone) {
            future.push(undone);
          }
        } else if (changed && isRedo) {
          const redone = future.pop();

          if (redone) {
            result.push(redone);
          }
        }

        continue;
      }
      if (
        action.type === 'MAKE_MOVE' &&
        action.payload.type === 'confirmPlacement'
      ) {
        if (
          pending &&
          !client.getState()!.G.pending &&
          client.getState()!.G.played.some((card) => card.id === pending.id)
        ) {
          result.push({
            ...action,
            payload: {
              ...action.payload,
              args: [pending.id, { column: pending.column, row: pending.row }],
              type: 'playEvent',
            },
          });
          future.length = 0;
        }
      } else if (!(
        action.type === 'MAKE_MOVE' && draftMoves.includes(action.payload.type)
      )) {
        result.push(action);
        future.length = 0;
      }
    }

    return result;
  } finally {
    client.stop();
  }
}

export function exportGameLog(
  seed: string,
  numPlayers: PlayerCount,
  entries: readonly LogEntry[] = [],
  startingPlayer: PlayerId = '0',
  rulesVersion: GameLog['rulesVersion'] = RULES_VERSION,
): string {
  // A move and its triggered events share a state ID. The move recreates
  // those events during replay, so retain only the first entry per ID.
  const seen = new Set<number>();
  const actions = entries
    .filter((entry) => {
      if (seen.has(entry._stateID)) {
        return false;
      }

      seen.add(entry._stateID);

      return !entry.automatic;
    })
    .map((entry) => ({
      ...entry.action,
      payload: {
        ...entry.action.payload,
        // Local replay never needs authentication credentials.
        credentials: undefined,
        playerID: entry.action.payload.playerID,
        ...(entry.action.type === 'GAME_EVENT'
          ? {
              args:
                entry.action.payload.args === undefined
                  ? []
                  : [entry.action.payload.args],
            }
          : {}),
      },
    }));

  return JSON.stringify(
    {
      actions: confirmedActions(
        seed,
        numPlayers,
        actions,
        startingPlayer,
        rulesVersion,
      ),
      numPlayers,
      rulesVersion,
      seed,
      startingPlayer,
      version: 2,
    } satisfies GameLog,
    null,
    2,
  );
}

export function parseGameLog(text: string): GameLog {
  if (text.length > 2_000_000) {
    throw new Error('The game log is too large.');
  }

  const parsed: unknown = JSON.parse(text);
  const isPlayerId = (value: unknown, count: unknown): value is PlayerId =>
    typeof value === 'string' &&
    ['0', '1', '2', '3'].includes(value) &&
    typeof count === 'number' &&
    Number(value) < count;

  if (
    !isRecord(parsed) ||
    (parsed.version !== 1 && parsed.version !== 2) ||
    (parsed.rulesVersion !== 2 && parsed.rulesVersion !== RULES_VERSION) ||
    (parsed.rulesVersion === RULES_VERSION &&
      !isPlayerId(parsed.startingPlayer, parsed.numPlayers)) ||
    typeof parsed.seed !== 'string' ||
    !parsed.seed ||
    parsed.seed.length > 200 ||
    (parsed.numPlayers !== 2 &&
      parsed.numPlayers !== 3 &&
      parsed.numPlayers !== 4) ||
    !Array.isArray(parsed.actions) ||
    parsed.actions.length > 10_000
  ) {
    throw new Error('Invalid or incompatible game log.');
  }

  const numPlayers = parsed.numPlayers;
  const rulesVersion = parsed.rulesVersion;
  const startingPlayer =
    parsed.rulesVersion === 2 ? '0' : (parsed.startingPlayer as PlayerId);
  const playerIds = Array.from({ length: numPlayers }, (_, index) =>
    String(index),
  );
  const actions: LogEntry['action'][] = [];
  const actionTypes = ['MAKE_MOVE', 'GAME_EVENT', 'UNDO', 'REDO'];

  for (const candidate of parsed.actions as unknown[]) {
    if (
      !isRecord(candidate) ||
      typeof candidate.type !== 'string' ||
      !actionTypes.includes(candidate.type) ||
      !isRecord(candidate.payload)
    ) {
      throw new Error('Invalid game log action.');
    }

    const payload = candidate.payload;

    if (
      (payload.playerID !== null &&
        payload.playerID !== undefined &&
        (typeof payload.playerID !== 'string' ||
          !playerIds.includes(payload.playerID))) ||
      ((candidate.type === 'MAKE_MOVE' || candidate.type === 'GAME_EVENT') &&
        (typeof payload.type !== 'string' || !Array.isArray(payload.args)))
    ) {
      throw new Error('Invalid game log action.');
    }

    actions.push(candidate as unknown as LogEntry['action']);
  }

  for (const action of actions) {
    if (action.type === 'MAKE_MOVE' || action.type === 'GAME_EVENT') {
      const names =
        action.type === 'MAKE_MOVE'
          ? parsed.version === 2
            ? ['playEvent', 'discardCard', 'manipulate', 'undoTest', 'redoTest']
            : Object.keys(CardGame.moves!)
          : [
              'endTurn',
              'endPhase',
              'endGame',
              'setPhase',
              'endStage',
              'setStage',
              'setActivePlayers',
            ];

      if (!names.includes(action.payload.type)) {
        throw new Error(
          `Unknown move or invalid arguments in game log: ${JSON.stringify(action)}.`,
        );
      }
    }
  }

  return {
    actions: confirmedActions(
      parsed.seed,
      numPlayers,
      actions,
      startingPlayer,
      rulesVersion,
    ),
    numPlayers,
    rulesVersion,
    seed: parsed.seed,
    startingPlayer,
    version: 2,
  };
}

export function replayGameLog(log: GameLog, steps = log.actions.length) {
  if (!Number.isInteger(steps) || steps < 0 || steps > log.actions.length) {
    throw new Error('Choose a valid action number.');
  }

  const client = Client({
    debug: false,
    game: {
      ...createCardGame(log.startingPlayer, log.rulesVersion !== 2),
      seed: log.seed,
    },
    numPlayers: log.numPlayers,
  });

  try {
    for (const [index, action] of log.actions.slice(0, steps).entries()) {
      const before = client.getState()!._stateID;

      applyGameLogAction(client, action);

      if (client.getState()!._stateID === before) {
        throw new Error(
          `Action ${index + 1} was rejected. The log may require a different game version.`,
        );
      }
    }

    return client;
  } catch (error) {
    client.stop();
    throw error;
  }
}
