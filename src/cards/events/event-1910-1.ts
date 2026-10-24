import type { EventCard } from '../../game';

export default {
  id: 'event-1910-1',
  type: 'event',
  name: 'global-conflict',
  number: 1910,
  category: 'political',
  effect: 'free-action',
} as const satisfies EventCard;
