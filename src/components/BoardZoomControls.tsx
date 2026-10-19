import { useIntl } from 'react-intl';

import { useMessages } from '../i18n/useMessages';
import boardZoomControlsStyles from './BoardZoomControls.module.css';

type Props = {
  boardZoom: number;
  onZoomChange: (change: number) => void;
  onResetZoom: () => void;
};

export function BoardZoomControls({
  boardZoom,
  onZoomChange,
  onResetZoom,
}: Props) {
  const t = useMessages();
  const intl = useIntl();

  return (
    <div
      className={boardZoomControlsStyles.zoomControls}
      role="group"
      aria-label={t('zoom.label')}
    >
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
        className={boardZoomControlsStyles.zoomValue}
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
  );
}
