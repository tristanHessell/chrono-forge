// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
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
  render(
    <IntlProvider locale="en" messages={messages}>
      <ComputerPlayer
        cards={cards}
        player={{ id: '1', name: 'Sally', type: 'computer' }}
        score={3}
      />
    </IntlProvider>,
  );

  expect(screen.getByLabelText('Sally, AI')).toBeTruthy();
  expect(screen.getByText('Sally', { selector: 'strong' })).toBeTruthy();
  expect(screen.getByText('3 points')).toBeTruthy();
  expect(screen.getByLabelText('2 face-down cards')).toBeTruthy();
  expect(screen.getByText('2', { selector: 'strong' })).toBeTruthy();
  expect(screen.queryByText('1900')).toBeNull();
  expect(screen.queryByText('1910')).toBeNull();
  expect(screen.queryByText("Sally's hand")).toBeNull();
});
