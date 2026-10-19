import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { CardEffect as Effect, ManipulationAction } from '../game';
import { useMessages } from '../i18n/useMessages';
import { listenForEffectTooltip } from './effectTooltip';

export function CardEffect({
  effect,
  showTooltip = false,
}: {
  effect?: Effect | ManipulationAction;
  showTooltip?: boolean;
}) {
  const t = useMessages();
  const nameId =
    effect === 'draw-one' || effect === 'timeline-1900-bonus'
      ? (`effect.${effect}.name` as const)
      : effect
        ? (`manipulation.${effect}.name` as const)
        : null;
  const descriptionId =
    effect === 'draw-one' || effect === 'timeline-1900-bonus'
      ? (`effect.${effect}.description` as const)
      : effect
        ? (`manipulation.${effect}.description` as const)
        : null;
  const icon = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    above: boolean;
  } | null>(null);

  useEffect(() => {
    const target = icon.current;
    const card = target?.parentElement;

    if (!target || !card || !effect || !showTooltip) {
      return;
    }

    const show = () => {
      const rect = card.getBoundingClientRect();
      const above = rect.top > 150;

      setAnchor({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)),
        top: above ? rect.top - 10 : rect.bottom + 10,
        above,
      });
    };
    const hide = () => setAnchor(null);

    return listenForEffectTooltip(target, card, window, show, hide);
  }, [effect, showTooltip]);

  if (!effect || !nameId || !descriptionId) {
    return null;
  }

  return (
    <>
      <span
        ref={icon}
        className="card-effect"
        role="img"
        tabIndex={showTooltip ? 0 : undefined}
        data-tooltip-enabled={showTooltip || undefined}
        aria-label={t(nameId)}
        aria-describedby={showTooltip && anchor ? tooltipId : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          {effect === 'draw-one' ? (
            <path d="M5 5V3h12v3M3 8h12v13H3zM18 9v8m-4-4h8" />
          ) : effect === 'time-jump' ? (
            <path d="M4 12h16m-6-6 6 6-6 6M4 5v14" />
          ) : effect === 'time-swap' ? (
            <path d="M3 7h18l-4-4m4 14H3l4 4M21 7l-4 4M3 17l4-4" />
          ) : effect === 'take-control' ? (
            <>
              <circle cx="12" cy="7" r="3" />
              <path d="M5 21v-3a7 7 0 0 1 14 0v3M3 12l3 3 4-4" />
            </>
          ) : effect === 'remove-event' ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
          )}
        </svg>
      </span>
      {showTooltip &&
        anchor &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="effect-tooltip"
            style={{
              top: anchor.top,
              left: anchor.left,
              transform: anchor.above ? 'translateY(-100%)' : undefined,
            }}
          >
            <strong>{t(nameId)}</strong>
            <p>{t(descriptionId)}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
