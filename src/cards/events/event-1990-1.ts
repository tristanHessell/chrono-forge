import type { EventCard } from '../../game';

export default {
  id: 'event-1990-1',
  type: 'event',
  name: 'european-union',
  number: 1990,
  effects: ['timeline-1900-bonus'],
  category: 'political',
} as const satisfies EventCard;
