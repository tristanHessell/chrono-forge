import type { ManipulationCard } from '../../game';

export default {
  id: 'take-control-2',
  type: 'manipulation',
  action: 'take-control',
} as const satisfies ManipulationCard;
