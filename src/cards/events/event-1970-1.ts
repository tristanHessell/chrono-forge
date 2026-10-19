import type { EventCard } from '../../game';

export default {
  id: 'event-1970-1',
  type: 'event',
  name: 'detente',
  number: 1970,
  category: 'political',
} as const satisfies EventCard;
