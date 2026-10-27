import { useIntl } from 'react-intl';

import type { CardEffect as Effect, ManipulationAction } from '../game';
import {
  effectDescriptionMessages,
  effectNameMessages,
  manipulationDescriptionMessages,
  manipulationNameMessages,
} from '../i18n/messageDescriptors';
import cardEffectStyles from './CardEffect.module.css';

export function CardEffect({
  effect,
}: {
  effect?: Effect | ManipulationAction;
}) {
  const intl = useIntl();
  const nameMessage =
    effect === 'draw-one' ||
    effect === 'free-action' ||
    effect === 'timeline-1900-bonus'
      ? effectNameMessages[effect]
      : effect
        ? manipulationNameMessages[effect]
        : null;
  const descriptionMessage =
    effect === 'draw-one' ||
    effect === 'free-action' ||
    effect === 'timeline-1900-bonus'
      ? effectDescriptionMessages[effect]
      : effect
        ? manipulationDescriptionMessages[effect]
        : null;

  if (!effect || !nameMessage || !descriptionMessage) {
    return null;
  }

  return (
    <span
      className={cardEffectStyles.cardEffect}
      role="img"
      aria-label={intl.formatMessage(nameMessage)}
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
        ) : effect === 'free-action' ? (
          <path d="m14 2-9 12h7l-2 8 9-12h-7z" />
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
  );
}

export function CardEffects({
  effects,
}: {
  effects?: readonly (Effect | ManipulationAction)[];
}) {
  if (!effects?.length) {
    return null;
  }

  return (
    <span className={cardEffectStyles.cardEffects}>
      {effects.map((effect) => (
        <CardEffect effect={effect} key={effect} />
      ))}
    </span>
  );
}
