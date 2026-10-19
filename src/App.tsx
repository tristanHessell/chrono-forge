import { Client } from 'boardgame.io/react';
import { useEffect, useRef, useState } from 'react';

import { CardGame, type CardGameState } from './game';
import { GameBoard } from './GameBoard';
import { applyGameLogAction, type GameLog } from './gameLog';
import { GameLogContext } from './gameLogContext';
import { type PlayerCount, PlayerCountContext } from './playerCount';

type Session = {
  seed: string;
  numPlayers: PlayerCount;
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
      debug: import.meta.env.DEV ? { collapseOnLoad: true } : false,
    }),
  };
}

function GameSession({ CardGameClient, replay }: Session) {
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

  return <CardGameClient ref={ref} />;
}

export function App() {
  const [session, setSession] = useState<Session>(() =>
    createSession({
      seed: crypto.randomUUID(),
      numPlayers: 2,
    }),
  );
  const [revision, setRevision] = useState(0);
  const replaceSession = (next: Omit<Session, 'CardGameClient'>) => {
    setSession(createSession(next));
    setRevision((value) => value + 1);
  };
  const newGame = () =>
    replaceSession({
      seed: crypto.randomUUID(),
      numPlayers: session.numPlayers,
    });
  const setPlayerCount = (numPlayers: PlayerCount) =>
    replaceSession({ seed: crypto.randomUUID(), numPlayers });

  return (
    <PlayerCountContext.Provider value={{ setPlayerCount }}>
      <GameLogContext.Provider
        value={{
          seed: session.seed,
          replayPaused: Boolean(session.replay),
          newGame,
          loadLog: (log, steps) =>
            replaceSession({
              seed: log.seed,
              numPlayers: log.numPlayers,
              replay: { log, steps },
            }),
        }}
      >
        <GameSession key={revision} {...session} />
      </GameLogContext.Provider>
    </PlayerCountContext.Provider>
  );
}
