import type { EventCard } from '../../game';

export default {
  category: 'tech',
  effects: ['draw-one'],
  id: 'event-1940-2',
  name: 'atomic-age',
  number: 1940,
  type: 'event',
} as const satisfies EventCard;
