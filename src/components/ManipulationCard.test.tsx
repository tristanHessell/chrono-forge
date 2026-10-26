import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import { CardHand } from './CardHand';

it.each(['time-jump', 'time-swap', 'take-control', 'remove-event'] as const)(
  'renders %s without an Event date or category',
  async (action) => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <CardHand
          cards={[{ id: 'test', type: 'manipulation', action }]}
          owner="0"
          ownerName="You"
          playerType="human"
          activeOwner="0"
          pendingCardId={undefined}
          score={0}
          isReturnTarget={false}
          selectedCardId={null}
          onChoose={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
        />
      </IntlProvider>,
    );

    expect(page.getByCSS('[data-card-type="manipulation"]').length).toBe(1);
    expect(
      page.getByText(messages[`manipulation.${action}.name`], { exact: true })
        .length,
    ).toBe(1);
    expect(
      page.getByCSS(`[class~="${cardStyles.manipulationName}"]`).length,
    ).toBe(1);
    await expect
      .element(page.getByCSS('[data-card-type="manipulation"]'))
      .toHaveAttribute(
        'aria-description',
        expect.stringContaining(messages[`manipulation.${action}.description`]),
      );
    expect(page.getByCSS('[class*="hand-corner-number"]').length).toBe(0);
    expect(page.getByCSS('[data-event-category]').length).toBe(0);
    expect(page.getByText('NaN', { exact: true }).length).toBe(0);
  },
);
