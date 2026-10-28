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
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <main className={titleScreenStyles.titleScreen}>
      <section className={titleScreenStyles.titleCard}>
        <p className={titleScreenStyles.tagline}>
          <FormattedMessage
            defaultMessage="Tactical card system"
            id="brand.tagline"
          />
        </p>
        <h1>
          <FormattedMessage defaultMessage="Chrono-Forge" id="brand.name" />
        </h1>
        <div className={titleScreenStyles.actions}>
          {onContinue && (
            <button
              className={titleScreenStyles.startButton}
              onClick={onContinue}
              type="button"
            >
              <FormattedMessage
                defaultMessage="Continue game"
                id="titleScreen.continue"
              />
            </button>
          )}
          <button
            className={titleScreenStyles.startButton}
            onClick={() => dialogRef.current?.showModal()}
            type="button"
          >
            <FormattedMessage
              defaultMessage="Start a new game"
              id="titleScreen.start"
            />
          </button>
        </div>
      </section>
      <NewGameDialog
        dialogRef={dialogRef}
        initialPlayers={createDefaultPlayers()}
        onStart={onStart}
      />
    </main>
  );
}
