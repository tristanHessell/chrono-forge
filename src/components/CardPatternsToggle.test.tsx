import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { CardPatternsToggle } from './CardPatternsToggle';

describe(CardPatternsToggle, () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(['on', 'off', null])(
    'shows the saved pattern preference: %s',
    async (value) => {
      vi.stubGlobal('localStorage', { getItem: () => value });

      expect.assertions(2);

      render(
        <IntlProvider locale="en" messages={messages}>
          <CardPatternsToggle />
        </IntlProvider>,
      );

      await expect
        .element(page.getByText('Colour-independent backgrounds'))
        .toBeInTheDocument();

      // eslint-disable-next-line vitest/no-conditional-in-test -- TODO refactor this test to avoid conditional logic
      if (value === 'on') {
        await expect.element(page.getByRole('checkbox')).toBeChecked();
      } else {
        await expect.element(page.getByRole('checkbox')).not.toBeChecked();
      }
    },
  );
});
