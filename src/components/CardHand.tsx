import clsx from 'clsx';
import { type CSSProperties, type DragEvent, useState } from 'react';
import { useIntl } from 'react-intl';

import type { Card, CardOwner } from '../game';
import {
  type HandOrder,
  moveHandCard,
  orderHand,
  restoreHandOrder,
} from '../handOrder';
import {
  effectDescriptionMessages,
  manipulationDescriptionMessages,
} from '../i18n/messageDescriptors';
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
  onShowDetails?: (card: Card) => void;
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
  onShowDetails,
  touchDrag,
}: CardHandProps) {
  const intl = useIntl();
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
              {owner === '0'
                ? intl.formatMessage({
                    id: 'hand.yourTitle',
                    defaultMessage: 'You',
                  })
                : intl.formatMessage(
                    {
                      id: 'hand.playerTitle',
                      defaultMessage: "{name}'s hand",
                    },
                    { name: ownerName },
                  )}
            </p>
            <span>
              {intl.formatMessage(
                {
                  id: 'score.points',
                  defaultMessage:
                    '{count, plural, one {# point} other {# points}}',
                },
                { count: score },
              )}
            </span>
          </div>
        </div>
        <div
          className={cardHandStyles.handOrder}
          role="group"
          aria-label={
            owner === '0'
              ? intl.formatMessage({
                  id: 'hand.yourOrderLabel',
                  defaultMessage: 'Order your hand',
                })
              : intl.formatMessage(
                  {
                    id: 'hand.orderLabel',
                    defaultMessage: "Order {name}'s hand",
                  },
                  { name: ownerName },
                )
          }
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
              {intl.formatMessage({
                id: 'hand.orderDate',
                defaultMessage: 'Date',
              })}
            </button>
          ))}
        </div>
      </div>
      <div
        aria-label={
          owner === '0'
            ? intl.formatMessage({
                id: 'hand.yourDropArea',
                defaultMessage: 'Your hand drop area',
              })
            : intl.formatMessage(
                {
                  id: 'hand.dropArea',
                  defaultMessage: "{name}'s hand drop area",
                },
                { name: ownerName },
              )
        }
        data-hand-owner={owner}
        data-return-label={intl.formatMessage({
          id: 'hand.return',
          defaultMessage: 'Drop here to return',
        })}
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
                aria-disabled={
                  !interactive || activeOwner !== owner || undefined
                }
                aria-pressed={
                  selectedCardId === card.id || pendingCardId === card.id
                }
                aria-description={[
                  card.type === 'manipulation'
                    ? intl.formatMessage(
                        manipulationDescriptionMessages[card.action],
                      )
                    : '',
                  ...(card.type === 'event'
                    ? (card.effects?.map((effect) =>
                        intl.formatMessage(effectDescriptionMessages[effect]),
                      ) ?? [])
                    : []),
                  intl.formatMessage({
                    id: 'hand.reorderHint',
                    defaultMessage:
                      'Drag within your hand to reorder, or use Alt + Left or Right arrow while focused.',
                  }),
                  intl.formatMessage({
                    id: 'card.detailsHint',
                    defaultMessage:
                      'Double-click or press Alt + Enter to view card details.',
                  }),
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
                draggable={interactive && activeOwner === owner}
                key={card.id}
                onClick={() => {
                  if (interactive && activeOwner === owner) {
                    onChoose(card.id);
                  }
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  onShowDetails?.(card);
                }}
                onPointerDown={
                  card.type === 'event' && interactive && activeOwner === owner
                    ? (event) => touchDrag?.onPointerDown(event, card.id)
                    : undefined
                }
                onPointerMove={touchDrag?.onPointerMove}
                onPointerUp={touchDrag?.onPointerUp}
                onPointerCancel={touchDrag?.onPointerCancel}
                onLostPointerCapture={touchDrag?.onLostPointerCapture}
                onPointerEnter={() => {
                  setHoveredCardId(card.id);
                }}
                onPointerLeave={() => {
                  setHoveredCardId(null);
                }}
                onFocus={() => {
                  setFocusedCardId(card.id);
                }}
                onBlur={() => {
                  setFocusedCardId(null);
                }}
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
                  if (event.altKey && event.key === 'Enter') {
                    event.preventDefault();
                    onShowDetails?.(card);

                    return;
                  }

                  if (!interactive || activeOwner !== owner) {
                    return;
                  }

                  if (
                    !event.altKey ||
                    !['ArrowLeft', 'ArrowRight'].includes(event.key)
                  ) {
                    return;
                  }

                  event.preventDefault();

                  const before = event.key === 'ArrowLeft';
                  const targetIndex = index + (before ? -1 : 1);

                  if (targetIndex >= 0 && targetIndex < orderedCards.length) {
                    reorder(card.id, orderedCards[targetIndex].id, before);
                  }
                }}
                type="button"
              >
                <HandCardFace card={card} />
                {pendingCardId === card.id && (
                  <small
                    className={cardHandStyles.handStatus}
                    data-drag-decoration
                  >
                    {intl.formatMessage({
                      id: 'hand.onTable',
                      defaultMessage: 'On table',
                    })}
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
