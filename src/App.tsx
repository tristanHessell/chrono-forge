import { Client } from 'boardgame.io/react';
import { useEffect, useRef, useState } from 'react';

import { CardGame, type CardGameState } from './game';
import { GameBoard } from './GameBoard';
import { applyGameLogAction, type GameLog } from './gameLog';
import { GameLogContext } from './gameLogContext';
import type { PlayerCount } from './playerCount';
import {
  createDefaultPlayers,
  type PlayerSetup,
  PlayerSetupContext,
} from './playerSetup';

type Session = {
  seed: string;
  numPlayers: PlayerCount;
  players: PlayerSetup[];
  replay?: { log: GameLog; steps: number };
  CardGameClient: ReturnType<typeof Client<CardGameState>>;
};

function createSession(options: Omit<Session, 'CardGameClient'>): Session {
  return {
    ...options,
    CardGameClient: Client({
      game: { ...CardGame, seed: options.seed },
      board: GameBoard,
      numPlayers: options.numPlayers,
      debug: false,
    }),
  };
}

function GameSession({ CardGameClient, players, replay }: Session) {
  const ref = useRef<InstanceType<typeof CardGameClient>>(null);
  const replayed = useRef(false);

  useEffect(() => {
    if (!replay || replayed.current || !ref.current) {
      return;
    }

    replayed.current = true;
    for (const action of replay.log.actions.slice(0, replay.steps)) {
      applyGameLogAction(ref.current.client, action);
    }
  }, [replay]);

  return (
    <PlayerSetupContext.Provider value={players}>
      <CardGameClient ref={ref} />
    </PlayerSetupContext.Provider>
  );
}

export function App() {
  const [session, setSession] = useState<Session>(() =>
    createSession({
      seed: crypto.randomUUID(),
      numPlayers: 2,
      players: createDefaultPlayers(),
    }),
  );
  const [revision, setRevision] = useState(0);
  const replaceSession = (next: Omit<Session, 'CardGameClient'>) => {
    setSession(createSession(next));
    setRevision((value) => value + 1);
  };
  const newGame = (players: PlayerSetup[]) => {
    replaceSession({
      seed: crypto.randomUUID(),
      numPlayers: players.length as PlayerCount,
      players,
    });
  };

  return (
    <GameLogContext.Provider
      value={{
        seed: session.seed,
        replayPaused: Boolean(session.replay),
        newGame,
        loadLog: (log, steps) => {
          replaceSession({
            seed: log.seed,
            numPlayers: log.numPlayers,
            players: createDefaultPlayers(log.numPlayers),
            replay: { log, steps },
          });
        },
      }}
    >
      <GameSession key={revision} {...session} />
    </GameLogContext.Provider>
  );
}
