import type { EventCard } from './game';
import type { MessageId } from './i18n/useMessages';

export function eventCardNameMessageId(card: EventCard): MessageId {
  return card.name ? `card.name.${card.name}` : 'card.event';
}
