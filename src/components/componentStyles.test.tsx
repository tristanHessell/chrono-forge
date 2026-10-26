// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { PlacedCard as Event } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import appearanceStyles from './CardAppearance.module.css';
import cardBackStyles from './CardBack.module.css';
import effectStyles from './CardEffect.module.css';
import computerPlayerStyles from './ComputerPlayer.module.css';
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
  name: 'atomic-age',
  number: 1940,
  effects: ['draw-one'],
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
  for (const className of cardStyles.card.split(' ')) {
    expect(slotStyles.snapPreview.split(' ')).toContain(className);
  }
});

it('uses the same card back artwork for the deck and computer hands', () => {
  for (const value of [
    gameBoardStyles.deckCardBack,
    computerPlayerStyles.cardBack,
  ]) {
    expect(value.split(' ')).toContain(cardBackStyles.cardBack);
  }
});

it('renders board card states and effect icons with their scoped classes', () => {
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <PlayedCard card={card} style={{}} links={null} isLatest />
    </IntlProvider>,
  );

  expect(
    container.querySelector(`.${cardStyles.card.split(' ')[0]}`),
  ).toBeTruthy();
  expect(container.querySelector(`.${playedStyles.latestCard}`)).toBeTruthy();
  expect(container.querySelector(`.${effectStyles.cardEffect}`)).toBeTruthy();
  expect(container.querySelector(`.${cardStyles.cardEventName}`)).toBeTruthy();
  expect(screen.getByText('Atomic Age')).toBeTruthy();
});

it('renders three card effects in a vertical stack', () => {
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <PlayedCard
        card={{
          ...card,
          effects: ['draw-one', 'free-action', 'timeline-1900-bonus'],
        }}
        style={{}}
        links={null}
        isLatest={false}
      />
    </IntlProvider>,
  );

  expect(container.querySelector(`.${effectStyles.cardEffects}`)).toBeTruthy();
  expect(
    container.querySelectorAll(`.${effectStyles.cardEffect}`),
  ).toHaveLength(3);
});

it.each(['0', '1', '2', '3', 'neutral'] as const)(
  'keeps the scoped ownership style for %s',
  (owner) => {
    const { container } = render(
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
    expect(container.querySelector(`.${expected.split(' ')[0]}`)).toBeTruthy();
  },
);

it('preserves scoped preview styles and a stable drop target', () => {
  const { container } = render(
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

  expect(
    container.querySelector(`[data-drop-position="1:0"][data-placement-slot]`),
  ).toBeTruthy();
  expect(
    container.querySelector('[data-event-category="technological"]'),
  ).toBeTruthy();
  expect(
    container.querySelector(`.${slotStyles.snapPreview.split(' ')[0]}`),
  ).toBeTruthy();
  expect(
    container.querySelector(`.${slotStyles.releaseLabel.split(' ')[0]}`),
  ).toBeTruthy();
  expect(
    container.querySelector(`.${appearanceStyles.appearance.split(' ')[0]}`),
  ).toBeTruthy();
});
