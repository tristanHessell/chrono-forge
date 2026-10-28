import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { GameResults } from './GameResults';

describe(GameResults, () => {
  it('shows a tie when neither player scored', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <GameResults played={[]} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent("it's a tie!");
    await expect
      .element(body)
      .toMatchTextContent('0 card points + 0 bonus points = 0 total');
  });

  it.each(['0', '1', '2', '3'] as const)(
    'announces %s as the winner',
    async (owner) => {
      const card: PlacedCard = {
        column: 0,
        id: 'test',
        name: 'timeline-origin',
        number: 1900,
        owner,
        placedAt: 1,
        row: 0,
        type: 'event',
      };

      render(
        <IntlProvider locale="en" messages={messages}>
          <GameResults played={[card]} playerIds={['0', '1', '2', '3']} />
        </IntlProvider>,
      );

      await expect
        .element(page.getByCSS('body'))
        .toMatchTextContent(
          owner === '0'
            ? 'you win!'
            : `${['Sally', 'Barry', 'Morgan'][Number(owner) - 1]} wins!`,
        );
      await expect
        .element(page.getByCSS('body'))
        .toMatchTextContent('1 card point + 0 bonus points = 1 total');
    },
  );

  it('names only the tied leaders in a four-player game', async () => {
    const played: PlacedCard[] = (['2', '3'] as const).map((owner) => ({
      column: Number(owner),
      id: owner,
      name: 'timeline-origin',
      number: 1900,
      owner,
      placedAt: Number(owner),
      row: 0,
      type: 'event',
    }));

    render(
      <IntlProvider locale="en" messages={messages}>
        <GameResults played={played} playerIds={['0', '1', '2', '3']} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect
      .element(body)
      .toMatchTextContent("it's a tie! (Barry, Morgan)");
    await expect.element(body).toMatchTextContent('You: 0 card points');
  });

  it('keeps the result summary free of game controls', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <GameResults played={[]} />
      </IntlProvider>,
    );

    expect(page.getByText('Round scores')).toHaveLength(0);
  });
});
