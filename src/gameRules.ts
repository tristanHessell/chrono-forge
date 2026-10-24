import type { Card, CardPosition, PlacedCard } from './game';

export const ADJACENT_OFFSETS: CardPosition[] = [
  { row: -1, column: 0 },
  { row: 0, column: -1 },
  { row: 0, column: 1 },
  { row: 1, column: 0 },
];

export const positionKey = ({ row, column }: CardPosition) =>
  `${row}:${column}`;

export const areAdjacent = (first: CardPosition, second: CardPosition) =>
  Math.abs(first.row - second.row) + Math.abs(first.column - second.column) ===
  1;

export const wouldCreateSquare = (
  played: PlacedCard[],
  position: CardPosition,
) => {
  const occupiedPositions = new Set(played.map(positionKey));
  const candidateSquares = [
    { row: position.row - 1, column: position.column - 1 },
    { row: position.row - 1, column: position.column },
    { row: position.row, column: position.column - 1 },
    { row: position.row, column: position.column },
  ];

  return candidateSquares.some(({ row, column }) => {
    const square = [
      { row, column },
      { row: row + 1, column },
      { row, column: column + 1 },
      { row: row + 1, column: column + 1 },
    ];

    return square
      .filter(
        (squarePosition) =>
          positionKey(squarePosition) !== positionKey(position),
      )
      .every((squarePosition) =>
        occupiedPositions.has(positionKey(squarePosition)),
      );
  });
};

export const wouldCreateHeadToHeadMerge = (
  played: PlacedCard[],
  position: CardPosition,
) => {
  const neighbors = played.filter((card) => areAdjacent(card, position));
  const hasTop = neighbors.some(
    (card) => card.row === position.row - 1 && card.column === position.column,
  );
  const hasBottom = neighbors.some(
    (card) => card.row === position.row + 1 && card.column === position.column,
  );
  const hasLeft = neighbors.some(
    (card) => card.row === position.row && card.column === position.column - 1,
  );
  const hasRight = neighbors.some(
    (card) => card.row === position.row && card.column === position.column + 1,
  );

  return (hasTop && hasBottom) || (hasLeft && hasRight);
};

const isValidEventPlacement = (
  played: PlacedCard[],
  position: CardPosition,
  card?: Card,
) => {
  if (card && card.type !== 'event') {
    return false;
  }
  if (!Number.isInteger(position.row) || !Number.isInteger(position.column)) {
    return false;
  }

  const occupying = played.find(
    (card) => card.row === position.row && card.column === position.column,
  );

  if (occupying) {
    if (!occupying.removed || occupying.owner === 'neutral') {
      return false;
    }

    // Replacements inherit the position's existing links, not new incoming
    // links from every neighbor. Validate both upstream and downstream dates.
    return (
      !card ||
      isValidBoard(
        withPlacedEvent(played, {
          ...card,
          row: position.row,
          column: position.column,
          owner: '0',
          placedAt: occupying.placedAt,
        }),
      )
    );
  }

  const remaining = played;
  const positionIsAdjacent = remaining.some((card) =>
    areAdjacent(card, position),
  );

  const valid =
    (!card ||
      remaining.every(
        (neighbor) =>
          !areAdjacent(neighbor, position) || neighbor.number < card.number,
      )) &&
    (remaining.length === 0 || positionIsAdjacent) &&
    !wouldCreateSquare(
      remaining.filter((neighbor) => !neighbor.removed),
      position,
    ) &&
    !wouldCreateHeadToHeadMerge(remaining, position);

  return valid;
};

export const isValidPlacement = (
  played: PlacedCard[],
  position: CardPosition,
  card?: Card,
) => isValidEventPlacement(played, position, card);

export function withPlacedEvent(
  played: PlacedCard[],
  card: PlacedCard,
): PlacedCard[] {
  const overwritten = played.find(
    (existing) => positionKey(existing) === positionKey(card),
  );

  return [
    ...played.filter((existing) => positionKey(existing) !== positionKey(card)),
    overwritten?.removed ? { ...card, placedAt: overwritten.placedAt } : card,
  ];
}

export function isValidBoard(played: PlacedCard[]): boolean {
  const ordered = [...played].sort((a, b) => a.placedAt - b.placedAt);

  if (
    !ordered.length ||
    ordered[0].owner !== 'neutral' ||
    new Set(played.map(positionKey)).size !== played.length
  ) {
    return false;
  }

  return ordered.every(
    (card, index) =>
      index === 0 || isValidEventPlacement(ordered.slice(0, index), card, card),
  );
}

export const getAvailablePositions = (
  played: PlacedCard[],
  selectedCard?: Card,
) => {
  const occupiedPositions = new Set(
    played.filter((card) => !card.removed).map(positionKey),
  );

  return Array.from(
    new Map(
      played.flatMap((card) =>
        [
          ...(card.removed ? [{ row: card.row, column: card.column }] : []),
          ...ADJACENT_OFFSETS.map(({ row, column }) => ({
            row: card.row + row,
            column: card.column + column,
          })),
        ]
          .filter(
            (position) =>
              !occupiedPositions.has(positionKey(position)) &&
              isValidPlacement(played, position, selectedCard),
          )
          .map((position) => [positionKey(position), position]),
      ),
    ).values(),
  );
};
