import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import packageJson from '../../package.json';
import {
  saveArrowAnimation,
  saveArrows,
  savedArrowAnimation,
  savedArrows,
} from '../gameSettings';
import { CardPatternsToggle } from './CardPatternsToggle';
import dialogStyles from './Dialog.module.css';
import settingsDialogStyles from './SettingsDialog.module.css';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
};

export function SettingsDialog({ dialogRef }: Props) {
  const intl = useIntl();
  const [arrows, setArrows] = useState(savedArrows);
  const [animateArrows, setAnimateArrows] = useState(savedArrowAnimation);

  return (
    <dialog
      aria-labelledby="settings-title"
      className={`${dialogStyles.gameLogDialog} ${settingsDialogStyles.settingsDialog}`}
      ref={dialogRef}
    >
      <form method="dialog">
        <div className={dialogStyles.gameLogHeader}>
          <h2 id="settings-title">
            <FormattedMessage defaultMessage="Settings" id="settings.title" />
          </h2>
          <button
            aria-label={intl.formatMessage({
              defaultMessage: 'Close settings',
              id: 'settings.close',
            })}
            className={dialogStyles.gameLogClose}
            type="submit"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className={settingsDialogStyles.settingsOptions}>
          <ThemeToggle />
          <CardPatternsToggle />
          <label className={settingsDialogStyles.settingsOption}>
            <FormattedMessage
              defaultMessage="Show arrows"
              id="settings.arrows"
            />
            <input
              checked={arrows}
              onChange={(event) => {
                const next = event.target.checked;

                saveArrows(next);
                setArrows(next);
              }}
              type="checkbox"
            />
          </label>
          <label className={settingsDialogStyles.settingsOption}>
            <FormattedMessage
              defaultMessage="Animate arrows in the direction they point"
              id="settings.animateArrows"
            />
            <input
              checked={animateArrows}
              onChange={(event) => {
                const next = event.target.checked;

                saveArrowAnimation(next);
                setAnimateArrows(next);
              }}
              type="checkbox"
            />
          </label>
        </div>
        <p className={settingsDialogStyles.settingsVersion}>
          <FormattedMessage
            defaultMessage="Version {version}"
            id="settings.version"
            values={{ version: packageJson.version }}
          />
        </p>
      </form>
    </dialog>
  );
}
