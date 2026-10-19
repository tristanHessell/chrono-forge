import type { EventCard } from '../../game';

export default {
  id: 'event-1970-2',
  type: 'event',
  name: 'microprocessor',
  number: 1970,
  category: 'technological',
} as const satisfies EventCard;
