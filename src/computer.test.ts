import { Client } from 'boardgame.io/client';
import { assert, describe, expect, it } from 'vitest';

import { loadCardCatalog } from './cardCatalog';
import { chooseComputerAction } from './computer';
import {
  CardGame,
  type CardGameState,
  type EventCard,
  type PlacedCard,
} from './game';
import { isValidPlacement } from './gameRules';
import { calculateScoreBreakdown } from './scoring';

const event = (id: string) =>
  loadCardCatalog().deck.find(
    (card): card is EventCard => card.id === id && card.type === 'event',
  )!;
const state = (): CardGameState =>
  CardGame.setup!({
    ctx: { numPlayers: 2 },
    random: { Shuffle: <T>(cards: T[]) => cards },
  } as never);

describe('computer opponent', () => {
  it('prioritizes a free action so the computer can use another card', () => {
    const G = state();

    G.hands['1'] = [event('event-1900-1'), event('event-1910-1')];

    expect(chooseComputerAction(G)).toMatchObject({
      cardId: 'event-1910-1',
      type: 'play',
    });
  });

  it('prefers a placement that earns the valid 1990 bonus', () => {
    const G = state();

    G.played.push({
      ...event('event-1900-1'),
      column: 1,
      owner: '0',
      placedAt: 1,
      row: 0,
    });
    G.nextPlacementOrder = 2;
    G.hands['1'] = [event('event-1940-1'), event('event-1990-1')];

    const action = chooseComputerAction(G);

    expect(action?.type).toBe('play');

    assert(action?.type === 'play', 'Expected a placement');

    expect(action.cardId).toBe('event-1990-1');

    const card = G.hands['1'].find(
      (candidate) => candidate.id === action.cardId,
    )!;

    assert(card.type === 'event', 'Expected an Event');

    expect(isValidPlacement(G.played, action.position, card)).toBe(true);
    expect(
      calculateScoreBreakdown([
        ...G.played,
        { ...card, ...action.position, owner: '1', placedAt: 2 },
      ])['1']?.bonus ?? 0,
    ).toBe(1);
  });

  it('discards when all cards are blocked', () => {
    const G = state();
    const surrounding: PlacedCard[] = [
      { column: 0, row: -1 },
      { column: -1, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 },
    ].map((position, index) => ({
      ...event('event-1990-1'),
      id: `block-${index}`,
      ...position,
      owner: '0',
      placedAt: index + 1,
    }));

    G.played.push(...surrounding);
    G.hands['1'] = [event('event-1900-1')];

    expect(chooseComputerAction(G)).toStrictEqual({
      cardId: 'event-1900-1',
      type: 'discard',
    });
  });

  it('confirms its pending card and stops at game end', () => {
    const G = state();

    G.pending = {
      ...event('event-1900-1'),
      column: 1,
      owner: '1',
      placedAt: 1,
      row: 0,
    };

    expect(chooseComputerAction(G)).toStrictEqual({ type: 'confirm' });

    G.roundOver = true;

    expect(chooseComputerAction(G)).toBeNull();
  });

  it('does not use the human hand or the hidden deck order', () => {
    const G = state();
    const before = chooseComputerAction(G);
    const altered = {
      ...G,
      deck: [...G.deck].reverse(),
      hands: { ...G.hands, '0': [] },
    };

    expect(chooseComputerAction(altered)).toStrictEqual(before);
  });

  it.each([2, 3, 4])(
    'finishes a complete %i-player match through the real game client',
    (numPlayers) => {
      const client = Client({
        game: { ...CardGame, seed: `complete-${numPlayers}` },
        numPlayers,
      });
      let moves = 0;

      while (!client.getState()!.G.roundOver && moves < 150) {
        const before = client.getState()!;
        const owner = before.G.playerIds.find(
          (id) => id === before.ctx.currentPlayer,
        )!;
        const action = chooseComputerAction(before.G, owner);

        assert(action, 'Expected a computer action');

        switch (action.type) {
          case 'play': {
            const hand = before.G.hands[owner];
            const card = hand.find(
              (candidate) => candidate.id === action.cardId,
            )!;

            assert(
              isValidPlacement(before.G.played, action.position, card),
              'Expected a valid placement',
            );

            client.moves.playCard(action.cardId, action.position);

            assert(
              client.getState()!.G.pending?.id === card.id,
              'Expected the correct card to be pending',
            );
            break;
          }
          case 'confirm':
            client.moves.confirmPlacement();
            break;
          case 'discard':
            client.moves.discardCard(action.cardId);
            break;
          case 'command':
            client.moves.command(
              action.cardId,
              action.targetId,
              action.destination,
            );
            break;
        }

        moves += 1;
      }

      const final = client.getState()!.G;

      expect(final.roundOver).toBe(true);
      expect(final.hands['0']).toStrictEqual([]);
      expect(final.hands['1']).toStrictEqual([]);
      expect(
        Object.values(final.hands).every((hand) => hand.length === 0),
      ).toBe(true);
      expect(
        final.played.length - 1 + final.discarded.length + final.deck.length,
      ).toBe(46);
      expect(final.deck.length).toBeLessThan(2);
    },
    30_000,
  );
});
