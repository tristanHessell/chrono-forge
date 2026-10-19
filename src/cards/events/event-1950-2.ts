import type { EventCard } from '../../game';

export default {
  id: 'event-1950-2',
  type: 'event',
  name: 'space-race',
  number: 1950,
  category: 'technological',
} as const satisfies EventCard;
