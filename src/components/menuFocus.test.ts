import { expect, it, vi } from 'vitest';

import { focusMovedOutside } from './menuFocus';

it('keeps the menu open when a native picker takes focus without a target', () => {
  const container = { contains: vi.fn(() => false) };

  expect(focusMovedOutside(container, null)).toBe(false);
  expect(container.contains).not.toHaveBeenCalled();
});

it('keeps the menu open when focus moves between its controls', () => {
  const nextTarget = new EventTarget();
  const container = { contains: vi.fn(() => true) };

  expect(focusMovedOutside(container, nextTarget)).toBe(false);
  expect(container.contains).toHaveBeenCalledWith(nextTarget);
});

it('closes the menu when focus moves to another page element', () => {
  const container = { contains: vi.fn(() => false) };

  expect(focusMovedOutside(container, new EventTarget())).toBe(true);
});
