import { useContext, useRef, useState } from 'react';
import type {MessageValue} from "react-intl";
import { FormattedMessage, useIntl } from 'react-intl';

import type { CardGameState } from '../game';
import {
  currentGameLog,
  type GameLog,
  parseGameLog,
  replayGameLog,
} from '../gameLog';
import { GameLogContext } from '../gameLogContext';
import controlsStyles from './Controls.module.css';
import dialogStyles from './Dialog.module.css';
import gameLogControlsStyles from './GameLogControls.module.css';
import { GameLogView } from './GameLogView';

type Props = {
  G: CardGameState;
  currentPlayer: string;
  onOpen: () => void;
};

export function GameLogControls({ G, currentPlayer, onOpen }: Props) {
  const intl = useIntl();
  const { seed, loadLog } = useContext(GameLogContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState('');
  const [steps, setSteps] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'log' | 'import' | 'export'>('log');
  const [snapshot, setSnapshot] = useState<GameLog | null>(null);
  const open = () => {
    onOpen();
    setSnapshot(currentGameLog(seed, G, currentPlayer));
    setMode('log');
    setText('');
    setSteps('');
    setStatus('');
    dialog.current?.showModal();
  };
  const replay = () => {
    try {
      const log = parseGameLog(text);
      const count = steps.trim() === '' ? log.actions.length : Number(steps);
      const client = replayGameLog(log, count);

      client.stop();
      loadLog(log, count);
    } catch (error) {
      setStatus(
        intl.formatMessage<{ readonly "reason": MessageValue }>(
          { id: 'log.error', defaultMessage: 'Could not load log: {reason}' },
          {
            reason: error instanceof Error ? error.message : String(error),
          },
        ),
      );
    }
  };
  const copyLog = () => {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setStatus(
          intl.formatMessage({
            id: 'log.copied',
            defaultMessage: 'Log copied.',
          }),
        );
      })
      .catch(() => {
        setStatus(
          intl.formatMessage({
            id: 'log.copyFallback',
            defaultMessage:
              'Clipboard unavailable. Select and copy the text above.',
          }),
        );
      });
  };

  return (
    <>
      <button
        className={controlsStyles.historyButton}
        type="button"
        aria-label={intl.formatMessage({
          id: 'log.title',
          defaultMessage: 'Game Log',
        })}
        title={intl.formatMessage({
          id: 'log.title',
          defaultMessage: 'Game Log',
        })}
        data-icon-button
        onClick={open}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        className={dialogStyles.gameLogDialog}
        aria-labelledby="game-log-title"
      >
        <div className={dialogStyles.gameLogHeader}>
          <h2 id="game-log-title">
            <FormattedMessage id={('log.title')} defaultMessage={('Game Log')} />
          </h2>
          <button
            className={dialogStyles.gameLogClose}
            type="button"
            aria-label={intl.formatMessage({
              id: 'log.close',
              defaultMessage: 'Close',
            })}
            onClick={() => dialog.current?.close()}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p>
          <FormattedMessage id={('log.overview')} defaultMessage={('Card uses are listed in order. Undo removes a card use and redo restores it; neither is a log entry. Computers stay paused while you inspect the log.')} />
        </p>
        <div className={gameLogControlsStyles.gameLogActions}>
          <button
            type="button"
            aria-pressed={mode === 'import'}
            onClick={() => {
              setMode('import');
              setText('');
              setStatus('');
            }}
          >
            <FormattedMessage id={('log.import')} defaultMessage={('Import JSON')} />
          </button>
          <button
            type="button"
            aria-pressed={mode === 'export'}
            onClick={() => {
              setMode('export');
              setText(snapshot ? JSON.stringify(snapshot, null, 2) : '');
              setStatus('');
            }}
          >
            <FormattedMessage id={('log.export')} defaultMessage={('Export JSON')} />
          </button>
          {mode !== 'log' && (
            <button
              type="button"
              onClick={() => {
                setMode('log');
                setStatus('');
              }}
            >
              <FormattedMessage id={('log.back')} defaultMessage={('Back to log')} />
            </button>
          )}
        </div>
        {mode === 'log' && snapshot && <GameLogView log={snapshot} />}
        {mode !== 'log' && (
          <>
            <p>
              <FormattedMessage id={('log.help')} defaultMessage={('The JSON log includes the initial seed, player count, starting player, and current card uses. Undo/redo operations and draft movements are not exported. Paste a log to recreate the game. Leave the action count blank for the latest confirmed state, or use 0 for the initial deal. Computers stay paused until resumed. Replays require matching game rules and card definitions. Logs reveal all hands and the deck order.')} />
            </p>
            <label htmlFor="game-log-text">
              <FormattedMessage id={('log.text')} defaultMessage={('Game log JSON')} />
            </label>
            <textarea
              id="game-log-text"
              value={text}
              spellCheck={false}
              readOnly={mode === 'export'}
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
            {mode === 'import' && (
              <>
                <label htmlFor="game-log-steps">
                  <FormattedMessage id={('log.steps')} defaultMessage={('Replay first N actions (optional)')} />
                </label>
                <input
                  id="game-log-steps"
                  type="number"
                  min="0"
                  step="1"
                  value={steps}
                  placeholder={intl.formatMessage({
                    id: 'log.all',
                    defaultMessage: 'All actions',
                  })}
                  onChange={(event) => {
                    setSteps(event.target.value);
                  }}
                />
              </>
            )}
            <p role="status">{status}</p>
            <div className={gameLogControlsStyles.gameLogActions}>
              {mode === 'export' && (
                <button type="button" onClick={copyLog}>
                  <FormattedMessage id={('log.copy')} defaultMessage={('Copy log')} />
                </button>
              )}
              {mode === 'import' && (
                <button type="button" onClick={replay}>
                  <FormattedMessage id={('log.replay')} defaultMessage={('Load replay')} />
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
