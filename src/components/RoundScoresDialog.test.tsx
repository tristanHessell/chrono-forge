import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { CardGame, type CardGameState } from '../game';
import messages from '../i18n/en.json';
import { RoundScoresDialog } from './RoundScoresDialog';

function shuffle<T>(cards: T[]): T[] {
  return cards;
}

describe('RoundScoresDialog', () => {
  const setupGame = (): CardGameState => ({
    ...CardGame.setup!({
      random: { Shuffle: shuffle },
    } as never),
    roundScores: [
      { '0': 2, '1': 1 },
      { '0': 3, '1': 3 },
    ],
    round: 3,
    roundOver: false,
  });

  it('renders individual round scores and running totals', () => {
    const G = setupGame();
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    expect(html).toContain('Round scores');
    expect(html).toContain('>Round points</button>');
    expect(html).toContain('>Cumulative</button>');
    expect(html).toContain('>You</th>');
    expect(html).toContain('>Sally</th>');
    expect(html).toContain('Round 1');
    expect(html).toContain('Round 2');
    expect(html).toContain('Round 3');
    expect(html).toContain('(in progress)');
    expect(html).toContain('>+2</span>');
    expect(html).toContain('>+1</span>');
    expect(html).toContain('total: 2');
    expect(html).toContain('total: 3');
    expect(html).toContain('>Total</th>');
  });

  it('renders only completed rounds when the game is over', () => {
    const G: CardGameState = {
      ...setupGame(),
      roundScores: [
        { '0': 2, '1': 1 },
        { '0': 4, '1': 3 },
      ],
      round: 2,
      roundOver: true,
    };
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    expect(html).toContain('Round 1');
    expect(html).toContain('Round 2');
    expect(html).not.toContain('(in progress)');
    expect(html).toContain('>Total</th>');
  });

  it('shows an in-progress row at the start of round 1', () => {
    const G: CardGameState = {
      ...CardGame.setup!({
        random: { Shuffle: shuffle },
      } as never),
      roundScores: [],
      round: 1,
      roundOver: false,
    };
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    expect(html).toContain('Round 1');
    expect(html).toContain('(in progress)');
    expect(html).toContain('>0</span>');
    expect(html).toContain('total: 0');
  });

  it('includes columns for three or four players', () => {
    const G: CardGameState = {
      ...CardGame.setup!({
        ctx: { numPlayers: 4 },
        random: { Shuffle: shuffle },
      } as never),
      roundScores: [{ '0': 1, '1': 2, '2': 0, '3': 1 }],
      round: 2,
      roundOver: false,
    };
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={createRef()} G={G} />
      </IntlProvider>,
    );

    expect(html).toContain('>You</th>');
    expect(html).toContain('>Sally</th>');
    expect(html).toContain('>Barry</th>');
    expect(html).toContain('>Morgan</th>');
  });
});
