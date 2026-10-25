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

import {
  changeBoardZoom,
  changeBoardZoomByPinch,
  listenForBoardWheel,
} from './boardZoom';
import { BoardZoomControls } from './components/BoardZoomControls';
import cardStyles from './components/Card.module.css';
import { CardCatalogDialog } from './components/CardCatalogDialog';
import { CardDetailsDialog } from './components/CardDetailsDialog';
import { CardEffects } from './components/CardEffect';
import { CardEventName } from './components/CardEventName';
import { CardHand } from './components/CardHand';
import { ComputerPlayer } from './components/ComputerPlayer';
import controlsStyles from './components/Controls.module.css';
import { GameLogControls } from './components/GameLogControls';
import { GameMenu } from './components/GameMenu';
import { GameResults } from './components/GameResults';
import { NewGameDialog } from './components/NewGameDialog';
import ownershipStyles from './components/Ownership.module.css';
import pendingCardStyles from './components/PendingCard.module.css';
import { PlacementSlot } from './components/PlacementSlot';
import { PlayedCard } from './components/PlayedCard';
import playedCardStyles from './components/PlayedCard.module.css';
import { RoundScoresDialog } from './components/RoundScoresDialog';
import {
  canUndoMove,
  type Card,
  type CardGameState,
  type CardPosition,
  getAvailablePositions,
  type PlacedCard,
  type PlayerId,
  positionKey,
} from './game';
import gameBoardStyles from './GameBoard.module.css';
import { GameLogContext } from './gameLogContext';
import {
  categoryMessages,
  startingEventNameMessage,
} from './i18n/messageDescriptors';
import {
  applyManipulation,
  applyTimeSwap,
  getTimeJumpPositions,
} from './manipulationRules';
import { getPlayer, type PlayerSetup, PlayerSetupContext } from './playerSetup';
import { calculateScores } from './scoring';
import {
  type DragPoint,
  type DragSource,
  touchDropPosition,
} from './touchCardDrag';
import { useComputerOpponent } from './useComputerOpponent';
import { useTouchCardDrag } from './useTouchCardDrag';

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
  {
    row: -1,
    column: 0,
    className: playedCardStyles.linkTop,
    outward: '↑',
    inward: '↓',
  },
  {
    row: 0,
    column: -1,
    className: playedCardStyles.linkLeft,
    outward: '←',
    inward: '→',
  },
  {
    row: 0,
    column: 1,
    className: playedCardStyles.linkRight,
    outward: '→',
    inward: '←',
  },
  {
    row: 1,
    column: 0,
    className: playedCardStyles.linkBottom,
    outward: '↓',
    inward: '↑',
  },
] as const;

function setCardDragImage(event: DragEvent<HTMLElement>) {
  const preview = event.currentTarget.cloneNode(true) as HTMLElement;

  preview.className = cardStyles.card;
  preview.removeAttribute('aria-pressed');
  preview.removeAttribute('style');
  preview.querySelectorAll('[data-drag-decoration]').forEach((element) => {
    element.remove();
  });
  preview.setAttribute('aria-hidden', 'true');
  preview.style.animation = 'none';
  preview.style.left = '-10000px';
  preview.style.opacity = '1';
  preview.style.outline = 'none';
  preview.style.pointerEvents = 'none';
  preview.style.position = 'fixed';
  preview.style.top = '0';
  preview.style.transform = 'none';
  preview.style.translate = 'none';
  document.body.append(preview);

  event.dataTransfer.setDragImage(
    preview,
    preview.offsetWidth / 2,
    preview.offsetHeight / 2,
  );
  window.setTimeout(() => {
    preview.remove();
  }, 0);
}

export function GameBoard({ G, ctx, moves }: BoardProps<CardGameState>) {
  const intl = useIntl();
  const gameMoves = moves as CardGameMoves;
  const finished = Boolean(ctx.gameover) || G.roundOver;
  const activeOwner = ctx.currentPlayer as PlayerId;
  const players = useContext(PlayerSetupContext);
  const activePlayer = getPlayer(players, activeOwner);
  const isHumanTurn = activePlayer.type === 'human';
  const handOwner = isHumanTurn ? activeOwner : '0';
  const handPlayer = getPlayer(players, handOwner);
  const scores = calculateScores(G.played);
  const { newGame, replayPaused } = useContext(GameLogContext);
  const [computerPaused, setComputerPaused] = useState(replayPaused);

  useComputerOpponent(
    G,
    ctx.currentPlayer,
    players,
    computerPaused || finished,
    gameMoves,
  );

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailsCard, setDetailsCard] = useState<Card | null>(null);
  const [manipulationTargetId, setManipulationTargetId] = useState<
    string | null
  >(null);
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [snapPosition, setSnapPosition] = useState<CardPosition | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const boardViewport = useRef<HTMLDivElement>(null);
  const cardCatalogDialog = useRef<HTMLDialogElement>(null);
  const newGameDialog = useRef<HTMLDialogElement>(null);
  const roundScoresDialog = useRef<HTMLDialogElement>(null);
  const lastJumpDestination = useRef<CardPosition | null>(null);
  const panStart = useRef({
    pointerX: 0,
    pointerY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef<number | null>(null);
  const draggedCardDetails = draggedCard
    ? draggedCard.source === 'pending'
      ? G.pending
      : Object.values(G.hands)
          .flat()
          .find((card) => card.id === draggedCard.cardId)
    : null;
  const showCardDetails = (card: Card) => {
    setDetailsCard(card);
  };
  const placementCard =
    draggedCardDetails ??
    Object.values(G.hands)
      .flat()
      .find((card) => card.id === selectedCardId) ??
    G.pending;
  const manipulation =
    placementCard?.type === 'manipulation' &&
    isHumanTurn &&
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
          className={clsx(playedCardStyles.linkArrow, link.className)}
          data-drag-decoration
          key={link.className}
        >
          {link.inward}
        </span>
      );
    });

  const chooseCard = (cardId: string) => {
    setManipulationTargetId(null);

    if (
      G.hands[activeOwner].find((card) => card.id === cardId)?.type ===
      'manipulation'
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
    if (touchDrag.controller.tracking) {
      event.preventDefault();

      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.setData('application/x-card-source', source);
    setCardDragImage(event);
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

  const allowManipulationDrop = (
    event: DragEvent<HTMLElement>,
    targetId: string,
  ) => {
    const droppedCard = readDraggedCard(event);

    if (
      manipulation &&
      droppedCard?.source === 'hand' &&
      droppedCard.cardId === manipulation.id &&
      manipulationTargets.some((target) => target.id === targetId)
    ) {
      allowDrop(event);
    }
  };

  const dropManipulationOnTarget = (
    event: DragEvent<HTMLElement>,
    targetId: string,
  ) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (
      !manipulation ||
      droppedCard?.source !== 'hand' ||
      droppedCard.cardId !== manipulation.id ||
      !manipulationTargets.some((target) => target.id === targetId)
    ) {
      return;
    }
    if (
      manipulation.action === 'take-control' ||
      manipulation.action === 'remove-event'
    ) {
      gameMoves.manipulate(manipulation.id, targetId);
      setSelectedCardId(null);
      setManipulationTargetId(null);
    } else {
      setSelectedCardId(manipulation.id);
      setManipulationTargetId(targetId);
    }

    setDraggedCard(null);
    setSnapPosition(null);
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

  const touchPosition = (
    point: DragPoint,
    cardId: string,
    source: DragSource,
  ) => {
    const target = document
      .elementFromPoint(point.x, point.y)
      ?.closest<HTMLElement>('[data-drop-position]');
    const key = target?.dataset.dropPosition;
    const card =
      source === 'pending'
        ? G.pending
        : G.hands[activeOwner].find((candidate) => candidate.id === cardId);

    if (card?.id !== cardId) {
      return null;
    }

    return touchDropPosition(G.played, card, key);
  };
  const touchDrag = useTouchCardDrag({
    onStart: (cardId, source) => {
      setDraggedCard({ cardId, source });
      setSelectedCardId(cardId);
      setManipulationTargetId(null);
    },
    onMove: (point) => {
      setSnapPosition(
        draggedCard
          ? touchPosition(point, draggedCard.cardId, draggedCard.source)
          : null,
      );
    },
    onDrop: (cardId, source, point) => {
      if (finished || !isHumanTurn) {
        return;
      }

      const target = document.elementFromPoint(point.x, point.y);

      if (target?.closest('[data-discard-pile]')) {
        gameMoves.discardCard(cardId);

        return;
      }
      if (
        source === 'pending' &&
        target?.closest(`[data-hand-owner="${activeOwner}"]`)
      ) {
        gameMoves.returnPendingCard();

        return;
      }

      const position = touchPosition(point, cardId, source);

      if (!position) {
        return;
      }
      if (source === 'pending') {
        gameMoves.movePendingCard(position);
      } else if (G.pending) {
        gameMoves.replacePendingCard(cardId, position);
      } else {
        gameMoves.playCard(cardId, position);
      }
    },
    onFinish: () => {
      finishDrag();
      setSelectedCardId(null);
    },
  });

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

  const startNewGame = (nextPlayers: PlayerSetup[]) => {
    setComputerPaused(false);
    setSelectedCardId(null);
    setDraggedCard(null);
    setSnapPosition(null);
    newGame(nextPlayers);
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
    if (event.pointerType === 'touch') {
      touchPoints.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (touchPoints.current.size === 2) {
        const [first, second] = [...touchPoints.current.values()];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);

        pinchDistance.current = distance || null;
        touchDrag.controller.cancel();
        setIsPanning(false);

        return;
      }
      if (touchPoints.current.size > 2) {
        pinchDistance.current = null;
        setIsPanning(false);

        return;
      }
    }

    if (
      event.button !== 0 ||
      pinchDistance.current ||
      (event.target as Element).closest(
        '[data-card-type], [data-placement-slot]',
      )
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
    if (event.pointerType === 'touch') {
      const touchPoint = touchPoints.current.get(event.pointerId);

      if (touchPoint) {
        touchPoint.x = event.clientX;
        touchPoint.y = event.clientY;

        if (pinchDistance.current && touchPoints.current.size === 2) {
          const [first, second] = [...touchPoints.current.values()];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const previousDistance = pinchDistance.current;

          pinchDistance.current = distance;
          setBoardZoom((current) =>
            changeBoardZoomByPinch(current, previousDistance, distance),
          );

          return;
        }
      }
      if (pinchDistance.current) {
        return;
      }
    }

    if (!isPanning) {
      return;
    }

    event.currentTarget.scrollLeft =
      panStart.current.scrollLeft - (event.clientX - panStart.current.pointerX);
    event.currentTarget.scrollTop =
      panStart.current.scrollTop - (event.clientY - panStart.current.pointerY);
  };

  const stopBoardPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touchPoints.current.delete(event.pointerId);

      if (touchPoints.current.size < 2) {
        pinchDistance.current = null;
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (isPanning) {
      setIsPanning(false);
    }
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
    ? activeOwner
    : G.pending?.owner;

  return (
    <main
      className={clsx(gameBoardStyles.gameShell, {
        [gameBoardStyles.choosingJumpDestination]: choosingJumpDestination,
      })}
      data-touch-dragging={Boolean(touchDrag.preview)}
      onPointerDownCapture={() => {
        touchDrag.controller.resetClickSuppression();
      }}
      onClickCapture={(event) => {
        if (touchDrag.controller.consumeClick()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          !event.defaultPrevented &&
          manipulation &&
          !(event.target as Element).closest('dialog[open]')
        ) {
          event.preventDefault();
          setSelectedCardId(null);
          setManipulationTargetId(null);
          touchDrag.controller.cancel();
          finishDrag();
        }
      }}
    >
      <header className={gameBoardStyles.header}>
        <div className={gameBoardStyles.topActions}>
          <div className={gameBoardStyles.gameBrand}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m12 2 9 5v10l-9 5-9-5V7z" />
            </svg>
            <div>
              {intl.formatMessage({
                id: 'brand.name',
                defaultMessage: 'Chrono-Forge',
              })}
              <small>
                {intl.formatMessage({
                  id: 'brand.tagline',
                  defaultMessage: 'Tactical card system',
                })}
              </small>
            </div>
          </div>
          <p
            className={clsx(
              gameBoardStyles.turnIndicator,
              ownershipStyles[`owner${activeOwner}`],
            )}
          >
            <span aria-hidden="true" />
            {finished
              ? intl.formatMessage({
                  id: 'game.over',
                  defaultMessage: 'Game over',
                })
              : activePlayer.type === 'computer'
                ? intl.formatMessage(
                    computerPaused
                      ? {
                          id: 'computer.paused',
                          defaultMessage: 'Computer paused',
                        }
                      : {
                          id: 'computer.thinking',
                          defaultMessage: '{name} is thinking…',
                        },
                    { name: activePlayer.name },
                  )
                : activeOwner === '0'
                  ? intl.formatMessage({
                      id: 'turn.you',
                      defaultMessage: 'Your turn',
                    })
                  : intl.formatMessage(
                      { id: 'turn.player', defaultMessage: "{name}'s turn" },
                      { name: activePlayer.name },
                    )}
            {!finished && (
              <small>
                {intl.formatMessage(
                  { id: 'turn.action', defaultMessage: '{count, number} / 2' },
                  { count: G.actionsThisTurn + 1 },
                )}
              </small>
            )}
          </p>
          <div
            className={gameBoardStyles.historyControls}
            aria-label={intl.formatMessage({
              id: 'history.label',
              defaultMessage: 'Move history controls',
            })}
          >
            <button
              aria-label={intl.formatMessage({
                id: 'history.undoLabel',
                defaultMessage: 'Undo your last move',
              })}
              className={controlsStyles.historyButton}
              disabled={!canUndoMove(G)}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.undoTest();
              }}
              type="button"
            >
              {intl.formatMessage({
                id: 'history.undo',
                defaultMessage: 'Undo',
              })}
            </button>
            <button
              aria-label={intl.formatMessage({
                id: 'history.redoLabel',
                defaultMessage: 'Redo last action',
              })}
              className={controlsStyles.historyButton}
              disabled={G.testFuture.length === 0}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.redoTest();
              }}
              type="button"
            >
              {intl.formatMessage({
                id: 'history.redo',
                defaultMessage: 'Redo',
              })}
            </button>
          </div>
          {computerPaused && !finished && activePlayer.type === 'computer' && (
            <button
              className={controlsStyles.historyButton}
              type="button"
              onClick={() => {
                setComputerPaused(false);
              }}
            >
              {intl.formatMessage({
                id: 'computer.resume',
                defaultMessage: 'Resume computer',
              })}
            </button>
          )}
          <GameMenu
            onNewGame={() => newGameDialog.current?.showModal()}
            onOpenCatalog={() => {
              setComputerPaused(true);
              touchDrag.controller.cancel();
              finishDrag();
              setSelectedCardId(null);
              setManipulationTargetId(null);
              cardCatalogDialog.current?.showModal();
            }}
          />
        </div>
      </header>

      <section
        className={gameBoardStyles.table}
        aria-label={intl.formatMessage({
          id: 'table.label',
          defaultMessage: 'Card table',
        })}
      >
        <div className={gameBoardStyles.opponentHand}>
          {G.playerIds
            .filter((id) => id !== handOwner)
            .map((id) => {
              const player = getPlayer(players, id);

              return player.type === 'computer' ? (
                <ComputerPlayer
                  cards={G.hands[id]}
                  key={id}
                  player={player}
                  score={scores[id] ?? 0}
                />
              ) : (
                <div className={gameBoardStyles.computerHand} key={id}>
                  <CardHand
                    activeOwner={activeOwner}
                    cards={G.hands[id]}
                    interactive={false}
                    isReturnTarget={
                      draggedCard?.source === 'pending' &&
                      G.pending?.owner === id
                    }
                    onChoose={chooseCard}
                    onDragEnd={finishDrag}
                    onDragOver={allowDrop}
                    onDragStart={(event, cardId) => {
                      beginDrag(event, cardId, 'hand');
                    }}
                    onDrop={returnCardToHand}
                    onShowDetails={showCardDetails}
                    owner={id}
                    ownerName={player.name}
                    playerType={player.type}
                    pendingCardId={G.pending?.id}
                    score={scores[id] ?? 0}
                    selectedCardId={selectedCardId}
                  />
                </div>
              );
            })}
        </div>

        <div className={gameBoardStyles.playArea}>
          <div className={gameBoardStyles.areaHeading}>
            <div className={gameBoardStyles.areaControls}>
              <div
                aria-label={intl.formatMessage(
                  {
                    id: 'deck.label',
                    defaultMessage:
                      '{count, plural, one {# card remaining in the deck} other {# cards remaining in the deck}}',
                  },
                  { count: G.deck.length },
                )}
                className={gameBoardStyles.deckDisplay}
                role="status"
              >
                <span>
                  {intl.formatMessage({
                    id: 'deck.title',
                    defaultMessage: 'Deck',
                  })}
                  <small>
                    {intl.formatMessage(
                      {
                        id: 'deck.remaining',
                        defaultMessage: '{count, number} remaining',
                      },
                      { count: G.deck.length },
                    )}
                  </small>
                </span>
                <div
                  className={gameBoardStyles.deckCardBack}
                  aria-hidden="true"
                >
                  <strong>{intl.formatNumber(G.deck.length)}</strong>
                </div>
              </div>
              <button
                type="button"
                data-discard-pile
                className={clsx(gameBoardStyles.discardPile, {
                  [gameBoardStyles.discardReady]: draggedCard && !finished,
                })}
                aria-label={intl.formatMessage(
                  {
                    id: 'discard.label',
                    defaultMessage:
                      'Discard pile: {count, plural, one {# card} other {# cards}}. Drop a card here or click to discard your selected card. This uses one of your two actions.',
                  },
                  { count: G.discarded.length },
                )}
                title={intl.formatMessage({
                  id: 'discard.hint',
                  defaultMessage:
                    'Drag a card here, or select a card and click here. Discarding uses one of your two actions.',
                })}
                disabled={
                  finished ||
                  !isHumanTurn ||
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
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 3v14m-6-6 6 6 6-6M5 21h14" />
                </svg>
                <span>
                  {intl.formatMessage({
                    id: 'discard.title',
                    defaultMessage: 'Discard',
                  })}
                  <small>
                    {intl.formatMessage(
                      {
                        id: 'discard.count',
                        defaultMessage: '{count, number} discarded',
                      },
                      { count: G.discarded.length },
                    )}
                  </small>
                </span>
              </button>
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
              <button
                className={controlsStyles.historyButton}
                type="button"
                aria-label={intl.formatMessage({
                  id: 'roundScores.title',
                  defaultMessage: 'Round scores',
                })}
                title={intl.formatMessage({
                  id: 'roundScores.title',
                  defaultMessage: 'Round scores',
                })}
                data-icon-button
                onClick={() => {
                  setComputerPaused(true);
                  touchDrag.controller.cancel();
                  finishDrag();
                  setSelectedCardId(null);
                  setManipulationTargetId(null);
                  roundScoresDialog.current?.showModal();
                }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 20h16M6 16v-5h4v5m2 0V5h4v11m2 0V9h4v7" />
                </svg>
              </button>
            </div>
          </div>
          <div className={gameBoardStyles.boardSurface}>
            <BoardZoomControls
              boardZoom={boardZoom}
              onResetZoom={() => {
                setBoardZoom(1);
              }}
              onZoomChange={adjustBoardZoom}
            />
            <div
              ref={boardViewport}
              aria-label={intl.formatMessage({
                id: 'board.label',
                defaultMessage: 'Pannable and zoomable played-card board',
              })}
              className={clsx(gameBoardStyles.playedViewport, {
                [gameBoardStyles.isPanning]: isPanning,
              })}
              onPointerCancel={stopBoardPan}
              onPointerDown={startBoardPan}
              onPointerMove={panBoard}
              onPointerUp={stopBoardPan}
            >
              <div
                className={gameBoardStyles.playedGrid}
                style={{ ...gridStyle, zoom: boardZoom }}
              >
                {G.played.length === 0 && !G.pending && showPlacementSlots ? (
                  <PlacementSlot
                    ariaLabel={intl.formatMessage({
                      id: 'placement.center',
                      defaultMessage: 'Drop a card in the center of the table',
                    })}
                    position={{ row: 0, column: 0 }}
                    draggedCard={draggedCardDetails}
                    initial
                    isDragActive={Boolean(draggedCard)}
                    isPreview={Boolean(
                      draggedCardDetails && isSnappedTo({ row: 0, column: 0 }),
                    )}
                    onClick={() => {
                      placeSelectedCard({ row: 0, column: 0 });
                    }}
                    onDragEnter={(event) => {
                      snapToPosition(event, { row: 0, column: 0 });
                    }}
                    onDragOver={allowDrop}
                    onDrop={(event) => {
                      dropCard(event, { row: 0, column: 0 });
                    }}
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
                          onDragOver={(event) => {
                            allowManipulationDrop(event, card.id);
                          }}
                          onDrop={(event) => {
                            dropManipulationOnTarget(event, card.id);
                          }}
                          onTarget={
                            (manipulation &&
                              manipulationTargetId === card.id) ||
                            manipulationTargets.some(
                              (target) => target.id === card.id,
                            )
                              ? () => {
                                  if (manipulationTargetId === card.id) {
                                    setManipulationTargetId(null);

                                    return;
                                  }
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
                          onShowDetails={showCardDetails}
                        />
                      ))}
                    {G.pending && (
                      <div
                        aria-label={intl.formatMessage({
                          id: 'placement.pending',
                          defaultMessage:
                            'Unconfirmed card replacement position',
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
                        data-owner={displayedPendingOwner}
                        data-drop-position={positionKey(G.pending)}
                        data-card-type={displayedPendingCard?.type}
                        data-event-category={displayedPendingCard?.category}
                        draggable={isHumanTurn && !finished}
                        key={`${G.pending.id}:${G.pending.row}:${G.pending.column}`}
                        onDragEnd={finishDrag}
                        onPointerDown={(event) => {
                          if (
                            isHumanTurn &&
                            !finished &&
                            !(event.target as Element).closest('button')
                          ) {
                            touchDrag.onPointerDown(
                              event,
                              G.pending!.id,
                              'pending',
                            );
                          }
                        }}
                        onPointerMove={touchDrag.onPointerMove}
                        onPointerUp={touchDrag.onPointerUp}
                        onPointerCancel={touchDrag.onPointerCancel}
                        onLostPointerCapture={touchDrag.onLostPointerCapture}
                        onDragEnter={(event) => {
                          snapToPosition(event, G.pending!);
                        }}
                        onDragOver={allowDrop}
                        onDragStart={(event) => {
                          beginDrag(event, G.pending!.id, 'pending');
                        }}
                        onDrop={dropOnPendingCard}
                        onDoubleClick={(event) => {
                          if ((event.target as Element).closest('button')) {
                            return;
                          }

                          if (displayedPendingCard) {
                            showCardDetails(displayedPendingCard);
                          }
                        }}
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
                        <span
                          data-card-label
                          className={cardStyles.cardTypeName}
                        >
                          {intl.formatMessage(
                            displayedPendingCard?.category
                              ? categoryMessages[displayedPendingCard.category]
                              : startingEventNameMessage,
                          )}
                        </span>
                        <span className={cardStyles.ownerBadge}>
                          {displayedPendingOwner === 'neutral'
                            ? intl.formatMessage({
                                id: 'owner.neutral',
                                defaultMessage: 'Start',
                              })
                            : getPlayer(
                                players,
                                displayedPendingOwner ?? activeOwner,
                              ).name}
                        </span>
                        <button
                          aria-label={intl.formatMessage({
                            id: 'placement.confirmLabel',
                            defaultMessage: 'Confirm card position',
                          })}
                          className={pendingCardStyles.pendingConfirm}
                          data-drag-decoration
                          disabled={!isHumanTurn || finished}
                          onClick={(event) => {
                            event.stopPropagation();
                            gameMoves.confirmPlacement();
                          }}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          title={intl.formatMessage({
                            id: 'placement.confirm',
                            defaultMessage: 'Confirm',
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
                            position={position}
                            overwrite={G.played.some(
                              (card) =>
                                card.removed &&
                                positionKey(card) === positionKey(position),
                            )}
                            ariaLabel={intl.formatMessage(
                              {
                                id: 'placement.target',
                                defaultMessage:
                                  '{pending, select, yes {Move pending card} other {Place selected card}} to row {row, number}, column {column, number}',
                              },
                              {
                                pending: G.pending ? 'yes' : 'no',
                                row: position.row,
                                column: position.column,
                              },
                            )}
                            draggedCard={draggedCardDetails}
                            isDragActive={Boolean(draggedCard)}
                            isPreview={Boolean(
                              draggedCardDetails && isSnappedTo(position),
                            )}
                            key={positionKey(position)}
                            onClick={() => {
                              placeSelectedCard(position);
                            }}
                            onDragEnter={(event) => {
                              snapToPosition(event, position);
                            }}
                            onDragOver={allowDrop}
                            onDrop={(event) => {
                              dropCard(event, position);
                            }}
                            style={positionStyle(position)}
                          />
                        ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={gameBoardStyles.hand}>
          <CardHand
            activeOwner={activeOwner}
            cards={G.hands[handOwner]}
            touchDrag={touchDrag}
            interactive={isHumanTurn && !finished}
            isReturnTarget={
              draggedCard?.source === 'pending' &&
              G.pending?.owner === handOwner
            }
            onChoose={chooseCard}
            onDragEnd={finishDrag}
            onDragOver={allowDrop}
            onDragStart={(event, cardId) => {
              beginDrag(event, cardId, 'hand');
            }}
            onDrop={returnCardToHand}
            onShowDetails={showCardDetails}
            owner={handOwner}
            ownerName={handPlayer.name}
            playerType={handPlayer.type}
            pendingCardId={G.pending?.id}
            score={scores[handOwner] ?? 0}
            selectedCardId={selectedCardId}
          />
        </div>
      </section>

      {touchDrag.preview && draggedCardDetails?.type === 'event' && (
        <div
          className={clsx(cardStyles.card, cardStyles.touchDragPreview)}
          aria-hidden="true"
          data-card-type="event"
          data-event-category={draggedCardDetails.category}
          style={{ left: touchDrag.preview.x, top: touchDrag.preview.y }}
        >
          <CardEffects effects={draggedCardDetails.effects} />
          <strong>
            {intl.formatNumber(draggedCardDetails.number, {
              useGrouping: false,
            })}
          </strong>
          <CardEventName card={draggedCardDetails} />
          <span className={cardStyles.cardTypeName}>
            {intl.formatMessage(
              draggedCardDetails.category
                ? categoryMessages[draggedCardDetails.category]
                : startingEventNameMessage,
            )}
          </span>
        </div>
      )}
      <NewGameDialog
        dialogRef={newGameDialog}
        initialPlayers={players}
        onStart={startNewGame}
      />
      <CardCatalogDialog
        dialogRef={cardCatalogDialog}
        onShowDetails={showCardDetails}
      />
      <CardDetailsDialog
        card={detailsCard}
        onClose={() => {
          setDetailsCard(null);
        }}
      />
      <RoundScoresDialog dialogRef={roundScoresDialog} G={G} />
      <footer className={gameBoardStyles.footer}>
        {finished ? (
          <GameResults played={G.played} playerIds={G.playerIds} />
        ) : (
          <p
            className={clsx(manipulation && gameBoardStyles.manipulationPrompt)}
          >
            {manipulation
              ? !manipulationTargetId
                ? manipulationTargets.length
                  ? intl.formatMessage({
                      id: 'manipulation.choose',
                      defaultMessage:
                        'Choose an Event card on the board. The starting card cannot be targeted.',
                    })
                  : intl.formatMessage({
                      id: 'manipulation.noTargets',
                      defaultMessage:
                        'No legal targets for this card. Select another card or discard it.',
                    })
                : manipulation.action === 'time-jump'
                  ? intl.formatMessage({
                      id: 'manipulation.jumpDestination',
                      defaultMessage:
                        'Choose a highlighted empty position or removed Event to complete Time Jump.',
                    })
                  : intl.formatMessage({
                      id: 'manipulation.swapDestination',
                      defaultMessage:
                        'Choose a highlighted second Event card to complete Time Swap.',
                    })
              : G.pending
                ? intl.formatMessage({
                    id: 'status.pending',
                    defaultMessage:
                      'Drag it to another slot, back to your hand, or confirm.',
                  })
                : draggedCard
                  ? intl.formatMessage({
                      id: 'status.dragging',
                      defaultMessage:
                        'Drop the card on a highlighted position.',
                    })
                  : selectedCardId
                    ? intl.formatMessage({
                        id: 'status.selected',
                        defaultMessage:
                          'Choose a slot above, below, or beside a card.',
                      })
                    : activeOwner === '0'
                      ? intl.formatMessage(
                          {
                            id: 'status.yourTurn',
                            defaultMessage:
                              'Your turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}',
                          },
                          { count: G.deck.length },
                        )
                      : intl.formatMessage(
                          {
                            id: 'status.playerTurn',
                            defaultMessage:
                              "{name}'s turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}",
                          },
                          { name: activePlayer.name, count: G.deck.length },
                        )}
          </p>
        )}
      </footer>
    </main>
  );
}
