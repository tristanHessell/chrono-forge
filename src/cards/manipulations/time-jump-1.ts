import type { ManipulationCard } from '../../game';

export default {
  id: 'time-jump-1',
  type: 'manipulation',
  action: 'time-jump',
} as const satisfies ManipulationCard;
