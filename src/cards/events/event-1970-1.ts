import type { EventCard } from '../../game';

export default {
  category: 'politics',
  id: 'event-1970-1',
  name: 'detente',
  number: 1970,
  type: 'event',
} as const satisfies EventCard;
