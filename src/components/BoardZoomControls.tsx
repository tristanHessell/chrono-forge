import { useIntl } from 'react-intl';

import { maximumBoardZoom, minimumBoardZoom } from '../boardZoom';
import boardZoomControlsStyles from './BoardZoomControls.module.css';

type Props = {
  boardZoom: number;
  onFitAll: () => void;
  onZoomChange: (change: number) => void;
  onResetZoom: () => void;
};

export function BoardZoomControls({
  boardZoom,
  onFitAll,
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
        disabled={boardZoom <= minimumBoardZoom}
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
          id: 'zoom.fitAll',
          defaultMessage: 'Fit all',
        })}
        onClick={(event) => {
          if (event.detail === 0) {
            onFitAll();
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          onFitAll();
        }}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
        </svg>
      </button>
      <button
        aria-label={intl.formatMessage({
          id: 'zoom.in',
          defaultMessage: 'Zoom in',
        })}
        disabled={boardZoom >= maximumBoardZoom}
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
