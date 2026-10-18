import type { ManipulationCard } from '../../game';

export default {
  id: 'time-jump-3',
  type: 'manipulation',
  action: 'time-jump',
} as const satisfies ManipulationCard;
