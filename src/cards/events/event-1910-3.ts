import type { EventCard } from '../../game';

export default {
  id: 'event-1910-3',
  type: 'event',
  name: 'national-parks',
  number: 1910,
  category: 'environmental',
  effect: 'free-action',
} as const satisfies EventCard;
