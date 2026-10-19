import type { EventCard } from '../../game';

export default {
  id: 'event-1940-2',
  type: 'event',
  number: 1940,
  effect: 'draw-one',
  category: 'technological',
} as const satisfies EventCard;
