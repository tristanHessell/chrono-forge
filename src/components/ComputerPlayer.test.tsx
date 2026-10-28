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
  it('shows computer identity and score without revealing its cards', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <ComputerPlayer
          cards={cards}
          player={{ id: '1', name: 'Sally', type: 'computer' }}
          score={3}
        />
      </IntlProvider>,
    );

    expect(page.getByLabelText('Sally, AI')).toHaveLength(1);
    await expect
      .element(page.getByText('Sally', { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(page.getByText('3 points', { exact: true }))
      .toBeInTheDocument();
    expect(page.getByLabelText('2 face-down cards')).toHaveLength(1);
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
