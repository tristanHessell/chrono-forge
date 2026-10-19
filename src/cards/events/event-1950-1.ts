import type { EventCard } from '../../game';

export default {
  id: 'event-1950-1',
  type: 'event',
  name: 'cold-war',
  number: 1950,
  category: 'political',
} as const satisfies EventCard;
