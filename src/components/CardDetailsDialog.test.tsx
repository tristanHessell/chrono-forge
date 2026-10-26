// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { Card } from '../game';
import messages from '../i18n/en.json';
import { CardDetailsDialog } from './CardDetailsDialog';

function renderCardDetails(card: Card) {
  return render(
    <IntlProvider locale="en" messages={messages}>
      <CardDetailsDialog card={card} onClose={() => {}} />
    </IntlProvider>,
  );
}

it('shows the date and every effect description in one dialog', () => {
  renderCardDetails({
    id: 'test-event',
    type: 'event',
    category: 'technological',
    name: 'internet-expansion',
    number: 1990,
    effects: ['draw-one', 'free-action', 'timeline-1900-bonus'],
  });

  expect(
    screen.getByRole('heading', { level: 2, name: 'Internet Expansion' }),
  ).toBeTruthy();
  expect(screen.getByText('Year', { selector: 'dt' })).toBeTruthy();
  expect(screen.getByText('1990', { selector: 'dd' })).toBeTruthy();
  expect(screen.getByText('Type', { selector: 'dt' })).toBeTruthy();
  expect(screen.getByText('Tech', { selector: 'dd' })).toBeTruthy();
  expect(screen.getByText('Draw one card')).toBeTruthy();
  expect(
    screen.getByText(/When you confirm this Event card, draw one card/),
  ).toBeTruthy();
  expect(screen.getByText('Free action')).toBeTruthy();
  expect(screen.getByText('1900 timeline bonus')).toBeTruthy();
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('shows the Command action description as its effect', () => {
  renderCardDetails({
    id: 'test-command',
    type: 'manipulation',
    action: 'time-jump',
  });

  expect(
    screen.getByRole('heading', { level: 2, name: 'Time Jump' }),
  ).toBeTruthy();
  expect(screen.getByText('Command', { selector: 'dd' })).toBeTruthy();
  expect(screen.getByText(/The entire board must remain legal/)).toBeTruthy();
});
