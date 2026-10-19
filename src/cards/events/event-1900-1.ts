import type { EventCard } from '../../game';

export default {
  id: 'event-1900-1',
  type: 'event',
  name: 'imperial-alliances',
  number: 1900,
  category: 'political',
} as const satisfies EventCard;
