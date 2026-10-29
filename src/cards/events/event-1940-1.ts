import type { EventCard } from '../../game';

export default {
  category: 'politics',
  effects: ['draw-one'],
  id: 'event-1940-1',
  name: 'united-nations',
  number: 1940,
  type: 'event',
} as const satisfies EventCard;
