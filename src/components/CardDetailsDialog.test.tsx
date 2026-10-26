import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { Card } from '../game';
import messages from '../i18n/en.json';
import { CardDetailsDialog } from './CardDetailsDialog';

function renderCardDetails(card: Card) {
  render(
    <IntlProvider locale="en" messages={messages}>
      <CardDetailsDialog card={card} onClose={() => {}} />
    </IntlProvider>,
  );
}

it('shows the date and every effect description in one dialog', async () => {
  renderCardDetails({
    id: 'test-event',
    type: 'event',
    category: 'technological',
    name: 'internet-expansion',
    number: 1990,
    effects: ['draw-one', 'free-action', 'timeline-1900-bonus'],
  });

  await expect
    .element(page.getByCSS('dialog h2'))
    .toHaveTextContent('Internet Expansion');
  await expect.element(page.getByCSS('dd').nth(0)).toHaveTextContent('1990');
  await expect.element(page.getByCSS('dd').nth(1)).toHaveTextContent('Tech');
  expect(page.getByText('Draw one card').length).toBeGreaterThan(0);
  await expect
    .element(page.getByCSS('body'))
    .toMatchTextContent('When you confirm this Event card, draw one card');
  expect(page.getByText('Free action').length).toBeGreaterThan(0);
  expect(page.getByText('1900 timeline bonus').length).toBeGreaterThan(0);
  expect(page.getByCSS('dialog').length).toBe(1);
});

it('shows the Command action description as its effect', async () => {
  renderCardDetails({
    id: 'test-command',
    type: 'manipulation',
    action: 'time-jump',
  });

  expect(page.getByText('Time Jump').length).toBeGreaterThan(0);
  await expect.element(page.getByCSS('dd').nth(0)).toHaveTextContent('Command');
  await expect
    .element(page.getByCSS('body'))
    .toMatchTextContent('The entire board must remain legal.');
});
