import type { CommandCard } from '../../game';

export default {
  action: 'take-control',
  id: 'take-control-1',
  type: 'command',
} as const satisfies CommandCard;
