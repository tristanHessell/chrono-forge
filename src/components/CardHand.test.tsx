import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { CardHand } from './CardHand';

describe(CardHand, () => {
  it('shows the player avatar without a date sort button or score', async () => {
    render(
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
          selectedCardId={null}
        />
      </IntlProvider>,
    );

    expect(page.getByLabelText('You, human')).toHaveLength(1);
    expect(page.getByLabelText('Your hand drop area')).toHaveLength(1);
    expect(page.getByRole('button', { name: 'Date' })).toHaveLength(0);
    await expect
      .element(page.getByText('4 points', { exact: true }))
      .not.toBeInTheDocument();
  });
});
