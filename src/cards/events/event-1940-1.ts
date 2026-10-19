import type { EventCard } from '../../game';

export default {
  id: 'event-1940-1',
  type: 'event',
  name: 'united-nations',
  number: 1940,
  effect: 'draw-one',
  category: 'political',
} as const satisfies EventCard;
