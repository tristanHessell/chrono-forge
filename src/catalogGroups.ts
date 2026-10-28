import type { Card } from './game';

export function catalogGroups(deck: Card[]) {
  const groups = new Map<string, Card[]>();

  for (const card of deck) {
    const key =
      card.type === 'event'
        ? `event:${card.category ?? 'neutral'}`
        : `manipulation:${card.action}`;
    const cards = groups.get(key) ?? [];

    cards.push(card);
    groups.set(key, cards);
  }

  return [...groups].map(([id, cards]) => ({
    cards: [...cards].sort(
      (left, right) =>
        (left.number ?? 0) - (right.number ?? 0) ||
        left.id.localeCompare(right.id),
    ),
    id,
  }));
}
