import { describe, expect, it } from 'vitest';

import {
  applyTimeJump,
  getTimeJumpPositions,
  isValidBoard,
} from './commandRules';
import setup from './fixtures/removed-time-jump.json';
import { exportGameLog, parseGameLog, replayGameLog } from './gameLog';

// TODO move this test to the be colocated with the fixture

describe('removedTimeJump', () => {
  it.each([false, true])(
    'rejects building off another removed Event when the jumping card is removed: %s',
    (removed) => {
      const client = replayGameLog(parseGameLog(JSON.stringify(setup)));
      const played = client
        .getState()!
        .G.played.map((card) =>
          card.id === 'event-1910-2'
            ? { ...card, removed: true }
            : card.id === 'event-1940-3'
              ? { ...card, removed }
              : card,
        );
      const destination = { column: 0, row: -2 };

      expect(isValidBoard(played)).toBe(true);
      expect(applyTimeJump(played, 'event-1940-3', destination)).toBeNull();
      expect(getTimeJumpPositions(played, 'event-1940-3')).not.toContainEqual(
        destination,
      );
      expect(
        applyTimeJump(played, 'event-1940-3', { column: 1, row: 0 }),
      ).not.toBeNull();

      client.stop();
    },
  );

  it.each([
    { column: 0, row: -2 },
    { column: 1, row: -1 },
  ])(
    'allows the removed 1920 Event to reconnect to 1910 at $row, $column',
    (destination) => {
      const client = replayGameLog(parseGameLog(JSON.stringify(setup)));
      const before = client.getState()!;
      const target = before.G.played.find(
        (card) => card.id === 'event-1920-3',
      )!;
      const jump = before.G.hands['0'].find(
        (card) => card.type === 'command' && card.action === 'time-jump',
      )!;

      expect(target).toMatchObject({ placedAt: 1, removed: true });
      expect(getTimeJumpPositions(before.G.played, target.id)).toContainEqual(
        destination,
      );
      expect(
        applyTimeJump(before.G.played, target.id, { column: -2, row: -1 }),
      ).toBeNull();
      expect(jump).toBeDefined();

      client.moves.manipulate(jump.id, target.id, destination);

      const after = client.getState()!;
      const moved = after.G.played.find((card) => card.id === target.id)!;

      expect(moved).toMatchObject({
        ...destination,
        number: 1920,
        owner: '0',
        removed: true,
      });
      expect(moved.placedAt).toBeGreaterThan(
        Math.max(...before.G.played.map((card) => card.placedAt)),
      );
      expect(after.G.nextPlacementOrder).toBeGreaterThan(moved.placedAt);
      expect(after.G.actionsThisTurn).toBe(1);
      expect(isValidBoard(after.G.played)).toBe(true);
      expect(after.G.deck).toStrictEqual(before.G.deck);

      client.moves.undoTest();

      expect(client.getState()!.G.played).toStrictEqual(before.G.played);
      expect(client.getState()!.G.nextPlacementOrder).toBe(
        before.G.nextPlacementOrder,
      );

      client.moves.redoTest();

      expect(client.getState()!.G.played).toStrictEqual(after.G.played);

      const replay = replayGameLog(
        parseGameLog(exportGameLog(setup.seed, 2, client.log, '0', 2)),
      );

      expect(replay.getState()!.G.played).toStrictEqual(after.G.played);

      client.stop();
      replay.stop();
    },
  );
});
