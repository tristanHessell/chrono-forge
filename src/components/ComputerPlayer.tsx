import clsx from 'clsx';
import { useIntl } from 'react-intl';

import type { Card } from '../game';
import { useMessages } from '../i18n/useMessages';
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
  const t = useMessages();
  const intl = useIntl();

  return (
    <section
      aria-label={t('computer.summary', {
        name: player.name,
        count: score,
      })}
      className={clsx(
        computerPlayerStyles.computerPlayer,
        ownershipStyles[`owner${player.id}`],
      )}
    >
      <div className={computerPlayerStyles.identity}>
        <PlayerAvatar compact {...player} owner={player.id} />
        <div>
          <strong>{player.name}</strong>
          <span>{t('score.points', { count: score })}</span>
        </div>
      </div>
      <div
        aria-label={t('computer.hiddenCards', { count: cards.length })}
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
