import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  initializeTheme,
  parseTheme,
  savedTheme,
  saveTheme,
  storageKey,
} from './theme';

let values: Map<string, string>;
let dataset: Record<string, string>;

beforeEach(() => {
  values = new Map();
  dataset = {};
  vi.stubGlobal('document', { documentElement: { dataset } });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  );
});

afterEach(() => vi.unstubAllGlobals());

it.each(['light', 'dark', 'greyscale-light', 'greyscale-dark'] as const)(
  'persists and restores the %s theme',
  (theme) => {
    saveTheme(theme);
    expect(dataset.theme).toBe(theme);
    expect(values.get(storageKey)).toBe(theme);
    expect(savedTheme()).toBe(theme);
    dataset.theme = '';
    expect(initializeTheme()).toBe(theme);
    expect(dataset.theme).toBe(theme);
  },
);

it.each(['grayscale', 'greyscale'])(
  'migrates the earlier %s preference to greyscale dark',
  (value) => {
    values.set(storageKey, value);
    expect(parseTheme(value)).toBe('greyscale-dark');
    expect(initializeTheme()).toBe('greyscale-dark');
    expect(dataset.theme).toBe('greyscale-dark');
  },
);

it.each([true, false])(
  'uses the system preference when no theme is saved: %s',
  (dark) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: dark })),
    );
    expect(initializeTheme()).toBe(dark ? 'dark' : 'light');
  },
);

it('ignores invalid preferences', () => {
  values.set(storageKey, 'invalid');
  expect(savedTheme()).toBeNull();
  expect(parseTheme(null)).toBeNull();
  expect(parseTheme({ theme: 'dark' })).toBeNull();
  expect(initializeTheme()).toBe('dark');
});

it('still applies greyscale when browser storage is unavailable', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Storage blocked');
    },
    setItem: () => {
      throw new Error('Storage blocked');
    },
  });

  expect(savedTheme()).toBeNull();
  expect(() => {
    saveTheme('greyscale-dark');
  }).not.toThrow();
  expect(dataset.theme).toBe('greyscale-dark');
});
