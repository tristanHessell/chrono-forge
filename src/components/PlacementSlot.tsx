import clsx from 'clsx';
import type { CSSProperties, DragEvent } from 'react';
import { useIntl } from 'react-intl';

import type { Card } from '../game';
import { useMessages } from '../i18n/useMessages';
import { CardEffect } from './CardEffect';

type PlacementSlotProps = {
  ariaLabel: string;
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
      className={clsx('placement-slot', {
        'initial-drop-slot': initial,
        'drag-ready': isDragActive,
        'snap-preview': isPreview,
        'overwrite-slot': overwrite,
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
          <span className="card-type-name">
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
