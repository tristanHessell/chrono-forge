import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  cardPatternsStorageKey,
  initializeCardPatterns,
  saveCardPatterns,
  savedCardPatterns,
} from './cardPatterns';

let values: Map<string, string>;
let dataset: Record<string, string>;

beforeEach(() => {
  values = new Map();
  dataset = { theme: 'greyscale-dark' };
  vi.stubGlobal('document', { documentElement: { dataset } });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

it('enables patterns by default', () => {
  expect(savedCardPatterns()).toBe(true);
  initializeCardPatterns();
  expect(dataset.cardPatterns).toBe('on');
});

it.each([true, false])('persists and restores patterns: %s', (enabled) => {
  saveCardPatterns(enabled);
  expect(dataset.cardPatterns).toBe(enabled ? 'on' : 'off');
  expect(values.get(cardPatternsStorageKey)).toBe(enabled ? 'on' : 'off');
  expect(savedCardPatterns()).toBe(enabled);
  dataset.cardPatterns = '';
  initializeCardPatterns();
  expect(dataset.cardPatterns).toBe(enabled ? 'on' : 'off');
  expect(dataset.theme).toBe('greyscale-dark');
});

it('uses the default for an invalid preference', () => {
  values.set(cardPatternsStorageKey, 'invalid');
  expect(savedCardPatterns()).toBe(true);
});

it('still toggles patterns when storage is unavailable', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Storage blocked');
    },
    setItem: () => {
      throw new Error('Storage blocked');
    },
  });

  expect(savedCardPatterns()).toBe(true);
  expect(() => saveCardPatterns(false)).not.toThrow();
  expect(dataset.cardPatterns).toBe('off');
});
