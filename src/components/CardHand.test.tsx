import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { CardHand } from './CardHand';

it('shows the player avatar and score above the current hand', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <CardHand
        activeOwner="0"
        cards={[]}
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
        score={4}
        selectedCardId={null}
      />
    </IntlProvider>,
  );

  expect(html).toContain('aria-label="You, human"');
  expect(html).toContain('Your hand');
  expect(html).toContain('4 points');
});
