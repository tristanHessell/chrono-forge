// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';

it('visually and accessibly marks a removed Event and its overwrite target', () => {
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <PlayedCard
        card={{
          id: 'removed',
          type: 'event',
          name: 'timeline-origin',
          number: 1990,
          row: 0,
          column: 1,
          placedAt: 1,
          owner: '2',
          removed: true,
        }}
        style={{}}
        links={null}
        isLatest={false}
      />
      <PlacementSlot
        ariaLabel="Overwrite removed Event"
        position={{ row: -1, column: 2 }}
        draggedCard={null}
        overwrite
        isDragActive={false}
        isPreview={false}
        onClick={() => {}}
        onDragEnter={() => {}}
        onDragOver={() => {}}
        onDrop={() => {}}
      />
    </IntlProvider>,
  );

  expect(container.querySelector('[data-removed="true"]')).toBeTruthy();
  expect(container.querySelector('[data-position="0:1"]')).toBeTruthy();
  expect(screen.getByText('Removed')).toBeTruthy();
  expect(
    container
      .querySelector('[data-removed="true"]')
      ?.getAttribute('aria-description'),
  ).toContain(messages['card.removedDescription']);
  expect(container.querySelector('[data-drop-position="-1:2"]')).toBeTruthy();
  expect(screen.getByLabelText('Overwrite removed Event')).toBeTruthy();
  expect(screen.queryByRole('tooltip')).toBeNull();
});
