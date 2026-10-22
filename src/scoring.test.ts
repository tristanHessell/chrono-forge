import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import { canUndoMove, CardGame, type PlacedCard } from './game';
import { calculateScoreBreakdown, calculateScores } from './scoring';

function placed(
  number: number,
  row: number,
  column: number,
  placedAt: number,
  owner: PlacedCard['owner'] = '0',
): PlacedCard {
  return {
    id: `${row}:${column}`,
    type: 'event',
    number,
    row,
    column,
    placedAt,
    owner,
    ...(number === 1990 ? { effect: 'timeline-1900-bonus' as const } : {}),
  };
}

const start = placed(0, 0, 0, 0, 'neutral');
const timeline = [start, placed(1900, 0, 1, 1), placed(1950, 0, 2, 2)];

describe('base scoring', () => {
  it('awards each board card to its owner and excludes the neutral start', () => {
    expect(
      calculateScoreBreakdown([
        ...timeline,
        placed(1980, 1, 0, 3, '1'),
        placed(1990, 0, 3, 4, '1'),
      ]),
    ).toEqual({
      '0': { base: 2, bonus: 0, total: 2 },
      '1': { base: 2, bonus: 1, total: 3 },
    });
    expect(calculateScores([start])).toEqual({ '0': 0, '1': 0 });
  });

  it('includes base and bonus points when the last play ends the game', () => {
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          played: timeline,
          nextPlacementOrder: 3,
          deck: [],
          hands: {
            ...CardGame.setup!(context).hands,
            '0': [
              loadCardCatalog().deck.find(
                (card) => card.id === 'event-1990-1',
              )!,
            ],
            '1': [],
          },
        }),
      },
      numPlayers: 2,
    });

    client.moves.playCard('event-1990-1', { row: 0, column: 3 });
    expect(calculateScores(client.getState()!.G.played)['0']).toBe(2);
    client.moves.confirmPlacement();
    expect(client.getState()!.G.roundOver).toBe(true);
    expect(calculateScoreBreakdown(client.getState()!.G.played)['0']).toEqual({
      base: 3,
      bonus: 1,
      total: 4,
    });
    client.moves.undoTest();
    expect(client.getState()!.G.roundOver).toBe(false);
    expect(calculateScores(client.getState()!.G.played)['0']).toBe(2);
  });
});

describe('1900 timeline bonus', () => {
  it('is listed on every 1990 card in the catalog', () => {
    const cards = loadCardCatalog().deck.filter((card) => card.number === 1990);

    expect(cards).toHaveLength(3);
    expect(cards.every((card) => card.effect === 'timeline-1900-bonus')).toBe(
      true,
    );
  });

  it('scores a direct or indirect timeline connection for the 1990 owner', () => {
    expect(
      calculateScores([start, placed(1900, 0, 1, 1), placed(1990, 0, 2, 2)]),
    ).toEqual({ '0': 3, '1': 0 });
    expect(calculateScores([...timeline, placed(1990, 0, 3, 3, '1')])).toEqual({
      '0': 2,
      '1': 2,
    });
  });

  it('does not count a 1900 on a separate branch through the starting card', () => {
    expect(calculateScores([...timeline, placed(1990, 1, 0, 3)])).toEqual({
      '0': 3,
      '1': 0,
    });
  });

  it('counts each qualifying 1990 once and allows multiple cards to score', () => {
    const played = [
      ...timeline,
      placed(1990, 0, 3, 3),
      placed(1990, 1, 2, 4, '1'),
    ];

    expect(calculateScores(played)).toEqual({ '0': 4, '1': 2 });

    const two1900 = [
      start,
      placed(1900, 0, 1, 1),
      placed(1900, 1, 0, 2),
      placed(1990, 1, 1, 3),
    ];

    expect(calculateScores(two1900)['0']).toBe(4);
  });

  it('updates the bonus after confirmation, undo, and redo', () => {
    const client = Client({
      game: {
        ...CardGame,
        setup: (context) => ({
          ...CardGame.setup!(context),
          played: timeline,
          nextPlacementOrder: 3,
          hands: {
            ...CardGame.setup!(context).hands,
            '0': [
              loadCardCatalog().deck.find(
                (card) => card.id === 'event-1990-1',
              )!,
            ],
          },
        }),
      },
      numPlayers: 2,
    });

    client.moves.playCard('event-1990-1', { row: 0, column: 3 });
    expect(calculateScores(client.getState()!.G.played)['0']).toBe(2);
    client.moves.confirmPlacement();
    expect(calculateScores(client.getState()!.G.played)['0']).toBe(4);
    expect(canUndoMove(client.getState()!.G)).toBe(false);
    client.moves.undoTest();
    expect(calculateScores(client.getState()!.G.played)['0']).toBe(4);
  });
});
