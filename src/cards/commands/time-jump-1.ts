import type { CommandCard } from '../../game';

export default {
  action: 'time-jump',
  id: 'time-jump-1',
  type: 'command',
} as const satisfies CommandCard;
