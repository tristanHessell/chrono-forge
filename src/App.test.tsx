import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { App } from './App';
import messages from './i18n/en.json';

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
