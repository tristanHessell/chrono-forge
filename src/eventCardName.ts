import type { EventCard } from './game';
import {
  eventNameMessages,
  startingEventNameMessage,
} from './i18n/messageDescriptors';

export function eventCardNameMessage(card: EventCard) {
  return card.name ? eventNameMessages[card.name] : startingEventNameMessage;
}
