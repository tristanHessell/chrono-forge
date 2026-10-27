import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { GameMenu } from './GameMenu';
import styles from './GameMenu.module.css';

vi.mock(import('./ThemeToggle'), () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

describe(GameMenu, () => {
  it('keeps all settings inside a closed menu', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <GameMenu onNewGame={() => {}} onOpenCatalog={() => {}} />
      </IntlProvider>,
    );

    expect(page.getByCSS('details')).toHaveLength(1);
    expect(page.getByCSS(`[class="${styles.gameMenu}"]`)).toHaveLength(1);
    expect(page.getByCSS('details[open]')).toHaveLength(0);
    expect(page.getByCSS('summary[aria-label="Game menu"]')).toHaveLength(1);
    expect(
      page.getByCSS('[role="group"][aria-label="Game menu"]'),
    ).toHaveLength(1);
    expect(
      page.getByCSS('button').filter({ hasText: 'New game' }),
    ).toHaveLength(1);
    expect(
      page.getByCSS('button').filter({ hasText: 'All cards' }),
    ).toHaveLength(1);
    expect(page.getByCSS('button').filter({ hasText: 'Theme' })).toHaveLength(
      1,
    );
    expect(page.getByText('Colour-independent backgrounds')).toHaveLength(1);
    expect(page.getByCSS('input[type="checkbox"]')).toHaveLength(1);
    expect(page.getByRole('menu')).toHaveLength(0);
  });
});
