import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { BoardZoomControls } from './BoardZoomControls';

describe(BoardZoomControls, () => {
  it.each([
    [0.2, '20%', 'Zoom out'],
    [1, '100%', null],
    [2, '200%', 'Zoom in'],
  ] as const)(
    'renders accessible floating controls at zoom %s',
    async (zoom, percent, disabled) => {
      expect.assertions(7);

      render(
        <IntlProvider locale="en" messages={messages}>
          <BoardZoomControls
            boardZoom={zoom}
            onFitAll={() => {}}
            onResetZoom={() => {}}
            onZoomChange={() => {}}
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

      // eslint-disable-next-line vitest/no-conditional-in-test -- TODO refactor this test to avoid conditional logic
      if (disabled) {
        await expect
          .element(page.getByRole('button', { name: disabled }))
          .toBeDisabled();
      } else {
        expect(page.getByCSS('button:disabled')).toHaveLength(0);
      }
    },
  );
});
