import type { CardPosition, CommandAction, PlacedCard, PlayerId } from './game';
import {
  ADJACENT_OFFSETS,
  areAdjacent,
  isValidBoard,
  positionKey,
} from './gameRules';

// Re-check all cards in their effective link order, not just the destination.
// This preserves arrow/date rules and keeps every timeline connected to the start.
export { isValidBoard } from './gameRules';

export function applyCommand(
  played: PlacedCard[],
  action: CommandAction,
  targetId: string,
  owner: PlayerId,
  destination?: CardPosition | string,
): null | PlacedCard[] {
  if (action === 'time-jump') {
    return destination && typeof destination === 'object'
      ? applyTimeJump(played, targetId, destination)
      : null;
  }
  if (action === 'time-swap') {
    return typeof destination === 'string'
      ? applyTimeSwap(played, targetId, destination)
      : null;
  }

  const target = played.find((card) => card.id === targetId);

  if (
    !target ||
    target.owner === 'neutral' ||
    (action === 'take-control' ? target.owner === owner : target.removed)
  ) {
    return null;
  }

  return played.map((card) =>
    card.id === targetId
      ? action === 'take-control'
        ? { ...card, owner }
        : { ...card, removed: true }
      : card,
  );
}

export function applyTimeJump(
  played: PlacedCard[],
  targetId: string,
  destination: CardPosition,
): null | PlacedCard[] {
  const target = played.find((card) => card.id === targetId);
  const occupying = played.find(
    (card) => positionKey(card) === positionKey(destination),
  );

  if (
    !target ||
    target.owner === 'neutral' ||
    !Number.isInteger(destination.row) ||
    !Number.isInteger(destination.column) ||
    (!occupying &&
      played.some(
        (card) =>
          card.id !== targetId &&
          card.removed &&
          areAdjacent(card, destination),
      )) ||
    (occupying &&
      (!occupying.removed ||
        occupying.owner === 'neutral' ||
        occupying.id === targetId))
  ) {
    return null;
  }

  const result = played
    .filter((card) => card.id !== occupying?.id)
    .map((card) =>
      card.id === targetId
        ? {
            ...card,
            column: destination.column,
            placedAt: occupying?.placedAt ?? card.placedAt,
            row: destination.row,
          }
        : card,
    );

  if (isValidBoard(result)) {
    return result;
  }
  if (occupying) {
    return null;
  }

  // Reconnect after existing Events when preserving play order reverses a new
  // link. The date rules still determine whether the new links are valid.
  const reconnected = result.map((card) =>
    card.id === targetId
      ? {
          ...card,
          placedAt: Math.max(...played.map((event) => event.placedAt)) + 1,
        }
      : card,
  );

  return isValidBoard(reconnected) ? reconnected : null;
}

export function applyTimeSwap(
  played: PlacedCard[],
  firstId: string,
  secondId: string,
): null | PlacedCard[] {
  const first = played.find((card) => card.id === firstId);
  const second = played.find((card) => card.id === secondId);

  if (
    !first ||
    !second ||
    firstId === secondId ||
    first.owner === 'neutral' ||
    second.owner === 'neutral'
  ) {
    return null;
  }

  const result = played.map((card) =>
    card.id === firstId
      ? { ...card, column: second.column, row: second.row }
      : card.id === secondId
        ? { ...card, column: first.column, row: first.row }
        : card,
  );

  if (isValidBoard(result)) {
    return result;
  }

  const ordered = [...result].sort(
    (firstCard, secondCard) =>
      firstCard.number - secondCard.number ||
      firstCard.placedAt - secondCard.placedAt,
  );
  const placementOrder = new Map(
    ordered.map((card, index) => [card.id, index]),
  );
  const reconnected = result.map((card) => ({
    ...card,
    placedAt: placementOrder.get(card.id)!,
  }));

  return isValidBoard(reconnected) ? reconnected : null;
}

export function getTimeJumpPositions(
  played: PlacedCard[],
  targetId: string,
): CardPosition[] {
  const candidates = new Map<string, CardPosition>();

  for (const card of played) {
    if (card.removed) {
      candidates.set(positionKey(card), { column: card.column, row: card.row });
    }

    for (const offset of ADJACENT_OFFSETS) {
      const position = {
        column: card.column + offset.column,
        row: card.row + offset.row,
      };

      candidates.set(positionKey(position), position);
    }
  }

  return [...candidates.values()].filter((position) =>
    applyTimeJump(played, targetId, position),
  );
}
