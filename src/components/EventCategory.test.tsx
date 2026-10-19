import { renderToStaticMarkup } from 'react-dom/server';
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
    const html = renderToStaticMarkup(
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
      html.match(new RegExp(`data-event-category="${category}"`, 'g')),
    ).toHaveLength(2);
    expect(html).toContain(messages[`card.category.${category}`]);
    expect(html.match(/Imperial Alliances/g)).toHaveLength(3);
    expect(html).toContain('placed by you');
  },
);
