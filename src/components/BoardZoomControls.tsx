import { useIntl } from 'react-intl';

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
  const intl = useIntl();

  return (
    <div
      className={boardZoomControlsStyles.zoomControls}
      role="group"
      aria-label={intl.formatMessage({
        id: 'zoom.label',
        defaultMessage: 'Board zoom controls',
      })}
    >
      <button
        aria-label={intl.formatMessage({
          id: 'zoom.out',
          defaultMessage: 'Zoom out',
        })}
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
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M3 8h10" />
        </svg>
      </button>
      <button
        aria-label={intl.formatMessage({
          id: 'zoom.reset',
          defaultMessage: 'Reset board zoom',
        })}
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
        aria-label={intl.formatMessage({
          id: 'zoom.in',
          defaultMessage: 'Zoom in',
        })}
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
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
    </div>
  );
}
