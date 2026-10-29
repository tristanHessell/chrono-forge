import type { EventCard } from '../../game';

export default {
  category: 'nature',
  effects: ['timeline-1900-bonus'],
  id: 'event-1990-3',
  name: 'climate-summit',
  number: 1990,
  type: 'event',
} as const satisfies EventCard;
