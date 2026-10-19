import type { EventCard } from '../../game';

export default {
  id: 'event-1990-1',
  type: 'event',
  number: 1990,
  effect: 'timeline-1900-bonus',
  category: 'political',
} as const satisfies EventCard;
