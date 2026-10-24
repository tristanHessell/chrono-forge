import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { GameMenu } from './GameMenu';
import styles from './GameMenu.module.css';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">{messages['theme.label']}</button>,
}));

it('keeps all settings inside a closed menu', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameMenu onNewGame={() => {}} onOpenCatalog={() => {}} />
    </IntlProvider>,
  );

  expect(html).toContain(`<details class="${styles.gameMenu}">`);
  expect(html).not.toContain('open=""');
  expect(html).toContain('aria-label="Game menu"');
  expect(html).toContain('>New game</button>');
  expect(html).toContain('>All cards</button>');
  expect(html).toContain('>Theme</button>');
  expect(html).toContain('Colour-independent backgrounds');
  expect(html).toContain('type="checkbox"');
  expect(html).not.toContain('role="menu"');
});
