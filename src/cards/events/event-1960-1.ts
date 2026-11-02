import type { EventCard } from '../../game';

export default {
  category: 'politics',
  effects: ['overwrite-event'],
  id: 'event-1960-1',
  name: 'civil-rights',
  number: 1960,
  type: 'event',
} as const satisfies EventCard;
