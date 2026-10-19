import type { EventCard } from '../../game';

export default {
  id: 'event-1900-3',
  type: 'event',
  name: 'conservation-movement',
  number: 1900,
  category: 'environmental',
} as const satisfies EventCard;
