import type { LogEntry } from 'boardgame.io';
import { Client } from 'boardgame.io/client';

import { CardGame, type CardGameState } from './game';
import type { PlayerCount } from './playerCount';

const RULES_VERSION = 2;

export type GameLog = {
  version: 2;
  rulesVersion: typeof RULES_VERSION;
  seed: string;
  numPlayers: PlayerCount;
  actions: LogEntry['action'][];
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
        args = [used.id, { row: placed.row, column: placed.column }];
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
          args.push({ row: moved.row, column: moved.column });
        } else if (used.action === 'time-swap') {
          args.push(changed[1].id);
        }
      }
    }
    actions.push({
      type: 'MAKE_MOVE',
      payload: { type, args, playerID: before.currentPlayer },
    } as LogEntry['action']);
  }

  return {
    version: 2,
    rulesVersion: RULES_VERSION,
    seed,
    numPlayers: G.playerIds.length as PlayerCount,
    actions,
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
    if (
      action.payload.playerID !== null &&
      action.payload.playerID !== client.getState()!.ctx.currentPlayer
    ) {
      throw new Error('Confirmed Event belongs to a different player turn.');
    }

    const [cardId, position] = action.payload.args;

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
): LogEntry['action'][] {
  const client = Client({
    game: { ...CardGame, seed },
    numPlayers,
    debug: false,
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
              type: 'playEvent',
              args: [pending.id, { row: pending.row, column: pending.column }],
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
        playerID: entry.action.payload.playerID ?? null,
        // Local replay never needs authentication credentials.
        credentials: undefined,
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
      version: 2,
      rulesVersion: RULES_VERSION,
      seed,
      numPlayers,
      actions: confirmedActions(seed, numPlayers, actions),
    } satisfies GameLog,
    null,
    2,
  );
}

export function parseGameLog(text: string): GameLog {
  if (text.length > 2_000_000) {
    throw new Error('The game log is too large.');
  }

  const data = JSON.parse(text) as Omit<GameLog, 'version'> & {
    version: 1 | 2;
  };

  if (
    !data ||
    ![1, 2].includes(data.version) ||
    data.rulesVersion !== RULES_VERSION ||
    typeof data.seed !== 'string' ||
    !data.seed ||
    data.seed.length > 200 ||
    ![2, 3, 4].includes(data.numPlayers) ||
    !Array.isArray(data.actions) ||
    data.actions.length > 10_000
  ) {
    throw new Error('Invalid or incompatible game log.');
  }
  for (const action of data.actions) {
    if (
      !action ||
      !['MAKE_MOVE', 'GAME_EVENT', 'UNDO', 'REDO'].includes(action.type) ||
      !action.payload ||
      (action.payload.playerID !== null &&
        !Array.from({ length: data.numPlayers }, (_, index) =>
          String(index),
        ).includes(action.payload.playerID))
    ) {
      throw new Error('Invalid game log action.');
    }
    if (action.type === 'MAKE_MOVE' || action.type === 'GAME_EVENT') {
      const names =
        action.type === 'MAKE_MOVE'
          ? data.version === 2
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

      if (
        !names.includes(action.payload.type) ||
        !Array.isArray(action.payload.args)
      ) {
        throw new Error(
          `Unknown move or invalid arguments in game log: ${JSON.stringify(action)}.`,
        );
      }
    }
  }

  return {
    ...data,
    version: 2,
    actions: confirmedActions(data.seed, data.numPlayers, data.actions),
  };
}

export function replayGameLog(log: GameLog, steps = log.actions.length) {
  if (!Number.isInteger(steps) || steps < 0 || steps > log.actions.length) {
    throw new Error('Choose a valid action number.');
  }

  const client = Client({
    game: { ...CardGame, seed: log.seed },
    numPlayers: log.numPlayers,
    debug: false,
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
