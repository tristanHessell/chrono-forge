export function changeBoardZoom(current: number, change: number) {
  return Math.min(1.6, Math.max(0.6, Math.round((current + change) * 10) / 10));
}

export function changeBoardZoomByPinch(
  currentZoom: number,
  previousDistance: number,
  distance: number,
) {
  return changeBoardZoom(
    currentZoom,
    currentZoom * (distance / previousDistance - 1),
  );
}

export function listenForBoardWheel(
  viewport: EventTarget,
  onZoomChange: (change: number) => void,
) {
  const zoomWithWheel = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();

    const { deltaY } = event as WheelEvent;

    if (deltaY !== 0) {
      onZoomChange(deltaY < 0 ? 0.1 : -0.1);
    }
  };

  // React's passive wheel listeners cannot cancel page scrolling or browser zoom.
  viewport.addEventListener('wheel', zoomWithWheel, { passive: false });

  return () => {
    viewport.removeEventListener('wheel', zoomWithWheel);
  };
}
