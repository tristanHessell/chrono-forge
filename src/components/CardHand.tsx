import clsx from 'clsx';
import { type CSSProperties, type DragEvent, useState } from 'react';

import type { Card, CardOwner } from '../game';
import {
  type HandOrder,
  moveHandCard,
  orderHand,
  restoreHandOrder,
} from '../handOrder';
import { useMessages } from '../i18n/useMessages';
import type { PlayerType } from '../playerSetup';
import type { TouchCardDragHandlers } from '../useTouchCardDrag';
import cardStyles from './Card.module.css';
import cardHandStyles from './CardHand.module.css';
import { HandCardFace } from './HandCardFace';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type CardHandProps = {
  interactive?: boolean;
  cards: Card[];
  owner: Exclude<CardOwner, 'neutral'>;
  ownerName: string;
  playerType: PlayerType;
  score: number;
  activeOwner: Exclude<CardOwner, 'neutral'>;
  pendingCardId: string | undefined;
  isReturnTarget: boolean;
  selectedCardId: string | null;
  onChoose: (cardId: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, cardId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  touchDrag?: TouchCardDragHandlers;
};

export function CardHand({
  interactive = true,
  cards,
  owner,
  ownerName,
  playerType,
  score,
  activeOwner,
  pendingCardId,
  isReturnTarget,
  selectedCardId,
  onChoose,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  touchDrag,
}: CardHandProps) {
  const t = useMessages();
  const isOpponent = owner !== '0';
  const [order, setOrder] = useState<HandOrder | null>(null);
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragStartIds, setDragStartIds] = useState<string[]>([]);
  const orderedCards = order
    ? orderHand(cards, order)
    : restoreHandOrder(cards, manualIds);
  const reorder = (sourceId: string, targetId: string, before: boolean) => {
    setManualIds(
      moveHandCard(orderedCards, sourceId, targetId, before).map(
        (card) => card.id,
      ),
    );
    setOrder(null);
  };
  const finishHandDrag = () => {
    setDraggedId(null);
    setHoveredCardId(null);
    onDragEnd();
  };
  const previewHandReorder = (event: DragEvent<HTMLDivElement>) => {
    if (!draggedId) {
      if (isReturnTarget) {
        onDragOver(event);
      }

      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const fan =
      event.currentTarget.querySelector<HTMLElement>('[data-hand-fan]');
    const cardElement = fan?.querySelector<HTMLElement>('[data-hand-card]');

    if (!fan || !cardElement || orderedCards.length < 2) {
      return;
    }

    const bounds = fan.getBoundingClientRect();
    const cardWidth = cardElement.getBoundingClientRect().width;
    const step = (bounds.width - cardWidth) / (orderedCards.length - 1);

    if (step <= 0) {
      return;
    }

    const targetIndex = Math.max(
      0,
      Math.min(
        orderedCards.length - 1,
        Math.round((event.clientX - bounds.left - cardWidth / 2) / step),
      ),
    );
    const sourceIndex = orderedCards.findIndex((card) => card.id === draggedId);

    if (sourceIndex !== targetIndex) {
      reorder(
        draggedId,
        orderedCards[targetIndex].id,
        targetIndex < sourceIndex,
      );
    }
  };
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const highlightedId =
    draggedId ??
    hoveredCardId ??
    focusedCardId ??
    selectedCardId ??
    pendingCardId;
  const highlightedIndex = orderedCards.findIndex(
    (card) => card.id === highlightedId,
  );
  // Keep the native drag source in the same DOM position while CSS slots move.
  const renderedCards = draggedId
    ? restoreHandOrder(cards, dragStartIds)
    : orderedCards;

  return (
    <>
      <div className={cardHandStyles.handHeading}>
        <div className={cardHandStyles.handIdentity}>
          <PlayerAvatar
            compact
            name={ownerName}
            owner={owner}
            type={playerType}
          />
          <div className={cardHandStyles.handIdentityText}>
            <p
              className={clsx(
                cardHandStyles.areaLabel,
                ownershipStyles[`owner${owner}`],
              )}
            >
              {t(owner === '0' ? 'hand.yourTitle' : 'hand.playerTitle', {
                name: ownerName,
              })}
            </p>
            <span>{t('score.points', { count: score })}</span>
          </div>
        </div>
        <div
          className={cardHandStyles.handOrder}
          role="group"
          aria-label={t(
            owner === '0' ? 'hand.yourOrderLabel' : 'hand.orderLabel',
            { name: ownerName },
          )}
        >
          {(['date'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={order === value}
              onClick={() => {
                setOrder(value);
                setHoveredCardId(null);
                setFocusedCardId(null);
              }}
            >
              {t('hand.orderDate')}
            </button>
          ))}
        </div>
      </div>
      <div
        aria-label={t(owner === '0' ? 'hand.yourDropArea' : 'hand.dropArea', {
          name: ownerName,
        })}
        data-hand-owner={owner}
        data-return-label={t('hand.return')}
        className={clsx(
          cardHandStyles.cardRow,
          isOpponent && cardHandStyles.opponentCardRow,
          cardHandStyles.handDropArea,
          {
            [cardHandStyles.handReturnTarget]: isReturnTarget,
          },
        )}
        onDragOver={previewHandReorder}
        onDrop={(event) => {
          if (draggedId) {
            event.preventDefault();
            event.stopPropagation();
            finishHandDrag();
          } else {
            onDrop(event);
          }
        }}
      >
        <div
          className={cardHandStyles.handFan}
          data-hand-fan
          style={{ '--hand-count': Math.max(1, cards.length) } as CSSProperties}
        >
          {renderedCards.map((card) => {
            const index = orderedCards.findIndex(
              (candidate) => candidate.id === card.id,
            );

            return (
              <button
                aria-pressed={
                  selectedCardId === card.id || pendingCardId === card.id
                }
                aria-description={[
                  card.type === 'manipulation'
                    ? t(`manipulation.${card.action}.description`)
                    : '',
                  card.effect ? t(`effect.${card.effect}.description`) : '',
                  t('hand.reorderHint'),
                ]
                  .filter(Boolean)
                  .join(' ')}
                className={clsx(
                  cardStyles.card,
                  cardHandStyles.playable,
                  cardHandStyles.handCard,
                  isOpponent && cardHandStyles.opponentCard,
                  {
                    [cardHandStyles.pendingInHand]: pendingCardId === card.id,
                    [cardHandStyles.handCardHighlighted]:
                      index === highlightedIndex,
                    [cardHandStyles.handCardBefore]:
                      !draggedId &&
                      highlightedIndex >= 0 &&
                      index < highlightedIndex,
                    [cardHandStyles.handCardAfter]:
                      !draggedId &&
                      highlightedIndex >= 0 &&
                      index > highlightedIndex,
                    [cardHandStyles.handCardDragging]: draggedId === card.id,
                  },
                )}
                style={{ '--hand-index': index } as CSSProperties}
                data-card-type={card.type}
                data-hand-card
                data-event-category={card.category}
                disabled={!interactive || activeOwner !== owner}
                draggable={interactive && activeOwner === owner}
                key={card.id}
                onClick={() => onChoose(card.id)}
                onPointerDown={
                  card.type === 'event' && interactive && activeOwner === owner
                    ? (event) => touchDrag?.onPointerDown(event, card.id)
                    : undefined
                }
                onPointerMove={touchDrag?.onPointerMove}
                onPointerUp={touchDrag?.onPointerUp}
                onPointerCancel={touchDrag?.onPointerCancel}
                onLostPointerCapture={touchDrag?.onLostPointerCapture}
                onPointerEnter={() => setHoveredCardId(card.id)}
                onPointerLeave={() => setHoveredCardId(null)}
                onFocus={() => setFocusedCardId(card.id)}
                onBlur={() => setFocusedCardId(null)}
                onDragEnd={finishHandDrag}
                onDragStart={(event) => {
                  onDragStart(event, card.id);

                  if (event.defaultPrevented) {
                    return;
                  }

                  setDragStartIds(orderedCards.map((card) => card.id));
                  setDraggedId(card.id);
                }}
                onKeyDown={(event) => {
                  if (
                    !event.altKey ||
                    !['ArrowLeft', 'ArrowRight'].includes(event.key)
                  ) {
                    return;
                  }

                  event.preventDefault();

                  const before = event.key === 'ArrowLeft';
                  const target = orderedCards[index + (before ? -1 : 1)];

                  if (target) {
                    reorder(card.id, target.id, before);
                  }
                }}
                type="button"
              >
                <HandCardFace card={card} showTooltip={!touchDrag?.preview} />
                {pendingCardId === card.id && (
                  <small
                    className={cardHandStyles.handStatus}
                    data-drag-decoration
                  >
                    {t('hand.onTable')}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
