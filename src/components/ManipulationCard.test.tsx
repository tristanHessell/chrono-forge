// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import { CardHand } from './CardHand';

it.each(['time-jump', 'time-swap', 'take-control', 'remove-event'] as const)(
  'renders %s without an Event date or category',
  (action) => {
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <CardHand
          cards={[{ id: 'test', type: 'manipulation', action }]}
          owner="0"
          ownerName="You"
          playerType="human"
          activeOwner="0"
          pendingCardId={undefined}
          score={0}
          isReturnTarget={false}
          selectedCardId={null}
          onChoose={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
        />
      </IntlProvider>,
    );

    expect(
      screen.getByText(messages[`manipulation.${action}.name`]),
    ).toBeTruthy();
    expect(
      container
        .querySelector('[aria-description]')
        ?.getAttribute('aria-description'),
    ).toContain(messages[`manipulation.${action}.description`]);
    expect(
      container.querySelector('[data-card-type="manipulation"]'),
    ).toBeTruthy();
    expect(
      container.querySelector(`.${cardStyles.manipulationName}`),
    ).toBeTruthy();
    expect(container.querySelector('.hand-corner-number')).toBeNull();
    expect(container.querySelector('[data-event-category]')).toBeNull();
    expect(screen.queryByText('NaN')).toBeNull();
  },
);
