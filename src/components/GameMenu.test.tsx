import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { GameMenu } from './GameMenu';
import styles from './GameMenu.module.css';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

it('keeps all settings inside a closed menu', () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <GameMenu onNewGame={() => {}} onOpenCatalog={() => {}} />
    </IntlProvider>,
  );

  expect(page.getByCSS('details').length).toBe(1);
  expect(page.getByCSS(`[class="${styles.gameMenu}"]`).length).toBe(1);
  expect(page.getByCSS('details[open]').length).toBe(0);
  expect(page.getByCSS('summary[aria-label="Game menu"]').length).toBe(1);
  expect(page.getByCSS('[role="group"][aria-label="Game menu"]').length).toBe(
    1,
  );
  expect(page.getByCSS('button').filter({ hasText: 'New game' }).length).toBe(
    1,
  );
  expect(page.getByCSS('button').filter({ hasText: 'All cards' }).length).toBe(
    1,
  );
  expect(page.getByCSS('button').filter({ hasText: 'Theme' }).length).toBe(1);
  expect(page.getByText('Colour-independent backgrounds').length).toBe(1);
  expect(page.getByCSS('input[type="checkbox"]').length).toBe(1);
  expect(page.getByRole('menu').length).toBe(0);
});
