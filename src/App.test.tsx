import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../tests/render';
import { App } from './App';
import { createCardGame } from './game';
import { gameStorageKey } from './gameStorage';
import messages from './i18n/en.json';
import { createDefaultPlayers } from './playerSetup';

describe(App, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the title screen without creating a game session', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <App />
      </IntlProvider>,
    );

    await expect
      .element(page.getByRole('heading', { name: 'Chrono-Forge' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Start a new game' }))
      .toBeVisible();
    expect(page.getByRole('region', { name: 'Card table' })).toHaveLength(0);
  });

  it('shows the player score beside the deck after continuing a saved game', async () => {
    const client = Client({
      game: { ...createCardGame('0'), seed: 'saved-game-seed' },
      numPlayers: 2,
    });

    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === gameStorageKey
          ? JSON.stringify({
              initialState: client.getInitialState(),
              log: [],
              numPlayers: 2,
              players: createDefaultPlayers(),
              replayPaused: false,
              seed: 'saved-game-seed',
              startingPlayer: '0',
              state: client.store.getState(),
              version: 1,
            })
          : null,
    });

    render(
      <IntlProvider locale="en" messages={messages}>
        <App />
      </IntlProvider>,
    );

    await expect
      .element(page.getByRole('button', { name: 'Continue game' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Continue game' }).click();

    await expect
      .element(page.getByRole('region', { name: 'Card table' }))
      .toBeVisible();

    await expect
      .element(page.getByCSS('[data-player-score]'))
      .toHaveTextContent('0 points');
  });
});
