// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { GameLogView } from './components/GameLogView';
import logStyles from './components/GameLogView.module.css';
import ownershipStyles from './components/Ownership.module.css';
import setup from './fixtures/removed-time-jump.json';
import { CardGame } from './game';
import {
  currentGameLog,
  exportGameLog,
  parseGameLog,
  replayGameLog,
} from './gameLog';
import { summarizeGameLog } from './gameLogSummary';
import messages from './i18n/en.json';

it('summarises actor, card, coordinates, refill draws, turn changes and history without changing the game', () => {
  const seed = 'readable-log';
  const client = Client({ game: { ...CardGame, seed }, debug: false });
  const initial = client.getState()!;
  const event = initial.G.hands['0'].find((card) => card.type === 'event')!;

  client.moves.playCard(event.id, { row: 0, column: 1 });
  client.moves.movePendingCard({ row: -1, column: 0 });
  client.moves.confirmPlacement();

  const discarded = client.getState()!.G.hands['0'][0];

  client.moves.discardCard(discarded.id);
  client.moves.undoTest();
  client.moves.redoTest();

  const before = client.getState()!;
  const log = parseGameLog(exportGameLog(seed, 2, client.log));
  const items = summarizeGameLog(log);

  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({
    index: 1,
    player: '0',
    turn: 1,
    move: 'playEvent',
    card: event,
    position: { row: -1, column: 0 },
  });
  expect(items[1]).toMatchObject({
    move: 'discardCard',
    card: discarded,
    nextPlayer: '1',
  });
  expect(items[1].drawn.length).toBeGreaterThan(0);
  expect(client.getState()).toEqual(before);

  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogView log={log} />
    </IntlProvider>,
  );

  expect(screen.getAllByText('You')).not.toHaveLength(0);
  expect(
    container.querySelector(`.${logStyles.logPlayerReference.split(' ')[0]}`),
  ).toBeTruthy();
  expect(container.querySelector(`.${ownershipStyles.owner0}`)).toBeTruthy();
  expect(container.querySelector(`.${ownershipStyles.owner1}`)).toBeTruthy();
  expect(screen.queryByText('Player 1')).toBeNull();
  expect(screen.queryByText('Selected')).toBeNull();
  expect(screen.getByText(/Confirmed/)).toBeTruthy();
  expect(screen.getByText(/Discarded/)).toBeTruthy();
  expect(screen.queryByText('Drew:')).toBeNull();
  expect(
    container.querySelectorAll(`.${logStyles.logCardReference.split(' ')[0]}`),
  ).toHaveLength(2);
  expect(screen.queryByText('Undid')).toBeNull();
  expect(screen.queryByText('Redid')).toBeNull();
  expect(screen.queryByText('MAKE_MOVE')).toBeNull();
  expect(screen.queryByText(event.id)).toBeNull();
  client.stop();
});

it('shows seed, player count and an empty-state message before the first action', () => {
  const log = parseGameLog(exportGameLog('initial-seed', 4));

  render(
    <IntlProvider locale="en" messages={messages}>
      <GameLogView log={log} />
    </IntlProvider>,
  );

  expect(summarizeGameLog(log)).toEqual([]);
  expect(screen.getByText('initial-seed')).toBeTruthy();
  expect(screen.getByText('No actions yet.')).toBeTruthy();
  expect(screen.getByText(/takes the first turn/)).toBeTruthy();
});

it.each(['time-jump', 'time-swap', 'take-control'] as const)(
  'highlights the %s card and every referenced target',
  (action) => {
    const client = replayGameLog(parseGameLog(JSON.stringify(setup)));
    const manipulation = client
      .getState()!
      .G.hands['0'].find(
        (card) => card.type === 'manipulation' && card.action === action,
      )!;

    if (action === 'time-jump') {
      client.moves.manipulate(manipulation.id, 'event-1920-3', {
        row: -1,
        column: 1,
      });
    } else if (action === 'time-swap') {
      client.moves.manipulate(manipulation.id, 'event-1920-3', 'event-1910-2');
    } else {
      client.moves.manipulate(manipulation.id, 'event-1940-3');
    }

    const state = client.getState()!;
    const log = currentGameLog(setup.seed, state.G, state.ctx.currentPlayer);
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <GameLogView log={log} />
      </IntlProvider>,
    );

    expect(log.actions).toHaveLength(5);
    expect(
      container.querySelectorAll(
        `.${logStyles.logCardReference.split(' ')[0]}`,
      ),
    ).toHaveLength(action === 'time-swap' ? 8 : 7);

    expect(
      container.querySelector('strong[data-card-type="manipulation"]'),
    ).toBeTruthy();
    expect(screen.getByText('Remove Event')).toBeTruthy();
    expect(
      screen.getByText(messages[`manipulation.${action}.name`]),
    ).toBeTruthy();
    expect(screen.queryByText('Drew:')).toBeNull();
    expect(screen.queryByText('a card')).toBeNull();
    client.stop();
  },
);
