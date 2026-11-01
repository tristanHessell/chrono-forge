import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  arrowAnimationStorageKey,
  arrowsStorageKey,
  initializeGameSettings,
  saveArrowAnimation,
  saveArrows,
  savedArrowAnimation,
  savedArrows,
} from './gameSettings';

let values: Map<string, string>;
let dataset: Record<string, string>;

describe('gameSettings', () => {
  beforeEach(() => {
    values = new Map();
    dataset = {};
    vi.stubGlobal('document', { documentElement: { dataset } });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('enables arrows and disables animation by default', () => {
    initializeGameSettings();

    expect(savedArrows()).toBe(true);
    expect(savedArrowAnimation()).toBe(false);
    expect(dataset.arrows).toBe('on');
    expect(dataset.arrowAnimation).toBe('off');
  });

  it('persists and restores arrow preferences', () => {
    saveArrows(false);
    saveArrowAnimation(true);

    expect(values.get(arrowsStorageKey)).toBe('off');
    expect(values.get(arrowAnimationStorageKey)).toBe('on');

    dataset.arrows = '';
    dataset.arrowAnimation = '';
    initializeGameSettings();

    expect(dataset.arrows).toBe('off');
    expect(dataset.arrowAnimation).toBe('on');
  });

  it('uses defaults when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage blocked');
      },
      setItem: () => {
        throw new Error('Storage blocked');
      },
    });

    expect(savedArrows()).toBe(true);
    expect(savedArrowAnimation()).toBe(false);
    expect(() => {
      saveArrows(false);
    }).not.toThrow();
    expect(dataset.arrows).toBe('off');
  });
});
