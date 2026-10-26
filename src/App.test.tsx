// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';

import { App } from './App';
import { createCardGame } from './game';
import { gameStorageKey } from './gameStorage';
import messages from './i18n/en.json';
import { createDefaultPlayers } from './playerSetup';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows the title screen without creating a game session', () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <App />
    </IntlProvider>,
  );

  expect(screen.getByRole('heading', { name: 'Chrono-Forge' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start a new game' })).toBeTruthy();
  expect(screen.queryByLabelText('Card table')).toBeNull();
});

it('offers to continue the saved game from the title screen', () => {
  const client = Client({
    game: { ...createCardGame('0'), seed: 'saved-game-seed' },
    numPlayers: 2,
  });

  vi.stubGlobal('localStorage', {
    getItem: (key: string) =>
      key === gameStorageKey
        ? JSON.stringify({
            version: 1,
            seed: 'saved-game-seed',
            numPlayers: 2,
            startingPlayer: '0',
            players: createDefaultPlayers(),
            replayPaused: false,
            state: client.store.getState(),
            initialState: client.getInitialState(),
            log: [],
          })
        : null,
  });

  render(
    <IntlProvider locale="en" messages={messages}>
      <App />
    </IntlProvider>,
  );

  expect(screen.getByRole('button', { name: 'Continue game' })).toBeTruthy();
});
