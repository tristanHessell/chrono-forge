import { useEffect, useRef } from 'react';

import { useMessages } from '../i18n/useMessages';
import type { PlayerCount } from '../playerCount';
import { CardPatternsToggle } from './CardPatternsToggle';
import controlsStyles from './Controls.module.css';
import gameMenuStyles from './GameMenu.module.css';
import { focusMovedOutside } from './menuFocus';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  playerCount: PlayerCount;
  onPlayerCountChange: (count: PlayerCount) => void;
  onNewGame: () => void;
  onOpenLog: () => void;
  onOpenCatalog: () => void;
};

export function GameMenu({
  playerCount,
  onPlayerCountChange,
  onNewGame,
  onOpenLog,
  onOpenCatalog,
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
        <label className={gameMenuStyles.playerCount}>
          {t('game.players')}
          <select
            aria-label={t('game.players')}
            title={t('game.playersHint')}
            value={playerCount}
            onChange={(event) => {
              closeMenu(true);
              onPlayerCountChange(Number(event.target.value) as PlayerCount);
            }}
          >
            {[2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <small className={gameMenuStyles.gameMenuHint}>
          {t('game.playersHint')}
        </small>
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
      </div>
    </details>
  );
}
