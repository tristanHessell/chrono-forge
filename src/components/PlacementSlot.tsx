import clsx from 'clsx';
import type { CSSProperties, DragEvent } from 'react';
import { useIntl } from 'react-intl';

import type { Card, CardPosition } from '../game';
import { positionKey } from '../gameRules';
import { useMessages } from '../i18n/useMessages';
import cardStyles from './Card.module.css';
import { CardEffect } from './CardEffect';
import placementSlotStyles from './PlacementSlot.module.css';

type PlacementSlotProps = {
  ariaLabel: string;
  position?: CardPosition;
  initial?: boolean;
  overwrite?: boolean;
  draggedCard: Card | null | undefined;
  isDragActive: boolean;
  isPreview: boolean;
  style?: CSSProperties;
  onClick: () => void;
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
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
  const t = useMessages();
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
          <CardEffect effect={draggedCard.effect} />
          <strong>
            {intl.formatNumber(draggedCard.number, { useGrouping: false })}
          </strong>
          <span className={cardStyles.cardTypeName}>
            {t(
              draggedCard.category
                ? `card.category.${draggedCard.category}`
                : 'card.event',
            )}
          </span>
          <small>{t('placement.release')}</small>
        </>
      ) : (
        <>
          <span>+</span>
          {overwrite && <small>{t('placement.overwrite')}</small>}
          {initial && <small>{t('placement.first')}</small>}
        </>
      )}
    </button>
  );
}
