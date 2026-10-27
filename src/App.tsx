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
      game: { ...createCardGame(options.startingPlayer), seed: options.seed },
      board: GameBoard,
      numPlayers: options.numPlayers,
      debug: false,
    }),
  };
}

function GameSession({
  CardGameClient,
  players,
  replay,
  restore,
  replayPaused,
  seed,
  numPlayers,
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
        seed,
        numPlayers,
        startingPlayer,
        players,
        replayPaused: replayPaused || Boolean(replay),
        state: {
          G: currentState.G,
          ctx: currentState.ctx,
          plugins: currentState.plugins,
          _undo: currentState._undo,
          _redo: currentState._redo,
          _stateID: currentState._stateID,
        },
        initialState: client.getInitialState(),
        log: client.log ?? [],
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
  const [session, setSession] = useState<Session | null>(null);
  const [savedGame] = useState(loadSavedGame);
  const [revision, setRevision] = useState(0);
  const replaceSession = (next: SessionOptions) => {
    setSession(createSession(next));
    setRevision((value) => value + 1);
  };
  const newGame = (players: PlayerSetup[]) => {
    replaceSession({
      seed: crypto.randomUUID(),
      numPlayers: players.length as PlayerCount,
      startingPlayer: chooseStartingPlayer(players.length as PlayerCount),
      players,
      replayPaused: false,
    });
  };
  const continueGame = () => {
    if (!savedGame) {
      return;
    }

    replaceSession({
      seed: savedGame.seed,
      numPlayers: savedGame.numPlayers,
      startingPlayer: savedGame.startingPlayer,
      players: savedGame.players,
      replayPaused: savedGame.replayPaused,
      restore: savedGame,
    });
  };

  return (
    <GameLogContext
      value={{
        seed: session?.seed ?? '',
        replayPaused: Boolean(session?.replayPaused || session?.replay),
        newGame,
        loadLog: (log, steps) => {
          replaceSession({
            seed: log.seed,
            numPlayers: log.numPlayers,
            startingPlayer: log.startingPlayer,
            players: createDefaultPlayers(log.numPlayers),
            replayPaused: true,
            replay: { log, steps },
          });
        },
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
