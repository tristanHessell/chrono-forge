import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import { chooseComputerAction } from './computer';
import { canUndoMove, CardGame, createCardGame } from './game';
import { exportGameLog, parseGameLog, replayGameLog } from './gameLog';
import { getAvailablePositions } from './gameRules';

describe.each([2, 3, 4] as const)('%i-player seeded replay', (numPlayers) => {
  it('reproduces every confirmed action, turn transition and history', () => {
    const seed = 'replay-test';
    const client = Client({
      debug: false,
      game: { ...CardGame, seed },
      numPlayers,
    });
    const states = [client.getState()!];

    for (
      let index = 0;
      index < 24 || client.getState()!.G.pending;
      index += 1
    ) {
      const { ctx, G } = client.getState()!;
      const action = chooseComputerAction(G, ctx.currentPlayer as '0');

      if (!action) {
        throw new Error('Expected a computer action');
      }
      if (action.type === 'play') {
        client.moves.playCard(action.cardId, action.position);
      } else if (action.type === 'confirm') {
        client.moves.confirmPlacement();
      } else if (action.type === 'discard') {
        client.moves.discardCard(action.cardId);
      } else {
        client.moves.command(
          action.cardId,
          action.targetId,
          action.destination,
        );
      }
      if (action.type !== 'play') {
        states.push(client.getState()!);
      }
    }
    client.moves.undoTest();
    client.moves.redoTest();

    const text = exportGameLog(seed, numPlayers, client.log);
    const log = parseGameLog(text);

    expect(log.actions).toHaveLength(states.length - 1);

    for (const [step, expected] of states.entries()) {
      const replay = replayGameLog(log, step);

      expect(replay.getState()!.G).toStrictEqual(expected.G);
      expect(replay.getState()!.ctx).toMatchObject({
        currentPlayer: expected.ctx.currentPlayer,
        turn: expected.ctx.turn,
      });

      replay.stop();
    }

    const replay = replayGameLog(log);

    expect(
      parseGameLog(exportGameLog(seed, numPlayers, replay.log)),
    ).toStrictEqual(log);

    client.stop();
    replay.stop();
  });
});

describe('gameLog', () => {
  it('rejects malformed or incompatible logs and unknown actions', () => {
    const valid = parseGameLog(exportGameLog('seed', 2, []));

    for (const input of [
      'no JSON',
      'null',
      '{}',
      JSON.stringify({ ...valid, version: 99 }),
      JSON.stringify({ ...valid, rulesVersion: 3 }),
      JSON.stringify({ ...valid, numPlayers: 5 }),
      JSON.stringify({ ...valid, actions: [{ type: 'RESET' }] }),
    ]) {
      expect(() => parseGameLog(input)).toThrow('');
    }

    expect(() => replayGameLog(valid, -1)).toThrow(
      'Choose a valid action number.',
    );
    expect(() => replayGameLog(valid, 1)).toThrow(
      'Choose a valid action number.',
    );
    expect(() => replayGameLog(valid, 0.5)).toThrow(
      'Choose a valid action number.',
    );
  });

  it('keeps confirmed actions in the exported replay', () => {
    const seed = 'card-use-history';
    const client = Client({ debug: false, game: { ...CardGame, seed } });
    const first = client.getState()!.G.hands['0'][0].id;
    const second = client.getState()!.G.hands['0'][1].id;
    const exported = () => parseGameLog(exportGameLog(seed, 2, client.log));

    client.moves.discardCard(first);
    client.moves.discardCard(second);

    expect(exported().actions).toHaveLength(2);
    expect(canUndoMove(client.getState()!.G)).toBe(false);

    client.moves.undoTest();

    expect(exported().actions).toHaveLength(2);

    client.stop();
  });

  it('preserves a non-zero starting player in a replay', () => {
    const seed = 'non-zero-starting-player';
    const client = Client({
      debug: false,
      game: { ...createCardGame('1'), seed },
      numPlayers: 2,
    });

    client.moves.discardCard(client.getState()!.G.hands['1'][0].id);

    const log = parseGameLog(exportGameLog(seed, 2, client.log, '1'));
    const replay = replayGameLog(log);

    expect(log.startingPlayer).toBe('1');
    expect(replay.getState()!.G).toStrictEqual(client.getState()!.G);
    expect(replay.getState()!.ctx.currentPlayer).toBe(
      client.getState()!.ctx.currentPlayer,
    );

    client.stop();
    replay.stop();
  });

  it('omits draft activity and records only the final confirmed card and position', () => {
    const seed = 'replay-test';
    const client = Client({ debug: false, game: { ...CardGame, seed } });
    const initial = client.getState()!.G;
    const events = initial.hands['0'].filter((card) => card.type === 'event');

    client.moves.playCard(events[0].id, { column: 1, row: 0 });
    client.moves.movePendingCard({ column: 0, row: -1 });
    client.moves.replacePendingCard(events[1].id);

    const draftLog = parseGameLog(exportGameLog(seed, 2, client.log));
    const draftReplay = replayGameLog(draftLog);

    expect(draftLog.actions).toStrictEqual([]);
    expect(draftReplay.getState()!.G).toStrictEqual(initial);

    client.moves.confirmPlacement();

    const confirmedLog = parseGameLog(exportGameLog(seed, 2, client.log));
    const replay = replayGameLog(confirmedLog);

    expect(confirmedLog.actions).toHaveLength(1);
    expect(confirmedLog.actions[0].payload).toMatchObject({
      args: [events[1].id, { column: 0, row: -1 }],
      type: 'playEvent',
    });
    expect(replay.getState()!.G).toStrictEqual(client.getState()!.G);

    client.stop();
    draftReplay.stop();
    replay.stop();
  });

  it('converts earlier JSON logs with draft moves to confirmed actions', () => {
    const seed = 'replay-test';
    const client = Client({ debug: false, game: { ...CardGame, seed } });
    const card = client
      .getState()!
      .G.hands['0'].find((card) => card.type === 'event')!;
    const action = (type: string, args: unknown[]) => ({
      payload: { args, playerID: '0', type },
      type: 'MAKE_MOVE',
    });
    const log = parseGameLog(
      JSON.stringify({
        actions: [
          action('playCard', [card.id, { column: 1, row: 0 }]),
          action('movePendingCard', [{ column: 0, row: -1 }]),
          action('confirmPlacement', []),
        ],
        numPlayers: 2,
        rulesVersion: 2,
        seed,
        version: 1,
      }),
    );

    expect(log.version).toBe(2);
    expect(log.actions).toHaveLength(1);
    expect(log.actions[0].payload).toMatchObject({
      args: [card.id, { column: 0, row: -1 }],
      type: 'playEvent',
    });

    client.stop();
  });

  it('replays repositioning, replacement, returning to hand, and branching after undo', () => {
    const seed = 'replay-test';
    const client = Client({ debug: false, game: { ...CardGame, seed } });
    const hand = client
      .getState()!
      .G.hands['0'].filter((card) => card.type === 'event');
    const first = hand[0];
    const second = hand[1];
    const positions = getAvailablePositions(client.getState()!.G.played, first);

    expect(second).toBeDefined();

    client.moves.playCard(first.id, positions[0]);
    client.moves.movePendingCard(positions[1]);
    client.moves.replacePendingCard(second.id);
    client.moves.returnPendingCard();
    client.moves.playCard(first.id, positions[2]);
    client.moves.confirmPlacement();
    client.moves.undoTest();
    client.moves.discardCard(second.id);

    const log = parseGameLog(exportGameLog(seed, 2, client.log));
    const replay = replayGameLog(log);

    expect(replay.getState()!.G).toStrictEqual(client.getState()!.G);
    expect(replay.getState()!.ctx.currentPlayer).toBe(
      client.getState()!.ctx.currentPlayer,
    );

    client.stop();
    replay.stop();
  });

  it('replays explicit debug turn events without duplicating move-triggered turn events', () => {
    const seed = 'debug-turn';
    const client = Client({ debug: false, game: { ...CardGame, seed } });

    client.events.endTurn!({ next: '1' });

    const log = parseGameLog(exportGameLog(seed, 2, client.log));
    const replay = replayGameLog(log);

    expect(log.actions).toHaveLength(1);
    expect(replay.getState()!.G).toStrictEqual(client.getState()!.G);
    expect(replay.getState()!.ctx).toStrictEqual(client.getState()!.ctx);

    client.stop();
    replay.stop();
  });

  it('folds framework undo and redo into card uses without recording either operation', () => {
    const seed = 'framework-history';
    const client = Client({ debug: false, game: { ...CardGame, seed } });

    client.moves.discardCard(client.getState()!.G.hands['0'][0].id);
    client.undo();
    client.redo();

    const log = parseGameLog(exportGameLog(seed, 2, client.log));
    const replay = replayGameLog(log);

    expect(log.actions.map((action) => action.type)).toStrictEqual([
      'MAKE_MOVE',
    ]);
    expect(replay.getState()!.G).toStrictEqual(client.getState()!.G);
    expect(replay.getState()!.ctx).toStrictEqual(client.getState()!.ctx);

    client.stop();
    replay.stop();
  });

  it('does not change the existing game when a replay fails', () => {
    const client = Client({
      debug: false,
      game: { ...CardGame, seed: 'unchanged' },
    });
    const before = client.getState()!;
    const text = JSON.stringify({
      actions: [
        {
          payload: { args: [null, null], playerID: '1', type: 'playEvent' },
          type: 'MAKE_MOVE',
        },
      ],
      numPlayers: 2,
      rulesVersion: 2,
      seed: 'bad-arguments',
      version: 2,
    });

    expect(() => replayGameLog(parseGameLog(text))).toThrow('');
    expect(client.getState()).toStrictEqual(before);

    client.stop();
  });
});
