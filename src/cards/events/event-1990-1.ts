import type { EventCard } from '../../game';

export default {
  category: 'politics',
  effects: ['timeline-1900-bonus'],
  id: 'event-1990-1',
  name: 'european-union',
  number: 1990,
  type: 'event',
} as const satisfies EventCard;
