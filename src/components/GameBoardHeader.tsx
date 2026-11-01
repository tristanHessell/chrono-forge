import clsx from 'clsx';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { canUndoMove, type CardGameState, type PlayerId } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import type { PlayerSetup } from '../playerSetup';
import controlsStyles from './Controls.module.css';
import { GameMenu } from './GameMenu';
import ownershipStyles from './Ownership.module.css';

type GameBoardHeaderProps = {
  activeOwner: PlayerId;
  activePlayer: PlayerSetup;
  computerPaused: boolean;
  finished: boolean;
  G: CardGameState;
  onNewGame: () => void;
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
  onRedo: () => void;
  onResumeComputer: () => void;
  onUndo: () => void;
};

export function GameBoardHeader({
  activeOwner,
  activePlayer,
  computerPaused,
  finished,
  G,
  onNewGame,
  onOpenCatalog,
  onOpenSettings,
  onRedo,
  onResumeComputer,
  onUndo,
}: GameBoardHeaderProps) {
  const intl = useIntl();

  return (
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
            onClick={onUndo}
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
            onClick={onRedo}
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
            onClick={onResumeComputer}
            type="button"
          >
            <FormattedMessage
              defaultMessage="Resume computer"
              id="computer.resume"
            />
          </button>
        )}
        <GameMenu
          onNewGame={onNewGame}
          onOpenCatalog={onOpenCatalog}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
}
