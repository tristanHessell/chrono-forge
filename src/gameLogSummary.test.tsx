import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
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

  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameLogView log={log} />
    </IntlProvider>,
  );

  expect(html).toContain('You');
  expect(html).toContain(logStyles.logPlayerReference);
  expect(html).toContain(ownershipStyles.owner0);
  expect(html).toContain(ownershipStyles.owner1);
  expect(html).not.toContain('Player 1');
  expect(html).not.toContain('Selected');
  expect(html).toContain('Confirmed');
  expect(html).toContain('Discarded');
  expect(html).not.toContain('Drew:');
  expect(html.split(`class="${logStyles.logCardReference}"`)).toHaveLength(3);
  expect(html).not.toContain('Undid');
  expect(html).not.toContain('Redid');
  expect(html).not.toContain('MAKE_MOVE');
  expect(html).not.toContain(event.id);
  client.stop();
});

it('shows seed, player count and an empty-state message before the first action', () => {
  const log = parseGameLog(exportGameLog('initial-seed', 4));
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <GameLogView log={log} />
    </IntlProvider>,
  );

  expect(summarizeGameLog(log)).toEqual([]);
  expect(html).toContain('initial-seed');
  expect(html).toContain('No actions yet.');
  expect(html).toContain('You</strong> takes the first turn.');
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
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <GameLogView log={log} />
      </IntlProvider>,
    );

    expect(log.actions).toHaveLength(5);
    expect(html.split(`class="${logStyles.logCardReference}"`)).toHaveLength(
      action === 'time-swap' ? 9 : 8,
    );
    expect(html).toMatch(
      /<strong[^>]*data-card-type="manipulation"[^>]*>Remove Event<\/strong>/,
    );
    expect(html).toContain(
      `>${messages[`manipulation.${action}.name`]}</strong>`,
    );
    expect(html).not.toContain('Drew:');
    expect(html).not.toContain('a card');
    client.stop();
  },
);
