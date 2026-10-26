import { describe, expect, it } from 'vitest';

import setup from './fixtures/removed-card-neighbor-replay.json';
import { parseGameLog, replayGameLog } from './gameLog';
import { areAdjacent, isValidBoard } from './gameRules';
import { applyTimeJump, getTimeJumpPositions } from './manipulationRules';

describe('removedCardNeighborReplay', () => {
  it('allows Climate Summit to reconnect beside Silent Spring in the supplied replay', () => {
    const client = replayGameLog(parseGameLog(JSON.stringify(setup)));

    try {
      const { G, ctx } = client.getState()!;
      const played = G.played;
      const climate = played.find((card) => card.id === 'event-1990-3')!;
      const silentSpring = played.find((card) => card.id === 'event-1960-3')!;
      const adjacentDestinations = [
        { row: silentSpring.row - 1, column: silentSpring.column },
        { row: silentSpring.row + 1, column: silentSpring.column },
        { row: silentSpring.row, column: silentSpring.column - 1 },
        { row: silentSpring.row, column: silentSpring.column + 1 },
      ];
      const destination = adjacentDestinations.find((position) =>
        getTimeJumpPositions(played, climate.id).some(
          (candidate) =>
            candidate.row === position.row &&
            candidate.column === position.column,
        ),
      );

      expect(areAdjacent(climate, silentSpring)).toBe(false);
      expect(destination).toBeDefined();

      const jump = G.hands[ctx.currentPlayer].find(
        (card) => card.type === 'manipulation' && card.action === 'time-jump',
      );

      expect(jump).toBeDefined();

      const jumped = applyTimeJump(played, climate.id, destination!)!;
      const movedClimate = jumped.find((card) => card.id === climate.id)!;

      expect(areAdjacent(movedClimate, silentSpring)).toBe(true);
      expect(movedClimate.placedAt).toBeGreaterThan(
        Math.max(...played.map((card) => card.placedAt)),
      );
      expect(isValidBoard(jumped)).toBe(true);

      client.moves.manipulate(jump!.id, climate.id, destination);

      expect(client.getState()!.G.played).toStrictEqual(jumped);
    } finally {
      client.stop();
    }
  });
});
