import type { PlacedCard } from './game';
import { areAdjacent } from './gameRules';

export function timelineIncludes1900 (
  card: PlacedCard,
  played: PlacedCard[],
): boolean {
  const visited = new Set<string>();
  const pending = [card];

  while (pending.length) {
    const current = pending.pop()!;

    if (visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);

    if (current.number === 1900 && !current.removed) {
      return true;
    }

    // Follow incoming arrows only: another branch through the starting card
    // is not part of this card's timeline.
    pending.push(
      ...played.filter(
        (neighbor) =>
          neighbor.placedAt < current.placedAt &&
          areAdjacent(neighbor, current),
      ),
    );
  }

  return false;
}

export function calculateScoreBreakdown (played: PlacedCard[]) {
  const scores: Record<string, { base: number; bonus: number; total: number }> =
    {
      '0': { base: 0, bonus: 0, total: 0 },
      '1': { base: 0, bonus: 0, total: 0 },
    };

  for (const card of played) {
    if (card.owner === 'neutral' || card.removed) {
      continue;
    }

    scores[card.owner] ??= { base: 0, bonus: 0, total: 0 };
    scores[card.owner].base += 1;

    if (
      card.effect === 'timeline-1900-bonus' &&
      timelineIncludes1900(card, played)
    ) {
      scores[card.owner].bonus += 1;
    }

    scores[card.owner].total =
      scores[card.owner].base + scores[card.owner].bonus;
  }

  return scores;
}

export function calculateScores (played: PlacedCard[]) {
  const scores = calculateScoreBreakdown(played);

  return Object.fromEntries(
    Object.entries(scores).map(([id, score]) => [id, score.total]),
  );
}
