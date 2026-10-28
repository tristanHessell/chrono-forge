import type { ManipulationCard } from '../../game';

export default {
  action: 'remove-event',
  id: 'remove-event-1',
  type: 'manipulation',
} as const satisfies ManipulationCard;
