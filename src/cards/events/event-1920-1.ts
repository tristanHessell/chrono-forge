import type { EventCard } from '../../game';

export default {
  id: 'event-1920-1',
  type: 'event',
  name: 'suffrage',
  number: 1920,
  category: 'political',
} as const satisfies EventCard;
