import type { ManipulationCard } from '../../game';

export default {
  action: 'time-jump',
  id: 'time-jump-1',
  type: 'manipulation',
} as const satisfies ManipulationCard;
