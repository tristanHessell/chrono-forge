// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { loadCardCatalog } from '../cardCatalog';
import messages from '../i18n/en.json';
import { CardCatalogDialog } from './CardCatalogDialog';

function renderCatalog(open = false) {
  const dialogRef = createRef<HTMLDialogElement>();
  const view = render(
    <IntlProvider locale="en" messages={messages}>
      <CardCatalogDialog dialogRef={dialogRef} onShowDetails={() => {}} />
    </IntlProvider>,
  );

  if (open) {
    dialogRef.current?.showModal();
  }

  return view;
}

it('shows every card copy and the starting card exactly once', () => {
  const { deck, startingCard } = loadCardCatalog();
  const { container } = renderCatalog();

  for (const card of [startingCard, ...deck]) {
    expect(
      container.querySelectorAll(`[data-catalog-card-id="${card.id}"]`),
    ).toHaveLength(1);
  }
  expect(container.querySelectorAll('[data-catalog-card-id]')).toHaveLength(
    deck.length + 1,
  );
  expect(screen.getByText('All cards', { selector: 'h2' })).toBeTruthy();
  expect(
    container.querySelector('[aria-label="Close card catalog"]'),
  ).toBeTruthy();
  expect(container.querySelector('dialog[open]')).toBeNull();
});

it('shows deck totals, categories, effects, and Command distributions', () => {
  const { container } = renderCatalog(true);

  for (const [label, value] of [
    ['Deck cards', '46'],
    ['Event', '30'],
    ['Command', '16'],
    ['Starting card', '1'],
  ]) {
    expect(screen.getByText(label, { selector: 'dt' })).toBeTruthy();
    expect(screen.getByText(value, { selector: 'dd' })).toBeTruthy();
  }
  expect(
    screen.getByRole('heading', { name: /Politics.*10 cards/ }),
  ).toBeTruthy();
  expect(screen.getByRole('heading', { name: /Tech.*10 cards/ })).toBeTruthy();
  expect(
    screen.getByRole('heading', { name: /Nature.*10 cards/ }),
  ).toBeTruthy();
  expect(screen.queryByText('Manipulation')).toBeNull();
  expect(screen.getAllByText('10 cards')).toHaveLength(3);
  expect(screen.getAllByText('4 cards')).toHaveLength(4);
  expect(
    container.querySelectorAll('[data-event-category="political"]'),
  ).not.toHaveLength(0);
  expect(
    container.querySelectorAll('[data-event-category="technological"]'),
  ).not.toHaveLength(0);
  expect(
    container.querySelectorAll('[data-event-category="environmental"]'),
  ).not.toHaveLength(0);
  for (const text of [
    'Time Jump',
    'Time Swap',
    'Take Control',
    'Remove Event',
    'Imperial Alliances',
    'Powered Flight',
    'Conservation Movement',
  ]) {
    expect(screen.getAllByText(text)).not.toHaveLength(0);
  }
  expect(
    screen.getAllByRole('img', { name: 'Draw one card' }),
  ).not.toHaveLength(0);
  expect(
    screen.getAllByRole('img', { name: '1900 timeline bonus' }),
  ).not.toHaveLength(0);
});
