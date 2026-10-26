import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import { CardGame } from '../game';
import messages from '../i18n/en.json';
import dialogStyles from './Dialog.module.css';
import { GameLogControls } from './GameLogControls';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

it('renders the game log trigger beside its dialog', async () => {
  const client = Client({ game: CardGame, debug: false });

  render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogControls
        G={client.getState()!.G}
        currentPlayer="0"
        onOpen={() => {}}
      />
    </IntlProvider>,
  );

  const button = page.getByRole('button', { name: 'Game Log' });

  await expect.element(button).toHaveAttribute('title', 'Game Log');
  await expect.element(button).toHaveAttribute('data-icon-button', 'true');
  expect(page.getByCSS('button[aria-label="Game Log"] + dialog').length).toBe(
    1,
  );
  expect(
    page.getByCSS('button[aria-label="Game Log"] svg[aria-hidden="true"]')
      .length,
  ).toBe(1);
  client.stop();
});

it('provides a labelled corner close icon instead of a text Close button', async () => {
  const client = Client({ game: CardGame, debug: false });

  render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogControls
        G={client.getState()!.G}
        currentPlayer="0"
        onOpen={() => {}}
      />
    </IntlProvider>,
  );

  expect(page.getByCSS(`[class~="${dialogStyles.gameLogHeader}"]`).length).toBe(
    1,
  );
  expect(page.getByCSS(`[class~="${dialogStyles.gameLogClose}"]`).length).toBe(
    1,
  );

  const closeButton = page.getByCSS('button[aria-label="Close"]');

  expect(closeButton.length).toBe(1);
  expect(
    page.getByCSS('button[aria-label="Close"] svg[aria-hidden="true"]').length,
  ).toBe(1);
  await expect.element(closeButton).toHaveTextContent('');
  client.stop();
});
