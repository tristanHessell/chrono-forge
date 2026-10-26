import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';

it.each(['political', 'technological', 'environmental'] as const)(
  'labels %s cards and preserves category styling on the board and drag preview',
  async (category) => {
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

    render(
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

    expect(page.getByCSS(`[data-event-category="${category}"]`).length).toBe(2);
    expect(
      page.getByText(messages[`card.category.${category}`], { exact: true })
        .length,
    ).toBe(2);
    expect(page.getByText('Imperial Alliances', { exact: true }).length).toBe(
      2,
    );
    expect(page.getByLabelText(/Imperial Alliances/).length).toBe(1);
    await expect
      .element(page.getByCSS('[data-owner="0"]'))
      .toHaveAttribute('aria-label', expect.stringContaining('placed by you'));
  },
);
