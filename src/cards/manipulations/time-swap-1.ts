import type { ManipulationCard } from '../../game';

export default {
  id: 'time-swap-1',
  type: 'manipulation',
  action: 'time-swap',
} as const satisfies ManipulationCard;
