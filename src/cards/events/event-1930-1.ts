import type { EventCard } from '../../game';

export default {
  category: 'politics',
  effects: ['overwrite-event'],
  id: 'event-1930-1',
  name: 'new-deal',
  number: 1930,
  type: 'event',
} as const satisfies EventCard;
