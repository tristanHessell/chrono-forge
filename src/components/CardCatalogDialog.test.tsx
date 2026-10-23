import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { loadCardCatalog } from '../cardCatalog';
import messages from '../i18n/en.json';
import { CardCatalogDialog } from './CardCatalogDialog';

function renderCatalog () {
  return renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardCatalogDialog dialogRef={createRef<HTMLDialogElement>()} />
    </IntlProvider>,
  );
}

it('shows every card copy and the starting card exactly once', () => {
  const { deck, startingCard } = loadCardCatalog();
  const html = renderCatalog();

  for (const card of [startingCard, ...deck]) {
    expect(html.split(`data-catalog-card-id="${card.id}"`)).toHaveLength(2);
  }
  expect(html.match(/data-catalog-card-id=/g)).toHaveLength(deck.length + 1);
  expect(html).toContain('>All cards</h2>');
  expect(html).toContain('aria-label="Close card catalog"');
  expect(html).not.toContain('open=""');
});

it('shows deck totals, categories, effects, and Command distributions', () => {
  const html = renderCatalog();

  expect(html).toContain('<dt>Deck cards</dt><dd>46</dd>');
  expect(html).toContain('<dt>Event</dt><dd>30</dd>');
  expect(html).toContain('<dt>Command</dt><dd>16</dd>');
  expect(html).toContain('<h3>Politics <span>10 cards</span></h3>');
  expect(html).toContain('<h3>Tech <span>10 cards</span></h3>');
  expect(html).toContain('<h3>Nature <span>10 cards</span></h3>');
  expect(html).not.toContain('>Manipulation<');
  expect(html).toContain('<dt>Starting card</dt><dd>1</dd>');
  expect(html.match(/>10 cards<\/span>/g)).toHaveLength(3);
  expect(html.match(/>4 cards<\/span>/g)).toHaveLength(4);
  expect(html).toContain('data-event-category="political"');
  expect(html).toContain('data-event-category="technological"');
  expect(html).toContain('data-event-category="environmental"');
  expect(html).toContain('Draw one card');
  expect(html).toContain('1900 timeline bonus');
  expect(html).toContain('Time Jump');
  expect(html).toContain('Time Swap');
  expect(html).toContain('Take Control');
  expect(html).toContain('Remove Event');
  expect(html).toContain('Imperial Alliances');
  expect(html).toContain('Powered Flight');
  expect(html).toContain('Conservation Movement');
});
