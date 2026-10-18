import { useIntl } from 'react-intl';

import type { PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';

type BoardToolbarProps = {
  boardZoom: number;
  scores: Record<string, number>;
  playerIds: PlayerId[];
  onZoomChange: (change: number) => void;
  onResetZoom: () => void;
};

export function BoardToolbar({
  boardZoom,
  scores,
  playerIds,
  onZoomChange,
  onResetZoom,
}: BoardToolbarProps) {
  const t = useMessages();
  const intl = useIntl();

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
      <div className="zoom-controls" aria-label={t('zoom.label')}>
        <button
          aria-label={t('zoom.out')}
          disabled={boardZoom <= 0.6}
          onClick={(event) => {
            if (event.detail === 0) {
              onZoomChange(-0.1);
            }
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            onZoomChange(-0.1);
          }}
          type="button"
        >
          −
        </button>
        <button
          aria-label={t('zoom.reset')}
          className="zoom-value"
          onClick={(event) => {
            if (event.detail === 0) {
              onResetZoom();
            }
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            onResetZoom();
          }}
          type="button"
        >
          {intl.formatNumber(boardZoom, {
            style: 'percent',
            maximumFractionDigits: 0,
          })}
        </button>
        <button
          aria-label={t('zoom.in')}
          disabled={boardZoom >= 1.6}
          onClick={(event) => {
            if (event.detail === 0) {
              onZoomChange(0.1);
            }
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            onZoomChange(0.1);
          }}
          type="button"
        >
          +
        </button>
      </div>
      <span className="board-help">{t('board.help')}</span>
    </div>
  );
}
