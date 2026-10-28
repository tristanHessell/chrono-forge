import { describe, expect, it, vi } from 'vitest';

import type { EventCard, PlacedCard } from './game';
import {
  type DragPointer,
  TouchCardDrag,
  touchDropPosition,
} from './touchCardDrag';

function setup() {
  const callbacks = {
    onDrop: vi.fn(),
    onFinish: vi.fn(),
    onMove: vi.fn(),
    onStart: vi.fn(),
  };
  const target = {
    hasPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
    setPointerCapture: vi.fn(),
  };
  const pointer = (changes: Partial<DragPointer> = {}): DragPointer => ({
    button: 0,
    clientX: 100,
    clientY: 400,
    currentTarget: target,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
    preventDefault: vi.fn(),
    ...changes,
  });

  return { callbacks, drag: new TouchCardDrag(callbacks), pointer, target };
}

describe('touch card dragging', () => {
  it('keeps taps as clicks without starting a drag or using a card', () => {
    const { callbacks, drag, pointer, target } = setup();

    drag.start(pointer(), 'event');
    drag.move(pointer({ clientX: 102, clientY: 402 }));
    drag.end(pointer());

    expect(target.setPointerCapture).toHaveBeenCalledWith(1);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(callbacks.onStart).not.toHaveBeenCalled();
    expect(callbacks.onDrop).not.toHaveBeenCalled();
    expect(callbacks.onFinish).not.toHaveBeenCalled();
    expect(drag.consumeClick()).toBe(false);
  });

  it.each(['touch', 'pen'])(
    'highlights positions when a %s drag starts and drops at the release point',
    (pointerType) => {
      const { callbacks, drag, pointer } = setup();
      const move = pointer({ clientY: 390, pointerType });

      drag.start(pointer({ pointerType }), 'event');
      drag.move(move);

      expect(callbacks.onStart).toHaveBeenCalledExactlyOnceWith(
        'event',
        'hand',
      );
      expect(callbacks.onMove).toHaveBeenCalledWith({ x: 100, y: 390 });
      expect(move.preventDefault).toHaveBeenCalledExactlyOnceWith();

      drag.move(pointer({ clientY: 300 }));
      drag.end(pointer({ clientX: 150, clientY: 200 }));

      expect(callbacks.onStart).toHaveBeenCalledExactlyOnceWith(
        'event',
        'hand',
      );
      expect(callbacks.onDrop).toHaveBeenCalledExactlyOnceWith(
        'event',
        'hand',
        { x: 150, y: 200 },
      );
      expect(callbacks.onFinish).toHaveBeenCalledExactlyOnceWith();
      expect(drag.tracking).toBe(false);
      expect(drag.consumeClick()).toBe(true);
      expect(drag.consumeClick()).toBe(false);
    },
  );

  it('preserves native mouse dragging and ignores extra fingers or secondary buttons', () => {
    for (const changes of [
      { pointerType: 'mouse' },
      { isPrimary: false },
      { button: 2 },
    ]) {
      const { callbacks, drag, pointer, target } = setup();

      drag.start(pointer(changes), 'event');
      drag.move(pointer({ clientY: 200 }));
      drag.end(pointer());

      expect(callbacks.onStart).not.toHaveBeenCalled();
      expect(callbacks.onDrop).not.toHaveBeenCalled();
      expect(target.setPointerCapture).not.toHaveBeenCalled();
    }
  });

  it('ignores unrelated pointer events and cancels without dropping', () => {
    const { callbacks, drag, pointer, target } = setup();

    drag.start(pointer(), 'pending-event', 'pending');
    drag.move(pointer({ clientY: 200, pointerId: 2 }));

    expect(callbacks.onStart).not.toHaveBeenCalled();

    drag.move(pointer({ clientY: 200 }));
    drag.cancel(2);

    expect(drag.tracking).toBe(true);

    drag.cancel(1);
    drag.cancel(1);

    expect(callbacks.onStart).toHaveBeenCalledWith('pending-event', 'pending');
    expect(callbacks.onDrop).not.toHaveBeenCalled();
    expect(callbacks.onFinish).toHaveBeenCalledExactlyOnceWith();
    expect(target.releasePointerCapture).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('uses current callbacks after highlighting causes a render', () => {
    const { callbacks, drag, pointer } = setup();
    const onDrop = vi.fn();

    drag.start(pointer(), 'event');
    drag.move(pointer({ clientY: 200 }));
    drag.updateCallbacks({ ...callbacks, onDrop });
    drag.end(pointer({ clientY: 200 }));

    expect(onDrop).toHaveBeenCalledExactlyOnceWith('event', 'hand', {
      x: 100,
      y: 200,
    });
    expect(callbacks.onDrop).not.toHaveBeenCalled();

    drag.resetClickSuppression();

    expect(drag.consumeClick()).toBe(false);
  });
});

describe('touch destinations', () => {
  const card: EventCard = {
    id: '1940',
    name: 'timeline-origin',
    number: 1940,
    type: 'event',
  };
  const played: PlacedCard[] = [
    {
      column: 0,
      id: 'start',
      name: 'timeline-origin',
      number: 0,
      owner: 'neutral',
      placedAt: 0,
      row: 0,
      type: 'event',
    },
  ];

  it('accepts only legal destinations for the dragged card', () => {
    expect(touchDropPosition(played, card, '-1:0')).toStrictEqual({
      column: 0,
      row: -1,
    });
    expect(touchDropPosition(played, card, '0:0')).toBeNull();
    expect(touchDropPosition(played, card, '2:0')).toBeNull();
    expect(touchDropPosition(played, card, undefined)).toBeNull();
    expect(touchDropPosition(played, undefined, '-1:0')).toBeNull();
    expect(
      touchDropPosition(
        played,
        { action: 'time-jump', id: 'jump', type: 'command' },
        '-1:0',
      ),
    ).toBeNull();
  });

  it('rejects earlier or equal dates even when a target existed for another card', () => {
    const board: PlacedCard[] = [
      ...played,
      { ...card, column: 0, owner: '0', placedAt: 1, row: -1 },
    ];

    expect(touchDropPosition(board, card, '-2:0')).toBeNull();
    expect(
      touchDropPosition(board, { ...card, number: 1930 }, '-2:0'),
    ).toBeNull();
    expect(
      touchDropPosition(board, { ...card, number: 1950 }, '-2:0'),
    ).toStrictEqual({ column: 0, row: -2 });
  });

  it('supports valid overwrites and empty positions beside removed cards', () => {
    const board: PlacedCard[] = [
      ...played,
      { ...card, column: 0, owner: '0', placedAt: 1, removed: true, row: -1 },
    ];

    expect(touchDropPosition(board, card, '-1:0')).toStrictEqual({
      column: 0,
      row: -1,
    });
    expect(
      touchDropPosition(board, { ...card, number: 1950 }, '-2:0'),
    ).toStrictEqual({ column: 0, row: -2 });
  });
});
