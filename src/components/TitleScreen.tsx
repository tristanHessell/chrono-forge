import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import { createDefaultPlayers, type PlayerSetup } from '../playerSetup';
import { NewGameDialog } from './NewGameDialog';
import titleScreenStyles from './TitleScreen.module.css';

type Props = {
  onContinue?: () => void;
  onStart: (players: PlayerSetup[]) => void;
};

export function TitleScreen({ onContinue, onStart }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <main className={titleScreenStyles.titleScreen}>
      <section className={titleScreenStyles.titleCard}>
        <p className={titleScreenStyles.tagline}>
          <FormattedMessage
            id={'brand.tagline'}
            defaultMessage={'Tactical card system'}
          />
        </p>
        <h1>
          <FormattedMessage id={'brand.name'} defaultMessage={'Chrono-Forge'} />
        </h1>
        <div className={titleScreenStyles.actions}>
          {onContinue && (
            <button
              className={titleScreenStyles.startButton}
              onClick={onContinue}
              type="button"
            >
              <FormattedMessage
                id={'titleScreen.continue'}
                defaultMessage={'Continue game'}
              />
            </button>
          )}
          <button
            className={titleScreenStyles.startButton}
            onClick={() => dialog.current?.showModal()}
            type="button"
          >
            <FormattedMessage
              id={'titleScreen.start'}
              defaultMessage={'Start a new game'}
            />
          </button>
        </div>
      </section>
      <NewGameDialog
        dialogRef={dialog}
        initialPlayers={createDefaultPlayers()}
        onStart={onStart}
      />
    </main>
  );
}
