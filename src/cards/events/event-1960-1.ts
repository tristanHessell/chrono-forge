import type { EventCard } from '../../game';

export default {
  id: 'event-1960-1',
  type: 'event',
  name: 'civil-rights',
  number: 1960,
  category: 'political',
} as const satisfies EventCard;
