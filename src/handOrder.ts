import type { Card } from './game';

export function restoreHandOrder(cards: Card[], ids: string[]): Card[] {
  const remaining = new Map(cards.map((card) => [card.id, card]));
  const ordered: Card[] = [];

  for (const id of ids) {
    const card = remaining.get(id);

    if (card) {
      ordered.push(card);
      remaining.delete(id);
    }
  }

  return [...ordered, ...remaining.values()];
}

export function moveHandCard(
  cards: Card[],
  sourceId: string,
  targetId: string,
  before: boolean,
): Card[] {
  const source = cards.find((card) => card.id === sourceId);

  if (
    !source ||
    sourceId === targetId ||
    !cards.some((card) => card.id === targetId)
  ) {
    return [...cards];
  }

  const ordered = cards.filter((card) => card.id !== sourceId);
  const targetIndex = ordered.findIndex((card) => card.id === targetId);

  ordered.splice(targetIndex + (before ? 0 : 1), 0, source);

  return ordered;
}
