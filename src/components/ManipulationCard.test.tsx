import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import cardStyles from './Card.module.css';
import { CardHand } from './CardHand';

it.each(['time-jump', 'time-swap', 'take-control', 'remove-event'] as const)(
  'renders %s without an Event date or category',
  (action) => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <CardHand
          cards={[{ id: 'test', type: 'manipulation', action }]}
          owner="0"
          activeOwner="0"
          pendingCardId={undefined}
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

    expect(html).toContain('data-card-type="manipulation"');
    expect(html).toContain(messages[`manipulation.${action}.name`]);
    expect(html).toContain(`class="${cardStyles.manipulationName}"`);
    expect(html).toContain(
      renderToStaticMarkup(
        <>{messages[`manipulation.${action}.description`]}</>,
      ),
    );
    expect(html).not.toContain('hand-corner-number');
    expect(html).not.toContain('data-event-category');
    expect(html).not.toContain('NaN');
  },
);
