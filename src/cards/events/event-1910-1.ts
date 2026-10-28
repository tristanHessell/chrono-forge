import type { EventCard } from '../../game';

export default {
  category: 'political',
  effects: ['free-action'],
  id: 'event-1910-1',
  name: 'global-conflict',
  number: 1910,
  type: 'event',
} as const satisfies EventCard;
