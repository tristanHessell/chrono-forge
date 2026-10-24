import { type PointerEvent, useEffect, useLayoutEffect, useState } from 'react';

import {
  type DragPoint,
  type DragSource,
  TouchCardDrag,
  type TouchDragCallbacks,
} from './touchCardDrag';

export function useTouchCardDrag(callbacks: TouchDragCallbacks) {
  const [preview, setPreview] = useState<DragPoint | null>(null);
  const [controller] = useState(() => new TouchCardDrag(callbacks));

  useLayoutEffect(() => {
    controller.updateCallbacks({
      ...callbacks,
      onMove: (point) => {
        setPreview(point);
        callbacks.onMove(point);
      },
      onFinish: () => {
        setPreview(null);
        callbacks.onFinish();
      },
    });
  });

  useEffect(
    () => () => {
      controller.cancel();
    },
    [controller],
  );

  return {
    preview,
    controller,
    onPointerDown: (
      event: PointerEvent<HTMLElement>,
      cardId: string,
      source: DragSource = 'hand',
    ) => {
      controller.start(event, cardId, source);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      controller.move(event);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      controller.end(event);
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      controller.cancel(event.pointerId);
    },
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
      controller.cancel(event.pointerId);
    },
  };
}

export type TouchCardDragHandlers = ReturnType<typeof useTouchCardDrag>;
