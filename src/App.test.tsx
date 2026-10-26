import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
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
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <App />
    </IntlProvider>,
  );

  expect(html).toContain('<h1>Chrono-Forge</h1>');
  expect(html).toContain('>Start a new game</button>');
  expect(html).not.toContain('aria-label="Card table"');
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

  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <App />
    </IntlProvider>,
  );

  expect(html).toContain('>Continue game</button>');
});
