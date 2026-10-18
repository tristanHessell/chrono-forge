import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';

it('visually and accessibly marks a removed Event and its overwrite target', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <PlayedCard
        card={{
          id: 'removed',
          type: 'event',
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

  expect(html).toContain('removed-card');
  expect(html).toContain('data-removed="true"');
  expect(html).toContain('data-position="0:1"');
  expect(html).toContain('Removed');
  expect(html).toContain(messages['card.removedDescription']);
  expect(html).toContain('overwrite-slot');
  expect(html).toContain('Overwrite');
  expect(html).not.toContain('role="tooltip"');
});
