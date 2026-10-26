// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';

import messages from '../i18n/en.json';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

it.each(['light', 'dark', 'greyscale-light', 'greyscale-dark'])(
  'shows four labelled choices with %s selected',
  (theme) => {
    vi.stubGlobal('matchMedia', () => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }));
    document.documentElement.dataset.theme = theme;

    render(
      <IntlProvider locale="en" messages={messages}>
        <ThemeToggle />
      </IntlProvider>,
    );

    const themeSelect = screen.getByRole('combobox', { name: 'Theme' });

    expect(screen.getByRole('option', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Dark' })).toBeTruthy();
    expect(
      screen.getByRole('option', { name: 'Greyscale Light' }),
    ).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Greyscale Dark' })).toBeTruthy();
    expect((themeSelect as HTMLSelectElement).value).toBe(theme);
    expect(screen.queryByRole('button', { name: 'Theme' })).toBeNull();
  },
);
