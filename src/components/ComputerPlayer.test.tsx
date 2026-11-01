import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { Card } from '../game';
import messages from '../i18n/en.json';
import { ComputerPlayer } from './ComputerPlayer';

const cards = [
  { id: 'hidden-1', name: 'timeline-origin', number: 1900, type: 'event' },
  { id: 'hidden-2', name: 'timeline-origin', number: 1910, type: 'event' },
] satisfies Card[];

describe(ComputerPlayer, () => {
  it('shows a human player summary without revealing their cards', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <ComputerPlayer
          actionsThisTurn={1}
          active
          cards={cards}
          player={{ id: '1', name: 'Sally', type: 'human' }}
          score={3}
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
          '[data-player-score="1"][data-current-turn="true"] > div > div > div > span:first-child',
        ),
      )
      .toBeInTheDocument();
    await expect
      .element(
        page.getByCSS(
          '[data-player-score="1"][data-current-turn="true"] > div > div > div > span:nth-child(2)',
        ),
      )
      .toHaveTextContent('1 action left');
    await expect
      .element(
        page.getByCSS('[data-player-score="1"] [aria-label="2 cards in hand"]'),
      )
      .toBeInTheDocument();
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
});
