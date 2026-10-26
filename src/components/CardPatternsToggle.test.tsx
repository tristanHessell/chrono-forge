// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { CardPatternsToggle } from './CardPatternsToggle';

afterEach(() => vi.unstubAllGlobals());

it.each(['on', 'off', null])(
  'shows the saved pattern preference: %s',
  (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });

    render(
      <IntlProvider locale="en" messages={messages}>
        <CardPatternsToggle />
      </IntlProvider>,
    );

    expect(screen.getByText('Colour-independent backgrounds')).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(
      value === 'on',
    );
  },
);
