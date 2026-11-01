import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import type { CardGameState, PlayerId } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import { getPlayer, type PlayerSetup } from '../playerSetup';
import { ComputerPlayer } from './ComputerPlayer';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type GameBoardPlayersProps = {
  actionsThisTurn: number;
  activeOwner: PlayerId;
  cards: CardGameState['hands'];
  finished: boolean;
  handOwner: PlayerId;
  handPlayer: PlayerSetup;
  playerIds: PlayerId[];
  players: PlayerSetup[];
  scores: Record<string, number>;
};

export function GameBoardPlayers({
  actionsThisTurn,
  activeOwner,
  cards,
  finished,
  handOwner,
  handPlayer,
  playerIds,
  players,
  scores,
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
              data-current-turn={activeOwner === handOwner && !finished}
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
                {activeOwner === handOwner && !finished && (
                  <span className={gameBoardStyles.playerTurn}>
                    <FormattedMessage
                      defaultMessage="Current player · {count, plural, one {# action left} other {# actions left}}"
                      id="turn.remaining"
                      values={{ count: Math.max(0, 2 - actionsThisTurn) }}
                    />
                  </span>
                )}
              </div>
            </div>
          );
        }

        const player = getPlayer(players, id);

        return (
          <ComputerPlayer
            actionsThisTurn={actionsThisTurn}
            active={activeOwner === id && !finished}
            cards={cards[id]}
            key={id}
            player={player}
            score={scores[id] ?? 0}
          />
        );
      })}
    </div>
  );
}
