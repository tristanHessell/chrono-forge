import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { ThemeToggle } from './ThemeToggle';

describe(ThemeToggle, () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it.each(['light', 'dark', 'greyscale-light', 'greyscale-dark'])(
    'shows four labelled choices with %s selected',
    async (theme) => {
      document.documentElement.dataset.theme = theme;

      render(
        <IntlProvider locale="en" messages={messages}>
          <ThemeToggle />
        </IntlProvider>,
      );

      const select = page.getByLabelText('Theme');

      await expect.element(select).toHaveValue(theme);
      expect(page.getByCSS('option')).toHaveLength(4);
      await expect
        .element(page.getByCSS('select'))
        .toMatchTextContent('LightDarkGreyscale LightGreyscale Dark');
      expect(page.getByCSS('[aria-pressed]')).toHaveLength(0);
    },
  );
});
