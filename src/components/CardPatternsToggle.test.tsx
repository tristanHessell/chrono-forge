import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { CardPatternsToggle } from './CardPatternsToggle';

afterEach(() => vi.unstubAllGlobals());

it.each(['on', 'off', null])(
  'shows the saved pattern preference: %s',
  (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });

    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <CardPatternsToggle />
      </IntlProvider>,
    );

    expect(html).toContain('Colour-independent backgrounds');
    expect(html).toContain('type="checkbox"');
    expect(html.includes('checked=""')).toBe(value !== 'off');
  },
);
