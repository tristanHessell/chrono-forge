import { createContext } from 'react';

export type PlayerCount = 2 | 3 | 4;

export const PlayerCountContext = createContext<{
  setPlayerCount: (count: PlayerCount) => void;
}>({ setPlayerCount: () => {} });
