import type { EventCard } from '../../game';

export default {
  id: 'event-1930-1',
  type: 'event',
  name: 'new-deal',
  number: 1930,
  category: 'political',
} as const satisfies EventCard;
