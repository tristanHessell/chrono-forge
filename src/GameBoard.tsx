import type { BoardProps } from 'boardgame.io/react';
import clsx from 'clsx';
import {
  type DragEvent,
  type PointerEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';

import { changeBoardZoom, listenForBoardWheel } from './boardZoom';
import { BoardToolbar } from './components/BoardToolbar';
import { CardEffect } from './components/CardEffect';
import { CardHand } from './components/CardHand';
import { GameLogControls } from './components/GameLogControls';
import { GameResults } from './components/GameResults';
import { PlacementSlot } from './components/PlacementSlot';
import { PlayedCard } from './components/PlayedCard';
import { ThemeToggle } from './components/ThemeToggle';
import {
  type CardGameState,
  type CardPosition,
  getAvailablePositions,
  type PlacedCard,
  type PlayerId,
  positionKey,
} from './game';
import { GameLogContext } from './gameLogContext';
import { useMessages } from './i18n/useMessages';
import {
  applyManipulation,
  applyTimeSwap,
  getTimeJumpPositions,
} from './manipulationRules';
import { type PlayerCount, PlayerCountContext } from './playerCount';
import { calculateScores } from './scoring';
import { useComputerOpponent } from './useComputerOpponent';

type CardGameMoves = {
  manipulate: (
    cardId: string,
    targetId: string,
    destination?: CardPosition | string,
  ) => void;
  discardCard: (cardId: string) => void;
  playCard: (cardId: string, position: CardPosition) => void;
  replacePendingCard: (cardId: string, position?: CardPosition) => void;
  movePendingCard: (position: CardPosition) => void;
  returnPendingCard: () => void;
  confirmPlacement: () => void;
  undoTest: () => void;
  redoTest: () => void;
};

type DraggedCard = {
  cardId: string;
  source: 'hand' | 'pending';
};

const linkDirections = [
  { row: -1, column: 0, className: 'top', outward: '↑', inward: '↓' },
  { row: 0, column: -1, className: 'left', outward: '←', inward: '→' },
  { row: 0, column: 1, className: 'right', outward: '→', inward: '←' },
  { row: 1, column: 0, className: 'bottom', outward: '↓', inward: '↑' },
] as const;

export function GameBoard({ G, ctx, moves }: BoardProps<CardGameState>) {
  const t = useMessages();
  const intl = useIntl();
  const gameMoves = moves as CardGameMoves;
  const finished = Boolean(ctx.gameover) || G.roundOver;
  const activeOwner = ctx.currentPlayer as PlayerId;
  const { setPlayerCount } = useContext(PlayerCountContext);
  const { newGame, replayPaused } = useContext(GameLogContext);
  const [computerPaused, setComputerPaused] = useState(replayPaused);

  useComputerOpponent(
    G,
    ctx.currentPlayer,
    computerPaused || finished,
    gameMoves,
  );

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [manipulationTargetId, setManipulationTargetId] = useState<
    string | null
  >(null);
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [snapPosition, setSnapPosition] = useState<CardPosition | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const boardViewport = useRef<HTMLDivElement>(null);
  const lastJumpDestination = useRef<CardPosition | null>(null);
  const panStart = useRef({
    pointerX: 0,
    pointerY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const draggedCardDetails = draggedCard
    ? draggedCard.source === 'pending'
      ? G.pending
      : Object.values(G.hands)
          .flat()
          .find((card) => card.id === draggedCard.cardId)
    : null;
  const placementCard =
    draggedCardDetails ??
    Object.values(G.hands)
      .flat()
      .find((card) => card.id === selectedCardId) ??
    G.pending;
  const manipulation =
    placementCard?.type === 'manipulation' &&
    activeOwner === '0' &&
    !finished &&
    !G.pending
      ? placementCard
      : null;
  const manipulationTargets = manipulation
    ? G.played.filter(
        (card) =>
          card.owner !== 'neutral' &&
          (manipulation.action === 'time-jump'
            ? getTimeJumpPositions(G.played, card.id).length > 0
            : manipulation.action === 'take-control' ||
                manipulation.action === 'remove-event'
              ? Boolean(
                  applyManipulation(
                    G.played,
                    manipulation.action,
                    card.id,
                    activeOwner,
                  ),
                )
              : manipulationTargetId
                ? Boolean(
                    applyTimeSwap(G.played, manipulationTargetId, card.id),
                  )
                : G.played.some((other) =>
                    applyTimeSwap(G.played, card.id, other.id),
                  )),
      )
    : [];
  const availablePositions = manipulation
    ? manipulation.action === 'time-jump' && manipulationTargetId
      ? getTimeJumpPositions(G.played, manipulationTargetId)
      : []
    : getAvailablePositions(G.played, placementCard ?? undefined);
  const choosingJumpDestination = Boolean(
    manipulation?.action === 'time-jump' && manipulationTargetId,
  );

  useLayoutEffect(() => {
    const viewport = boardViewport.current;
    const position = lastJumpDestination.current;

    if (!viewport || choosingJumpDestination || !position) {
      return;
    }

    const movedCard = viewport.querySelector<HTMLElement>(
      `[data-position="${positionKey(position)}"]`,
    );

    if (movedCard) {
      const cardBounds = movedCard.getBoundingClientRect();
      const viewBounds = viewport.getBoundingClientRect();

      viewport.scrollLeft +=
        cardBounds.left +
        cardBounds.width / 2 -
        viewBounds.left -
        viewBounds.width / 2;
      viewport.scrollTop +=
        cardBounds.top +
        cardBounds.height / 2 -
        viewBounds.top -
        viewBounds.height / 2;
    }
    lastJumpDestination.current = null;
  }, [choosingJumpDestination, G.played]);

  const showPlacementSlots =
    !finished && Boolean(selectedCardId || draggedCard);
  // Reserve slot space even when hidden so selecting a card doesn't shift the board.
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

  const positionStyle = ({ row, column }: CardPosition) => ({
    gridRow: row - minimumRow + 1,
    gridColumn: column - minimumColumn + 1,
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
          row: card.row + link.row,
          column: card.column + link.column,
        }),
      );

      if (!neighbor) {
        return null;
      }

      const pointsOutward = card.placedAt < neighbor.placedAt;

      if (pointsOutward) {
        return null;
      }

      return (
        <span
          aria-hidden="true"
          className={clsx('link-arrow', `link-${link.className}`)}
          key={link.className}
        >
          {link.inward}
        </span>
      );
    });

  const chooseCard = (cardId: string) => {
    setManipulationTargetId(null);
    if (
      G.hands['0'].find((card) => card.id === cardId)?.type === 'manipulation'
    ) {
      if (G.pending) {
        gameMoves.returnPendingCard();
      }
      setSelectedCardId((current) => (current === cardId ? null : cardId));

      return;
    }
    if (G.pending) {
      gameMoves.replacePendingCard(cardId);

      return;
    }

    if (G.played.length === 0) {
      gameMoves.playCard(cardId, { row: 0, column: 0 });

      return;
    }

    setSelectedCardId((current) => (current === cardId ? null : cardId));
  };

  const placeSelectedCard = (position: CardPosition) => {
    if (manipulation && manipulationTargetId) {
      lastJumpDestination.current = position;
      gameMoves.manipulate(manipulation.id, manipulationTargetId, position);
      setSelectedCardId(null);
      setManipulationTargetId(null);

      return;
    }
    if (G.pending) {
      gameMoves.movePendingCard(position);

      return;
    }

    if (!selectedCardId) {
      return;
    }

    gameMoves.playCard(selectedCardId, position);
    setSelectedCardId(null);
  };

  const beginDrag = (
    event: DragEvent<HTMLElement>,
    cardId: string,
    source: DraggedCard['source'],
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.setData('application/x-card-source', source);
    setDraggedCard({ cardId, source });
    setSelectedCardId(null);
    setManipulationTargetId(null);
  };

  const readDraggedCard = (event: DragEvent<HTMLElement>) => {
    if (draggedCard) {
      return draggedCard;
    }

    const cardId = event.dataTransfer.getData('text/plain');
    const source = event.dataTransfer.getData('application/x-card-source');

    if (!cardId || (source !== 'hand' && source !== 'pending')) {
      return null;
    }

    return { cardId, source } satisfies DraggedCard;
  };

  const dropCard = (event: DragEvent<HTMLElement>, position: CardPosition) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (!droppedCard) {
      return;
    }

    if (droppedCard.source === 'pending') {
      gameMoves.movePendingCard(position);
    } else if (G.pending) {
      gameMoves.replacePendingCard(droppedCard.cardId, position);
    } else {
      gameMoves.playCard(droppedCard.cardId, position);
    }

    setDraggedCard(null);
    setSnapPosition(null);
    setSelectedCardId(null);
  };

  const allowDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const snapToPosition = (
    event: DragEvent<HTMLElement>,
    position: CardPosition,
  ) => {
    allowDrop(event);
    setSnapPosition(position);
  };

  const finishDrag = () => {
    setDraggedCard(null);
    setSnapPosition(null);
  };

  const discardCard = (cardId: string) => {
    gameMoves.discardCard(cardId);
    finishDrag();
    setSelectedCardId(null);
  };

  const dropOnDiscard = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (droppedCard && !finished) {
      discardCard(droppedCard.cardId);
    }
  };

  const dropOnPendingCard = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (!droppedCard || droppedCard.source !== 'hand') {
      return;
    }

    gameMoves.replacePendingCard(droppedCard.cardId);
    setDraggedCard(null);
    setSnapPosition(null);
    setSelectedCardId(null);
  };

  const returnCardToHand = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (!droppedCard || droppedCard.source !== 'pending') {
      return;
    }

    gameMoves.returnPendingCard();
    setDraggedCard(null);
    setSnapPosition(null);
    setSelectedCardId(null);
  };

  const startNewGame = () => {
    setComputerPaused(false);
    setSelectedCardId(null);
    setDraggedCard(null);
    setSnapPosition(null);
    newGame();
  };

  const adjustBoardZoom = useCallback((change: number) => {
    setBoardZoom((current) => changeBoardZoom(current, change));
  }, []);

  useEffect(() => {
    const viewport = boardViewport.current;

    if (!viewport) {
      return;
    }

    return listenForBoardWheel(viewport, adjustBoardZoom);
  }, [adjustBoardZoom]);

  const startBoardPan = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target as Element).closest('.card, .placement-slot')
    ) {
      return;
    }

    panStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const panBoard = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPanning) {
      return;
    }

    event.currentTarget.scrollLeft =
      panStart.current.scrollLeft - (event.clientX - panStart.current.pointerX);
    event.currentTarget.scrollTop =
      panStart.current.scrollTop - (event.clientY - panStart.current.pointerY);
  };

  const stopBoardPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPanning) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
  };

  const isSnappedTo = (position: CardPosition) =>
    snapPosition && positionKey(snapPosition) === positionKey(position);

  const pendingShowsReplacement = Boolean(
    G.pending &&
    draggedCard?.source === 'hand' &&
    draggedCardDetails &&
    draggedCardDetails.type === 'event' &&
    isSnappedTo(G.pending),
  );
  const displayedPendingCard =
    pendingShowsReplacement && draggedCardDetails?.type === 'event'
      ? draggedCardDetails
      : G.pending;
  const displayedPendingOwner = pendingShowsReplacement
    ? G.hands['0'].some((card) => card.id === draggedCardDetails?.id)
      ? '0'
      : '1'
    : G.pending?.owner;

  return (
    <main
      className={clsx('game-shell', {
        'choosing-jump-destination': choosingJumpDestination,
      })}
    >
      <header>
        <div className="top-actions">
          <div className="game-brand" aria-label={t('brand.label')}>
            <span aria-hidden="true">⬡</span>
            <div>
              NEXUS<small>{t('brand.tagline')}</small>
            </div>
          </div>
          <p className={clsx('turn-indicator', `owner-${activeOwner}`)}>
            <span aria-hidden="true" />
            {finished
              ? t('game.over')
              : activeOwner !== '0'
                ? t(computerPaused ? 'computer.paused' : 'computer.thinking', {
                    owner: activeOwner,
                  })
                : t('turn', { owner: activeOwner })}
            {!finished && (
              <small>
                {t('turn.action', { count: G.actionsThisTurn + 1 })}
              </small>
            )}
          </p>
          <div className="history-controls" aria-label={t('history.label')}>
            <button
              aria-label={t('history.undoLabel')}
              className="history-button"
              disabled={G.testHistory.length === 0}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.undoTest();
              }}
              type="button"
            >
              {t('history.undo')}
            </button>
            <button
              aria-label={t('history.redoLabel')}
              className="history-button"
              disabled={G.testFuture.length === 0}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.redoTest();
              }}
              type="button"
            >
              {t('history.redo')}
            </button>
          </div>
          {computerPaused && !finished && (
            <button
              className="history-button"
              type="button"
              onClick={() => setComputerPaused(false)}
            >
              {t('computer.resume')}
            </button>
          )}
          <GameLogControls
            G={G}
            currentPlayer={ctx.currentPlayer}
            onOpen={() => {
              setComputerPaused(true);
              finishDrag();
              setSelectedCardId(null);
              setManipulationTargetId(null);
            }}
          />
          <button className="reset" onClick={startNewGame} type="button">
            {t('game.new')}
          </button>
          <ThemeToggle />
          <label className="player-count">
            {t('game.players')}
            <select
              aria-label={t('game.players')}
              title={t('game.playersHint')}
              value={G.playerIds.length}
              onChange={(event) =>
                setPlayerCount(Number(event.target.value) as PlayerCount)
              }
            >
              {[2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="table" aria-label={t('table.label')}>
        <div className="opponent-hand">
          {G.playerIds
            .filter((id) => id !== '0')
            .map((id) => (
              <div className="computer-hand" key={id}>
                <CardHand
                  activeOwner={activeOwner}
                  cards={G.hands[id]}
                  interactive={false}
                  isReturnTarget={
                    draggedCard?.source === 'pending' && G.pending?.owner === id
                  }
                  onChoose={chooseCard}
                  onDragEnd={finishDrag}
                  onDragOver={allowDrop}
                  onDragStart={(event, cardId) =>
                    beginDrag(event, cardId, 'hand')
                  }
                  onDrop={returnCardToHand}
                  owner={id}
                  pendingCardId={G.pending?.id}
                  selectedCardId={selectedCardId}
                />
              </div>
            ))}
        </div>

        <div className="play-area">
          <div className="area-heading">
            <div className="area-title-with-deck">
              <p className="area-label">{t('board.title')}</p>
              <div
                aria-label={t('deck.label', { count: G.deck.length })}
                className="deck-display"
                role="status"
              >
                <div className="deck-card-back" aria-hidden="true">
                  <strong>{intl.formatNumber(G.deck.length)}</strong>
                </div>
                <span>
                  {t('deck.title')}
                  <small>{t('deck.remaining', { count: G.deck.length })}</small>
                </span>
              </div>
              <button
                type="button"
                className={clsx('discard-pile', {
                  'discard-ready': draggedCard && !finished,
                })}
                aria-label={t('discard.label', { count: G.discarded.length })}
                title={t('discard.hint')}
                disabled={
                  finished ||
                  activeOwner !== '0' ||
                  !(draggedCard || selectedCardId || G.pending)
                }
                onDragEnter={allowDrop}
                onDragOver={allowDrop}
                onDrop={dropOnDiscard}
                onClick={() => {
                  const cardId = selectedCardId ?? G.pending?.id;

                  if (cardId) {
                    discardCard(cardId);
                  }
                }}
              >
                <span aria-hidden="true">⇣</span>
                <span>
                  {t('discard.title')}
                  <small>
                    {t('discard.count', { count: G.discarded.length })}
                  </small>
                </span>
              </button>
            </div>
            <BoardToolbar
              playerIds={G.playerIds}
              scores={calculateScores(G.played)}
              boardZoom={boardZoom}
              onResetZoom={() => setBoardZoom(1)}
              onZoomChange={adjustBoardZoom}
            />
          </div>
          <div
            ref={boardViewport}
            aria-label={t('board.label')}
            className={clsx('played-viewport', { 'is-panning': isPanning })}
            onPointerCancel={stopBoardPan}
            onPointerDown={startBoardPan}
            onPointerMove={panBoard}
            onPointerUp={stopBoardPan}
          >
            <div
              className="played-grid"
              style={{ ...gridStyle, zoom: boardZoom }}
            >
              {G.played.length === 0 && !G.pending && showPlacementSlots ? (
                <PlacementSlot
                  ariaLabel={t('placement.center')}
                  draggedCard={draggedCardDetails}
                  initial
                  isDragActive={Boolean(draggedCard)}
                  isPreview={Boolean(
                    draggedCardDetails && isSnappedTo({ row: 0, column: 0 }),
                  )}
                  onClick={() => placeSelectedCard({ row: 0, column: 0 })}
                  onDragEnter={(event) =>
                    snapToPosition(event, { row: 0, column: 0 })
                  }
                  onDragOver={allowDrop}
                  onDrop={(event) => dropCard(event, { row: 0, column: 0 })}
                />
              ) : (
                <>
                  {G.played
                    .filter(
                      (card) =>
                        !card.removed ||
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
                        key={card.id}
                        style={positionStyle(card)}
                        card={card}
                        isLatest={
                          card.owner !== 'neutral' &&
                          card.id === G.played.at(-1)?.id
                        }
                        links={renderLinkDirections(card)}
                        selected={Boolean(
                          manipulation && manipulationTargetId === card.id,
                        )}
                        onTarget={
                          manipulationTargets.some(
                            (target) => target.id === card.id,
                          )
                            ? () => {
                                if (
                                  manipulation?.action === 'take-control' ||
                                  manipulation?.action === 'remove-event'
                                ) {
                                  gameMoves.manipulate(
                                    manipulation.id,
                                    card.id,
                                  );
                                  setSelectedCardId(null);
                                  setManipulationTargetId(null);

                                  return;
                                }
                                if (
                                  manipulation?.action === 'time-swap' &&
                                  manipulationTargetId
                                ) {
                                  gameMoves.manipulate(
                                    manipulation.id,
                                    manipulationTargetId,
                                    card.id,
                                  );
                                  setSelectedCardId(null);
                                  setManipulationTargetId(null);
                                } else {
                                  setManipulationTargetId(card.id);
                                }
                              }
                            : undefined
                        }
                      />
                    ))}
                  {G.pending && (
                    <div
                      aria-label={t('placement.pending')}
                      className={clsx(
                        'card',
                        'pending-card',
                        `owner-${displayedPendingOwner}`,
                        { 'replacement-target': pendingShowsReplacement },
                      )}
                      data-owner={displayedPendingOwner}
                      data-card-type={displayedPendingCard?.type}
                      data-event-category={displayedPendingCard?.category}
                      draggable={activeOwner === '0' && !finished}
                      key={`${G.pending.id}:${G.pending.row}:${G.pending.column}`}
                      onDragEnd={finishDrag}
                      onDragEnter={(event) => snapToPosition(event, G.pending!)}
                      onDragOver={allowDrop}
                      onDragStart={(event) =>
                        beginDrag(event, G.pending!.id, 'pending')
                      }
                      onDrop={dropOnPendingCard}
                      role="region"
                      style={positionStyle(G.pending)}
                    >
                      {renderLinkDirections(G.pending)}
                      <CardEffect effect={displayedPendingCard?.effect} />
                      <strong>
                        {displayedPendingCard &&
                          intl.formatNumber(displayedPendingCard.number, {
                            useGrouping: false,
                          })}
                      </strong>
                      <span className="card-type-name">
                        {t(
                          displayedPendingCard?.category
                            ? `card.category.${displayedPendingCard.category}`
                            : 'card.event',
                        )}
                      </span>
                      <span className="owner-badge">
                        {t(`owner.${displayedPendingOwner ?? activeOwner}`)}
                      </span>
                      <button
                        aria-label={t('placement.confirmLabel')}
                        className="pending-confirm"
                        disabled={activeOwner !== '0' || finished}
                        onClick={(event) => {
                          event.stopPropagation();
                          gameMoves.confirmPlacement();
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        type="button"
                      >
                        {t('placement.confirm')}
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
                          overwrite={G.played.some(
                            (card) =>
                              card.removed &&
                              positionKey(card) === positionKey(position),
                          )}
                          ariaLabel={t('placement.target', {
                            pending: G.pending ? 'yes' : 'no',
                            row: position.row,
                            column: position.column,
                          })}
                          draggedCard={draggedCardDetails}
                          isDragActive={Boolean(draggedCard)}
                          isPreview={Boolean(
                            draggedCardDetails && isSnappedTo(position),
                          )}
                          key={positionKey(position)}
                          onClick={() => placeSelectedCard(position)}
                          onDragEnter={(event) =>
                            snapToPosition(event, position)
                          }
                          onDragOver={allowDrop}
                          onDrop={(event) => dropCard(event, position)}
                          style={positionStyle(position)}
                        />
                      ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hand">
          <CardHand
            activeOwner={activeOwner}
            cards={G.hands['0']}
            interactive={!finished}
            isReturnTarget={
              draggedCard?.source === 'pending' && G.pending?.owner === '0'
            }
            onChoose={chooseCard}
            onDragEnd={finishDrag}
            onDragOver={allowDrop}
            onDragStart={(event, cardId) => beginDrag(event, cardId, 'hand')}
            onDrop={returnCardToHand}
            owner="0"
            pendingCardId={G.pending?.id}
            selectedCardId={selectedCardId}
          />
        </div>
      </section>

      <footer>
        {finished ? (
          <GameResults played={G.played} playerIds={G.playerIds} />
        ) : (
          <p className={clsx(manipulation && 'manipulation-prompt')}>
            {manipulation
              ? t(
                  !manipulationTargetId
                    ? manipulationTargets.length
                      ? 'manipulation.choose'
                      : 'manipulation.noTargets'
                    : manipulation.action === 'time-jump'
                      ? 'manipulation.jumpDestination'
                      : 'manipulation.swapDestination',
                )
              : G.pending
                ? t('status.pending')
                : draggedCard
                  ? t('status.dragging')
                  : selectedCardId
                    ? t('status.selected')
                    : t('status.turn', {
                        owner: activeOwner,
                        count: G.deck.length,
                      })}
            {manipulation && (
              <button
                className="history-button"
                type="button"
                onClick={() => {
                  setSelectedCardId(null);
                  setManipulationTargetId(null);
                }}
              >
                {t('manipulation.cancel')}
              </button>
            )}
          </p>
        )}
      </footer>
    </main>
  );
}
