import clsx from 'clsx';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Card } from '../game';
import type { PlayerSetup } from '../playerSetup';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';
import playerRowStyles from './PlayerRow.module.css';

type Props = {
  actionsThisTurn: number;
  active: boolean;
  cards: Card[];
  confirmTurn?: () => void;
  player: PlayerSetup;
  score: number;
  turnPendingConfirmation?: boolean;
};

export function PlayerRow({
  actionsThisTurn,
  active,
  cards,
  confirmTurn,
  player,
  score,
  turnPendingConfirmation = false,
}: Props) {
  const intl = useIntl();

  return (
    <section
      aria-label={intl.formatMessage<{
        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
        readonly count: number | bigint;
        readonly name: MessageValue;
      }>(
        {
          defaultMessage:
            '{name}, {count, plural, one {# point} other {# points}}',
          id: 'computer.summary',
        },
        {
          count: score,
          name: player.name,
        },
      )}
      className={clsx(
        playerRowStyles.playerRow,
        ownershipStyles[`owner${player.id}`],
      )}
      data-current-turn={active}
      data-player-score={player.id}
    >
      <div className={playerRowStyles.identity}>
        <PlayerAvatar compact {...player} owner={player.id} />
        <div className={playerRowStyles.playerDetails} data-player-details>
          <strong>{player.name}</strong>
          <span>
            <FormattedMessage
              defaultMessage="{count, plural, one {# point} other {# points}}"
              id="score.points"
              values={{
                count: score,
              }}
            />
          </span>
        </div>
      </div>
      <div
        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
        aria-label={intl.formatMessage<{ readonly count: number | bigint }>(
          {
            defaultMessage:
              '{count, plural, one {# card in hand} other {# cards in hand}}',
            id: 'player.handCount',
          },
          { count: cards.length },
        )}
        className={playerRowStyles.hiddenCards}
        role="img"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7 11V5a1.5 1.5 0 0 1 3 0v5V4a1.5 1.5 0 0 1 3 0v6V5a1.5 1.5 0 0 1 3 0v6V8a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7h-1a7 7 0 0 1-6.1-3.6L3.2 14a1.7 1.7 0 0 1 2.7-2.1L7 13" />
        </svg>
        <strong className={playerRowStyles.handCount}>
          {intl.formatNumber(cards.length)}
        </strong>
      </div>
      <div
        aria-hidden={!active}
        className={playerRowStyles.playerTurn}
        data-active={active}
        data-player-turn
      >
        {confirmTurn && turnPendingConfirmation ? (
          <button
            className={playerRowStyles.confirmTurn}
            onClick={confirmTurn}
            type="button"
          >
            <FormattedMessage defaultMessage="End turn" id="turn.confirm" />
          </button>
        ) : (
          <span>
            <FormattedMessage
              defaultMessage="{count, plural, one {# action left} other {# actions left}}"
              id="turn.actionsLeft"
              values={{ count: Math.max(0, 2 - actionsThisTurn) }}
            />
          </span>
        )}
      </div>
    </section>
  );
}
