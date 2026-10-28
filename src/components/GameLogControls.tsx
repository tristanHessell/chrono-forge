import { use, useRef, useState } from 'react';
import type { MessageValue } from 'react-intl';
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
  currentPlayer: string;
  G: CardGameState;
  onOpen: () => void;
};

export function GameLogControls({ currentPlayer, G, onOpen }: Props) {
  const intl = useIntl();
  const { loadLog, seed } = use(GameLogContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState('');
  const [steps, setSteps] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'export' | 'import' | 'log'>('log');
  const [snapshot, setSnapshot] = useState<GameLog | null>(null);
  const open = () => {
    onOpen();
    setSnapshot(currentGameLog(seed, G, currentPlayer));
    setMode('log');
    setText('');
    setSteps('');
    setStatus('');
    dialogRef.current?.showModal();
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
        intl.formatMessage<{ readonly reason: MessageValue }>(
          { defaultMessage: 'Could not load log: {reason}', id: 'log.error' },
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
            defaultMessage: 'Log copied.',
            id: 'log.copied',
          }),
        );
      })
      .catch(() => {
        setStatus(
          intl.formatMessage({
            defaultMessage:
              'Clipboard unavailable. Select and copy the text above.',
            id: 'log.copyFallback',
          }),
        );
      });
  };

  return (
    <>
      <button
        aria-label={intl.formatMessage({
          defaultMessage: 'Game Log',
          id: 'log.title',
        })}
        className={controlsStyles.historyButton}
        data-icon-button
        onClick={open}
        title={intl.formatMessage({
          defaultMessage: 'Game Log',
          id: 'log.title',
        })}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
        </svg>
      </button>
      <dialog
        aria-labelledby="game-log-title"
        className={dialogStyles.gameLogDialog}
        ref={dialogRef}
      >
        <div className={dialogStyles.gameLogHeader}>
          <h2 id="game-log-title">
            <FormattedMessage defaultMessage="Game Log" id="log.title" />
          </h2>
          <button
            aria-label={intl.formatMessage({
              defaultMessage: 'Close',
              id: 'log.close',
            })}
            className={dialogStyles.gameLogClose}
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p>
          <FormattedMessage
            defaultMessage="Card uses are listed in order. Undo removes a card use and redo restores it; neither is a log entry. Computers stay paused while you inspect the log."
            id="log.overview"
          />
        </p>
        <div className={gameLogControlsStyles.gameLogActions}>
          <button
            aria-pressed={mode === 'import'}
            onClick={() => {
              setMode('import');
              setText('');
              setStatus('');
            }}
            type="button"
          >
            <FormattedMessage defaultMessage="Import JSON" id="log.import" />
          </button>
          <button
            aria-pressed={mode === 'export'}
            onClick={() => {
              setMode('export');
              setText(snapshot ? JSON.stringify(snapshot, null, 2) : '');
              setStatus('');
            }}
            type="button"
          >
            <FormattedMessage defaultMessage="Export JSON" id="log.export" />
          </button>
          {mode !== 'log' && (
            <button
              onClick={() => {
                setMode('log');
                setStatus('');
              }}
              type="button"
            >
              <FormattedMessage defaultMessage="Back to log" id="log.back" />
            </button>
          )}
        </div>
        {mode === 'log' && snapshot && <GameLogView log={snapshot} />}
        {mode !== 'log' && (
          <>
            <p>
              <FormattedMessage
                defaultMessage="The JSON log includes the initial seed, player count, starting player, and current card uses. Undo/redo operations and draft movements are not exported. Paste a log to recreate the game. Leave the action count blank for the latest confirmed state, or use 0 for the initial deal. Computers stay paused until resumed. Replays require matching game rules and card definitions. Logs reveal all hands and the deck order."
                id="log.help"
              />
            </p>
            <label htmlFor="game-log-text">
              <FormattedMessage defaultMessage="Game log JSON" id="log.text" />
            </label>
            <textarea
              id="game-log-text"
              onChange={(event) => {
                setText(event.target.value);
              }}
              readOnly={mode === 'export'}
              spellCheck={false}
              value={text}
            />
            {mode === 'import' && (
              <>
                <label htmlFor="game-log-steps">
                  <FormattedMessage
                    defaultMessage="Replay first N actions (optional)"
                    id="log.steps"
                  />
                </label>
                <input
                  id="game-log-steps"
                  min="0"
                  onChange={(event) => {
                    setSteps(event.target.value);
                  }}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'All actions',
                    id: 'log.all',
                  })}
                  step="1"
                  type="number"
                  value={steps}
                />
              </>
            )}
            <p role="status">{status}</p>
            <div className={gameLogControlsStyles.gameLogActions}>
              {mode === 'export' && (
                <button onClick={copyLog} type="button">
                  <FormattedMessage defaultMessage="Copy log" id="log.copy" />
                </button>
              )}
              {mode === 'import' && (
                <button onClick={replay} type="button">
                  <FormattedMessage
                    defaultMessage="Load replay"
                    id="log.replay"
                  />
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
