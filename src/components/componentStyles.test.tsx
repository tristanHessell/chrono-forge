import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { PlacedCard as Event } from '../game';
import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import appearanceStyles from './CardAppearance.module.css';
import effectStyles from './CardEffect.module.css';
import logStyles from './GameLogView.module.css';
import ownerStyles from './Ownership.module.css';
import { PlacementSlot } from './PlacementSlot';
import slotStyles from './PlacementSlot.module.css';
import { PlayedCard } from './PlayedCard';
import playedStyles from './PlayedCard.module.css';

const card: Event = {
  id: 'styled-event',
  type: 'event',
  category: 'technological',
  number: 1940,
  effect: 'draw-one',
  owner: '0',
  row: 0,
  column: 1,
  placedAt: 1,
};

it('exports camelCase keys for dot notation without kebab-case aliases', () => {
  expect(logStyles.gameLogReadable).toBeTruthy();
  expect(logStyles).not.toHaveProperty('game-log-readable');
  expect(playedStyles.linkTop).toBeTruthy();
  expect(playedStyles.linkBottom).toBeTruthy();
  for (const owner of ['0', '1', '2', '3', 'Neutral'] as const) {
    expect(ownerStyles[`owner${owner}`]).toBeTruthy();
  }
});

it('composes shared appearance into cards, previews, and log references', () => {
  for (const value of [
    cardStyles.card,
    slotStyles.placementSlot,
    logStyles.logCardReference,
  ]) {
    expect(value.split(' ')).toContain(appearanceStyles.appearance);
  }
  expect(cardStyles.card).not.toBe('card');
  expect(slotStyles.placementSlot).not.toBe('placement-slot');
});

it('renders board card states and effect icons with their scoped classes', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <PlayedCard card={card} style={{}} links={null} isLatest />
    </IntlProvider>,
  );

  expect(html).toContain(cardStyles.card);
  expect(html).toContain(playedStyles.latestCard);
  expect(html).toContain(effectStyles.cardEffect);
});

it.each(['0', '1', '2', '3', 'neutral'] as const)(
  'keeps the scoped ownership style for %s',
  (owner) => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <PlayedCard
          card={{ ...card, owner }}
          style={{}}
          links={null}
          isLatest={false}
        />
      </IntlProvider>,
    );
    const expected =
      owner === 'neutral'
        ? ownerStyles.ownerNeutral
        : ownerStyles[`owner${owner}`];

    expect(expected).toBeTruthy();
    expect(html).toContain(expected);
  },
);

it('preserves scoped preview styles and a stable drop target', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <PlacementSlot
        ariaLabel="Place here"
        position={{ row: 1, column: 0 }}
        draggedCard={card}
        isDragActive
        isPreview
        onClick={() => {}}
        onDragEnter={() => {}}
        onDragOver={() => {}}
        onDrop={() => {}}
      />
    </IntlProvider>,
  );

  expect(html).toContain(slotStyles.snapPreview);
  expect(html).toContain(appearanceStyles.appearance);
  expect(html).toContain('data-drop-position="1:0"');
  expect(html).toContain('data-placement-slot="true"');
  expect(html).toContain('data-event-category="technological"');
});
