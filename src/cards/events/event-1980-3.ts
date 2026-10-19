import type { EventCard } from '../../game';

export default {
  id: 'event-1980-3',
  type: 'event',
  name: 'ozone-hole',
  number: 1980,
  category: 'environmental',
} as const satisfies EventCard;
