import clsx from 'clsx';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Card } from '../game';
import type { PlayerSetup } from '../playerSetup';
import computerPlayerStyles from './ComputerPlayer.module.css';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type Props = {
  cards: Card[];
  player: PlayerSetup;
  score: number;
};

export function ComputerPlayer({ cards, player, score }: Props) {
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
        computerPlayerStyles.computerPlayer,
        ownershipStyles[`owner${player.id}`],
      )}
    >
      <div className={computerPlayerStyles.identity}>
        <PlayerAvatar compact {...player} owner={player.id} />
        <div>
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
              '{count, plural, one {# face-down card} other {# face-down cards}}',
            id: 'computer.hiddenCards',
          },
          { count: cards.length },
        )}
        className={computerPlayerStyles.hiddenCards}
        role="img"
      >
        {cards.map((card, index) => (
          <span
            aria-hidden="true"
            className={computerPlayerStyles.cardBack}
            key={card.id}
          >
            {index === cards.length - 1 && (
              <strong className={computerPlayerStyles.cardCount}>
                {intl.formatNumber(cards.length)}
              </strong>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
