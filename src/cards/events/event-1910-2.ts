import type { EventCard } from '../../game';

export default {
  id: 'event-1910-2',
  type: 'event',
  name: 'assembly-lines',
  number: 1910,
  category: 'technological',
  effect: 'free-action',
} as const satisfies EventCard;
