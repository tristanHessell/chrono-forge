import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { GameMenu } from './GameMenu';

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme toggle</button>,
}));

it.each([2, 3, 4] as const)(
  'keeps all settings inside a closed menu with %s players selected',
  (playerCount) => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <GameMenu
          playerCount={playerCount}
          onNewGame={() => {}}
          onOpenLog={() => {}}
          onPlayerCountChange={() => {}}
        />
      </IntlProvider>,
    );

    expect(html).toMatch(/^<details class="game-menu">/);
    expect(html).not.toContain('open=""');
    expect(html).toContain('aria-label="Game menu"');
    expect(html).toContain('>New game</button>');
    expect(html).toContain('>Game Log</button>');
    expect(html).toContain('>Theme toggle</button>');
    expect(html).toContain('aria-label="Players"');
    expect(html).toContain(
      `<option value="${playerCount}" selected="">${playerCount}</option>`,
    );
    expect(html).toContain(messages['game.playersHint']);
    expect(html).not.toContain('role="menu"');
  },
);
