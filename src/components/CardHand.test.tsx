import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { EventCard } from '../game';
import messages from '../i18n/en.json';
import { useTouchCardDrag } from '../useTouchCardDrag';
import { CardHand } from './CardHand';

function TouchCardHand({ cards }: { cards: EventCard[] }) {
  const touchDrag = useTouchCardDrag({
    onDrop: () => {},
    onFinish: () => {},
    onMove: () => {},
    onStart: () => {},
  });

  return (
    <div
      style={
        {
          '--card-height': '140px',
          '--card-width': '100px',
        } as React.CSSProperties
      }
    >
      <CardHand
        activeOwner="0"
        cards={cards}
        isReturnTarget={false}
        onChoose={() => {}}
        onDragEnd={() => {}}
        onDragOver={() => {}}
        onDragStart={() => {}}
        onDrop={() => {}}
        owner="0"
        ownerName="You"
        pendingCardId={undefined}
        playerType="human"
        selectedCardId={null}
        touchDrag={touchDrag}
      />
    </div>
  );
}

describe(CardHand, () => {
  it('shows the player avatar without a date sort button or score', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <CardHand
          activeOwner="0"
          cards={[]}
          isReturnTarget={false}
          onChoose={() => {}}
          onDragEnd={() => {}}
          onDragOver={() => {}}
          onDragStart={() => {}}
          onDrop={() => {}}
          owner="0"
          ownerName="You"
          pendingCardId={undefined}
          playerType="human"
          selectedCardId={null}
        />
      </IntlProvider>,
    );

    expect(page.getByLabelText('You, human')).toHaveLength(1);
    expect(page.getByLabelText('Your hand drop area')).toHaveLength(1);
    expect(page.getByText('You', { exact: true })).toHaveLength(0);
    expect(page.getByRole('button', { name: 'Date' })).toHaveLength(0);
    await expect
      .element(page.getByText('4 points', { exact: true }))
      .not.toBeInTheDocument();
  });

  it('reorders event cards when a touch drag stays in the hand', async () => {
    const cards: EventCard[] = [
      {
        category: 'nature',
        id: 'nature',
        name: 'timeline-origin',
        number: 1900,
        type: 'event',
      },
      {
        category: 'politics',
        id: 'politics',
        name: 'timeline-origin',
        number: 1910,
        type: 'event',
      },
      {
        category: 'tech',
        id: 'tech',
        name: 'timeline-origin',
        number: 1920,
        type: 'event',
      },
    ];

    render(
      <IntlProvider locale="en" messages={messages}>
        <TouchCardHand cards={cards} />
      </IntlProvider>,
    );

    const handCards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-hand-card]'),
    );
    const first = handCards[0].getBoundingClientRect();
    const last = handCards.at(-1)!.getBoundingClientRect();
    const endX = last.left + last.width / 2;
    const endY = last.top + last.height / 2;
    const source = handCards[0];

    expect(endX - (first.left + first.width / 2)).toBeGreaterThan(6);

    source.setPointerCapture = () => {};
    source.hasPointerCapture = () => false;
    source.releasePointerCapture = () => {};

    const dispatch = (type: string, clientX: number, clientY: number) => {
      source.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX,
          clientY,
          isPrimary: true,
          pointerId: 1,
          pointerType: 'touch',
        }),
      );
    };

    dispatch(
      'pointerdown',
      first.left + first.width / 2,
      first.top + first.height / 2,
    );
    dispatch('pointermove', endX, endY);
    dispatch('pointerup', endX, endY);

    expect(
      document.elementFromPoint(endX, endY)?.closest('[data-hand-owner]'),
    ).not.toBeNull();
    await expect
      .poll(() =>
        Array.from(document.querySelectorAll('[data-hand-card]')).map(
          (element) => element.getAttribute('data-event-category'),
        ),
      )
      .toStrictEqual(['politics', 'tech', 'nature']);
  });
});
