import { FormattedMessage } from 'react-intl';

import gameBoardStyles from '../GameBoard.module.css';
import type { PlayerSetup } from '../playerSetup';
import controlsStyles from './Controls.module.css';
import { GameMenu } from './GameMenu';

type GameBoardHeaderProps = {
  activePlayer: PlayerSetup;
  computerPaused: boolean;
  finished: boolean;
  onNewGame: () => void;
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
  onResumeComputer: () => void;
};

export function GameBoardHeader({
  activePlayer,
  computerPaused,
  finished,
  onNewGame,
  onOpenCatalog,
  onOpenSettings,
  onResumeComputer,
}: GameBoardHeaderProps) {
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
