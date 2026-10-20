import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { GameResults } from './GameResults';

it('shows a tie when neither player scored', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameResults played={[]} />
    </IntlProvider>,
  );

  expect(html).toContain('it&#x27;s a tie!');
  expect(html).toContain('0 card points + 0 bonus points = 0 total');
});

it.each(['0', '1', '2', '3'] as const)(
  'announces %s as the winner',
  (owner) => {
    const card: PlacedCard = {
      id: 'test',
      type: 'event',
      number: 1900,
      row: 0,
      column: 0,
      placedAt: 1,
      owner,
    };
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <GameResults played={[card]} playerIds={['0', '1', '2', '3']} />
      </IntlProvider>,
    );

    expect(html).toContain(
      owner === '0'
        ? 'you win!'
        : `${['Sally', 'Barry', 'Morgan'][Number(owner) - 1]} wins!`,
    );
    expect(html).toContain('1 card point + 0 bonus points = 1 total');
  },
);

it('names only the tied leaders in a four-player game', () => {
  const played: PlacedCard[] = (['2', '3'] as const).map((owner) => ({
    id: owner,
    type: 'event',
    number: 1900,
    row: 0,
    column: Number(owner),
    placedAt: Number(owner),
    owner,
  }));
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameResults played={played} playerIds={['0', '1', '2', '3']} />
    </IntlProvider>,
  );

  expect(html).toContain('it&#x27;s a tie! (Barry, Morgan)');
  expect(html).toContain('You: 0 card points');
});

it('renders a round scores button when requested', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameResults onOpenRoundScores={() => {}} played={[]} />
    </IntlProvider>,
  );

  expect(html).toContain('>Round scores</button>');
});
