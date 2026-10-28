import type { ManipulationCard } from '../../game';

export default {
  action: 'time-jump',
  id: 'time-jump-2',
  type: 'manipulation',
} as const satisfies ManipulationCard;
