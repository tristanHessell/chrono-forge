import type { EventCard } from '../../game';

export default {
  id: 'event-1940-3',
  type: 'event',
  name: 'green-revolution',
  number: 1940,
  effect: 'draw-one',
  category: 'environmental',
} as const satisfies EventCard;
