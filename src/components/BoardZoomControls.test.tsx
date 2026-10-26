// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
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

    expect(
      screen.getByRole('group', { name: 'Board zoom controls' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Reset board zoom' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fit all' })).toBeTruthy();
    expect(screen.getByText(percent)).toBeTruthy();

    if (disabled) {
      expect(
        screen.getByRole<HTMLButtonElement>('button', { name: disabled })
          .disabled,
      ).toBe(true);
    } else {
      expect(
        screen.getByRole<HTMLButtonElement>('button', { name: 'Zoom out' })
          .disabled,
      ).toBe(false);
      expect(
        screen.getByRole<HTMLButtonElement>('button', { name: 'Zoom in' })
          .disabled,
      ).toBe(false);
    }
  },
);
