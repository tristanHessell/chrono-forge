import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { CardGame } from '../game';
import messages from '../i18n/en.json';
import { GameLogControls } from './GameLogControls';

it('provides a labelled corner close icon instead of a text Close button', () => {
  const client = Client({ game: CardGame, debug: false });
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameLogControls
        G={client.getState()!.G}
        currentPlayer="0"
        onOpen={() => {}}
      />
    </IntlProvider>,
  );

  expect(html).toContain('class="game-log-header"');
  expect(html).toContain('class="game-log-close"');
  expect(html).toContain('aria-label="Close"');
  expect(html).toContain('<span aria-hidden="true">×</span>');
  expect(html).not.toContain('>Close</button>');
  client.stop();
});
import { Client } from 'boardgame.io/client';
