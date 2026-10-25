import type { PlacedCard, PlayerId } from './game';
import { areAdjacent } from './gameRules';

export function timelineIncludes1900(
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

export function calculateScoreBreakdown(
  played: PlacedCard[],
): Partial<Record<PlayerId, { base: number; bonus: number; total: number }>> {
  const scores: Partial<
    Record<PlayerId, { base: number; bonus: number; total: number }>
  > = {
    '0': { base: 0, bonus: 0, total: 0 },
    '1': { base: 0, bonus: 0, total: 0 },
  };

  for (const card of played) {
    if (card.owner === 'neutral' || card.removed) {
      continue;
    }

    const score = (scores[card.owner] ??= { base: 0, bonus: 0, total: 0 });

    score.base += 1;

    if (timelineIncludes1900(card, played)) {
      score.bonus +=
        card.effects?.filter((effect) => effect === 'timeline-1900-bonus')
          .length ?? 0;
    }

    score.total = score.base + score.bonus;
  }

  return scores;
}

export function calculateScores(
  played: PlacedCard[],
): Partial<Record<PlayerId, number>> {
  const scores = calculateScoreBreakdown(played);

  return Object.fromEntries(
    Object.entries(scores).map(([id, score]) => [id, score.total]),
  );
}
