import type { BoardProps } from 'boardgame.io/react';
import clsx from 'clsx';
import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  changeBoardZoom,
  changeBoardZoomByPinch,
  fitBoardZoom,
  listenForBoardWheel,
} from './boardZoom';
import {
  applyCommand,
  applyTimeSwap,
  getTimeJumpPositions,
} from './commandRules';
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
  command: (
    cardId: string,
    targetId: string,
    destination?: CardPosition | string,
  ) => void;
  confirmPlacement: () => void;
  discardCard: (cardId: string) => void;
  movePendingCard: (position: CardPosition) => void;
  playCard: (cardId: string, position: CardPosition) => void;
  redoTest: () => void;
  replacePendingCard: (cardId: string, position?: CardPosition) => void;
  returnPendingCard: () => void;
  undoTest: () => void;
};

type DraggedCard = {
  cardId: string;
  source: 'hand' | 'pending';
};

const linkDirections = [
  {
    className: playedCardStyles.linkTop,
    column: 0,
    inward: '↓',
    outward: '↑',
    row: -1,
  },
  {
    className: playedCardStyles.linkLeft,
    column: -1,
    inward: '→',
    outward: '←',
    row: 0,
  },
  {
    className: playedCardStyles.linkRight,
    column: 1,
    inward: '←',
    outward: '→',
    row: 0,
  },
  {
    className: playedCardStyles.linkBottom,
    column: 0,
    inward: '↑',
    outward: '↓',
    row: 1,
  },
] as const;

function setCardDragImage(event: React.DragEvent<HTMLElement>) {
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

export function GameBoard({ ctx, G, moves }: BoardProps<CardGameState>) {
  const intl = useIntl();
  const gameMoves = moves as CardGameMoves;
  const finished = Boolean(ctx.gameover) || G.roundOver;
  const activeOwner = ctx.currentPlayer as PlayerId;
  const players = use(PlayerSetupContext);
  const activePlayer = getPlayer(players, activeOwner);
  const isHumanTurn = activePlayer.type === 'human';
  const handOwner = isHumanTurn ? activeOwner : '0';
  const handPlayer = getPlayer(players, handOwner);
  const scores = calculateScores(G.played);
  const { newGame, replayPaused } = use(GameLogContext);
  const [computerPaused, setComputerPaused] = useState(replayPaused);

  useComputerOpponent(
    G,
    ctx.currentPlayer,
    players,
    computerPaused || finished,
    gameMoves,
  );

  const [selectedCardId, setSelectedCardId] = useState<null | string>(null);
  const [detailsCard, setDetailsCard] = useState<Card | null>(null);
  const [commandTargetId, setCommandTargetId] = useState<null | string>(null);
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [snapPosition, setSnapPosition] = useState<CardPosition | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const cardCatalogDialogRef = useRef<HTMLDialogElement>(null);
  const newGameDialogRef = useRef<HTMLDialogElement>(null);
  const roundScoresDialogRef = useRef<HTMLDialogElement>(null);
  const lastJumpDestinationRef = useRef<CardPosition | null>(null);
  const panStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<null | number>(null);
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
  const command =
    placementCard?.type === 'command' && isHumanTurn && !finished && !G.pending
      ? placementCard
      : null;
  const commandTargets = command
    ? G.played.filter(
        (card) =>
          card.owner !== 'neutral' &&
          (command.action === 'time-jump'
            ? getTimeJumpPositions(G.played, card.id).length > 0
            : command.action === 'take-control' ||
                command.action === 'remove-event'
              ? Boolean(
                  applyCommand(G.played, command.action, card.id, activeOwner),
                )
              : commandTargetId
                ? Boolean(applyTimeSwap(G.played, commandTargetId, card.id))
                : G.played.some((other) =>
                    applyTimeSwap(G.played, card.id, other.id),
                  )),
      )
    : [];
  const availablePositions = command
    ? command.action === 'time-jump' && commandTargetId
      ? getTimeJumpPositions(G.played, commandTargetId)
      : []
    : getAvailablePositions(G.played, placementCard ?? undefined);
  const choosingJumpDestination = Boolean(
    command?.action === 'time-jump' && commandTargetId,
  );

  useLayoutEffect(() => {
    const viewport = boardViewportRef.current;
    const position = lastJumpDestinationRef.current;

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

    lastJumpDestinationRef.current = null;
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
    setCommandTargetId(null);

    if (
      G.hands[activeOwner].find((card) => card.id === cardId)?.type ===
      'command'
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
      gameMoves.playCard(cardId, { column: 0, row: 0 });

      return;
    }

    setSelectedCardId((current) => (current === cardId ? null : cardId));
  };

  const placeSelectedCard = (position: CardPosition) => {
    if (command && commandTargetId) {
      lastJumpDestinationRef.current = position;
      gameMoves.command(command.id, commandTargetId, position);
      setSelectedCardId(null);
      setCommandTargetId(null);

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
    event: React.DragEvent<HTMLElement>,
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
    setCommandTargetId(null);
  };

  const readDraggedCard = (event: React.DragEvent<HTMLElement>) => {
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

  const dropCard = (
    event: React.DragEvent<HTMLElement>,
    position: CardPosition,
  ) => {
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

  const allowDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const allowCommandDrop = (
    event: React.DragEvent<HTMLElement>,
    targetId: string,
  ) => {
    const droppedCard = readDraggedCard(event);

    if (
      command &&
      droppedCard?.source === 'hand' &&
      droppedCard.cardId === command.id &&
      commandTargets.some((target) => target.id === targetId)
    ) {
      allowDrop(event);
    }
  };

  const dropCommandOnTarget = (
    event: React.DragEvent<HTMLElement>,
    targetId: string,
  ) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (
      !command ||
      droppedCard?.source !== 'hand' ||
      droppedCard.cardId !== command.id ||
      !commandTargets.some((target) => target.id === targetId)
    ) {
      return;
    }
    if (
      command.action === 'take-control' ||
      command.action === 'remove-event'
    ) {
      gameMoves.command(command.id, targetId);
      setSelectedCardId(null);
      setCommandTargetId(null);
    } else {
      setSelectedCardId(command.id);
      setCommandTargetId(targetId);
    }

    setDraggedCard(null);
    setSnapPosition(null);
  };

  const snapToPosition = (
    event: React.DragEvent<HTMLElement>,
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
    onMove: (point) => {
      setSnapPosition(
        draggedCard
          ? touchPosition(point, draggedCard.cardId, draggedCard.source)
          : null,
      );
    },
    onStart: (cardId, source) => {
      setDraggedCard({ cardId, source });
      setSelectedCardId(cardId);
      setCommandTargetId(null);
    },
  });

  const discardCard = (cardId: string) => {
    gameMoves.discardCard(cardId);
    finishDrag();
    setSelectedCardId(null);
  };

  const dropOnDiscard = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();

    const droppedCard = readDraggedCard(event);

    if (droppedCard && !finished) {
      discardCard(droppedCard.cardId);
    }
  };

  const dropOnPendingCard = (event: React.DragEvent<HTMLElement>) => {
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

  const returnCardToHand = (event: React.DragEvent<HTMLElement>) => {
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

  const requestNewGame = () => {
    if (
      window.confirm(
        intl.formatMessage({
          defaultMessage: 'Your current game will be lost. Start a new game?',
          id: 'newGame.confirmCurrent',
        }),
      )
    ) {
      newGameDialogRef.current?.showModal();
    }
  };

  const adjustBoardZoom = useCallback((change: number) => {
    setBoardZoom((current) => changeBoardZoom(current, change));
  }, []);

  const fitBoardToViewport = useCallback(() => {
    const viewport = boardViewportRef.current;
    const grid = viewport?.querySelector<HTMLElement>('[data-board-grid]');

    if (!viewport || !grid) {
      return;
    }

    const gridBounds = grid.getBoundingClientRect();
    const viewportStyles = getComputedStyle(viewport);
    const availableWidth =
      viewport.clientWidth -
      parseFloat(viewportStyles.paddingLeft) -
      parseFloat(viewportStyles.paddingRight);
    const availableHeight =
      viewport.clientHeight -
      parseFloat(viewportStyles.paddingTop) -
      parseFloat(viewportStyles.paddingBottom);

    setBoardZoom((current) =>
      fitBoardZoom(
        current,
        gridBounds.width,
        gridBounds.height,
        availableWidth,
        availableHeight,
      ),
    );
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, []);

  useEffect(() => {
    const viewport = boardViewportRef.current;

    if (!viewport) {
      return;
    }

    return listenForBoardWheel(viewport, adjustBoardZoom);
  }, [adjustBoardZoom]);

  const startBoardPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (touchPointsRef.current.size === 2) {
        const [first, second] = [...touchPointsRef.current.values()];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);

        pinchDistanceRef.current = distance || null;
        touchDrag.controller.cancel();
        setIsPanning(false);

        return;
      }
      if (touchPointsRef.current.size > 2) {
        pinchDistanceRef.current = null;
        setIsPanning(false);

        return;
      }
    }

    if (
      event.button !== 0 ||
      pinchDistanceRef.current ||
      (event.target as Element).closest(
        '[data-card-type], [data-placement-slot]',
      )
    ) {
      return;
    }

    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const panBoard = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      const touchPoint = touchPointsRef.current.get(event.pointerId);

      if (touchPoint) {
        touchPoint.x = event.clientX;
        touchPoint.y = event.clientY;

        if (pinchDistanceRef.current && touchPointsRef.current.size === 2) {
          const [first, second] = [...touchPointsRef.current.values()];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const previousDistance = pinchDistanceRef.current;

          pinchDistanceRef.current = distance;
          setBoardZoom((current) =>
            changeBoardZoomByPinch(current, previousDistance, distance),
          );

          return;
        }
      }
      if (pinchDistanceRef.current) {
        return;
      }
    }

    if (!isPanning) {
      return;
    }

    event.currentTarget.scrollLeft =
      panStartRef.current.scrollLeft -
      (event.clientX - panStartRef.current.pointerX);
    event.currentTarget.scrollTop =
      panStartRef.current.scrollTop -
      (event.clientY - panStartRef.current.pointerY);
  };

  const stopBoardPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.delete(event.pointerId);

      if (touchPointsRef.current.size < 2) {
        pinchDistanceRef.current = null;
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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- element interactions are a catch all here, rather than it being a truly interactive element.
    <main
      className={gameBoardStyles.gameShell}
      data-touch-dragging={Boolean(touchDrag.preview)}
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
          command &&
          !(event.target as Element).closest('dialog[open]')
        ) {
          event.preventDefault();
          setSelectedCardId(null);
          setCommandTargetId(null);
          touchDrag.controller.cancel();
          finishDrag();
        }
      }}
      onPointerDownCapture={() => {
        touchDrag.controller.resetClickSuppression();
      }}
    >
      <header className={gameBoardStyles.header}>
        <div className={gameBoardStyles.topActions}>
          <div className={gameBoardStyles.gameBrand}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m12 2 9 5v10l-9 5-9-5V7z" />
            </svg>
            <div>
              <FormattedMessage defaultMessage="Chrono-Forge" id="brand.name" />
              <small>
                <FormattedMessage
                  defaultMessage="Tactical card system"
                  id="brand.tagline"
                />
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
                  defaultMessage: 'Game over',
                  id: 'game.over',
                })
              : activePlayer.type === 'computer'
                ? intl.formatMessage(
                    computerPaused
                      ? {
                          defaultMessage: 'Computer paused',
                          id: 'computer.paused',
                        }
                      : {
                          defaultMessage: '{name} is thinking…',
                          id: 'computer.thinking',
                        },
                    { name: activePlayer.name },
                  )
                : activeOwner === '0'
                  ? intl.formatMessage({
                      defaultMessage: 'Your turn',
                      id: 'turn.you',
                    })
                  : intl.formatMessage<{ readonly name: MessageValue }>(
                      { defaultMessage: "{name}'s turn", id: 'turn.player' },
                      { name: activePlayer.name },
                    )}
            {!finished && (
              <small>
                <FormattedMessage
                  defaultMessage="{count, number} / 2"
                  id="turn.action"
                  values={{ count: G.actionsThisTurn + 1 }}
                />
              </small>
            )}
          </p>
          <div
            aria-label={intl.formatMessage({
              defaultMessage: 'Move history controls',
              id: 'history.label',
            })}
            className={gameBoardStyles.historyControls}
          >
            <button
              aria-label={intl.formatMessage({
                defaultMessage: 'Undo your last move',
                id: 'history.undoLabel',
              })}
              className={controlsStyles.historyButton}
              data-icon-button
              disabled={!canUndoMove(G)}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.undoTest();
              }}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13" />
              </svg>
            </button>
            <button
              aria-label={intl.formatMessage({
                defaultMessage: 'Redo last action',
                id: 'history.redoLabel',
              })}
              className={controlsStyles.historyButton}
              data-icon-button
              disabled={G.testFuture.length === 0}
              onClick={() => {
                setComputerPaused(true);
                finishDrag();
                setSelectedCardId(null);
                gameMoves.redoTest();
              }}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13" />
              </svg>
            </button>
          </div>
          {computerPaused && !finished && activePlayer.type === 'computer' && (
            <button
              className={controlsStyles.historyButton}
              onClick={() => {
                setComputerPaused(false);
              }}
              type="button"
            >
              <FormattedMessage
                defaultMessage="Resume computer"
                id="computer.resume"
              />
            </button>
          )}
          <GameMenu
            onNewGame={requestNewGame}
            onOpenCatalog={() => {
              setComputerPaused(true);
              touchDrag.controller.cancel();
              finishDrag();
              setSelectedCardId(null);
              setCommandTargetId(null);
              cardCatalogDialogRef.current?.showModal();
            }}
          />
        </div>
      </header>

      <section
        aria-label={intl.formatMessage({
          defaultMessage: 'Card table',
          id: 'table.label',
        })}
        className={gameBoardStyles.table}
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
                    pendingCardId={G.pending?.id}
                    playerType={player.type}
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
                aria-label={intl.formatMessage<{
                  // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                  readonly count: number | bigint;
                }>(
                  {
                    defaultMessage:
                      '{count, plural, one {# card remaining in the deck} other {# cards remaining in the deck}}',
                    id: 'deck.label',
                  },
                  { count: G.deck.length },
                )}
                className={gameBoardStyles.deckDisplay}
                role="status"
              >
                <div
                  aria-label={intl.formatMessage<{
                    // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                    readonly count: number | bigint;
                  }>(
                    {
                      defaultMessage: '{count, number} cards in deck',
                      id: 'deck.remaining',
                    },
                    { count: G.deck.length },
                  )}
                  className={gameBoardStyles.deckCardBack}
                >
                  <strong aria-hidden="true">
                    {intl.formatNumber(G.deck.length)}
                  </strong>
                </div>
              </div>
              <button
                aria-label={intl.formatMessage<{
                  // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                  readonly count: number | bigint;
                }>(
                  {
                    defaultMessage:
                      'Discard pile: {count, plural, one {# card} other {# cards}}. Drop a card here or click to discard your selected card. This uses one of your two actions.',
                    id: 'discard.label',
                  },
                  { count: G.discarded.length },
                )}
                className={clsx(gameBoardStyles.discardPile, {
                  [gameBoardStyles.discardReady]: draggedCard && !finished,
                })}
                data-discard-pile
                disabled={
                  finished ||
                  !isHumanTurn ||
                  !(draggedCard || selectedCardId || G.pending)
                }
                onClick={() => {
                  const cardId = selectedCardId ?? G.pending?.id;

                  if (cardId) {
                    discardCard(cardId);
                  }
                }}
                onDragEnter={allowDrop}
                onDragOver={allowDrop}
                onDrop={dropOnDiscard}
                title={intl.formatMessage({
                  defaultMessage:
                    'Drag a card here, or select a card and click here. Discarding uses one of your two actions.',
                  id: 'discard.hint',
                })}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 3v14m-6-6 6 6 6-6M5 21h14" />
                </svg>
                <span>
                  <FormattedMessage
                    defaultMessage="Discard"
                    id="discard.title"
                  />
                  <small>
                    <FormattedMessage
                      defaultMessage="{count, number} discarded"
                      id="discard.count"
                      values={{ count: G.discarded.length }}
                    />
                  </small>
                </span>
              </button>
              <GameLogControls
                currentPlayer={ctx.currentPlayer}
                G={G}
                onOpen={() => {
                  setComputerPaused(true);
                  finishDrag();
                  setSelectedCardId(null);
                  setCommandTargetId(null);
                }}
              />
              <button
                aria-label={intl.formatMessage({
                  defaultMessage: 'Round scores',
                  id: 'roundScores.title',
                })}
                className={controlsStyles.historyButton}
                data-icon-button
                onClick={() => {
                  setComputerPaused(true);
                  touchDrag.controller.cancel();
                  finishDrag();
                  setSelectedCardId(null);
                  setCommandTargetId(null);
                  roundScoresDialogRef.current?.showModal();
                }}
                title={intl.formatMessage({
                  defaultMessage: 'Round scores',
                  id: 'roundScores.title',
                })}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 20h16M6 16v-5h4v5m2 0V5h4v11m2 0V9h4v7" />
                </svg>
              </button>
            </div>
            <span className={gameBoardStyles.playerScore} data-player-score>
              <FormattedMessage
                defaultMessage="{count, plural, one {# point} other {# points}}"
                id="score.points"
                values={{ count: scores[handOwner] ?? 0 }}
              />
            </span>
          </div>
          <div className={gameBoardStyles.boardSurface}>
            <BoardZoomControls
              boardZoom={boardZoom}
              onFitAll={fitBoardToViewport}
              onResetZoom={() => {
                setBoardZoom(1);
              }}
              onZoomChange={adjustBoardZoom}
            />
            <div
              aria-label={intl.formatMessage({
                defaultMessage: 'Pannable and zoomable played-card board',
                id: 'board.label',
              })}
              className={clsx(gameBoardStyles.playedViewport, {
                [gameBoardStyles.isPanning]: isPanning,
              })}
              onPointerCancel={stopBoardPan}
              onPointerDown={startBoardPan}
              onPointerMove={panBoard}
              onPointerUp={stopBoardPan}
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
                    isDragActive={Boolean(draggedCard)}
                    isPreview={Boolean(
                      draggedCardDetails && isSnappedTo({ column: 0, row: 0 }),
                    )}
                    onClick={() => {
                      placeSelectedCard({ column: 0, row: 0 });
                    }}
                    onDragEnter={(event) => {
                      snapToPosition(event, { column: 0, row: 0 });
                    }}
                    onDragOver={allowDrop}
                    onDrop={(event) => {
                      dropCard(event, { column: 0, row: 0 });
                    }}
                    position={{ column: 0, row: 0 }}
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
                          card={card}
                          isLatest={
                            card.owner !== 'neutral' &&
                            card.id === G.played.at(-1)?.id
                          }
                          key={card.id}
                          links={renderLinkDirections(card)}
                          onDragOver={(event) => {
                            allowCommandDrop(event, card.id);
                          }}
                          onDrop={(event) => {
                            dropCommandOnTarget(event, card.id);
                          }}
                          onShowDetails={showCardDetails}
                          onTarget={
                            (command && commandTargetId === card.id) ||
                            commandTargets.some(
                              (target) => target.id === card.id,
                            )
                              ? () => {
                                  if (commandTargetId === card.id) {
                                    setCommandTargetId(null);

                                    return;
                                  }
                                  if (
                                    command?.action === 'take-control' ||
                                    command?.action === 'remove-event'
                                  ) {
                                    gameMoves.command(command.id, card.id);
                                    setSelectedCardId(null);
                                    setCommandTargetId(null);

                                    return;
                                  }
                                  if (
                                    command?.action === 'time-swap' &&
                                    commandTargetId
                                  ) {
                                    gameMoves.command(
                                      command.id,
                                      commandTargetId,
                                      card.id,
                                    );
                                    setSelectedCardId(null);
                                    setCommandTargetId(null);
                                  } else {
                                    setCommandTargetId(card.id);
                                  }
                                }
                              : undefined
                          }
                          selected={Boolean(
                            command && commandTargetId === card.id,
                          )}
                          style={positionStyle(card)}
                        />
                      ))}
                    {G.pending && (
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- TODO improve roles for these cards
                      <div
                        aria-label={intl.formatMessage({
                          defaultMessage:
                            'Unconfirmed card replacement position',
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
                            showCardDetails(displayedPendingCard);
                          }
                        }}
                        onDragEnd={finishDrag}
                        onDragEnter={(event) => {
                          snapToPosition(event, G.pending!);
                        }}
                        onDragOver={allowDrop}
                        onDragStart={(event) => {
                          beginDrag(event, G.pending!.id, 'pending');
                        }}
                        onDrop={dropOnPendingCard}
                        onLostPointerCapture={touchDrag.onLostPointerCapture}
                        onPointerCancel={touchDrag.onPointerCancel}
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
                          className={cardStyles.cardTypeName}
                          data-card-label
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
                                defaultMessage: 'Start',
                                id: 'owner.neutral',
                              })
                            : getPlayer(
                                players,
                                displayedPendingOwner ?? activeOwner,
                              ).name}
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
                            gameMoves.confirmPlacement();
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
                            overwrite={G.played.some(
                              (card) =>
                                card.removed &&
                                positionKey(card) === positionKey(position),
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
        </div>
        <div className={gameBoardStyles.hand}>
          <CardHand
            activeOwner={activeOwner}
            cards={G.hands[handOwner]}
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
            pendingCardId={G.pending?.id}
            playerType={handPlayer.type}
            selectedCardId={selectedCardId}
            touchDrag={touchDrag}
          />
        </div>
      </section>

      {touchDrag.preview && draggedCardDetails?.type === 'event' && (
        <div
          aria-hidden="true"
          className={clsx(cardStyles.card, cardStyles.touchDragPreview)}
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
        dialogRef={newGameDialogRef}
        initialPlayers={players}
        onStart={startNewGame}
      />
      <CardCatalogDialog
        dialogRef={cardCatalogDialogRef}
        onShowDetails={showCardDetails}
      />
      <CardDetailsDialog
        card={detailsCard}
        onClose={() => {
          setDetailsCard(null);
        }}
      />
      <RoundScoresDialog dialogRef={roundScoresDialogRef} G={G} />
      <footer className={gameBoardStyles.footer}>
        {finished ? (
          <GameResults played={G.played} playerIds={G.playerIds} />
        ) : (
          <p className={clsx(command && gameBoardStyles.commandPrompt)}>
            {command
              ? !commandTargetId
                ? commandTargets.length
                  ? intl.formatMessage({
                      defaultMessage:
                        'Choose an Event card on the board. The starting card cannot be targeted.',
                      id: 'command.choose',
                    })
                  : intl.formatMessage({
                      defaultMessage:
                        'No legal targets for this card. Select another card or discard it.',
                      id: 'command.noTargets',
                    })
                : command.action === 'time-jump'
                  ? intl.formatMessage({
                      defaultMessage:
                        'Choose a highlighted empty position or removed Event to complete Time Jump.',
                      id: 'command.jumpDestination',
                    })
                  : intl.formatMessage({
                      defaultMessage:
                        'Choose a highlighted second Event card to complete Time Swap.',
                      id: 'command.swapDestination',
                    })
              : G.pending
                ? intl.formatMessage({
                    defaultMessage:
                      'Drag it to another slot, back to your hand, or confirm.',
                    id: 'status.pending',
                  })
                : draggedCard
                  ? intl.formatMessage({
                      defaultMessage:
                        'Drop the card on a highlighted position.',
                      id: 'status.dragging',
                    })
                  : selectedCardId
                    ? intl.formatMessage({
                        defaultMessage:
                          'Choose a slot above, below, or beside a card.',
                        id: 'status.selected',
                      })
                    : activeOwner === '0'
                      ? // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                        intl.formatMessage<{ readonly count: number | bigint }>(
                          {
                            defaultMessage:
                              'Your turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}',
                            id: 'status.yourTurn',
                          },
                          { count: G.deck.length },
                        )
                      : intl.formatMessage<{
                          // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                          readonly count: number | bigint;
                          readonly name: MessageValue;
                        }>(
                          {
                            defaultMessage:
                              "{name}'s turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}",
                            id: 'status.playerTurn',
                          },
                          { count: G.deck.length, name: activePlayer.name },
                        )}
          </p>
        )}
      </footer>
    </main>
  );
}
