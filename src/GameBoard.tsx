import type { BoardProps } from 'boardgame.io/react';
import clsx from 'clsx';
import { use, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  applyCommand,
  applyTimeSwap,
  getTimeJumpPositions,
} from './commandRules';
import cardStyles from './components/Card.module.css';
import { CardCatalogDialog } from './components/CardCatalogDialog';
import { CardDetailsDialog } from './components/CardDetailsDialog';
import { CardEffects } from './components/CardEffect';
import { CardEventName } from './components/CardEventName';
import { CardHand } from './components/CardHand';
import controlsStyles from './components/Controls.module.css';
import { GameBoardFooter } from './components/GameBoardFooter';
import { GameBoardHeader } from './components/GameBoardHeader';
import { GameBoardPlayers } from './components/GameBoardPlayers';
import { GameLogControls } from './components/GameLogControls';
import { NewGameDialog } from './components/NewGameDialog';
import { PlayedBoard } from './components/PlayedBoard';
import { RoundScoresDialog } from './components/RoundScoresDialog';
import { SettingsDialog } from './components/SettingsDialog';
import {
  canUndoMove,
  type Card,
  type CardGameState,
  type CardPosition,
  getAvailablePositions,
  type PlayerId,
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
import { useBoardViewport } from './useBoardViewport';
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
  const [commandMode, setCommandMode] = useState<'replace' | 'restore' | null>(
    null,
  );
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [snapPosition, setSnapPosition] = useState<CardPosition | null>(null);
  const cardCatalogDialogRef = useRef<HTMLDialogElement>(null);
  const newGameDialogRef = useRef<HTMLDialogElement>(null);
  const roundScoresDialogRef = useRef<HTMLDialogElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
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
            : command.action === 'event-reclaim'
              ? commandMode === 'restore'
                ? Boolean(
                    card.removed &&
                    applyCommand(
                      G.played,
                      command.action,
                      card.id,
                      activeOwner,
                    ),
                  )
                : commandMode === 'replace' &&
                  G.hands[activeOwner].some(
                    (replacement) =>
                      replacement.type === 'event' &&
                      Boolean(
                        applyCommand(
                          G.played,
                          command.action,
                          card.id,
                          activeOwner,
                          replacement.id,
                          replacement,
                        ),
                      ),
                  )
              : command.action === 'take-control' ||
                  command.action === 'remove-event'
                ? Boolean(
                    applyCommand(
                      G.played,
                      command.action,
                      card.id,
                      activeOwner,
                    ),
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

  const showPlacementSlots =
    !finished && Boolean(selectedCardId || draggedCard);
  // Reserve slot space even when hidden so selecting a card doesn't shift the board.
  const chooseCard = (cardId: string) => {
    const chosenCard = G.hands[activeOwner].find((card) => card.id === cardId);

    if (command?.action === 'event-reclaim' && chosenCard?.type === 'event') {
      if (
        commandMode === 'replace' &&
        commandTargetId &&
        applyCommand(
          G.played,
          command.action,
          commandTargetId,
          activeOwner,
          chosenCard.id,
          chosenCard,
        )
      ) {
        gameMoves.command(command.id, commandTargetId, chosenCard.id);
        setSelectedCardId(null);
        setCommandTargetId(null);
        setCommandMode(null);
      }

      return;
    }

    setCommandTargetId(null);

    if (chosenCard?.type === 'command') {
      if (G.pending) {
        gameMoves.returnPendingCard();
      }

      setCommandMode(null);
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
      rememberJumpDestination(position);
      gameMoves.command(command.id, commandTargetId, position);
      setSelectedCardId(null);
      setCommandTargetId(null);
      setCommandMode(null);

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
    setCommandMode(null);
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
      command.action === 'remove-event' ||
      (command.action === 'event-reclaim' && commandMode === 'restore')
    ) {
      gameMoves.command(command.id, targetId);
      setSelectedCardId(null);
      setCommandTargetId(null);
      setCommandMode(null);
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
      setCommandMode(null);
    },
  });
  const {
    adjustBoardZoom,
    boardViewportRef,
    boardZoom,
    fitBoardToViewport,
    isPanning,
    panBoard,
    rememberJumpDestination,
    resetBoardZoom,
    startBoardPan,
    stopBoardPan,
  } = useBoardViewport({
    choosingJumpDestination,
    onCancelTouchDrag: () => {
      touchDrag.controller.cancel();
    },
    played: G.played,
  });

  const discardCard = (cardId: string) => {
    gameMoves.discardCard(cardId);
    finishDrag();
    setSelectedCardId(null);
    setCommandTargetId(null);
    setCommandMode(null);
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
    setCommandTargetId(null);
    setCommandMode(null);
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
          setCommandMode(null);
          touchDrag.controller.cancel();
          finishDrag();
        }
      }}
      onPointerDownCapture={() => {
        touchDrag.controller.resetClickSuppression();
      }}
    >
      <GameBoardHeader
        activePlayer={activePlayer}
        computerPaused={computerPaused}
        finished={finished}
        onNewGame={requestNewGame}
        onOpenCatalog={() => {
          setComputerPaused(true);
          touchDrag.controller.cancel();
          finishDrag();
          setSelectedCardId(null);
          setCommandTargetId(null);
          setCommandMode(null);
          cardCatalogDialogRef.current?.showModal();
        }}
        onOpenSettings={() => settingsDialogRef.current?.showModal()}
        onResumeComputer={() => {
          setComputerPaused(false);
        }}
      />

      <section
        aria-label={intl.formatMessage({
          defaultMessage: 'Card table',
          id: 'table.label',
        })}
        className={gameBoardStyles.table}
      >
        <GameBoardPlayers
          actionsThisTurn={G.actionsThisTurn}
          activeOwner={activeOwner}
          cards={G.hands}
          draggedPendingCard={draggedCard?.source === 'pending'}
          finished={finished}
          handOwner={handOwner}
          handPlayer={handPlayer}
          onChooseCard={chooseCard}
          onDragEnd={finishDrag}
          onDragOver={allowDrop}
          onDragStart={(event, cardId) => {
            beginDrag(event, cardId, 'hand');
          }}
          onDrop={returnCardToHand}
          onShowDetails={showCardDetails}
          pendingCardId={G.pending?.id}
          pendingOwner={G.pending?.owner}
          playerIds={G.playerIds}
          players={players}
          scores={scores}
          selectedCardId={selectedCardId}
        />

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
                  setCommandMode(null);
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
          </div>
          <PlayedBoard
            activeOwner={activeOwner}
            availablePositions={availablePositions}
            boardViewportRef={boardViewportRef}
            boardZoom={boardZoom}
            command={command}
            commandTargetId={commandTargetId}
            commandTargets={commandTargets}
            draggedCardDetails={draggedCardDetails}
            draggedCardSource={draggedCard?.source ?? null}
            finished={finished}
            G={G}
            isDragActive={Boolean(draggedCard)}
            isHumanTurn={isHumanTurn}
            isPanning={isPanning}
            onAllowCommandDrop={allowCommandDrop}
            onAllowDrop={allowDrop}
            onBeginDrag={beginDrag}
            onConfirmPlacement={() => {
              gameMoves.confirmPlacement();
            }}
            onDragEnd={finishDrag}
            onDropCard={dropCard}
            onDropCommandOnTarget={dropCommandOnTarget}
            onDropPendingCard={dropOnPendingCard}
            onFitAll={fitBoardToViewport}
            onPanBoard={panBoard}
            onPlaceSelectedCard={placeSelectedCard}
            onResetZoom={resetBoardZoom}
            onShowDetails={showCardDetails}
            onSnapToPosition={snapToPosition}
            onStartBoardPan={startBoardPan}
            onStopBoardPan={stopBoardPan}
            onTargetCard={(card) => {
              if (commandTargetId === card.id) {
                setCommandTargetId(null);

                return;
              }
              if (
                command?.action === 'event-reclaim' &&
                commandMode === 'restore'
              ) {
                gameMoves.command(command.id, card.id);
                setSelectedCardId(null);
                setCommandTargetId(null);
                setCommandMode(null);

                return;
              }
              if (
                command?.action === 'take-control' ||
                command?.action === 'remove-event'
              ) {
                gameMoves.command(command.id, card.id);
                setSelectedCardId(null);
                setCommandTargetId(null);
                setCommandMode(null);

                return;
              }
              if (command?.action === 'time-swap' && commandTargetId) {
                gameMoves.command(command.id, commandTargetId, card.id);
                setSelectedCardId(null);
                setCommandTargetId(null);
                setCommandMode(null);
              } else {
                setCommandTargetId(card.id);
              }
            }}
            onZoomChange={adjustBoardZoom}
            players={players}
            showPlacementSlots={showPlacementSlots}
            snapPosition={snapPosition}
            touchDrag={touchDrag}
          />
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
            showAvatar={false}
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
      <SettingsDialog dialogRef={settingsDialogRef} />
      <GameBoardFooter
        activeOwner={activeOwner}
        activePlayer={activePlayer}
        commandAction={command?.action}
        commandMode={commandMode}
        commandTargetCount={commandTargets.length}
        commandTargetId={commandTargetId}
        deckCount={G.deck.length}
        draggedCard={Boolean(draggedCard)}
        finished={finished}
        onChooseCommandMode={(mode) => {
          setCommandMode(mode);
          setCommandTargetId(null);
        }}
        pending={Boolean(G.pending)}
        played={G.played}
        playerIds={G.playerIds}
        selectedCardId={selectedCardId}
      />
    </main>
  );
}
