import type { EventCard } from '../../game';

export default {
  category: 'nature',
  effects: ['draw-one'],
  id: 'event-1940-3',
  name: 'green-revolution',
  number: 1940,
  type: 'event',
} as const satisfies EventCard;
