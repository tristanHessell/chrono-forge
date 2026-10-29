import type { CommandCard } from '../../game';

export default {
  action: 'take-control',
  id: 'take-control-4',
  type: 'command',
} as const satisfies CommandCard;
