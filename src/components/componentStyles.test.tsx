import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
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

describe('componentStyles', () => {
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

  it('renders board card states and effect icons with their scoped classes', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PlayedCard card={card} style={{}} links={null} isLatest />
      </IntlProvider>,
    );

    const cardElement = page.getByCSS('[data-card-type="event"]');

    await expect
      .element(cardElement)
      .toHaveClass(...cardStyles.card.split(' '));
    await expect
      .element(cardElement)
      .toHaveClass(...playedStyles.latestCard.split(' '));
    expect(page.getByCSS(`[class~="${effectStyles.cardEffect}"]`)).toHaveLength(
      1,
    );
    await expect
      .element(page.getByText('Atomic Age'))
      .toHaveClass(...cardStyles.cardEventName.split(' '));
  });

  it('renders three card effects in a vertical stack', () => {
    render(
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

    expect(
      page.getByCSS(`[class~="${effectStyles.cardEffects}"]`),
    ).toHaveLength(1);
    expect(page.getByCSS(`[class~="${effectStyles.cardEffect}"]`)).toHaveLength(
      3,
    );
  });

  it.each(['0', '1', '2', '3', 'neutral'] as const)(
    'keeps the scoped ownership style for %s',
    async (owner) => {
      render(
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
      await expect
        .element(page.getByCSS(`[data-owner="${owner}"]`))
        .toHaveClass(...expected.split(' '));
    },
  );

  it('preserves scoped preview styles and a stable drop target', async () => {
    render(
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

    const slot = page.getByCSS('[data-drop-position="1:0"]');

    await expect
      .element(slot)
      .toHaveClass(...slotStyles.snapPreview.split(' '));
    expect(page.getByCSS(`[class~="${slotStyles.releaseLabel}"]`)).toHaveLength(
      1,
    );
    await expect
      .element(slot)
      .toHaveClass(...appearanceStyles.appearance.split(' '));
    await expect.element(slot).toHaveAttribute('data-placement-slot');
    await expect
      .element(slot)
      .toHaveAttribute('data-event-category', 'technological');
  });
});
