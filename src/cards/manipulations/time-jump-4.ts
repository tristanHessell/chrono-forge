import type { ManipulationCard } from '../../game';

export default {
  id: 'time-jump-4',
  type: 'manipulation',
  action: 'time-jump',
} as const satisfies ManipulationCard;
