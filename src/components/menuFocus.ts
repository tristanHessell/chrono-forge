export function focusMovedOutside (
  container: Pick<HTMLElement, 'contains'>,
  nextTarget: EventTarget | null,
): boolean {
  return nextTarget !== null && !container.contains(nextTarget as Node);
}
