// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { CardHand } from './CardHand';

it('shows the player avatar and score above the current hand', () => {
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
        score={4}
        selectedCardId={null}
      />
    </IntlProvider>,
  );

  expect(screen.getByLabelText('You, human')).toBeTruthy();
  expect(screen.getByLabelText('Your hand drop area')).toBeTruthy();
  expect(screen.getByText('4 points')).toBeTruthy();
});
