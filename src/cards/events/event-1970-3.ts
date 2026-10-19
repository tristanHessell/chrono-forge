import type { EventCard } from '../../game';

export default {
  id: 'event-1970-3',
  type: 'event',
  name: 'earth-day',
  number: 1970,
  category: 'environmental',
} as const satisfies EventCard;
