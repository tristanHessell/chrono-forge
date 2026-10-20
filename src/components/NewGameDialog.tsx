import clsx from 'clsx';
import { type FormEvent, type RefObject, useState } from 'react';

import type { PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';
import {
  createDefaultPlayers,
  type PlayerSetup,
  type PlayerType,
} from '../playerSetup';
import controlsStyles from './Controls.module.css';
import dialogStyles from './Dialog.module.css';
import newGameDialogStyles from './NewGameDialog.module.css';
import { PlayerAvatar } from './PlayerAvatar';

type Props = {
  dialogRef: RefObject<HTMLDialogElement>;
  initialPlayers: PlayerSetup[];
  onStart: (players: PlayerSetup[]) => void;
};

export function NewGameDialog({ dialogRef, initialPlayers, onStart }: Props) {
  const t = useMessages();
  const [players, setPlayers] = useState(initialPlayers);
  const addPlayer = () => {
    const next = createDefaultPlayers((players.length + 1) as 3 | 4);

    setPlayers([...players, next.at(-1)!]);
  };
  const removePlayer = (id: PlayerId) => {
    setPlayers(players.filter((player) => player.id !== id));
  };
  const setPlayerType = (id: PlayerId, type: PlayerType) => {
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, type } : player,
      ),
    );
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dialogRef.current?.close();
    onStart(players);
  };

  return (
    <dialog
      aria-labelledby="new-game-title"
      className={dialogStyles.gameLogDialog}
      ref={dialogRef}
    >
      <form onSubmit={submit}>
        <div
          className={clsx(
            dialogStyles.gameLogHeader,
            newGameDialogStyles.dialogHeader,
          )}
        >
          <div>
            <h2 id="new-game-title">{t('newGame.title')}</h2>
            <p>{t('newGame.description')}</p>
          </div>
          <button
            aria-label={t('newGame.close')}
            className={dialogStyles.gameLogClose}
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={newGameDialogStyles.playerList}>
          {players.map((player, index) => (
            <div className={newGameDialogStyles.playerRow} key={player.id}>
              <PlayerAvatar {...player} owner={player.id} />
              <div className={newGameDialogStyles.playerDetails}>
                <strong>{player.name}</strong>
                <small>{t('newGame.playerNumber', { count: index + 1 })}</small>
              </div>
              {index === 0 ? (
                <span className={newGameDialogStyles.fixedType}>
                  {t('newGame.human')}
                </span>
              ) : (
                <label className={newGameDialogStyles.playerType}>
                  <span>{t('newGame.playerType')}</span>
                  <select
                    aria-label={t('newGame.playerTypeFor', {
                      name: player.name,
                    })}
                    onChange={(event) =>
                      setPlayerType(player.id, event.target.value as PlayerType)
                    }
                    value={player.type}
                  >
                    <option value="computer">{t('newGame.computer')}</option>
                    <option value="human">{t('newGame.human')}</option>
                  </select>
                </label>
              )}
              {index > 1 && index === players.length - 1 && (
                <button
                  aria-label={t('newGame.removePlayer', { name: player.name })}
                  className={controlsStyles.historyButton}
                  onClick={() => removePlayer(player.id)}
                  type="button"
                >
                  {t('newGame.remove')}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className={newGameDialogStyles.actions}>
          {players.length < 4 && (
            <button
              className={controlsStyles.historyButton}
              onClick={addPlayer}
              type="button"
            >
              {t('newGame.addPlayer')}
            </button>
          )}
          <button className={controlsStyles.historyButton} type="submit">
            {t('newGame.start')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
