import type { EventCard } from '../../game';

export default {
  id: 'event-1960-2',
  type: 'event',
  name: 'moon-landing',
  number: 1960,
  category: 'technological',
} as const satisfies EventCard;
