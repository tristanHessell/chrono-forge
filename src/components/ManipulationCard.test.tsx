import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import { CardHand } from './CardHand';

// TODO move this to CardHand.

describe('manipulationCard', () => {
  it.each(['time-jump', 'time-swap', 'take-control', 'remove-event'] as const)(
    'renders %s without an Event date or category',
    (action) => {
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

      expect(page.getByCSS('[data-card-type="manipulation"]')).toHaveLength(1);
      expect(
        page.getByText(messages[`manipulation.${action}.name`], {
          exact: true,
        }),
      ).toHaveLength(1);
      expect(
        page.getByCSS(`[class~="${cardStyles.manipulationName}"]`),
      ).toHaveLength(1);
      expect(page.getByCSS('[class*="hand-corner-number"]')).toHaveLength(0);
      expect(page.getByCSS('[data-event-category]')).toHaveLength(0);
      expect(page.getByText('NaN', { exact: true })).toHaveLength(0);
    },
  );
});
