import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import type { Card, CardGameState, CardOwner, PlayerId } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import { getPlayer, type PlayerSetup } from '../playerSetup';
import { CardHand } from './CardHand';
import { ComputerPlayer } from './ComputerPlayer';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type GameBoardPlayersProps = {
  activeOwner: PlayerId;
  cards: CardGameState['hands'];
  draggedPendingCard: boolean;
  handOwner: PlayerId;
  handPlayer: PlayerSetup;
  onChooseCard: (cardId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, cardId: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onShowDetails: (card: Card) => void;
  pendingCardId?: string;
  pendingOwner?: CardOwner;
  playerIds: PlayerId[];
  players: PlayerSetup[];
  scores: Record<string, number>;
  selectedCardId: null | string;
};

export function GameBoardPlayers({
  activeOwner,
  cards,
  draggedPendingCard,
  handOwner,
  handPlayer,
  onChooseCard,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onShowDetails,
  pendingCardId,
  pendingOwner,
  playerIds,
  players,
  scores,
  selectedCardId,
}: GameBoardPlayersProps) {
  return (
    <div className={gameBoardStyles.opponentHand} data-player-row>
      {playerIds.map((id) => {
        if (id === handOwner) {
          return (
            <div
              className={clsx(
                gameBoardStyles.playerScore,
                ownershipStyles[`owner${handOwner}`],
              )}
              data-player-score={id}
              key={id}
            >
              <PlayerAvatar compact {...handPlayer} owner={handOwner} />
              <div>
                <strong>{handPlayer.name}</strong>
                <span>
                  <FormattedMessage
                    defaultMessage="{count, plural, one {# point} other {# points}}"
                    id="score.points"
                    values={{ count: scores[handOwner] ?? 0 }}
                  />
                </span>
              </div>
            </div>
          );
        }

        const player = getPlayer(players, id);

        return player.type === 'computer' ? (
          <ComputerPlayer
            cards={cards[id]}
            key={id}
            player={player}
            score={scores[id] ?? 0}
          />
        ) : (
          <div className={gameBoardStyles.computerHand} key={id}>
            <CardHand
              activeOwner={activeOwner}
              cards={cards[id]}
              interactive={false}
              isReturnTarget={draggedPendingCard && pendingOwner === id}
              onChoose={onChooseCard}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onShowDetails={onShowDetails}
              owner={id}
              ownerName={player.name}
              pendingCardId={pendingCardId}
              playerType={player.type}
              selectedCardId={selectedCardId}
            />
          </div>
        );
      })}
    </div>
  );
}
