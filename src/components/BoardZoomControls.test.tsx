import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { BoardZoomControls } from './BoardZoomControls';

it.each([
  [0.2, '20%', 'Zoom out'],
  [1, '100%', null],
  [2, '200%', 'Zoom in'],
] as const)(
  'renders accessible floating controls at zoom %s',
  async (zoom, percent, disabled) => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <BoardZoomControls
          boardZoom={zoom}
          onFitAll={() => {}}
          onZoomChange={() => {}}
          onResetZoom={() => {}}
        />
      </IntlProvider>,
    );

    await expect
      .element(page.getByRole('group', { name: 'Board zoom controls' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Zoom out' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Zoom in' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Reset board zoom' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Fit all' }))
      .toBeVisible();
    await expect
      .element(page.getByCSS('button').nth(1))
      .toHaveTextContent(percent);

    if (disabled) {
      await expect
        .element(page.getByRole('button', { name: disabled }))
        .toBeDisabled();
    } else {
      expect(page.getByCSS('button:disabled').length).toBe(0);
    }
  },
);
