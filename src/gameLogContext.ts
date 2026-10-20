import { createContext } from 'react';

import type { GameLog } from './gameLog';
import type { PlayerSetup } from './playerSetup';

export const GameLogContext = createContext<{
  seed: string;
  replayPaused: boolean;
  loadLog: (log: GameLog, steps: number) => void;
  newGame: (players: PlayerSetup[]) => void;
}>({
  seed: '',
  replayPaused: false,
  loadLog: () => {},
  newGame: () => {},
});
