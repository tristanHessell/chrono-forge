import { describe, expect, it } from 'vitest';

import { applyTimeSwap } from './commandRules';
import setup from './fixtures/issue-64-replay.json';
import { parseGameLog, replayGameLog } from './gameLog';
import { areAdjacent, isValidBoard } from './gameRules';

describe('timeSwapLeafNodes', () => {
  it('replays the issue 64 log and validates leaf node swaps with European Union', () => {
    const client = replayGameLog(parseGameLog(JSON.stringify(setup)));

    try {
      const { ctx, G } = client.getState()!;
      const played = G.played;
      const eu = played.find((card) => card.id === 'event-1990-1')!;

      expect(eu).toMatchObject({
        column: 3,
        id: 'event-1990-1',
        number: 1990,
        row: 0,
      });

      const neighbor = played.find((card) => areAdjacent(card, eu))!;

      expect(neighbor).toMatchObject({
        column: 2,
        id: 'event-1960-3',
        number: 1960,
        row: 0,
      });

      // Leaf nodes with dates later than 1960 can swap with European Union.
      const validSwapIds = [
        'event-1970-1',
        'event-1970-2',
        'event-1970-3',
        'event-1980-2',
        'event-1990-2',
      ];

      for (const targetId of validSwapIds) {
        const target = played.find((card) => card.id === targetId)!;

        expect(target.number).toBeGreaterThan(neighbor.number);

        const swapped = applyTimeSwap(played, eu.id, target.id);

        expect(swapped).not.toBeNull();
        expect(isValidBoard(swapped!)).toBe(true);
      }

      // Leaf nodes with dates on or earlier than 1960 cannot swap into (0, 3)
      // because the incoming neighbor (0, 2) is a 1960 Event.
      const invalidSwapIds = [
        'event-1920-2',
        'event-1930-3',
        'event-1950-3',
        'event-1960-2',
      ];

      for (const targetId of invalidSwapIds) {
        const target = played.find((card) => card.id === targetId)!;

        expect(target.number).toBeLessThanOrEqual(neighbor.number);
        expect(applyTimeSwap(played, eu.id, target.id)).toBeNull();
      }

      const activeHand = G.hands[ctx.currentPlayer];
      const timeSwap = activeHand.find(
        (card) => card.type === 'command' && card.action === 'time-swap',
      );

      expect(timeSwap).toBeDefined();

      const chosenTargetId = 'event-1970-2';
      const expectedBoard = applyTimeSwap(played, eu.id, chosenTargetId)!;

      client.moves.command(timeSwap!.id, eu.id, chosenTargetId);

      expect(client.getState()!.G.played).toStrictEqual(expectedBoard);
    } finally {
      client.stop();
    }
  });
});
