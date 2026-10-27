import clsx from 'clsx';
import { type RefObject, useContext, useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { CardGameState } from '../game';
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
  const intl = useIntl();
  const titleId = useId();
  const [viewMode, setViewMode] = useState<'round' | 'total'>('round');
  const players = useContext(PlayerSetupContext);
  const playerIds = G.playerIds;
  const completedRounds = G.roundScores;
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
        <h2 id={titleId}>
          <FormattedMessage
            id="roundScores.title"
            defaultMessage="Round scores"
          />
        </h2>
        <button
          className={dialogStyles.gameLogClose}
          type="button"
          aria-label={intl.formatMessage({
            id: 'roundScores.close',
            defaultMessage: 'Close round scores dialog',
          })}
          onClick={() => dialogRef.current?.close()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p>
        <FormattedMessage
          id="roundScores.overview"
          defaultMessage="Points for each player across rounds."
        />
      </p>
      {rows.length === 0 ? (
        <p className={roundScoresDialogStyles.emptyMessage}>
          <FormattedMessage
            id="roundScores.empty"
            defaultMessage="No rounds played yet."
          />
        </p>
      ) : (
        <>
          <div
            className={roundScoresDialogStyles.viewToggle}
            role="group"
            aria-label={intl.formatMessage({
              id: 'roundScores.viewLabel',
              defaultMessage: 'Score display mode',
            })}
          >
            <button
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'round' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              type="button"
              aria-pressed={viewMode === 'round'}
              onClick={() => {
                setViewMode('round');
              }}
            >
              <FormattedMessage
                id="roundScores.modeRound"
                defaultMessage="Round points"
              />
            </button>
            <button
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'total' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              type="button"
              aria-pressed={viewMode === 'total'}
              onClick={() => {
                setViewMode('total');
              }}
            >
              <FormattedMessage
                id="roundScores.modeTotal"
                defaultMessage="Cumulative"
              />
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
                    <FormattedMessage
                      id="roundScores.round"
                      defaultMessage="Round"
                    />
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
                      <FormattedMessage
                        id="roundScores.roundNumber"
                        defaultMessage="Round {count, number}"
                        values={{ count: row.roundNumber }}
                      />
                      {row.isInProgress && (
                        <span className={roundScoresDialogStyles.currentBadge}>
                          <FormattedMessage
                            id="roundScores.inProgress"
                            defaultMessage="(in progress)"
                          />
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
                                ? intl.formatMessage<{
                                    readonly count: number | bigint;
                                  }>(
                                    {
                                      id: 'roundScores.totalHint',
                                      defaultMessage: 'total: {count, number}',
                                    },
                                    {
                                      count: cumulative,
                                    },
                                  )
                                : intl.formatMessage<{
                                    readonly count: number | bigint;
                                  }>(
                                    {
                                      id: 'roundScores.roundHint',
                                      defaultMessage: 'round: {count, number}',
                                    },
                                    {
                                      count: roundScore,
                                    },
                                  )}
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
                    <FormattedMessage
                      id="roundScores.total"
                      defaultMessage="Total"
                    />
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
