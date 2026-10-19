import { eventCardNameMessageId } from '../eventCardName';
import type { EventCard } from '../game';
import { useMessages } from '../i18n/useMessages';
import cardStyles from './Card.module.css';

export function CardEventName({ card }: { card: EventCard }) {
  const t = useMessages();

  return (
    <small className={cardStyles.cardEventName}>
      {t(eventCardNameMessageId(card))}
    </small>
  );
}
