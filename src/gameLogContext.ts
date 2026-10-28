import { createContext } from 'react';

import type { GameLog } from './gameLog';
import type { PlayerSetup } from './playerSetup';

export const GameLogContext = createContext<{
  loadLog: (log: GameLog, steps: number) => void;
  newGame: (players: PlayerSetup[]) => void;
  replayPaused: boolean;
  seed: string;
}>({
  loadLog: () => {},
  newGame: () => {},
  replayPaused: false,
  seed: '',
});
