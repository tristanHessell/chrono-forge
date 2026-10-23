import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { effectTooltipDelay, listenForEffectTooltip } from './effectTooltip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup () {
  const icon = new EventTarget();
  const card = new EventTarget();
  const view = new EventTarget();
  const show = vi.fn();
  const hide = vi.fn();
  const cleanup = listenForEffectTooltip(icon, card, view, show, hide);

  return { icon, card, view, show, hide, cleanup };
}

it('waits one second after entering the icon before showing an explanation', () => {
  const { icon, show, cleanup } = setup();

  icon.dispatchEvent(new Event('pointerenter'));
  vi.advanceTimersByTime(effectTooltipDelay - 1);
  expect(show).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(show).toHaveBeenCalledOnce();
  cleanup();
});

it('does not open from hovering or focusing the rest of the card', () => {
  const { card, show, cleanup } = setup();

  card.dispatchEvent(new Event('pointerenter'));
  card.dispatchEvent(new Event('focusin'));
  vi.advanceTimersByTime(effectTooltipDelay * 2);
  expect(show).not.toHaveBeenCalled();
  cleanup();
});

it('cancels a brief hover and requires a full delay after entering again', () => {
  const { icon, show, cleanup } = setup();

  icon.dispatchEvent(new Event('pointerenter'));
  vi.advanceTimersByTime(750);
  icon.dispatchEvent(new Event('pointerleave'));
  vi.advanceTimersByTime(effectTooltipDelay);
  expect(show).not.toHaveBeenCalled();
  icon.dispatchEvent(new Event('pointerenter'));
  vi.advanceTimersByTime(effectTooltipDelay - 1);
  expect(show).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(show).toHaveBeenCalledOnce();
  cleanup();
});

it('supports delayed keyboard focus on the icon and hides on blur', () => {
  const { icon, show, hide, cleanup } = setup();

  icon.dispatchEvent(new Event('focusin'));
  vi.advanceTimersByTime(effectTooltipDelay);
  expect(show).toHaveBeenCalledOnce();
  icon.dispatchEvent(new Event('focusout'));
  expect(hide).toHaveBeenCalledOnce();
  cleanup();
});

it.each(['pointerdown', 'dragstart'])(
  'cancels pending explanations when the card receives %s',
  (type) => {
    const { icon, card, show, hide, cleanup } = setup();

    icon.dispatchEvent(new Event('pointerenter'));
    card.dispatchEvent(new Event(type));
    vi.advanceTimersByTime(effectTooltipDelay);
    expect(show).not.toHaveBeenCalled();
    expect(hide).toHaveBeenCalledOnce();
    cleanup();
  },
);

it.each(['scroll', 'resize', 'blur', 'keydown'])(
  'dismisses pending explanations on window %s',
  (type) => {
    const { icon, view, show, hide, cleanup } = setup();

    icon.dispatchEvent(new Event('pointerenter'));
    view.dispatchEvent(Object.assign(new Event(type), { key: 'Escape' }));
    vi.advanceTimersByTime(effectTooltipDelay);
    expect(show).not.toHaveBeenCalled();
    expect(hide).toHaveBeenCalledOnce();
    cleanup();
  },
);

it('ignores touch hover events so dragging does not schedule explanations', () => {
  const { icon, show, cleanup } = setup();

  icon.dispatchEvent(
    Object.assign(new Event('pointerenter'), { pointerType: 'touch' }),
  );
  vi.advanceTimersByTime(effectTooltipDelay);
  expect(show).not.toHaveBeenCalled();
  cleanup();
});

it('removes all listeners and timers during cleanup', () => {
  const { icon, card, view, show, hide, cleanup } = setup();

  icon.dispatchEvent(new Event('pointerenter'));
  cleanup();
  expect(vi.getTimerCount()).toBe(0);
  hide.mockClear();
  icon.dispatchEvent(new Event('pointerenter'));
  icon.dispatchEvent(new Event('pointerleave'));
  icon.dispatchEvent(new Event('focusin'));
  card.dispatchEvent(new Event('dragstart'));
  view.dispatchEvent(new Event('scroll'));
  vi.advanceTimersByTime(effectTooltipDelay * 2);
  expect(show).not.toHaveBeenCalled();
  expect(hide).not.toHaveBeenCalled();
});
