import clsx from 'clsx';
import { useIntl } from 'react-intl';

import type { Card } from '../game';
import {
  categoryMessages,
  manipulationNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import cardStyles from './Card.module.css';
import { CardEffects } from './CardEffect';
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
      <CardEffects
        effects={card.type === 'manipulation' ? [card.action] : card.effects}
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
        {card.type === 'manipulation'
          ? intl.formatMessage({
              id: 'card.manipulation',
              defaultMessage: 'Command',
            })
          : card.category
            ? intl.formatMessage(categoryMessages[card.category])
            : intl.formatMessage(startingEventNameMessage)}
      </span>
    </>
  );
}
