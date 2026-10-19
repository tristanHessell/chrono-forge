export const effectTooltipDelay = 1000;

export function listenForEffectTooltip(
  icon: EventTarget,
  card: EventTarget,
  view: EventTarget,
  show: () => void,
  hide: () => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const dismiss = () => {
    cancel();
    hide();
  };
  const schedule = (event: Event) => {
    if ((event as PointerEvent).pointerType === 'touch') {
      return;
    }
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      show();
    }, effectTooltipDelay);
  };
  const escape = (event: Event) => {
    if ((event as KeyboardEvent).key === 'Escape') {
      dismiss();
    }
  };

  icon.addEventListener('pointerenter', schedule);
  icon.addEventListener('pointerleave', dismiss);
  icon.addEventListener('focusin', schedule);
  icon.addEventListener('focusout', dismiss);
  card.addEventListener('pointerdown', dismiss);
  card.addEventListener('dragstart', dismiss);
  view.addEventListener('keydown', escape);
  view.addEventListener('scroll', dismiss, { capture: true });
  view.addEventListener('resize', dismiss);
  view.addEventListener('blur', dismiss);

  return () => {
    dismiss();
    icon.removeEventListener('pointerenter', schedule);
    icon.removeEventListener('pointerleave', dismiss);
    icon.removeEventListener('focusin', schedule);
    icon.removeEventListener('focusout', dismiss);
    card.removeEventListener('pointerdown', dismiss);
    card.removeEventListener('dragstart', dismiss);
    view.removeEventListener('keydown', escape);
    view.removeEventListener('scroll', dismiss, { capture: true });
    view.removeEventListener('resize', dismiss);
    view.removeEventListener('blur', dismiss);
  };
}
