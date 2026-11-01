import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  changeBoardZoom,
  changeBoardZoomByPinch,
  fitBoardZoom,
  listenForBoardWheel,
} from './boardZoom';
import type { CardPosition, PlacedCard } from './game';
import { positionKey } from './game';

type UseBoardViewportOptions = {
  choosingJumpDestination: boolean;
  onCancelTouchDrag: () => void;
  played: PlacedCard[];
};

export function useBoardViewport({
  choosingJumpDestination,
  onCancelTouchDrag,
  played,
}: UseBoardViewportOptions) {
  const [boardZoom, setBoardZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const lastJumpDestinationRef = useRef<CardPosition | null>(null);
  const panStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<null | number>(null);

  const adjustBoardZoom = useCallback((change: number) => {
    setBoardZoom((current) => changeBoardZoom(current, change));
  }, []);

  const rememberJumpDestination = (position: CardPosition) => {
    lastJumpDestinationRef.current = position;
  };

  useLayoutEffect(() => {
    const viewport = boardViewportRef.current;
    const position = lastJumpDestinationRef.current;

    if (!viewport || choosingJumpDestination || !position) {
      return;
    }

    const movedCard = viewport.querySelector<HTMLElement>(
      `[data-position="${positionKey(position)}"]`,
    );

    if (movedCard) {
      const cardBounds = movedCard.getBoundingClientRect();
      const viewBounds = viewport.getBoundingClientRect();

      viewport.scrollLeft +=
        cardBounds.left +
        cardBounds.width / 2 -
        viewBounds.left -
        viewBounds.width / 2;
      viewport.scrollTop +=
        cardBounds.top +
        cardBounds.height / 2 -
        viewBounds.top -
        viewBounds.height / 2;
    }

    lastJumpDestinationRef.current = null;
  }, [choosingJumpDestination, played]);

  const fitBoardToViewport = useCallback(() => {
    const viewport = boardViewportRef.current;
    const grid = viewport?.querySelector<HTMLElement>('[data-board-grid]');

    if (!viewport || !grid) {
      return;
    }

    const gridBounds = grid.getBoundingClientRect();
    const viewportStyles = getComputedStyle(viewport);
    const availableWidth =
      viewport.clientWidth -
      parseFloat(viewportStyles.paddingLeft) -
      parseFloat(viewportStyles.paddingRight);
    const availableHeight =
      viewport.clientHeight -
      parseFloat(viewportStyles.paddingTop) -
      parseFloat(viewportStyles.paddingBottom);

    setBoardZoom((current) =>
      fitBoardZoom(
        current,
        gridBounds.width,
        gridBounds.height,
        availableWidth,
        availableHeight,
      ),
    );
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, []);

  useEffect(() => {
    const viewport = boardViewportRef.current;

    if (!viewport) {
      return;
    }

    return listenForBoardWheel(viewport, adjustBoardZoom);
  }, [adjustBoardZoom]);

  const startBoardPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (touchPointsRef.current.size === 2) {
        const [first, second] = [...touchPointsRef.current.values()];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);

        pinchDistanceRef.current = distance || null;
        onCancelTouchDrag();
        setIsPanning(false);

        return;
      }
      if (touchPointsRef.current.size > 2) {
        pinchDistanceRef.current = null;
        setIsPanning(false);

        return;
      }
    }

    if (
      event.button !== 0 ||
      pinchDistanceRef.current ||
      (event.target as Element).closest(
        '[data-card-type], [data-placement-slot]',
      )
    ) {
      return;
    }

    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const panBoard = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      const touchPoint = touchPointsRef.current.get(event.pointerId);

      if (touchPoint) {
        touchPoint.x = event.clientX;
        touchPoint.y = event.clientY;

        if (pinchDistanceRef.current && touchPointsRef.current.size === 2) {
          const [first, second] = [...touchPointsRef.current.values()];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const previousDistance = pinchDistanceRef.current;

          pinchDistanceRef.current = distance;
          setBoardZoom((current) =>
            changeBoardZoomByPinch(current, previousDistance, distance),
          );

          return;
        }
      }
      if (pinchDistanceRef.current) {
        return;
      }
    }

    if (!isPanning) {
      return;
    }

    event.currentTarget.scrollLeft =
      panStartRef.current.scrollLeft -
      (event.clientX - panStartRef.current.pointerX);
    event.currentTarget.scrollTop =
      panStartRef.current.scrollTop -
      (event.clientY - panStartRef.current.pointerY);
  };

  const stopBoardPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.delete(event.pointerId);

      if (touchPointsRef.current.size < 2) {
        pinchDistanceRef.current = null;
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  return {
    adjustBoardZoom,
    boardViewportRef,
    boardZoom,
    fitBoardToViewport,
    isPanning,
    panBoard,
    rememberJumpDestination,
    resetBoardZoom: () => {
      setBoardZoom(1);
    },
    startBoardPan,
    stopBoardPan,
  };
}
