import { Client } from 'boardgame.io/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { TitleScreen } from './components/TitleScreen';
import { type CardGameState, createCardGame } from './game';
import { GameBoard } from './GameBoard';
import { applyGameLogAction, type GameLog } from './gameLog';
import { GameLogContext } from './gameLogContext';
import {
  loadSavedGame,
  restoreSavedGame,
  type SavedGame,
  type SavedGameSession,
  saveGame,
} from './gameStorage';
import type { PlayerCount } from './playerCount';
import {
  chooseStartingPlayer,
  createDefaultPlayers,
  type PlayerSetup,
  PlayerSetupContext,
} from './playerSetup';

type SessionOptions = SavedGameSession & {
  replay?: { log: GameLog; steps: number };
  restore?: SavedGame;
};

type Session = SessionOptions & {
  CardGameClient: ReturnType<typeof Client<CardGameState>>;
};

function createSession(options: SessionOptions): Session {
  return {
    ...options,
    CardGameClient: Client({
      board: GameBoard,
      debug: false,
      game: { ...createCardGame(options.startingPlayer), seed: options.seed },
      numPlayers: options.numPlayers,
    }),
  };
}

function GameSession({
  CardGameClient,
  numPlayers,
  players,
  replay,
  replayPaused,
  restore,
  seed,
  startingPlayer,
}: Session) {
  const ref = useRef<InstanceType<typeof CardGameClient>>(null);
  const replayedRef = useRef(false);

  useLayoutEffect(() => {
    const client = ref.current?.client;

    if (!client) {
      return;
    }

    if (restore) {
      restoreSavedGame(client, restore);
    }

    return client.subscribe(() => {
      const currentState = client.getState();

      if (!currentState) {
        throw new Error('The game client has no state to save.');
      }

      saveGame({
        initialState: client.getInitialState(),
        log: client.log ?? [],
        numPlayers,
        players,
        replayPaused: replayPaused || Boolean(replay),
        seed,
        startingPlayer,
        state: {
          _redo: currentState._redo,
          _stateID: currentState._stateID,
          _undo: currentState._undo,
          ctx: currentState.ctx,
          G: currentState.G,
          plugins: currentState.plugins,
        },
      });
    });
  }, [
    numPlayers,
    players,
    replay,
    replayPaused,
    restore,
    seed,
    startingPlayer,
  ]);

  useEffect(() => {
    if (!replay || replayedRef.current || !ref.current) {
      return;
    }

    replayedRef.current = true;
    for (const action of replay.log.actions.slice(0, replay.steps)) {
      applyGameLogAction(ref.current.client, action);
    }
  }, [replay]);

  return (
    <PlayerSetupContext value={players}>
      <CardGameClient ref={ref} />
    </PlayerSetupContext>
  );
}

export function App() {
  const [session, setSession] = useState<null | Session>(null);
  const [savedGame] = useState(loadSavedGame);
  const [revision, setRevision] = useState(0);
  const replaceSession = (next: SessionOptions) => {
    setSession(createSession(next));
    setRevision((value) => value + 1);
  };
  const newGame = (players: PlayerSetup[]) => {
    replaceSession({
      numPlayers: players.length as PlayerCount,
      players,
      replayPaused: false,
      seed: crypto.randomUUID(),
      startingPlayer: chooseStartingPlayer(players.length as PlayerCount),
    });
  };
  const continueGame = () => {
    if (!savedGame) {
      return;
    }

    replaceSession({
      numPlayers: savedGame.numPlayers,
      players: savedGame.players,
      replayPaused: savedGame.replayPaused,
      restore: savedGame,
      seed: savedGame.seed,
      startingPlayer: savedGame.startingPlayer,
    });
  };

  return (
    <GameLogContext
      value={{
        loadLog: (log, steps) => {
          replaceSession({
            numPlayers: log.numPlayers,
            players: createDefaultPlayers(log.numPlayers),
            replay: { log, steps },
            replayPaused: true,
            seed: log.seed,
            startingPlayer: log.startingPlayer,
          });
        },
        newGame,
        replayPaused: Boolean(session?.replayPaused || session?.replay),
        seed: session?.seed ?? '',
      }}
    >
      {session ? (
        <GameSession key={revision} {...session} />
      ) : (
        <TitleScreen
          onContinue={savedGame ? continueGame : undefined}
          onStart={newGame}
        />
      )}
    </GameLogContext>
  );
}
