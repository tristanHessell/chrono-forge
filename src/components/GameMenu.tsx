import { useEffect, useRef } from 'react';

import { useMessages } from '../i18n/useMessages';
import { CardPatternsToggle } from './CardPatternsToggle';
import controlsStyles from './Controls.module.css';
import gameMenuStyles from './GameMenu.module.css';
import { focusMovedOutside } from './menuFocus';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  onNewGame: () => void;
  onOpenLog: () => void;
  onOpenCatalog: () => void;
  onOpenRoundScores: () => void;
};

export function GameMenu({
  onNewGame,
  onOpenLog,
  onOpenCatalog,
  onOpenRoundScores,
}: Props) {
  const t = useMessages();
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const closeMenu = (restoreFocus = false) => {
    menu.current?.removeAttribute('open');

    if (restoreFocus) {
      trigger.current?.focus();
    }
  };

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) {
        menu.current?.removeAttribute('open');
      }
    };

    document.addEventListener('pointerdown', closeOutside);

    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return (
    <details
      className={gameMenuStyles.gameMenu}
      ref={menu}
      onBlur={(event) => {
        if (focusMovedOutside(event.currentTarget, event.relatedTarget)) {
          closeMenu();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu(true);
        }
      }}
    >
      <summary
        className={controlsStyles.historyButton}
        ref={trigger}
        aria-label={t('menu.title')}
      >
        <span aria-hidden="true">☰</span> {t('menu.toggle')}
      </summary>
      <div
        className={gameMenuStyles.gameMenuPanel}
        role="group"
        aria-label={t('menu.title')}
      >
        <button
          className={controlsStyles.historyButton}
          type="button"
          onClick={() => {
            closeMenu(true);
            onNewGame();
          }}
        >
          {t('game.new')}
        </button>
        <ThemeToggle />
        <CardPatternsToggle />
        <button
          className={controlsStyles.historyButton}
          type="button"
          onClick={() => {
            closeMenu(true);
            onOpenCatalog();
          }}
        >
          {t('catalog.title')}
        </button>
        <button
          className={controlsStyles.historyButton}
          type="button"
          onClick={() => {
            closeMenu(true);
            onOpenLog();
          }}
        >
          {t('log.title')}
        </button>
        <button
          className={controlsStyles.historyButton}
          type="button"
          onClick={() => {
            closeMenu(true);
            onOpenRoundScores();
          }}
        >
          {t('roundScores.title')}
        </button>
      </div>
    </details>
  );
}
