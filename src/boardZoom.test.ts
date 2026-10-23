import { expect, it, vi } from 'vitest';

import { changeBoardZoom, listenForBoardWheel } from './boardZoom';

function wheel (deltaY: number, ctrlKey = false) {
  return Object.assign(
    new Event('wheel', { bubbles: true, cancelable: true }),
    {
      deltaY,
      ctrlKey,
    },
  );
}

it.each([
  [1, -100, 1.1],
  [1, 100, 0.9],
  [1.6, -100, 1.6],
  [0.6, 100, 0.6],
  [1, 0, 1],
])(
  'contains wheel input at zoom %s with delta %s',
  (initial, delta, expected) => {
    const viewport = new EventTarget();
    const addListener = vi.spyOn(viewport, 'addEventListener');
    let zoom = initial;
    const cleanup = listenForBoardWheel(viewport, (change) => {
      zoom = changeBoardZoom(zoom, change);
    });
    const event = wheel(delta);
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    expect(addListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: false,
    });
    expect(viewport.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(zoom).toBe(expected);
    cleanup();
  },
);

it('cancels browser zoom gestures even after repeated input at the zoom limit', () => {
  const viewport = new EventTarget();
  let zoom = 1.6;
  const cleanup = listenForBoardWheel(viewport, (change) => {
    zoom = changeBoardZoom(zoom, change);
  });

  for (let index = 0; index < 5; index += 1) {
    const event = wheel(-100, true);

    expect(viewport.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(zoom).toBe(1.6);
  }
  cleanup();
});

it('only intercepts the board and removes its listener during cleanup', () => {
  const viewport = new EventTarget();
  const outside = new EventTarget();
  const onZoomChange = vi.fn();
  const cleanup = listenForBoardWheel(viewport, onZoomChange);
  const outsideEvent = wheel(-100);

  expect(outside.dispatchEvent(outsideEvent)).toBe(true);
  expect(outsideEvent.defaultPrevented).toBe(false);
  expect(onZoomChange).not.toHaveBeenCalled();
  viewport.dispatchEvent(wheel(-100));
  expect(onZoomChange).toHaveBeenCalledExactlyOnceWith(0.1);
  cleanup();

  const event = wheel(-100);

  expect(viewport.dispatchEvent(event)).toBe(true);
  expect(event.defaultPrevented).toBe(false);
  expect(onZoomChange).toHaveBeenCalledOnce();
});
