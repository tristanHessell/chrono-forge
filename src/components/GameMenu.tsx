import { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CardPatternsToggle } from './CardPatternsToggle';
import controlsStyles from './Controls.module.css';
import gameMenuStyles from './GameMenu.module.css';
import { focusMovedOutside } from './menuFocus';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  onNewGame: () => void;
  onOpenCatalog: () => void;
};

export function GameMenu({ onNewGame, onOpenCatalog }: Props) {
  const intl = useIntl();
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

    return () => {
      document.removeEventListener('pointerdown', closeOutside);
    };
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
        aria-label={intl.formatMessage({
          id: 'menu.title',
          defaultMessage: 'Game menu',
        })}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M2 3h12M2 8h12M2 13h12" />
        </svg>
        <FormattedMessage id={('menu.toggle')} defaultMessage={('Menu')} />
      </summary>
      <div
        className={gameMenuStyles.gameMenuPanel}
        role="group"
        aria-label={intl.formatMessage({
          id: 'menu.title',
          defaultMessage: 'Game menu',
        })}
      >
        <button
          className={controlsStyles.historyButton}
          type="button"
          onClick={() => {
            closeMenu(true);
            onNewGame();
          }}
        >
          <FormattedMessage id={('game.new')} defaultMessage={('New game')} />
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
          <FormattedMessage id={('catalog.title')} defaultMessage={('All cards')} />
        </button>
      </div>
    </details>
  );
}
