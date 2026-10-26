// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';

import { CardGame } from '../game';
import messages from '../i18n/en.json';
import dialogStyles from './Dialog.module.css';
import { GameLogControls } from './GameLogControls';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

it('renders the game log trigger beside its dialog', () => {
  const client = Client({ game: CardGame, debug: false });
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogControls
        G={client.getState()!.G}
        currentPlayer="0"
        onOpen={() => {}}
      />
    </IntlProvider>,
  );

  expect(screen.getByRole('button', { name: 'Game Log' })).toBeTruthy();
  expect(screen.getByTitle('Game Log')).toBeTruthy();
  expect(container.querySelector('[data-icon-button="true"]')).toBeTruthy();
  expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  expect(container.querySelector('button + dialog')).toBeTruthy();
  client.stop();
});

it('provides a labelled corner close icon instead of a text Close button', () => {
  const client = Client({ game: CardGame, debug: false });
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogControls
        G={client.getState()!.G}
        currentPlayer="0"
        onOpen={() => {}}
      />
    </IntlProvider>,
  );

  expect(
    container.querySelector(`.${dialogStyles.gameLogHeader}`),
  ).toBeTruthy();
  expect(container.querySelector(`.${dialogStyles.gameLogClose}`)).toBeTruthy();
  expect(
    container
      .querySelector(`.${dialogStyles.gameLogClose}`)
      ?.getAttribute('aria-label'),
  ).toBe('Close');
  expect(
    container.querySelector(
      `.${dialogStyles.gameLogClose} svg[aria-hidden="true"]`,
    ),
  ).toBeTruthy();
  client.stop();
});
