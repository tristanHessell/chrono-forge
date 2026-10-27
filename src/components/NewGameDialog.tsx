import clsx from 'clsx';
import { useState } from 'react';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PlayerId } from '../game';
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
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  initialPlayers: PlayerSetup[];
  onStart: (players: PlayerSetup[]) => void;
};

export function NewGameDialog({ dialogRef, initialPlayers, onStart }: Props) {
  const intl = useIntl();
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
  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
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
            <h2 id="new-game-title">
              <FormattedMessage id="newGame.title" defaultMessage="New game" />
            </h2>
            <p>
              <FormattedMessage
                id="newGame.description"
                defaultMessage="Player 1 is always human. Add up to four players and choose who controls each other seat."
              />
            </p>
          </div>
          <button
            aria-label={intl.formatMessage({
              id: 'newGame.close',
              defaultMessage: 'Close new game dialog',
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
        <div className={newGameDialogStyles.playerList}>
          {players.map((player, index) => (
            <div className={newGameDialogStyles.playerRow} key={player.id}>
              <PlayerAvatar {...player} owner={player.id} />
              <div className={newGameDialogStyles.playerDetails}>
                <strong>{player.name}</strong>
                <small>
                  <FormattedMessage
                    id="newGame.playerNumber"
                    defaultMessage="Player {count, number}"
                    values={{ count: index + 1 }}
                  />
                </small>
              </div>
              {index === 0 ? (
                <span className={newGameDialogStyles.fixedType}>
                  <FormattedMessage id="newGame.human" defaultMessage="Human" />
                </span>
              ) : (
                <label className={newGameDialogStyles.playerType}>
                  <span>
                    <FormattedMessage
                      id="newGame.playerType"
                      defaultMessage="Controller"
                    />
                  </span>
                  <select
                    aria-label={intl.formatMessage<{
                      readonly name: MessageValue;
                    }>(
                      {
                        id: 'newGame.playerTypeFor',
                        defaultMessage: 'Controller for {name}',
                      },
                      {
                        name: player.name,
                      },
                    )}
                    onChange={(event) => {
                      setPlayerType(
                        player.id,
                        event.target.value as PlayerType,
                      );
                    }}
                    value={player.type}
                  >
                    <option value="computer">
                      <FormattedMessage
                        id="newGame.computer"
                        defaultMessage="AI"
                      />
                    </option>
                    <option value="human">
                      <FormattedMessage
                        id="newGame.human"
                        defaultMessage="Human"
                      />
                    </option>
                  </select>
                </label>
              )}
              {index > 1 && index === players.length - 1 && (
                <button
                  aria-label={intl.formatMessage<{
                    readonly name: MessageValue;
                  }>(
                    {
                      id: 'newGame.removePlayer',
                      defaultMessage: 'Remove {name}',
                    },
                    { name: player.name },
                  )}
                  className={controlsStyles.historyButton}
                  onClick={() => {
                    removePlayer(player.id);
                  }}
                  type="button"
                >
                  <FormattedMessage
                    id="newGame.remove"
                    defaultMessage="Remove"
                  />
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
              <FormattedMessage
                id="newGame.addPlayer"
                defaultMessage="Add player"
              />
            </button>
          )}
          <button className={controlsStyles.historyButton} type="submit">
            <FormattedMessage id="newGame.start" defaultMessage="Start game" />
          </button>
        </div>
      </form>
    </dialog>
  );
}
