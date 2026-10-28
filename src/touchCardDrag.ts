import type { Card, PlacedCard } from './game';
import { getAvailablePositions, positionKey } from './gameRules';

export function touchDropPosition(
  played: PlacedCard[],
  card: Card | undefined,
  key: string | undefined,
) {
  if (!key || card?.type !== 'event') {
    return null;
  }

  return (
    getAvailablePositions(played, card).find(
      (position) => positionKey(position) === key,
    ) ?? null
  );
}

export type DragPoint = { x: number; y: number };
export type DragSource = 'hand' | 'pending';

type CaptureTarget = {
  hasPointerCapture: (id: number) => boolean;
  releasePointerCapture: (id: number) => void;
  setPointerCapture: (id: number) => void;
};

export type DragPointer = {
  button: number;
  clientX: number;
  clientY: number;
  currentTarget: CaptureTarget;
  isPrimary: boolean;
  pointerId: number;
  pointerType: string;
  preventDefault: () => void;
};

export type TouchDragCallbacks = {
  onDrop: (cardId: string, source: DragSource, point: DragPoint) => void;
  onFinish: () => void;
  onMove: (point: DragPoint) => void;
  onStart: (cardId: string, source: DragSource) => void;
};

export class TouchCardDrag {
  private session: {
    active: boolean;
    cardId: string;
    id: number;
    source: DragSource;
    start: DragPoint;
    target: CaptureTarget;
  } | null = null;
  private suppressClick = false;

  constructor(private callbacks: TouchDragCallbacks) {}

  updateCallbacks(callbacks: TouchDragCallbacks) {
    this.callbacks = callbacks;
  }

  get tracking() {
    return this.session !== null;
  }

  resetClickSuppression() {
    if (!this.session) {
      this.suppressClick = false;
    }
  }

  consumeClick() {
    const suppress = this.suppressClick;

    this.suppressClick = false;

    return suppress;
  }

  start(event: DragPointer, cardId: string, source: DragSource = 'hand') {
    if (
      this.session ||
      !['touch', 'pen'].includes(event.pointerType) ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }

    this.session = {
      active: false,
      cardId,
      id: event.pointerId,
      source,
      start: { x: event.clientX, y: event.clientY },
      target: event.currentTarget,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  move(event: DragPointer) {
    const session = this.session;
    const point = { x: event.clientX, y: event.clientY };

    if (!session || session.id !== event.pointerId) {
      return;
    }
    if (!session.active) {
      if (
        Math.hypot(point.x - session.start.x, point.y - session.start.y) < 6
      ) {
        return;
      }

      session.active = true;
      this.suppressClick = true;
      this.callbacks.onStart(session.cardId, session.source);
    }

    event.preventDefault();
    this.callbacks.onMove(point);
  }

  end(event: DragPointer) {
    const session = this.session;

    if (!session || session.id !== event.pointerId) {
      return;
    }
    if (session.active) {
      event.preventDefault();
      this.callbacks.onDrop(session.cardId, session.source, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    this.cancel(event.pointerId);
  }

  cancel(pointerId?: number) {
    const session = this.session;

    if (!session || (pointerId !== undefined && session.id !== pointerId)) {
      return;
    }

    this.session = null;

    if (session.target.hasPointerCapture(session.id)) {
      session.target.releasePointerCapture(session.id);
    }
    if (session.active) {
      this.callbacks.onFinish();
    }
  }
}
