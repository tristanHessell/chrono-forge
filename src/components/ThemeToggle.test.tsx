import { IntlProvider } from 'react-intl';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { ThemeToggle } from './ThemeToggle';

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
    expect(page.getByCSS('option').length).toBe(4);
    await expect
      .element(page.getByCSS('select'))
      .toMatchTextContent('LightDarkGreyscale LightGreyscale Dark');
    expect(page.getByCSS('[aria-pressed]').length).toBe(0);
  },
);
