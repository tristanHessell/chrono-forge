import type { EventCard } from '../../game';

export default {
  category: 'technological',
  effects: ['timeline-1900-bonus'],
  id: 'event-1990-2',
  name: 'internet-expansion',
  number: 1990,
  type: 'event',
} as const satisfies EventCard;
