export const maximumBoardZoom = 2;
export const minimumBoardZoom = 0.2;

export function changeBoardZoom(current: number, change: number) {
  return Math.min(
    maximumBoardZoom,
    Math.max(minimumBoardZoom, Math.round((current + change) * 10) / 10),
  );
}

export function fitBoardZoom(
  currentZoom: number,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  if (
    contentWidth <= 0 ||
    contentHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return currentZoom;
  }

  const fitRatio = Math.min(
    1,
    viewportWidth / contentWidth,
    viewportHeight / contentHeight,
  );

  return Math.max(
    minimumBoardZoom,
    Math.floor(currentZoom * fitRatio * 10) / 10,
  );
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
