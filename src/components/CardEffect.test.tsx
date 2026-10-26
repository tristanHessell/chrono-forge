import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { CardEffect } from './CardEffect';

it('shows effect icons without hover tooltips', async () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="draw-one" />
    </IntlProvider>,
  );

  await expect
    .element(page.getByRole('img', { name: 'Draw one card' }))
    .toBeInTheDocument();
  expect(page.getByRole('tooltip').length).toBe(0);
  expect(page.getByCSS('[data-tooltip-enabled]').length).toBe(0);
});

it('shows the free action label', async () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="free-action" />
    </IntlProvider>,
  );

  await expect
    .element(page.getByRole('img', { name: 'Free action' }))
    .toBeInTheDocument();
});
