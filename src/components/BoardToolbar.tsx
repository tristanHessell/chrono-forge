import type { PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';

type BoardToolbarProps = {
  scores: Record<string, number>;
  playerIds: PlayerId[];
};

export function BoardToolbar({ scores, playerIds }: BoardToolbarProps) {
  const t = useMessages();

  return (
    <div className="board-toolbar">
      <div className="owner-legend" aria-label={t('owner.legend')}>
        {playerIds.map((owner) => (
          <span key={owner} className={`legend-item owner-${owner}`}>
            {t('score.player', { owner, count: scores[owner] ?? 0 })}
          </span>
        ))}
        <span className="legend-item owner-neutral">{t('owner.neutral')}</span>
      </div>
    </div>
  );
}
