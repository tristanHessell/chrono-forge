import type { EventCard } from '../../game';

export default {
  id: 'event-1990-2',
  type: 'event',
  name: 'internet-expansion',
  number: 1990,
  effect: 'timeline-1900-bonus',
  category: 'technological',
} as const satisfies EventCard;
