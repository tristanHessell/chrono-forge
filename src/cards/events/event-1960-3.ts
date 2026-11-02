import type { EventCard } from '../../game';

export default {
  category: 'nature',
  effects: ['overwrite-event'],
  id: 'event-1960-3',
  name: 'silent-spring',
  number: 1960,
  type: 'event',
} as const satisfies EventCard;
