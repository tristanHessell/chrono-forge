import clsx from 'clsx';
import { useIntl } from 'react-intl';

import type { Card } from '../game';
import {
  categoryMessages,
  manipulationNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import cardStyles from './Card.module.css';
import { CardEffect } from './CardEffect';
import { CardEventName } from './CardEventName';

export function HandCardFace({
  card,
  showTooltip = true,
}: {
  card: Card;
  showTooltip?: boolean;
}) {
  const intl = useIntl();

  return (
    <>
      <CardEffect
        effect={card.type === 'manipulation' ? card.action : card.effect}
        showTooltip={showTooltip}
      />
      {card.type === 'event' && (
        <span aria-hidden="true" className={cardStyles.handCardNumber}>
          {intl.formatNumber(card.number, { useGrouping: false })}
        </span>
      )}
      <strong
        className={clsx(
          card.type === 'manipulation' && cardStyles.manipulationName,
        )}
      >
        {card.type === 'event'
          ? intl.formatNumber(card.number, { useGrouping: false })
          : intl.formatMessage(manipulationNameMessages[card.action])}
      </strong>
      {card.type === 'event' && <CardEventName card={card} />}
      <span className={cardStyles.cardTypeName}>
        {intl.formatMessage(
          card.type === 'manipulation'
            ? { id: 'card.manipulation', defaultMessage: 'Command' }
            : card.category
              ? categoryMessages[card.category]
              : startingEventNameMessage,
        )}
      </span>
    </>
  );
}
