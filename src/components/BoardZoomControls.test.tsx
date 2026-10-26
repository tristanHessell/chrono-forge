import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { BoardZoomControls } from './BoardZoomControls';

it.each([
  [0.2, '20%', 'Zoom out'],
  [1, '100%', null],
  [2, '200%', 'Zoom in'],
] as const)(
  'renders accessible floating controls at zoom %s',
  (zoom, percent, disabled) => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={messages}>
        <BoardZoomControls
          boardZoom={zoom}
          onFitAll={() => {}}
          onZoomChange={() => {}}
          onResetZoom={() => {}}
        />
      </IntlProvider>,
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Board zoom controls"');
    expect(html).toContain('aria-label="Zoom out"');
    expect(html).toContain('aria-label="Zoom in"');
    expect(html).toContain('aria-label="Reset board zoom"');
    expect(html).toContain('aria-label="Fit all"');
    expect(html).toContain('>Fit all</button>');
    expect(html).toContain(`>${percent}</button>`);

    if (disabled) {
      expect(html).toContain(`aria-label="${disabled}" disabled=""`);
    } else {
      expect(html).not.toContain('disabled=""');
    }
  },
);
