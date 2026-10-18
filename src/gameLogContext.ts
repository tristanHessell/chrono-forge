import { createContext } from 'react';

import type { GameLog } from './gameLog';

export const GameLogContext = createContext<{
  seed: string;
  replayPaused: boolean;
  loadLog: (log: GameLog, steps: number) => void;
  newGame: () => void;
}>({
  seed: '',
  replayPaused: false,
  loadLog: () => {},
  newGame: () => {},
});
