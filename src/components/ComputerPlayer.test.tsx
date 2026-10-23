import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { Card } from '../game';
import messages from '../i18n/en.json';
import { ComputerPlayer } from './ComputerPlayer';

const cards = [
  { id: 'hidden-1', type: 'event', name: 'timeline-origin', number: 1900 },
  { id: 'hidden-2', type: 'event', name: 'timeline-origin', number: 1910 },
] satisfies Card[];

it('shows computer identity and score without revealing its cards', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <ComputerPlayer
        cards={cards}
        player={{ id: '1', name: 'Sally', type: 'computer' }}
        score={3}
      />
    </IntlProvider>,
  );

  expect(html).toContain('aria-label="Sally, AI"');
  expect(html).toContain('>Sally</strong>');
  expect(html).toContain('>3 points</span>');
  expect(html).toContain('aria-label="2 face-down cards"');
  expect(html).toContain('>2</strong>');
  expect(html).not.toContain('1900');
  expect(html).not.toContain('1910');
  expect(html).not.toContain("Sally's hand");
});
