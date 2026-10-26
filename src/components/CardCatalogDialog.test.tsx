import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import { loadCardCatalog } from '../cardCatalog';
import messages from '../i18n/en.json';
import { CardCatalogDialog } from './CardCatalogDialog';

function renderCatalog() {
  render(
    <IntlProvider locale="en" messages={messages}>
      <CardCatalogDialog
        dialogRef={createRef<HTMLDialogElement>()}
        onShowDetails={() => {}}
      />
    </IntlProvider>,
  );
}

it('shows every card copy and the starting card exactly once', async () => {
  const { deck, startingCard } = loadCardCatalog();

  renderCatalog();

  for (const card of [startingCard, ...deck]) {
    expect(page.getByCSS(`[data-catalog-card-id="${card.id}"]`).length).toBe(1);
  }
  expect(page.getByCSS('[data-catalog-card-id]').length).toBe(deck.length + 1);
  await expect
    .element(page.getByCSS('dialog h2'))
    .toHaveTextContent('All cards');
  expect(page.getByCSS('button[aria-label="Close card catalog"]').length).toBe(
    1,
  );
  expect(page.getByCSS('dialog[open]').length).toBe(0);
});

it('shows deck totals, categories, effects, and Command distributions', async () => {
  renderCatalog();

  const body = page.getByCSS('body');

  await expect.element(body).toMatchTextContent('Deck cards46');
  await expect.element(body).toMatchTextContent('Event30');
  await expect.element(body).toMatchTextContent('Command16');
  await expect.element(body).toMatchTextContent('Politics10 cards');
  await expect.element(body).toMatchTextContent('Tech10 cards');
  await expect.element(body).toMatchTextContent('Nature10 cards');
  await expect.element(body).not.toMatchTextContent('Manipulation');
  await expect.element(body).toMatchTextContent('Starting card1');
  expect(page.getByText('10 cards', { exact: true }).length).toBe(3);
  expect(page.getByText('4 cards', { exact: true }).length).toBe(4);
  expect(
    page.getByCSS('[data-event-category="political"]').length,
  ).toBeGreaterThan(0);
  expect(
    page.getByCSS('[data-event-category="technological"]').length,
  ).toBeGreaterThan(0);
  expect(
    page.getByCSS('[data-event-category="environmental"]').length,
  ).toBeGreaterThan(0);
  expect(page.getByCSS('[aria-label="Draw one card"]').length).toBeGreaterThan(
    0,
  );
  expect(
    page.getByCSS('[aria-label="1900 timeline bonus"]').length,
  ).toBeGreaterThan(0);
  await expect.element(body).toMatchTextContent('Time Jump');
  await expect.element(body).toMatchTextContent('Time Swap');
  await expect.element(body).toMatchTextContent('Take Control');
  await expect.element(body).toMatchTextContent('Remove Event');
  await expect.element(body).toMatchTextContent('Imperial Alliances');
  await expect.element(body).toMatchTextContent('Powered Flight');
  await expect.element(body).toMatchTextContent('Conservation Movement');
});
