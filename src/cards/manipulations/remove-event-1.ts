import type { ManipulationCard } from '../../game';

export default {
  id: 'remove-event-1',
  type: 'manipulation',
  action: 'remove-event',
} as const satisfies ManipulationCard;
