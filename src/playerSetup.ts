import { createContext } from 'react';

import type { PlayerId } from './game';
import type { PlayerCount } from './playerCount';

export type PlayerType = 'human' | 'computer';

export type PlayerSetup = {
  id: PlayerId;
  name: string;
  type: PlayerType;
};

const playerNames = ['You', 'Sally', 'Barry', 'Morgan'] as const;

export function createDefaultPlayers (count: PlayerCount = 2): PlayerSetup[] {
  return playerNames.slice(0, count).map((name, index) => ({
    id: String(index) as PlayerId,
    name,
    type: index === 0 ? 'human' : 'computer',
  }));
}

export function getPlayer (players: PlayerSetup[], id: PlayerId): PlayerSetup {
  const defaults = createDefaultPlayers(4);

  return (
    players.find((player) => player.id === id) ??
    defaults.find((player) => player.id === id) ??
    defaults[0]
  );
}

export const PlayerSetupContext = createContext<PlayerSetup[]>(
  createDefaultPlayers(4),
);
