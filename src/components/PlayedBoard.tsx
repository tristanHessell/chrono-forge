import clsx from 'clsx';
import { useIntl } from 'react-intl';

import {
  type Card,
  type CardGameState,
  type CardPosition,
  type CommandCard,
  getAvailablePositions,
  type PlacedCard,
  type PlayerId,
  positionKey,
} from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import {
  categoryMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import { getPlayer, type PlayerSetup } from '../playerSetup';
import type { TouchCardDragHandlers } from '../useTouchCardDrag';
import { BoardZoomControls } from './BoardZoomControls';
import cardStyles from './Card.module.css';
import { CardEffects } from './CardEffect';
import { CardEventName } from './CardEventName';
import ownershipStyles from './Ownership.module.css';
import pendingCardStyles from './PendingCard.module.css';
import { PlacementSlot } from './PlacementSlot';
import { PlayedCard } from './PlayedCard';
import playedCardStyles from './PlayedCard.module.css';

type PlayedBoardProps = {
  activeOwner: PlayerId;
  availablePositions: CardPosition[];
  boardViewportRef: React.RefObject<HTMLDivElement | null>;
  boardZoom: number;
  command: CommandCard | null;
  commandTargetId: null | string;
  commandTargets: PlacedCard[];
  draggedCardDetails: Card | null | undefined;
  draggedCardSource: 'hand' | 'pending' | null;
  finished: boolean;
  G: CardGameState;
  isDragActive: boolean;
  isHumanTurn: boolean;
  isPanning: boolean;
  onAllowCommandDrop: (
    event: React.DragEvent<HTMLElement>,
    targetId: string,
  ) => void;
  onAllowDrop: (event: React.DragEvent<HTMLElement>) => void;
  onBeginDrag: (
    event: React.DragEvent<HTMLElement>,
    cardId: string,
    source: 'hand' | 'pending',
  ) => void;
  onConfirmPlacement: () => void;
  onDragEnd: () => void;
  onDropCard: (
    event: React.DragEvent<HTMLElement>,
    position: CardPosition,
  ) => void;
  onDropCommandOnTarget: (
    event: React.DragEvent<HTMLElement>,
    targetId: string,
  ) => void;
  onDropPendingCard: (event: React.DragEvent<HTMLElement>) => void;
  onFitAll: () => void;
  onPanBoard: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPlaceSelectedCard: (position: CardPosition) => void;
  onResetZoom: () => void;
  onShowDetails: (card: Card) => void;
  onSnapToPosition: (
    event: React.DragEvent<HTMLElement>,
    position: CardPosition,
  ) => void;
  onStartBoardPan: (event: React.PointerEvent<HTMLDivElement>) => void;
  onStopBoardPan: (event: React.PointerEvent<HTMLDivElement>) => void;
  onTargetCard: (card: PlacedCard) => void;
  onZoomChange: (change: number) => void;
  players: PlayerSetup[];
  showPlacementSlots: boolean;
  snapPosition: CardPosition | null;
  touchDrag: TouchCardDragHandlers;
};

const linkDirections = [
  {
    className: playedCardStyles.linkTop,
    column: 0,
    direction: 'down',
    inward: '↓',
    row: -1,
  },
  {
    className: playedCardStyles.linkLeft,
    column: -1,
    direction: 'right',
    inward: '→',
    row: 0,
  },
  {
    className: playedCardStyles.linkRight,
    column: 1,
    direction: 'left',
    inward: '←',
    row: 0,
  },
  {
    className: playedCardStyles.linkBottom,
    column: 0,
    direction: 'up',
    inward: '↑',
    row: 1,
  },
] as const;

export function PlayedBoard({
  activeOwner,
  availablePositions,
  boardViewportRef,
  boardZoom,
  command,
  commandTargetId,
  commandTargets,
  draggedCardDetails,
  draggedCardSource,
  finished,
  G,
  isDragActive,
  isHumanTurn,
  isPanning,
  onAllowCommandDrop,
  onAllowDrop,
  onBeginDrag,
  onConfirmPlacement,
  onDragEnd,
  onDropCard,
  onDropCommandOnTarget,
  onDropPendingCard,
  onFitAll,
  onPanBoard,
  onPlaceSelectedCard,
  onResetZoom,
  onShowDetails,
  onSnapToPosition,
  onStartBoardPan,
  onStopBoardPan,
  onTargetCard,
  onZoomChange,
  players,
  showPlacementSlots,
  snapPosition,
  touchDrag,
}: PlayedBoardProps) {
  const intl = useIntl();

  const isSnappedTo = (position: CardPosition) =>
    snapPosition && positionKey(snapPosition) === positionKey(position);

  const pendingShowsReplacement = Boolean(
    G.pending &&
    draggedCardSource === 'hand' &&
    draggedCardDetails?.type === 'event' &&
    isSnappedTo(G.pending),
  );
  const displayedPendingCard =
    pendingShowsReplacement && draggedCardDetails?.type === 'event'
      ? draggedCardDetails
      : G.pending;
  const displayedPendingOwner = pendingShowsReplacement
    ? activeOwner
    : G.pending?.owner;

  const visiblePositions = !finished
    ? [...G.played, ...getAvailablePositions(G.played), ...availablePositions]
    : [...G.played];

  if (G.pending) {
    visiblePositions.push(G.pending);
  }

  const rows = visiblePositions.map(({ row }) => row);
  const columns = visiblePositions.map(({ column }) => column);
  const minimumRow = Math.min(...rows);
  const maximumRow = Math.max(...rows);
  const minimumColumn = Math.min(...columns);
  const maximumColumn = Math.max(...columns);
  const gridStyle = G.played.length
    ? {
        gridTemplateColumns: `repeat(${maximumColumn - minimumColumn + 1}, var(--card-width))`,
        gridTemplateRows: `repeat(${maximumRow - minimumRow + 1}, var(--card-height))`,
      }
    : undefined;

  const positionStyle = ({ column, row }: CardPosition) => ({
    gridColumn: column - minimumColumn + 1,
    gridRow: row - minimumRow + 1,
  });

  const linkedCardsByPosition = new Map(
    [...G.played, ...(G.pending ? [G.pending] : [])].map((card) => [
      positionKey(card),
      card,
    ]),
  );

  const renderLinkDirections = (card: PlacedCard) =>
    linkDirections.map((link) => {
      const neighbor = linkedCardsByPosition.get(
        positionKey({
          column: card.column + link.column,
          row: card.row + link.row,
        }),
      );

      if (!neighbor || card.placedAt < neighbor.placedAt) {
        return null;
      }

      return (
        <span
          aria-hidden="true"
          className={clsx(playedCardStyles.linkArrow, link.className)}
          data-direction={link.direction}
          data-drag-decoration
          key={link.className}
        >
          {link.inward}
        </span>
      );
    });

  return (
    <div className={gameBoardStyles.boardSurface}>
      <BoardZoomControls
        boardZoom={boardZoom}
        onFitAll={onFitAll}
        onResetZoom={onResetZoom}
        onZoomChange={onZoomChange}
      />
      <div
        aria-label={intl.formatMessage({
          defaultMessage: 'Pannable and zoomable played-card board',
          id: 'board.label',
        })}
        className={clsx(gameBoardStyles.playedViewport, {
          [gameBoardStyles.isPanning]: isPanning,
        })}
        onPointerCancel={onStopBoardPan}
        onPointerDown={onStartBoardPan}
        onPointerMove={onPanBoard}
        onPointerUp={onStopBoardPan}
        ref={boardViewportRef}
      >
        <div
          className={gameBoardStyles.playedGrid}
          data-board-grid
          style={{ ...gridStyle, zoom: boardZoom }}
        >
          {G.played.length === 0 && !G.pending && showPlacementSlots ? (
            <PlacementSlot
              ariaLabel={intl.formatMessage({
                defaultMessage: 'Drop a card in the center of the table',
                id: 'placement.center',
              })}
              draggedCard={draggedCardDetails}
              initial
              isDragActive={isDragActive}
              isPreview={Boolean(
                draggedCardDetails && isSnappedTo({ column: 0, row: 0 }),
              )}
              onClick={() => {
                onPlaceSelectedCard({ column: 0, row: 0 });
              }}
              onDragEnter={(event) => {
                onSnapToPosition(event, { column: 0, row: 0 });
              }}
              onDragOver={onAllowDrop}
              onDrop={(event) => {
                onDropCard(event, { column: 0, row: 0 });
              }}
              position={{ column: 0, row: 0 }}
            />
          ) : (
            <>
              {G.played
                .filter(
                  (card) =>
                    !availablePositions.some(
                      (position) => positionKey(position) === positionKey(card),
                    ) ||
                    !(
                      (G.pending &&
                        positionKey(card) === positionKey(G.pending)) ||
                      (showPlacementSlots &&
                        availablePositions.some(
                          (position) =>
                            positionKey(position) === positionKey(card),
                        ))
                    ),
                )
                .map((card) => (
                  <PlayedCard
                    card={card}
                    isLatest={
                      card.owner !== 'neutral' &&
                      card.id === G.played.at(-1)?.id
                    }
                    key={card.id}
                    links={renderLinkDirections(card)}
                    onDragOver={(event) => {
                      onAllowCommandDrop(event, card.id);
                    }}
                    onDrop={(event) => {
                      onDropCommandOnTarget(event, card.id);
                    }}
                    onShowDetails={onShowDetails}
                    onTarget={
                      (command && commandTargetId === card.id) ||
                      commandTargets.some((target) => target.id === card.id)
                        ? () => {
                            onTargetCard(card);
                          }
                        : undefined
                    }
                    selected={Boolean(command && commandTargetId === card.id)}
                    style={positionStyle(card)}
                  />
                ))}
              {G.pending && (
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- TODO improve roles for these cards
                <div
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Unconfirmed card replacement position',
                    id: 'placement.pending',
                  })}
                  className={clsx(
                    cardStyles.card,
                    pendingCardStyles.pendingCard,
                    displayedPendingOwner === 'neutral'
                      ? ownershipStyles.ownerNeutral
                      : ownershipStyles[
                          `owner${displayedPendingOwner ?? activeOwner}`
                        ],
                    {
                      [pendingCardStyles.replacementTarget]:
                        pendingShowsReplacement,
                    },
                  )}
                  data-card-type={displayedPendingCard?.type}
                  data-drop-position={positionKey(G.pending)}
                  data-event-category={displayedPendingCard?.category}
                  data-owner={displayedPendingOwner}
                  draggable={isHumanTurn && !finished}
                  key={`${G.pending.id}:${G.pending.row}:${G.pending.column}`}
                  onDoubleClick={(event) => {
                    if ((event.target as Element).closest('button')) {
                      return;
                    }

                    if (displayedPendingCard) {
                      onShowDetails(displayedPendingCard);
                    }
                  }}
                  onDragEnd={onDragEnd}
                  onDragEnter={(event) => {
                    onSnapToPosition(event, G.pending!);
                  }}
                  onDragOver={onAllowDrop}
                  onDragStart={(event) => {
                    onBeginDrag(event, G.pending!.id, 'pending');
                  }}
                  onDrop={onDropPendingCard}
                  onLostPointerCapture={touchDrag.onLostPointerCapture}
                  onPointerCancel={touchDrag.onPointerCancel}
                  onPointerDown={(event) => {
                    if (
                      isHumanTurn &&
                      !finished &&
                      !(event.target as Element).closest('button')
                    ) {
                      touchDrag.onPointerDown(event, G.pending!.id, 'pending');
                    }
                  }}
                  onPointerMove={touchDrag.onPointerMove}
                  onPointerUp={touchDrag.onPointerUp}
                  role="region"
                  style={positionStyle(G.pending)}
                >
                  {renderLinkDirections(G.pending)}
                  <CardEffects effects={displayedPendingCard?.effects} />
                  <strong>
                    {displayedPendingCard &&
                      intl.formatNumber(displayedPendingCard.number, {
                        useGrouping: false,
                      })}
                  </strong>
                  {displayedPendingCard && (
                    <CardEventName card={displayedPendingCard} />
                  )}
                  <span className={cardStyles.cardTypeName} data-card-label>
                    {intl.formatMessage(
                      displayedPendingCard?.category
                        ? categoryMessages[displayedPendingCard.category]
                        : startingEventNameMessage,
                    )}
                  </span>
                  <span className={cardStyles.ownerBadge}>
                    {displayedPendingOwner === 'neutral'
                      ? intl.formatMessage({
                          defaultMessage: 'Start',
                          id: 'owner.neutral',
                        })
                      : getPlayer(players, displayedPendingOwner ?? activeOwner)
                          .name}
                  </span>
                  <button
                    aria-label={intl.formatMessage({
                      defaultMessage: 'Confirm card position',
                      id: 'placement.confirmLabel',
                    })}
                    className={pendingCardStyles.pendingConfirm}
                    data-drag-decoration
                    disabled={!isHumanTurn || finished}
                    onClick={(event) => {
                      event.stopPropagation();
                      onConfirmPlacement();
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    title={intl.formatMessage({
                      defaultMessage: 'Confirm',
                      id: 'placement.confirm',
                    })}
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </button>
                </div>
              )}
              {showPlacementSlots &&
                availablePositions
                  .filter(
                    (position) =>
                      !G.pending ||
                      positionKey(position) !== positionKey(G.pending),
                  )
                  .map((position) => (
                    <PlacementSlot
                      ariaLabel={intl.formatMessage<{
                        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                        readonly column: number | bigint;
                        readonly pending: string;
                        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                        readonly row: number | bigint;
                      }>(
                        {
                          defaultMessage:
                            '{pending, select, yes {Move pending card} other {Place selected card}} to row {row, number}, column {column, number}',
                          id: 'placement.target',
                        },
                        {
                          column: position.column,
                          pending: G.pending ? 'yes' : 'no',
                          row: position.row,
                        },
                      )}
                      draggedCard={draggedCardDetails}
                      isDragActive={isDragActive}
                      isPreview={Boolean(
                        draggedCardDetails && isSnappedTo(position),
                      )}
                      key={positionKey(position)}
                      onClick={() => {
                        onPlaceSelectedCard(position);
                      }}
                      onDragEnter={(event) => {
                        onSnapToPosition(event, position);
                      }}
                      onDragOver={onAllowDrop}
                      onDrop={(event) => {
                        onDropCard(event, position);
                      }}
                      overwrite={G.played.some(
                        (card) => positionKey(card) === positionKey(position),
                      )}
                      position={position}
                      style={positionStyle(position)}
                    />
                  ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
