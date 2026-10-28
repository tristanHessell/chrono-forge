import { useEffect } from 'react';

import { chooseComputerAction } from './computer';
import type { CardGameState, CardPosition, PlayerId } from './game';
import type { PlayerSetup } from './playerSetup';

type ComputerMoves = {
  command: (
    cardId: string,
    targetId: string,
    destination?: CardPosition | string,
  ) => void;
  confirmPlacement: () => void;
  discardCard: (cardId: string) => void;
  playCard: (cardId: string, position: CardPosition) => void;
};

export function useComputerOpponent(
  G: CardGameState,
  currentPlayer: string,
  players: PlayerSetup[],
  paused: boolean,
  moves: ComputerMoves,
) {
  const { command, confirmPlacement, discardCard, playCard } = moves;

  useEffect(() => {
    const current = players.find((player) => player.id === currentPlayer);

    if (paused || current?.type !== 'computer' || G.roundOver) {
      return;
    }

    const timer = window.setTimeout(() => {
      const action = chooseComputerAction(G, currentPlayer as PlayerId);

      if (action?.type === 'play') {
        playCard(action.cardId, action.position);
      } else if (action?.type === 'discard') {
        discardCard(action.cardId);
      } else if (action?.type === 'confirm') {
        confirmPlacement();
      } else if (action?.type === 'command') {
        command(action.cardId, action.targetId, action.destination);
      }
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    G,
    currentPlayer,
    players,
    paused,
    playCard,
    discardCard,
    confirmPlacement,
    command,
  ]);
}
