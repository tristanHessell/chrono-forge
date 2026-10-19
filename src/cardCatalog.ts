import definitions from './cards';
import type { Card, ManipulationAction } from './game';

function readCard(definition: {
  id: string;
  type: string;
  number?: number;
  action?: string;
  category?: string;
  effect?: string;
}): Card {
  if (definition.type === 'manipulation') {
    if (
      !definition.id ||
      !['time-jump', 'time-swap', 'take-control', 'remove-event'].includes(
        definition.action ?? '',
      ) ||
      definition.category !== undefined ||
      definition.number !== undefined ||
      definition.effect !== undefined
    ) {
      throw new Error(`Invalid Manipulation card: ${definition.id}`);
    }

    return {
      id: definition.id,
      type: 'manipulation',
      action: definition.action as ManipulationAction,
    };
  }
  if (
    !definition.id ||
    definition.type !== 'event' ||
    !Number.isInteger(definition.number)
  ) {
    throw new Error(`Invalid card definition: ${definition.id}`);
  }
  if (
    definition.effect !== undefined &&
    definition.effect !== 'draw-one' &&
    definition.effect !== 'timeline-1900-bonus'
  ) {
    throw new Error(`Unknown card effect: ${definition.effect}`);
  }

  const { effect, category, ...card } = definition;

  if (
    category !== undefined &&
    category !== 'political' &&
    category !== 'technological' &&
    category !== 'environmental'
  ) {
    throw new Error(`Unknown Event category: ${category}`);
  }

  return {
    id: card.id,
    number: card.number!,
    type: definition.type,
    ...(category ? { category } : {}),
    ...(effect ? { effect } : {}),
  };
}

export function loadCardCatalog() {
  const startingCard = readCard(definitions.startingCard);

  if (startingCard.type !== 'event') {
    throw new Error('The starting card must be an Event.');
  }

  const deck = definitions.deck.map(readCard);

  if (deck.some((card) => card.type === 'event' && !card.category)) {
    throw new Error('Every deck card must have an Event category.');
  }

  const cards = [startingCard, ...deck];

  if (new Set(cards.map((card) => card.id)).size !== cards.length) {
    throw new Error('Card definitions must have unique IDs.');
  }

  return { startingCard, deck };
}
