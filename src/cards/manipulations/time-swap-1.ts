import type { ManipulationCard } from '../../game';

export default {
  action: 'time-swap',
  id: 'time-swap-1',
  type: 'manipulation',
} as const satisfies ManipulationCard;
