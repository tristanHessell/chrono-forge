import type { CommandCard } from '../../game';

export default {
  action: 'time-jump',
  id: 'time-jump-3',
  type: 'command',
} as const satisfies CommandCard;
