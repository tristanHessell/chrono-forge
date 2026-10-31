import clsx from 'clsx';
import { useState } from 'react';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Card, CardOwner } from '../game';
import { moveHandCard, restoreHandOrder } from '../handOrder';
import {
  commandDescriptionMessages,
  effectDescriptionMessages,
} from '../i18n/messageDescriptors';
import type { PlayerType } from '../playerSetup';
import type { TouchCardDragHandlers } from '../useTouchCardDrag';
import { AriaDescription } from './AriaDescription';
import cardStyles from './Card.module.css';
import cardHandStyles from './CardHand.module.css';
import { HandCardFace } from './HandCardFace';
import ownershipStyles from './Ownership.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type CardHandProps = {
  activeOwner: Exclude<CardOwner, 'neutral'>;
  cards: Card[];
  interactive?: boolean;
  isReturnTarget: boolean;
  onChoose: (cardId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, cardId: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onShowDetails?: (card: Card) => void;
  owner: Exclude<CardOwner, 'neutral'>;
  ownerName: string;
  pendingCardId: string | undefined;
  playerType: PlayerType;
  selectedCardId: null | string;
  touchDrag?: TouchCardDragHandlers;
};

export function CardHand({
  activeOwner,
  cards,
  interactive = true,
  isReturnTarget,
  onChoose,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onShowDetails,
  owner,
  ownerName,
  pendingCardId,
  playerType,
  selectedCardId,
  touchDrag,
}: CardHandProps) {
  const intl = useIntl();
  const isOpponent = owner !== '0';
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<null | string>(null);
  const [dragStartIds, setDragStartIds] = useState<string[]>([]);
  const orderedCards = restoreHandOrder(cards, manualIds);
  const reorder = (sourceId: string, targetId: string, before: boolean) => {
    setManualIds(
      moveHandCard(orderedCards, sourceId, targetId, before).map(
        (card) => card.id,
      ),
    );
  };
  const finishHandDrag = () => {
    setDraggedId(null);
    setHoveredCardId(null);
    onDragEnd();
  };
  const previewHandReorder = (event: React.DragEvent<HTMLDivElement>) => {
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
  const [hoveredCardId, setHoveredCardId] = useState<null | string>(null);
  const [focusedCardId, setFocusedCardId] = useState<null | string>(null);
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
                  defaultMessage: 'You',
                  id: 'hand.yourTitle',
                })
              : intl.formatMessage<{ readonly name: MessageValue }>(
                  {
                    defaultMessage: "{name}'s hand",
                    id: 'hand.playerTitle',
                  },
                  { name: ownerName },
                )}
          </p>
        </div>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- TODO this will need to change once we use role="application" */}
      <div
        aria-label={
          owner === '0'
            ? intl.formatMessage({
                defaultMessage: 'Your hand drop area',
                id: 'hand.yourDropArea',
              })
            : intl.formatMessage<{ readonly name: MessageValue }>(
                {
                  defaultMessage: "{name}'s hand drop area",
                  id: 'hand.dropArea',
                },
                { name: ownerName },
              )
        }
        className={clsx(
          cardHandStyles.cardRow,
          isOpponent && cardHandStyles.opponentCardRow,
          cardHandStyles.handDropArea,
          {
            [cardHandStyles.handReturnTarget]: isReturnTarget,
          },
        )}
        data-hand-owner={owner}
        data-return-label={intl.formatMessage({
          defaultMessage: 'Drop here to return',
          id: 'hand.return',
        })}
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
          style={
            { '--hand-count': Math.max(1, cards.length) } as React.CSSProperties
          }
        >
          {renderedCards.map((card) => {
            const index = orderedCards.findIndex(
              (candidate) => candidate.id === card.id,
            );

            return (
              <button
                aria-describedby=""
                aria-disabled={
                  !interactive || activeOwner !== owner || undefined
                }
                aria-pressed={
                  selectedCardId === card.id || pendingCardId === card.id
                }
                className={clsx(
                  cardStyles.card,
                  cardHandStyles.playable,
                  cardHandStyles.handCard,
                  isOpponent && cardHandStyles.opponentCard,
                  {
                    [cardHandStyles.handCardAfter]:
                      !draggedId &&
                      highlightedIndex >= 0 &&
                      index > highlightedIndex,
                    [cardHandStyles.handCardBefore]:
                      !draggedId &&
                      highlightedIndex >= 0 &&
                      index < highlightedIndex,
                    [cardHandStyles.handCardDragging]: draggedId === card.id,
                    [cardHandStyles.handCardHighlighted]:
                      index === highlightedIndex,
                    [cardHandStyles.pendingInHand]: pendingCardId === card.id,
                  },
                )}
                data-card-type={card.type}
                data-event-category={card.category}
                data-hand-card
                draggable={interactive && activeOwner === owner}
                key={card.id}
                onBlur={() => {
                  setFocusedCardId(null);
                }}
                onClick={() => {
                  if (interactive && activeOwner === owner) {
                    onChoose(card.id);
                  }
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  onShowDetails?.(card);
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
                onFocus={() => {
                  setFocusedCardId(card.id);
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
                onLostPointerCapture={touchDrag?.onLostPointerCapture}
                onPointerCancel={touchDrag?.onPointerCancel}
                onPointerDown={
                  card.type === 'event' && interactive && activeOwner === owner
                    ? (event) => touchDrag?.onPointerDown(event, card.id)
                    : undefined
                }
                onPointerEnter={() => {
                  setHoveredCardId(card.id);
                }}
                onPointerLeave={() => {
                  setHoveredCardId(null);
                }}
                onPointerMove={touchDrag?.onPointerMove}
                onPointerUp={touchDrag?.onPointerUp}
                style={{ '--hand-index': index } as React.CSSProperties}
                type="button"
              >
                <AriaDescription id="">
                  {[
                    card.type === 'command'
                      ? intl.formatMessage(
                          commandDescriptionMessages[card.action],
                        )
                      : '',
                    ...(card.type === 'event'
                      ? (card.effects?.map((effect) =>
                          intl.formatMessage(effectDescriptionMessages[effect]),
                        ) ?? [])
                      : []),
                    intl.formatMessage({
                      defaultMessage:
                        'Drag within your hand to reorder, or use Alt + Left or Right arrow while focused.',
                      id: 'hand.reorderHint',
                    }),
                    intl.formatMessage({
                      defaultMessage:
                        'Double-click or press Alt + Enter to view card details.',
                      id: 'card.detailsHint',
                    }),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </AriaDescription>
                <HandCardFace card={card} />
                {pendingCardId === card.id && (
                  <small
                    className={cardHandStyles.handStatus}
                    data-drag-decoration
                  >
                    <FormattedMessage
                      defaultMessage="On table"
                      id="hand.onTable"
                    />
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
