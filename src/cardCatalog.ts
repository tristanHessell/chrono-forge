import definitions from './cards';
import type {
  Card,
  CardEffect,
  CommandAction,
  EventCard,
  EventName,
} from './game';

function readCard(definition: {
  action?: string;
  category?: string;
  effects?: unknown;
  id: string;
  name?: string;
  number?: number;
  type: string;
}): Card {
  if (definition.type === 'command') {
    if (
      !definition.id ||
      ![
        'event-reclaim',
        'time-jump',
        'time-swap',
        'take-control',
        'remove-event',
      ].includes(definition.action ?? '') ||
      definition.category !== undefined ||
      definition.number !== undefined ||
      definition.effects !== undefined ||
      definition.name !== undefined
    ) {
      throw new Error(`Invalid Command card: ${definition.id}`);
    }

    return {
      action: definition.action as CommandAction,
      id: definition.id,
      type: 'command',
    };
  }
  if (
    !definition.id ||
    definition.type !== 'event' ||
    !definition.name ||
    !Number.isInteger(definition.number)
  ) {
    throw new Error(`Invalid card definition: ${definition.id}`);
  }

  const effects = readEffects(definition.effects, definition.id);

  const { category, name, ...card } = definition;

  if (
    category !== undefined &&
    category !== 'politics' &&
    category !== 'tech' &&
    category !== 'nature'
  ) {
    throw new Error(`Unknown Event category: ${category}`);
  }

  return {
    id: card.id,
    name: name as EventName,
    number: card.number!,
    type: 'event',
    ...(category ? { category } : {}),
    ...(effects?.length ? { effects } : {}),
  };
}

export function readEffects(
  value: unknown,
  cardId: string,
): CardEffect[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > 3) {
    throw new Error(`Invalid effects for Event card: ${cardId}`);
  }

  const effects = value.filter(
    (effect: unknown): effect is CardEffect =>
      effect === 'draw-one' ||
      effect === 'free-action' ||
      effect === 'overwrite-event' ||
      effect === 'timeline-1900-bonus',
  );

  if (effects.length !== value.length) {
    throw new Error(`Invalid effects for Event card: ${cardId}`);
  }

  return effects;
}

export function loadCardCatalog(
  includeEventReclaim = true,
  includeEventOverwrite = true,
): { deck: Card[]; startingCard: EventCard } {
  const startingCard = readCard(definitions.startingCard);

  if (startingCard.type !== 'event') {
    throw new Error('The starting card must be an Event.');
  }

  const deck = definitions.deck
    .filter(
      (definition) =>
        includeEventReclaim ||
        definition.type !== 'command' ||
        definition.action !== 'event-reclaim',
    )
    .map((definition) => {
      const card = readCard(definition);

      if (
        includeEventOverwrite ||
        card.type !== 'event' ||
        !card.effects?.includes('overwrite-event')
      ) {
        return card;
      }

      const effects = card.effects.filter(
        (effect) => effect !== 'overwrite-event',
      );

      if (effects.length) {
        return { ...card, effects };
      }

      const withoutEffects = { ...card };

      delete withoutEffects.effects;

      return withoutEffects;
    });

  if (
    deck.some((card) => card.type === 'event' && (!card.category || !card.name))
  ) {
    throw new Error('Every deck Event must have a category and name.');
  }

  const cards = [startingCard, ...deck];

  if (new Set(cards.map((card) => card.id)).size !== cards.length) {
    throw new Error('Card definitions must have unique IDs.');
  }

  return { deck, startingCard };
}
