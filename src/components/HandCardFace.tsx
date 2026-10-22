import clsx from 'clsx';
import { useIntl } from 'react-intl';

import type { Card } from '../game';
import { useMessages } from '../i18n/useMessages';
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
  const t = useMessages();
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
          : t(`manipulation.${card.action}.name`)}
      </strong>
      {card.type === 'event' && <CardEventName card={card} />}
      <span className={cardStyles.cardTypeName}>
        {t(
          card.type === 'manipulation'
            ? 'card.manipulation'
            : card.category
              ? `card.category.${card.category}`
              : 'card.event',
        )}
      </span>
    </>
  );
}
