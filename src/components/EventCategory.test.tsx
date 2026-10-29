import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import type { PlacedCard } from '../game';
import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';

describe('eventCategory', () => {
  it.each(['politics', 'tech', 'nature'] as const)(
    'labels %s cards and preserves category styling on the board and drag preview',
    async (category) => {
      const card: PlacedCard = {
        category,
        column: 1,
        id: 'test',
        name: 'imperial-alliances',
        number: 1900,
        owner: '0',
        placedAt: 1,
        row: 0,
        type: 'event',
      };

      render(
        <IntlProvider locale="en" messages={messages}>
          <PlayedCard card={card} isLatest links={null} style={{}} />
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

      expect(page.getByCSS(`[data-event-category="${category}"]`)).toHaveLength(
        2,
      );
      expect(
        page.getByText(messages[`card.category.${category}`], { exact: true }),
      ).toHaveLength(2);
      expect(
        page.getByText('Imperial Alliances', { exact: true }),
      ).toHaveLength(2);
      expect(page.getByLabelText(/Imperial Alliances/)).toHaveLength(1);
      await expect
        .element(page.getByCSS('[data-owner="0"]'))
        .toHaveAttribute(
          'aria-label',
          expect.stringContaining('placed by you'),
        );
    },
  );
});
