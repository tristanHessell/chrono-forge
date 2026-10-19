import type { EventCard } from '../../game';

export default {
  id: 'event-1980-2',
  type: 'event',
  name: 'personal-computers',
  number: 1980,
  category: 'technological',
} as const satisfies EventCard;
