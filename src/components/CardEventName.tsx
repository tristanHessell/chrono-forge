import { useIntl } from 'react-intl';

import { eventCardNameMessage } from '../eventCardName';
import type { EventCard } from '../game';
import cardStyles from './Card.module.css';

export function CardEventName({ card }: { card: EventCard }) {
  const intl = useIntl();

  return (
    <small className={cardStyles.cardEventName}>
      {intl.formatMessage(eventCardNameMessage(card))}
    </small>
  );
}
