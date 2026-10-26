// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { GameResults } from './GameResults';

it('shows a tie when neither player scored', () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <GameResults played={[]} />
    </IntlProvider>,
  );

  expect(screen.getByText(/it's a tie!/)).toBeTruthy();
  expect(
    screen.getAllByText(/0 card points \+ 0 bonus points = 0 total/),
  ).not.toHaveLength(0);
});

it.each(['0', '1', '2', '3'] as const)(
  'announces %s as the winner',
  (owner) => {
    const card: PlacedCard = {
      id: 'test',
      type: 'event',
      name: 'timeline-origin',
      number: 1900,
      row: 0,
      column: 0,
      placedAt: 1,
      owner,
    };

    render(
      <IntlProvider locale="en" messages={messages}>
        <GameResults played={[card]} playerIds={['0', '1', '2', '3']} />
      </IntlProvider>,
    );

    expect(
      screen.getByText(
        owner === '0'
          ? /you win!/
          : new RegExp(
              `${['Sally', 'Barry', 'Morgan'][Number(owner) - 1]} wins!`,
            ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/1 card point \+ 0 bonus points = 1 total/),
    ).toBeTruthy();
  },
);

it('names only the tied leaders in a four-player game', () => {
  const played: PlacedCard[] = (['2', '3'] as const).map((owner) => ({
    id: owner,
    type: 'event',
    name: 'timeline-origin',
    number: 1900,
    row: 0,
    column: Number(owner),
    placedAt: Number(owner),
    owner,
  }));

  render(
    <IntlProvider locale="en" messages={messages}>
      <GameResults played={played} playerIds={['0', '1', '2', '3']} />
    </IntlProvider>,
  );

  expect(screen.getByText(/it's a tie! \(Barry, Morgan\)/)).toBeTruthy();
  expect(screen.getByText(/You: 0 card points/)).toBeTruthy();
});

it('keeps the result summary free of game controls', () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <GameResults played={[]} />
    </IntlProvider>,
  );

  expect(screen.queryByRole('button', { name: 'Round scores' })).toBeNull();
});
