import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { PlacementSlot } from './PlacementSlot';
import slotStyles from './PlacementSlot.module.css';
import { PlayedCard } from './PlayedCard';
import playedStyles from './PlayedCard.module.css';

// TODO move this to PlayedCard.

describe('removedCard', () => {
  it('visually and accessibly marks a removed Event and its overwrite target', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PlayedCard
          card={{
            column: 1,
            id: 'removed',
            name: 'timeline-origin',
            number: 1990,
            owner: '2',
            placedAt: 1,
            removed: true,
            row: 0,
            type: 'event',
          }}
          isLatest={false}
          links={null}
          style={{}}
        />
        <PlacementSlot
          ariaLabel="Overwrite removed Event"
          draggedCard={null}
          isDragActive={false}
          isPreview={false}
          onClick={() => {}}
          onDragEnter={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
          overwrite
          position={{ column: 2, row: -1 }}
        />
      </IntlProvider>,
    );

    const removedCard = page.getByCSS('[data-removed="true"]');

    expect(removedCard).toHaveLength(1);
    await expect
      .element(removedCard)
      .toHaveClass(...playedStyles.removedCard.split(' '));
    await expect.element(removedCard).toHaveAttribute('data-position', '0:1');
    expect(page.getByText('Removed', { exact: true })).toHaveLength(1);

    const overwriteSlot = page.getByCSS('[data-drop-position="-1:2"]');

    expect(overwriteSlot).toHaveLength(1);
    await expect
      .element(overwriteSlot)
      .toHaveClass(...slotStyles.overwriteSlot.split(' '));
    expect(page.getByLabelText('Overwrite removed Event')).toHaveLength(1);
    expect(page.getByRole('tooltip')).toHaveLength(0);
  });
});
