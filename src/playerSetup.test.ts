import { describe, expect, it, vi } from 'vitest';

import {
  chooseStartingPlayer,
  createDefaultPlayers,
  getPlayer,
} from './playerSetup';

describe('player setup', () => {
  it('defaults to one human and one computer', () => {
    expect(createDefaultPlayers()).toStrictEqual([
      { id: '0', name: 'You', type: 'human' },
      { id: '1', name: 'Sally', type: 'computer' },
    ]);
  });

  it('uses stable names for all four seats', () => {
    const players = createDefaultPlayers(4);

    expect(players.map((player) => player.name)).toStrictEqual([
      'You',
      'Sally',
      'Barry',
      'Morgan',
    ]);
    expect(players.slice(1).every((player) => player.type === 'computer')).toBe(
      true,
    );
    expect(getPlayer(players, '2').name).toBe('Barry');
  });

  it('selects the player at the random position', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    try {
      expect(chooseStartingPlayer(2)).toBe('1');
    } finally {
      random.mockRestore();
    }
  });
});
