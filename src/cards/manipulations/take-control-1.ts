import type { ManipulationCard } from '../../game';

export default {
  action: 'take-control',
  id: 'take-control-1',
  type: 'manipulation',
} as const satisfies ManipulationCard;
