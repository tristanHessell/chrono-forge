import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => vi.unstubAllGlobals());

it.each(['light', 'dark', 'greyscale-light', 'greyscale-dark'])(
  'shows four labelled choices with %s selected',
  (theme) => {
    vi.stubGlobal('document', { documentElement: { dataset: { theme } } });

    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <ThemeToggle />
      </IntlProvider>,
    );

    expect(html).toContain('aria-label="Theme"');
    expect(html).toContain('>Light</option>');
    expect(html).toContain('>Dark</option>');
    expect(html).toContain('>Greyscale Light</option>');
    expect(html).toContain('>Greyscale Dark</option>');
    expect(html).toContain(`value="${theme}" selected=""`);
    expect(html).not.toContain('aria-pressed');
  },
);
