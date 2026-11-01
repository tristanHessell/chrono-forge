import type { CardGameState, PlayerId } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import { getPlayer, type PlayerSetup } from '../playerSetup';
import { PlayerRow } from './PlayerRow';

type GameBoardPlayersProps = {
  actionsThisTurn: number;
  activeOwner: PlayerId;
  cards: CardGameState['hands'];
  confirmTurn: () => void;
  finished: boolean;
  handOwner: PlayerId;
  playerIds: PlayerId[];
  players: PlayerSetup[];
  scores: Record<string, number>;
  turnPendingConfirmation: boolean;
};

export function GameBoardPlayers({
  actionsThisTurn,
  activeOwner,
  cards,
  confirmTurn,
  finished,
  handOwner,
  playerIds,
  players,
  scores,
  turnPendingConfirmation,
}: GameBoardPlayersProps) {
  return (
    <div className={gameBoardStyles.opponentHand} data-player-row>
      {playerIds.map((id) => {
        const player = getPlayer(players, id);

        return (
          <PlayerRow
            actionsThisTurn={actionsThisTurn}
            active={activeOwner === id && !finished}
            cards={cards[id]}
            confirmTurn={id === handOwner ? confirmTurn : undefined}
            key={id}
            player={player}
            score={scores[id] ?? 0}
            turnPendingConfirmation={turnPendingConfirmation}
          />
        );
      })}
    </div>
  );
}
