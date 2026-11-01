import type { CommandCard } from '../../game';

export default {
  action: 'event-reclaim',
  id: 'event-reclaim-1',
  type: 'command',
} as const satisfies CommandCard;
