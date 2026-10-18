import { useContext, useRef, useState } from 'react';

import type { CardGameState } from '../game';
import {
  currentGameLog,
  type GameLog,
  parseGameLog,
  replayGameLog,
} from '../gameLog';
import { GameLogContext } from '../gameLogContext';
import { useMessages } from '../i18n/useMessages';
import { GameLogView } from './GameLogView';

type Props = {
  G: CardGameState;
  currentPlayer: string;
  onOpen: () => void;
};

export function GameLogControls({ G, currentPlayer, onOpen }: Props) {
  const t = useMessages();
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
        t('log.error', {
          reason: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };

  return (
    <>
      <button className="history-button" type="button" onClick={open}>
        {t('log.title')}
      </button>
      <dialog
        ref={dialog}
        className="game-log-dialog"
        aria-labelledby="game-log-title"
      >
        <div className="game-log-header">
          <h2 id="game-log-title">{t('log.title')}</h2>
          <button
            className="game-log-close"
            type="button"
            aria-label={t('log.close')}
            onClick={() => dialog.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p>{t('log.overview')}</p>
        <div className="game-log-actions">
          <button
            type="button"
            aria-pressed={mode === 'import'}
            onClick={() => {
              setMode('import');
              setText('');
              setStatus('');
            }}
          >
            {t('log.import')}
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
            {t('log.export')}
          </button>
          {mode !== 'log' && (
            <button
              type="button"
              onClick={() => {
                setMode('log');
                setStatus('');
              }}
            >
              {t('log.back')}
            </button>
          )}
        </div>
        {mode === 'log' && snapshot && <GameLogView log={snapshot} />}
        {mode !== 'log' && (
          <>
            <p>{t('log.help')}</p>
            <label htmlFor="game-log-text">{t('log.text')}</label>
            <textarea
              id="game-log-text"
              value={text}
              spellCheck={false}
              readOnly={mode === 'export'}
              onChange={(event) => setText(event.target.value)}
            />
            {mode === 'import' && (
              <>
                <label htmlFor="game-log-steps">{t('log.steps')}</label>
                <input
                  id="game-log-steps"
                  type="number"
                  min="0"
                  step="1"
                  value={steps}
                  placeholder={t('log.all')}
                  onChange={(event) => setSteps(event.target.value)}
                />
              </>
            )}
            <p role="status">{status}</p>
            <div className="game-log-actions">
              {mode === 'export' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(text);
                      setStatus(t('log.copied'));
                    } catch {
                      setStatus(t('log.copyFallback'));
                    }
                  }}
                >
                  {t('log.copy')}
                </button>
              )}
              {mode === 'import' && (
                <button type="button" onClick={replay}>
                  {t('log.replay')}
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
