import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { CardEffect } from './CardEffect';

it('shows effect icons without hover tooltips', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="draw-one" />
    </IntlProvider>,
  );

  expect(html).toContain('role="img"');
  expect(html).toContain('aria-label="Draw one card"');
  expect(html).not.toContain('role="tooltip"');
  expect(html).not.toContain('data-tooltip-enabled');
});

it('shows the free action label', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="free-action" />
    </IntlProvider>,
  );

  expect(html).toContain('aria-label="Free action"');
});
