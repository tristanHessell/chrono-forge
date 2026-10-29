import type { CommandCard } from '../../game';

export default {
  action: 'remove-event',
  id: 'remove-event-1',
  type: 'command',
} as const satisfies CommandCard;
