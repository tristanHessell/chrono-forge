import type { EventCard } from '../../game';

export default {
  id: 'event-1900-2',
  type: 'event',
  name: 'powered-flight',
  number: 1900,
  category: 'technological',
} as const satisfies EventCard;
