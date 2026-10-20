import { describe, expect, it } from 'vitest';

import { createDefaultPlayers, getPlayer } from './playerSetup';

describe('player setup', () => {
  it('defaults to one human and one computer', () => {
    expect(createDefaultPlayers()).toEqual([
      { id: '0', name: 'You', type: 'human' },
      { id: '1', name: 'Sally', type: 'computer' },
    ]);
  });

  it('uses stable names for all four seats', () => {
    const players = createDefaultPlayers(4);

    expect(players.map((player) => player.name)).toEqual([
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
});
