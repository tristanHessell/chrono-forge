// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';

it.each(['political', 'technological', 'environmental'] as const)(
  'labels %s cards and preserves category styling on the board and drag preview',
  (category) => {
    const card: PlacedCard = {
      id: 'test',
      type: 'event',
      category,
      name: 'imperial-alliances',
      number: 1900,
      row: 0,
      column: 1,
      owner: '0',
      placedAt: 1,
    };
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <PlayedCard card={card} style={{}} links={null} isLatest />
        <PlacementSlot
          ariaLabel="Place here"
          draggedCard={card}
          isDragActive
          isPreview
          onClick={() => {}}
          onDragEnter={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
        />
      </IntlProvider>,
    );

    expect(
      container.querySelectorAll(`[data-event-category="${category}"]`),
    ).toHaveLength(2);
    expect(
      screen.getAllByText(messages[`card.category.${category}`]),
    ).not.toHaveLength(0);
    expect(screen.getAllByText('Imperial Alliances')).toHaveLength(2);
    expect(screen.getByRole('img', { name: /placed by you/ })).toBeTruthy();
  },
);
