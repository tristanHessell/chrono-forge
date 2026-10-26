import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import { CardGame, type CardGameState } from '../game';
import messages from '../i18n/en.json';
import { RoundScoresDialog } from './RoundScoresDialog';

function shuffle<T>(cards: T[]): T[] {
  return cards;
}

describe(RoundScoresDialog, () => {
  const setupGame = (): CardGameState => ({
    ...CardGame.setup!({
      ctx: { numPlayers: 2 },
      random: { Shuffle: shuffle },
    } as never),
    roundScores: [
      { '0': 2, '1': 1 },
      { '0': 3, '1': 3 },
    ],
    round: 3,
    roundOver: false,
  });

  it('renders individual round scores and running totals', async () => {
    const G = setupGame();

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent('Round scores');
    expect(
      page.getByCSS('button').filter({ hasText: 'Round points' }),
    ).toHaveLength(1);
    expect(
      page.getByCSS('button').filter({ hasText: 'Cumulative' }),
    ).toHaveLength(1);
    await expect.element(body).toMatchTextContent('You');
    await expect.element(body).toMatchTextContent('Sally');
    await expect.element(body).toMatchTextContent('Round 1');
    await expect.element(body).toMatchTextContent('Round 2');
    await expect.element(body).toMatchTextContent('Round 3');
    await expect.element(body).toMatchTextContent('(in progress)');
    await expect.element(body).toMatchTextContent('+2');
    await expect.element(body).toMatchTextContent('+1');
    await expect.element(body).toMatchTextContent('total: 2');
    await expect.element(body).toMatchTextContent('total: 3');
    await expect.element(body).toMatchTextContent('Total');
  });

  it('renders only completed rounds when the game is over', async () => {
    const G: CardGameState = {
      ...setupGame(),
      roundScores: [
        { '0': 2, '1': 1 },
        { '0': 4, '1': 3 },
      ],
      round: 2,
      roundOver: true,
    };

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent('Round 1');
    await expect.element(body).toMatchTextContent('Round 2');
    await expect.element(body).not.toMatchTextContent('(in progress)');
    await expect.element(body).toMatchTextContent('Total');
  });

  it('shows an in-progress row at the start of round 1', async () => {
    const G: CardGameState = {
      ...CardGame.setup!({
        ctx: { numPlayers: 2 },
        random: { Shuffle: shuffle },
      } as never),
      roundScores: [],
      round: 1,
      roundOver: false,
    };

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent('Round 1');
    await expect.element(body).toMatchTextContent('(in progress)');
    await expect.element(body).toMatchTextContent('0');
    await expect.element(body).toMatchTextContent('total: 0');
  });

  it('includes columns for three or four players', async () => {
    const G: CardGameState = {
      ...CardGame.setup!({
        ctx: { numPlayers: 4 },
        random: { Shuffle: shuffle },
      } as never),
      roundScores: [{ '0': 1, '1': 2, '2': 0, '3': 1 }],
      round: 2,
      roundOver: false,
    };

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    expect(page.getByCSS('th[scope="col"]')).toHaveLength(5);

    for (const [index, name] of ['You', 'Sally', 'Barry', 'Morgan'].entries()) {
      await expect
        .element(page.getByCSS('th[scope="col"]').nth(index + 1))
        .toHaveTextContent(name);
    }
  });
});
