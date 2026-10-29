import type { CommandCard } from '../../game';

export default {
  action: 'take-control',
  id: 'take-control-2',
  type: 'command',
} as const satisfies CommandCard;
