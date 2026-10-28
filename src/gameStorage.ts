import type { LogEntry, State } from 'boardgame.io';
import { type Client } from 'boardgame.io/client';

import type { CardGameState, PlayerId } from './game';
import type { PlayerCount } from './playerCount';
import type { PlayerSetup } from './playerSetup';

export const gameStorageKey = 'chrono-forge-saved-game';

export type SavedGameSession = {
  numPlayers: PlayerCount;
  players: PlayerSetup[];
  replayPaused: boolean;
  seed: string;
  startingPlayer: PlayerId;
};

export type SavedGame = SavedGameSession & {
  initialState: State<CardGameState>;
  log: LogEntry[];
  state: State<CardGameState>;
  version: 1;
};

type GameSave = SavedGameSession &
  Pick<SavedGame, 'initialState' | 'log' | 'state'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlayerId(value: unknown): value is PlayerId {
  return value === '0' || value === '1' || value === '2' || value === '3';
}

function isPlayerSetup(value: unknown, index: number): value is PlayerSetup {
  return (
    isRecord(value) &&
    value.id === String(index) &&
    typeof value.name === 'string' &&
    (value.type === 'human' || value.type === 'computer')
  );
}

function isCardGameState(value: unknown): value is CardGameState {
  return (
    isRecord(value) &&
    typeof value.actionsThisTurn === 'number' &&
    Array.isArray(value.discarded) &&
    typeof value.freeActionsEnabled === 'boolean' &&
    isRecord(value.hands) &&
    Array.isArray(value.playerIds) &&
    Number.isInteger(value.round) &&
    Array.isArray(value.roundScores) &&
    Array.isArray(value.deck) &&
    Array.isArray(value.played) &&
    (value.pending === null || isRecord(value.pending)) &&
    isPlayerId(value.startingPlayer) &&
    typeof value.roundOver === 'boolean' &&
    Number.isInteger(value.nextPlacementOrder) &&
    Array.isArray(value.testHistory) &&
    Array.isArray(value.testFuture) &&
    Array.isArray(value.moveUndoHistory) &&
    typeof value.undoBlocked === 'boolean' &&
    (value.pendingSnapshot === null || isRecord(value.pendingSnapshot))
  );
}

function isBoardgameState(value: unknown): value is State<CardGameState> {
  return (
    isRecord(value) &&
    isCardGameState(value.G) &&
    isRecord(value.ctx) &&
    isRecord(value.plugins) &&
    Array.isArray(value._undo) &&
    Array.isArray(value._redo) &&
    Number.isInteger(value._stateID)
  );
}

function isSavedGame(value: unknown): value is SavedGame {
  if (!isRecord(value) || value.version !== 1) {
    return false;
  }

  const { numPlayers, players, startingPlayer } = value;

  if (
    typeof value.seed !== 'string' ||
    !value.seed ||
    (numPlayers !== 2 && numPlayers !== 3 && numPlayers !== 4) ||
    !Array.isArray(players) ||
    players.length !== numPlayers ||
    !players.every(isPlayerSetup) ||
    !isPlayerId(startingPlayer) ||
    Number(startingPlayer) >= numPlayers ||
    typeof value.replayPaused !== 'boolean' ||
    !isBoardgameState(value.state) ||
    !isBoardgameState(value.initialState) ||
    !Array.isArray(value.log)
  ) {
    return false;
  }

  return players[0].type === 'human';
}

export function loadSavedGame(): null | SavedGame {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const value = localStorage.getItem(gameStorageKey);

    if (value === null) {
      return null;
    }

    const savedGame: unknown = JSON.parse(value);

    if (!isSavedGame(savedGame)) {
      console.error('The saved game has an invalid or unsupported format.');

      return null;
    }

    return savedGame;
  } catch (error) {
    console.error('Could not load the saved game from local storage.', error);

    return null;
  }
}

export function saveGame(game: GameSave) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      gameStorageKey,
      JSON.stringify({ ...game, version: 1 }),
    );
  } catch (error) {
    console.error('Could not save the game to local storage.', error);
  }
}

export function restoreSavedGame(
  client: ReturnType<typeof Client<CardGameState>>,
  game: SavedGame,
) {
  client.store.dispatch({
    clientOnly: true,
    initialState: game.initialState,
    log: game.log,
    state: game.state,
    type: 'SYNC',
  });
}
