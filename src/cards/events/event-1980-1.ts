import type { EventCard } from '../../game';

export default {
  id: 'event-1980-1',
  type: 'event',
  name: 'democratic-change',
  number: 1980,
  category: 'political',
} as const satisfies EventCard;
