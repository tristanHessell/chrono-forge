import clsx from 'clsx';

import type { PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';
import boardToolbarStyles from './BoardToolbar.module.css';
import ownershipStyles from './Ownership.module.css';

type BoardToolbarProps = {
  scores: Record<string, number>;
  playerIds: PlayerId[];
};

export function BoardToolbar({ scores, playerIds }: BoardToolbarProps) {
  const t = useMessages();

  return (
    <div className={boardToolbarStyles.boardToolbar}>
      <div
        className={boardToolbarStyles.ownerLegend}
        aria-label={t('owner.legend')}
      >
        {playerIds.map((owner) => (
          <span
            key={owner}
            className={clsx(
              boardToolbarStyles.legendItem,
              ownershipStyles[`owner${owner}`],
            )}
          >
            {t('score.player', { owner, count: scores[owner] ?? 0 })}
          </span>
        ))}
        <span
          className={clsx(
            boardToolbarStyles.legendItem,
            ownershipStyles.ownerNeutral,
          )}
        >
          {t('owner.neutral')}
        </span>
      </div>
    </div>
  );
}
