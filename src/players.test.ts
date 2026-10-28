import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';

import {
  canUndoMove,
  CardGame,
  type CardGameState,
  type PlayerId,
} from './game';
import { calculateScoreBreakdown } from './scoring';

describe.each([3, 4])('%i-player games', (numPlayers) => {
  it('deals five unique cards to every player', () => {
    const client = Client({ game: CardGame, numPlayers });
    const G = client.getState()!.G;

    expect(G.playerIds).toHaveLength(numPlayers);
    expect(Object.values(G.hands).map((hand) => hand.length)).toStrictEqual(
      Array(numPlayers).fill(5),
    );
    expect(G.deck).toHaveLength(46 - numPlayers * 5);
    expect(
      new Set(
        [...Object.values(G.hands).flat(), ...G.deck].map((card) => card.id),
      ).size,
    ).toBe(46);
  });

  it('rotates through all seats and advances rounds only when wrapping', () => {
    const client = Client({ game: CardGame, numPlayers });

    for (let id = 0; id < numPlayers; id += 1) {
      expect(client.getState()!.ctx.currentPlayer).toBe(String(id));
      expect(client.getState()!.G.round).toBe(1);

      client.moves.discardCard(client.getState()!.G.hands[id][0].id);

      expect(client.getState()!.ctx.currentPlayer).toBe(String(id));
      expect(client.getState()!.G.actionsThisTurn).toBe(1);

      client.moves.discardCard(client.getState()!.G.hands[id][0].id);

      expect(client.getState()!.G.hands[id]).toHaveLength(5);
    }

    expect(client.getState()!.ctx.currentPlayer).toBe('0');
    expect(client.getState()!.G.round).toBe(2);

    const after = client.getState()!.G;

    expect(canUndoMove(after)).toBe(false);

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after);

    client.moves.redoTest();

    expect(client.getState()!.G).toStrictEqual(after);
  });

  it('skips empty seats and waits for every hand before ending', () => {
    const client = Client({
      game: {
        ...CardGame,
        setup: (context): CardGameState => {
          const G = CardGame.setup!(context);

          return {
            ...G,
            deck: [],
            hands: Object.fromEntries(
              G.playerIds.map((id) => [
                id,
                id === '1'
                  ? []
                  : [
                      {
                        id: `last-${id}`,
                        name: 'timeline-origin',
                        number: 1900,
                        type: 'event',
                      },
                    ],
              ]),
            ),
          };
        },
      },
      numPlayers,
    });

    client.moves.discardCard('last-0');

    expect(client.getState()!.ctx.currentPlayer).toBe('2');
    expect(client.getState()!.G.roundOver).toBe(false);

    client.moves.discardCard('last-2');

    // eslint-disable-next-line vitest/no-conditional-in-test -- TODO refactor this test to avoid conditional logic
    if (numPlayers === 4) {
      expect(client.getState()!.G.roundOver).toBe(false);
      expect(client.getState()!.ctx.currentPlayer).toBe('3');

      client.moves.discardCard('last-3');
    }

    expect(client.getState()!.G.roundOver).toBe(true);
    expect(client.getState()!.G.round).toBe(1);
  });

  it('gives play effects, scoring and history to the correct third/fourth player', () => {
    const owner = String(numPlayers - 1) as PlayerId;
    const client = Client({
      game: {
        ...CardGame,
        setup: (context): CardGameState => {
          const G = CardGame.setup!(context);

          return {
            ...G,
            deck: [
              {
                id: 'drawn',
                name: 'timeline-origin',
                number: 1960,
                type: 'event',
              },
            ],
            hands: {
              ...G.hands,
              [owner]: [
                {
                  effects: ['draw-one'],
                  id: 'effect',
                  name: 'timeline-origin',
                  number: 1940,
                  type: 'event',
                },
                {
                  id: 'spare',
                  name: 'timeline-origin',
                  number: 1950,
                  type: 'event',
                },
              ],
            },
          };
        },
      },
      numPlayers,
    });

    client.events.endTurn!({ next: owner });

    const before = client.getState()!.G;

    client.moves.playCard(before.hands['0'][0].id, { column: 1, row: 0 });
    client.moves.discardCard(before.hands['0'][0].id);

    expect(client.getState()!.G).toStrictEqual(before);

    client.moves.playCard('effect', { column: 1, row: 0 });

    expect(client.getState()!.G.pending?.owner).toBe(owner);

    client.moves.confirmPlacement();

    expect(
      client.getState()!.G.hands[owner].map((card) => card.id),
    ).toStrictEqual(['spare', 'drawn']);
    expect(
      calculateScoreBreakdown(client.getState()!.G.played)[owner]?.total ?? 0,
    ).toBe(1);
    expect(client.getState()!.G.hands['0']).toStrictEqual(before.hands['0']);

    const after = client.getState()!;

    expect(canUndoMove(after.G)).toBe(false);

    client.moves.undoTest();

    expect(client.getState()!.G).toStrictEqual(after.G);
  });
});
