import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import { CardHand } from './CardHand';

// TODO move this to CardHand.

describe('commandCard', () => {
  it.each(['time-jump', 'time-swap', 'take-control', 'remove-event'] as const)(
    'renders %s without an Event date or category',
    (action) => {
      render(
        <IntlProvider locale="en" messages={messages}>
          <CardHand
            activeOwner="0"
            cards={[{ action, id: 'test', type: 'command' }]}
            isReturnTarget={false}
            onChoose={() => {}}
            onDragEnd={() => {}}
            onDragOver={() => {}}
            onDragStart={() => {}}
            onDrop={() => {}}
            owner="0"
            ownerName="You"
            pendingCardId={undefined}
            playerType="human"
            score={0}
            selectedCardId={null}
          />
        </IntlProvider>,
      );

      expect(page.getByCSS('[data-card-type="command"]')).toHaveLength(1);
      expect(
        page.getByText(messages[`command.${action}.name`], {
          exact: true,
        }),
      ).toHaveLength(1);
      expect(
        page.getByCSS(`[class~="${cardStyles.commandName}"]`),
      ).toHaveLength(1);
      expect(page.getByCSS('[class*="hand-corner-number"]')).toHaveLength(0);
      expect(page.getByCSS('[data-event-category]')).toHaveLength(0);
      expect(page.getByText('NaN', { exact: true })).toHaveLength(0);
    },
  );
});
