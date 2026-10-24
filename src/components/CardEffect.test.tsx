import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { CardEffect } from './CardEffect';

it.each([true, false])(
  'keeps only enabled explanation icons focusable: %s',
  (showTooltip) => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <CardEffect effect="draw-one" showTooltip={showTooltip} />
      </IntlProvider>,
    );

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Draw one card"');
    expect(html.includes('tabindex="0"')).toBe(showTooltip);
    expect(html.includes('data-tooltip-enabled="true"')).toBe(showTooltip);
    expect(html).not.toContain('role="tooltip"');
  },
);

it('shows the free action label', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="free-action" />
    </IntlProvider>,
  );

  expect(html).toContain('aria-label="Free action"');
});
