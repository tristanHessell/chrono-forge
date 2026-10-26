// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
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

  it('renders individual round scores and running totals', () => {
    const G = setupGame();
    const dialogRef = createRef<HTMLDialogElement>();

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={dialogRef} G={G} />
      </IntlProvider>,
    );

    dialogRef.current?.showModal();

    expect(screen.getByRole('heading', { name: 'Round scores' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Round points' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cumulative' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'You' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Sally' })).toBeTruthy();
    expect(screen.getByText('Round 1')).toBeTruthy();
    expect(screen.getByText('Round 2')).toBeTruthy();
    expect(screen.getByText('Round 3')).toBeTruthy();
    expect(screen.getByText('(in progress)')).toBeTruthy();
    expect(screen.getAllByText('+2')).not.toHaveLength(0);
    expect(screen.getAllByText('+1')).not.toHaveLength(0);
    expect(screen.getAllByText('total: 2')).not.toHaveLength(0);
    expect(screen.getAllByText('total: 3')).not.toHaveLength(0);
    expect(screen.getByRole('rowheader', { name: 'Total' })).toBeTruthy();
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
    const dialogRef = createRef<HTMLDialogElement>();

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={dialogRef} G={G} />
      </IntlProvider>,
    );
    dialogRef.current?.showModal();

    expect(screen.getAllByText('Round 1')).not.toHaveLength(0);
    expect(screen.getAllByText('Round 2')).not.toHaveLength(0);
    expect(screen.queryByText('(in progress)')).toBeNull();
    expect(screen.getByRole('rowheader', { name: 'Total' })).toBeTruthy();
  });

  it('shows an in-progress row at the start of round 1', () => {
    const G: CardGameState = {
      ...CardGame.setup!({
        ctx: { numPlayers: 2 },
        random: { Shuffle: shuffle },
      } as never),
      roundScores: [],
      round: 1,
      roundOver: false,
    };
    const dialogRef = createRef<HTMLDialogElement>();

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={dialogRef} G={G} />
      </IntlProvider>,
    );

    dialogRef.current?.showModal();

    expect(screen.getByText('Round 1')).toBeTruthy();
    expect(screen.getByText('(in progress)')).toBeTruthy();
    expect(screen.getAllByText('0')).not.toHaveLength(0);
    expect(screen.getAllByText('total: 0')).not.toHaveLength(0);
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
    const dialogRef = createRef<HTMLDialogElement>();

    render(
      <IntlProvider locale="en" messages={messages}>
        <RoundScoresDialog dialogRef={dialogRef} G={G} />
      </IntlProvider>,
    );
    dialogRef.current?.showModal();

    for (const name of ['You', 'Sally', 'Barry', 'Morgan']) {
      expect(screen.getByRole('columnheader', { name })).toBeTruthy();
    }
  });
});
