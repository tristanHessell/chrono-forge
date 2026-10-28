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
  draggedCard: Card | null | undefined;
  initial?: boolean;
  isDragActive: boolean;
  isPreview: boolean;
  onClick: () => void;
  onDragEnter: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  overwrite?: boolean;
  position?: CardPosition;
  style?: React.CSSProperties;
};

export function PlacementSlot({
  ariaLabel,
  draggedCard,
  initial = false,
  isDragActive,
  isPreview,
  onClick,
  onDragEnter,
  onDragOver,
  onDrop,
  overwrite = false,
  position,
  style,
}: PlacementSlotProps) {
  const intl = useIntl();

  return (
    <button
      aria-label={ariaLabel}
      className={clsx(placementSlotStyles.placementSlot, {
        [placementSlotStyles.dragReady]: isDragActive,
        [placementSlotStyles.initialDropSlot]: initial,
        [placementSlotStyles.overwriteSlot]: overwrite,
        [placementSlotStyles.snapPreview]: isPreview,
      })}
      data-card-type={isPreview ? draggedCard?.type : undefined}
      data-drop-position={position ? positionKey(position) : undefined}
      data-event-category={isPreview ? draggedCard?.category : undefined}
      data-placement-slot
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
              defaultMessage="Release to place"
              id="placement.release"
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
                defaultMessage="Overwrite"
                id="placement.overwrite"
              />
            </small>
          )}
          {initial && (
            <small>
              <FormattedMessage
                defaultMessage="Drop first card"
                id="placement.first"
              />
            </small>
          )}
        </>
      )}
    </button>
  );
}
