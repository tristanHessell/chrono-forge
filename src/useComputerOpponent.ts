import { useEffect } from 'react';

import { chooseComputerAction } from './computer';
import type { CardGameState, CardPosition, PlayerId } from './game';

type ComputerMoves = {
  manipulate: (
    cardId: string,
    targetId: string,
    destination?: CardPosition | string,
  ) => void;
  playCard: (cardId: string, position: CardPosition) => void;
  discardCard: (cardId: string) => void;
  confirmPlacement: () => void;
};

export function useComputerOpponent(
  G: CardGameState,
  currentPlayer: string,
  paused: boolean,
  moves: ComputerMoves,
) {
  const { playCard, discardCard, confirmPlacement, manipulate } = moves;

  useEffect(() => {
    if (paused || currentPlayer === '0' || G.roundOver) {
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
      } else if (action?.type === 'manipulate') {
        manipulate(action.cardId, action.targetId, action.destination);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    G,
    currentPlayer,
    paused,
    playCard,
    discardCard,
    confirmPlacement,
    manipulate,
  ]);
}
