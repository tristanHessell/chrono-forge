import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { Card } from '../game';
import messages from '../i18n/en.json';
import { CardDetailsDialog } from './CardDetailsDialog';

function renderCardDetails(card: Card) {
  return renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardDetailsDialog card={card} onClose={() => {}} />
    </IntlProvider>,
  );
}

it('shows the date and every effect description in one dialog', () => {
  const html = renderCardDetails({
    id: 'test-event',
    type: 'event',
    category: 'technological',
    name: 'internet-expansion',
    number: 1990,
    effects: ['draw-one', 'free-action', 'timeline-1900-bonus'],
  });

  expect(html).toContain('<h2 id=');
  expect(html).toContain('Internet Expansion');
  expect(html).toContain('<dt>Year</dt><dd>1990</dd>');
  expect(html).toContain('<dt>Type</dt><dd>Tech</dd>');
  expect(html).toContain('Draw one card');
  expect(html).toContain('When you confirm this Event card, draw one card');
  expect(html).toContain('Free action');
  expect(html).toContain('1900 timeline bonus');
  expect(html).toContain('<dialog');
});

it('shows the Command action description as its effect', () => {
  const html = renderCardDetails({
    id: 'test-command',
    type: 'manipulation',
    action: 'time-jump',
  });

  expect(html).toContain('Time Jump');
  expect(html).toContain('<dt>Type</dt><dd>Command</dd>');
  expect(html).toContain('The entire board must remain legal.');
});
