import clsx from 'clsx';
import { type RefObject, useContext, useId, useState } from 'react';
import { useIntl } from 'react-intl';

import type { CardGameState } from '../game';
import { useMessages } from '../i18n/useMessages';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import { calculateScores } from '../scoring';
import dialogStyles from './Dialog.module.css';
import ownershipStyles from './Ownership.module.css';
import roundScoresDialogStyles from './RoundScoresDialog.module.css';

type Props = {
  dialogRef: RefObject<HTMLDialogElement>;
  G: CardGameState;
};

type RoundRow = {
  cumulativeScores: Record<string, number>;
  isInProgress: boolean;
  roundNumber: number;
  roundScores: Record<string, number>;
};

function formatRoundPoints(value: number, intl: ReturnType<typeof useIntl>) {
  if (value > 0) {
    return `+${intl.formatNumber(value)}`;
  }

  return intl.formatNumber(value);
}

export function RoundScoresDialog({ dialogRef, G }: Props) {
  const t = useMessages();
  const intl = useIntl();
  const titleId = useId();
  const [viewMode, setViewMode] = useState<'round' | 'total'>('round');
  const players = useContext(PlayerSetupContext);
  const playerIds = G.playerIds;
  const completedRounds = G.roundScores ?? [];
  const inProgressCumulative = calculateScores(G.played);

  const rows: RoundRow[] = [];
  let previousCumulative: Record<string, number> = Object.fromEntries(
    playerIds.map((id) => [id, 0]),
  );

  for (let index = 0; index < completedRounds.length; index += 1) {
    const cumulative = completedRounds[index];
    const roundScores: Record<string, number> = {};

    for (const id of playerIds) {
      roundScores[id] = (cumulative[id] ?? 0) - (previousCumulative[id] ?? 0);
    }

    rows.push({
      cumulativeScores: cumulative,
      isInProgress: false,
      roundNumber: index + 1,
      roundScores,
    });

    previousCumulative = cumulative;
  }

  if (!G.roundOver) {
    const currentScores: Record<string, number> = {};

    for (const id of playerIds) {
      currentScores[id] =
        (inProgressCumulative[id] ?? 0) - (previousCumulative[id] ?? 0);
    }

    rows.push({
      cumulativeScores: inProgressCumulative,
      isInProgress: true,
      roundNumber: G.round,
      roundScores: currentScores,
    });
  }

  const finalTotals =
    rows[rows.length - 1]?.cumulativeScores ?? inProgressCumulative;

  return (
    <dialog
      ref={dialogRef}
      className={clsx(
        dialogStyles.gameLogDialog,
        roundScoresDialogStyles.roundScoresDialog,
      )}
      aria-labelledby={titleId}
    >
      <div className={dialogStyles.gameLogHeader}>
        <h2 id={titleId}>{t('roundScores.title')}</h2>
        <button
          className={dialogStyles.gameLogClose}
          type="button"
          aria-label={t('roundScores.close')}
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p>{t('roundScores.overview')}</p>
      {rows.length === 0 ? (
        <p className={roundScoresDialogStyles.emptyMessage}>
          {t('roundScores.empty')}
        </p>
      ) : (
        <>
          <div
            className={roundScoresDialogStyles.viewToggle}
            role="group"
            aria-label={t('roundScores.viewLabel')}
          >
            <button
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'round' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              type="button"
              aria-pressed={viewMode === 'round'}
              onClick={() => setViewMode('round')}
            >
              {t('roundScores.modeRound')}
            </button>
            <button
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'total' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              type="button"
              aria-pressed={viewMode === 'total'}
              onClick={() => setViewMode('total')}
            >
              {t('roundScores.modeTotal')}
            </button>
          </div>
          <div className={roundScoresDialogStyles.tableWrapper}>
            <table className={roundScoresDialogStyles.table}>
              <thead>
                <tr>
                  <th
                    className={roundScoresDialogStyles.headerCell}
                    scope="col"
                  >
                    {t('roundScores.round')}
                  </th>
                  {playerIds.map((id) => (
                    <th
                      className={clsx(
                        roundScoresDialogStyles.headerCell,
                        roundScoresDialogStyles.playerHeader,
                        ownershipStyles[`owner${id}`],
                      )}
                      key={id}
                      scope="col"
                    >
                      {getPlayer(players, id).name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className={clsx(
                      row.isInProgress && roundScoresDialogStyles.currentRow,
                    )}
                    key={row.roundNumber}
                  >
                    <th
                      className={roundScoresDialogStyles.roundCell}
                      scope="row"
                    >
                      {t('roundScores.roundNumber', { count: row.roundNumber })}
                      {row.isInProgress && (
                        <span className={roundScoresDialogStyles.currentBadge}>
                          {t('roundScores.inProgress')}
                        </span>
                      )}
                    </th>
                    {playerIds.map((id) => {
                      const roundScore = row.roundScores[id] ?? 0;
                      const cumulative = row.cumulativeScores[id] ?? 0;

                      return (
                        <td
                          className={roundScoresDialogStyles.numberCell}
                          key={id}
                        >
                          <div
                            className={roundScoresDialogStyles.scoreCellContent}
                          >
                            <span
                              className={roundScoresDialogStyles.primaryScore}
                            >
                              {viewMode === 'round'
                                ? formatRoundPoints(roundScore, intl)
                                : intl.formatNumber(cumulative)}
                            </span>
                            <span
                              className={roundScoresDialogStyles.secondaryScore}
                            >
                              {viewMode === 'round'
                                ? t('roundScores.totalHint', {
                                    count: cumulative,
                                  })
                                : t('roundScores.roundHint', {
                                    count: roundScore,
                                  })}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={roundScoresDialogStyles.totalRow}>
                  <th className={roundScoresDialogStyles.roundCell} scope="row">
                    {t('roundScores.total')}
                  </th>
                  {playerIds.map((id) => (
                    <td className={roundScoresDialogStyles.numberCell} key={id}>
                      <span className={roundScoresDialogStyles.totalScore}>
                        {intl.formatNumber(finalTotals[id] ?? 0)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </dialog>
  );
}
