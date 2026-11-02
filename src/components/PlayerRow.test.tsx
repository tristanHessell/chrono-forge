import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { Card } from '../game';
import messages from '../i18n/en.json';
import { PlayerRow } from './PlayerRow';

const cards = [
  { id: 'hidden-1', name: 'timeline-origin', number: 1900, type: 'event' },
  { id: 'hidden-2', name: 'timeline-origin', number: 1910, type: 'event' },
] satisfies Card[];

describe(PlayerRow, () => {
  it('shows a human player summary without revealing their cards', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PlayerRow
          actionsThisTurn={1}
          active
          cards={cards}
          confirmTurn={() => {}}
          player={{ id: '1', name: 'Sally', type: 'human' }}
          score={3}
          turnPendingConfirmation
        />
      </IntlProvider>,
    );

    expect(page.getByLabelText('Sally, human')).toHaveLength(1);
    await expect
      .element(page.getByText('Sally', { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(page.getByText('3 points', { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(
        page.getByCSS(
          '[data-player-score="1"][data-current-turn="true"] [data-active="true"] button',
        ),
      )
      .toHaveTextContent('End turn');
    await expect
      .element(
        page.getByCSS('[data-player-score="1"] [aria-label="2 cards in hand"]'),
      )
      .toBeInTheDocument();
    expect(
      page.getByCSS(
        '[data-player-score="1"] [aria-label="2 cards in hand"] svg',
      ),
    ).toHaveLength(1);
    expect(page.getByLabelText('2 cards in hand')).toHaveLength(1);
    await expect
      .element(page.getByText('2', { exact: true }))
      .toBeInTheDocument();
    await expect.element(page.getByCSS('body')).not.toMatchTextContent('1900');
    await expect.element(page.getByCSS('body')).not.toMatchTextContent('1910');
    await expect
      .element(page.getByCSS('body'))
      .not.toMatchTextContent("Sally's hand");
  });

  it('shows only the remaining action count for the active player', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PlayerRow
          actionsThisTurn={0}
          active
          cards={cards}
          player={{ id: '1', name: 'Sally', type: 'human' }}
          score={3}
        />
      </IntlProvider>,
    );

    await expect
      .element(page.getByCSS('[data-player-score="1"] [data-player-turn]'))
      .toHaveTextContent('2 actions left');
    await expect
      .element(page.getByCSS('body'))
      .not.toMatchTextContent('Current player');
  });

  it('keeps the turn status in the layout when the player is inactive', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PlayerRow
          actionsThisTurn={0}
          active={false}
          cards={cards}
          player={{ id: '1', name: 'Sally', type: 'human' }}
          score={3}
        />
      </IntlProvider>,
    );

    expect(
      page.getByCSS(
        '[data-player-score="1"] [data-active="false"][aria-hidden="true"]',
      ),
    ).toHaveLength(1);
  });
});
