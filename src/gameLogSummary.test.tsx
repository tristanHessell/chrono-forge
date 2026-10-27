import { Client } from 'boardgame.io/client';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../tests/render';
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

describe('gameLogSummary', () => {
  it('summarises actor, card, coordinates, refill draws, turn changes and history without changing the game', async () => {
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
    expect(client.getState()).toStrictEqual(before);

    render(
      <IntlProvider locale="en" messages={messages}>
        <GameLogView log={log} />
      </IntlProvider>,
    );

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent('You');
    expect(page.getByCSS('strong').length).toBeGreaterThan(0);
    await expect
      .element(page.getByCSS('strong').first())
      .toHaveClass(...logStyles.logPlayerReference.split(' '));
    await expect
      .element(page.getByCSS('strong').first())
      .toHaveClass(...ownershipStyles.owner0.split(' '));
    await expect
      .element(page.getByText('Sally', { exact: true }).first())
      .toHaveClass(...ownershipStyles.owner1.split(' '));
    await expect.element(body).not.toMatchTextContent('Player 1');
    await expect.element(body).not.toMatchTextContent('Selected');
    await expect.element(body).toMatchTextContent('Confirmed');
    await expect.element(body).toMatchTextContent('Discarded');
    await expect.element(body).not.toMatchTextContent('Drew:');
    expect(page.getByCSS('strong[data-card-type]')).toHaveLength(2);
    await expect
      .element(page.getByCSS('strong[data-card-type]').first())
      .toHaveClass(...logStyles.logCardReference.split(' '));
    await expect.element(body).not.toMatchTextContent('Undid');
    await expect.element(body).not.toMatchTextContent('Redid');
    await expect.element(body).not.toMatchTextContent('MAKE_MOVE');
    await expect.element(body).not.toMatchTextContent(event.id);

    client.stop();
  });

  it('shows seed, player count and an empty-state message before the first action', async () => {
    const log = parseGameLog(exportGameLog('initial-seed', 4));

    render(
      <IntlProvider locale="en" messages={messages}>
        <GameLogView log={log} />
      </IntlProvider>,
    );

    expect(summarizeGameLog(log)).toStrictEqual([]);

    const body = page.getByCSS('body');

    await expect.element(body).toMatchTextContent('initial-seed');
    await expect.element(body).toMatchTextContent('No actions yet.');
    await expect.element(body).toMatchTextContent('You takes the first turn.');
  });

  it.each(['time-jump', 'time-swap', 'take-control'] as const)(
    'highlights the %s card and every referenced target',
    async (action) => {
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
        client.moves.manipulate(
          manipulation.id,
          'event-1920-3',
          'event-1910-2',
        );
      } else {
        client.moves.manipulate(manipulation.id, 'event-1940-3');
      }

      const state = client.getState()!;
      const log = currentGameLog(setup.seed, state.G, state.ctx.currentPlayer);

      render(
        <IntlProvider locale="en" messages={messages}>
          <GameLogView log={log} />
        </IntlProvider>,
      );

      expect(log.actions).toHaveLength(5);
      expect(page.getByCSS('strong[data-card-type]')).toHaveLength(
        action === 'time-swap' ? 8 : 7,
      );
      await expect
        .element(page.getByCSS('strong[data-card-type="manipulation"]').first())
        .toHaveTextContent('Remove Event');
      await expect
        .element(page.getByCSS('strong[data-card-type="manipulation"]').first())
        .toHaveClass(...logStyles.logCardReference.split(' '));
      expect(
        page.getByText(messages[`manipulation.${action}.name`], {
          exact: true,
        }),
      ).toHaveLength(1);

      const body = page.getByCSS('body');

      await expect.element(body).not.toMatchTextContent('Drew:');
      await expect.element(body).not.toMatchTextContent('a card');

      client.stop();
    },
  );
});
