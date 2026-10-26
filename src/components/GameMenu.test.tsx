// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { GameMenu } from './GameMenu';
import styles from './GameMenu.module.css';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

it('keeps all settings inside a closed menu', () => {
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <GameMenu onNewGame={() => {}} onOpenCatalog={() => {}} />
    </IntlProvider>,
  );

  const menu = container.querySelector('details');

  expect(menu?.classList.contains(styles.gameMenu)).toBe(true);
  expect(menu?.open).toBe(false);
  expect(
    container.querySelector('summary[aria-label="Game menu"]'),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'New game' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'All cards' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Theme' })).toBeTruthy();
  expect(screen.getByText('Colour-independent backgrounds')).toBeTruthy();
  expect(screen.getByRole('checkbox')).toBeTruthy();
  expect(container.querySelector('[role="menu"]')).toBeNull();
});
