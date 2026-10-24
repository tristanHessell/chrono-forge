import type { EventCard } from './game';
import { eventNameMessages } from './i18n/messageDescriptors';

export function eventCardNameMessage(card: EventCard) {
  return eventNameMessages[card.name];
}
