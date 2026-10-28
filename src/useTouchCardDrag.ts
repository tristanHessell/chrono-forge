import { useEffect, useLayoutEffect, useState } from 'react';

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
      onFinish: () => {
        setPreview(null);
        callbacks.onFinish();
      },
      onMove: (point) => {
        setPreview(point);
        callbacks.onMove(point);
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
    controller,
    onLostPointerCapture: (event: React.PointerEvent<HTMLElement>) => {
      controller.cancel(event.pointerId);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => {
      controller.cancel(event.pointerId);
    },
    onPointerDown: (
      event: React.PointerEvent<HTMLElement>,
      cardId: string,
      source: DragSource = 'hand',
    ) => {
      controller.start(event, cardId, source);
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      controller.move(event);
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      controller.end(event);
    },
    preview,
  };
}

export type TouchCardDragHandlers = ReturnType<typeof useTouchCardDrag>;
