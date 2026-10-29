import type { CommandCard } from '../../game';

export default {
  action: 'time-swap',
  id: 'time-swap-1',
  type: 'command',
} as const satisfies CommandCard;
