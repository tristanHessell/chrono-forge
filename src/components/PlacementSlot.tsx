import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Card, CardPosition } from '../game';
import { positionKey } from '../gameRules';
import {
  categoryMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import cardStyles from './Card.module.css';
import { CardEffects } from './CardEffect';
import { CardEventName } from './CardEventName';
import placementSlotStyles from './PlacementSlot.module.css';

type PlacementSlotProps = {
  ariaLabel: string;
  position?: CardPosition;
  initial?: boolean;
  overwrite?: boolean;
  draggedCard: Card | null | undefined;
  isDragActive: boolean;
  isPreview: boolean;
  style?: React.CSSProperties;
  onClick: () => void;
  onDragEnter: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
};

export function PlacementSlot({
  ariaLabel,
  position,
  initial = false,
  overwrite = false,
  draggedCard,
  isDragActive,
  isPreview,
  style,
  onClick,
  onDragEnter,
  onDragOver,
  onDrop,
}: PlacementSlotProps) {
  const intl = useIntl();

  return (
    <button
      aria-label={ariaLabel}
      data-placement-slot
      data-drop-position={position ? positionKey(position) : undefined}
      className={clsx(placementSlotStyles.placementSlot, {
        [placementSlotStyles.initialDropSlot]: initial,
        [placementSlotStyles.dragReady]: isDragActive,
        [placementSlotStyles.snapPreview]: isPreview,
        [placementSlotStyles.overwriteSlot]: overwrite,
      })}
      data-card-type={isPreview ? draggedCard?.type : undefined}
      data-event-category={isPreview ? draggedCard?.category : undefined}
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={style}
      type="button"
    >
      {isPreview && draggedCard?.type === 'event' ? (
        <>
          <CardEffects effects={draggedCard.effects} />
          <strong>
            {intl.formatNumber(draggedCard.number, { useGrouping: false })}
          </strong>
          <CardEventName card={draggedCard} />
          <span className={cardStyles.cardTypeName}>
            {intl.formatMessage(
              draggedCard.category
                ? categoryMessages[draggedCard.category]
                : startingEventNameMessage,
            )}
          </span>
          <small className={placementSlotStyles.releaseLabel}>
            <FormattedMessage
              id="placement.release"
              defaultMessage="Release to place"
            />
          </small>
        </>
      ) : (
        <>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 4v16M4 12h16" />
          </svg>
          {overwrite && (
            <small>
              <FormattedMessage
                id="placement.overwrite"
                defaultMessage="Overwrite"
              />
            </small>
          )}
          {initial && (
            <small>
              <FormattedMessage
                id="placement.first"
                defaultMessage="Drop first card"
              />
            </small>
          )}
        </>
      )}
    </button>
  );
}
