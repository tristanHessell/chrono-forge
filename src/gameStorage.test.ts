import { Client } from 'boardgame.io/client';
import { afterEach, expect, it, vi } from 'vitest';

import { type CardGameState, createCardGame } from './game';
import {
  gameStorageKey,
  loadSavedGame,
  restoreSavedGame,
  type SavedGame,
  saveGame,
} from './gameStorage';
import { createDefaultPlayers } from './playerSetup';

function createSave(): SavedGame {
  const client = Client<CardGameState>({
    game: { ...createCardGame('0'), seed: 'saved-game-seed' },
    numPlayers: 2,
  });
  const card = client.getState()!.G.hands['0'][0];

  client.moves.discardCard(card.id);

  return {
    version: 1,
    seed: 'saved-game-seed',
    numPlayers: 2,
    startingPlayer: '0',
    players: createDefaultPlayers(),
    replayPaused: true,
    state: client.getState()!,
    initialState: client.getInitialState(),
    log: client.log ?? [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('saves and loads a valid game', () => {
  const values = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });

  const savedGame = createSave();

  saveGame(savedGame);

  const loadedGame = loadSavedGame();

  expect(loadedGame).toMatchObject({
    seed: savedGame.seed,
    replayPaused: true,
    state: { G: savedGame.state.G },
  });
  expect(values.has(gameStorageKey)).toBe(true);

  const resumed = Client({
    game: { ...createCardGame(savedGame.startingPlayer), seed: savedGame.seed },
    numPlayers: savedGame.numPlayers,
  });

  if (!loadedGame) {
    throw new Error('The saved game did not load.');
  }

  restoreSavedGame(resumed, loadedGame);

  expect(resumed.store.getState().G).toEqual(savedGame.state.G);
  expect(resumed.log).toEqual(savedGame.log);
});

it('restores the game state and log into a new client', () => {
  const savedGame = createSave();
  const resumed = Client({
    game: { ...createCardGame(savedGame.startingPlayer), seed: savedGame.seed },
    numPlayers: savedGame.numPlayers,
  });

  restoreSavedGame(resumed, savedGame);

  expect(resumed.store.getState()).toEqual(savedGame.state);
  expect(resumed.getInitialState()).toEqual(savedGame.initialState);
});

it('does not offer an invalid saved-game format for continuation', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => '{"version":1}',
  });

  vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(loadSavedGame()).toBeNull();
  expect(console.error).toHaveBeenCalled();
});
