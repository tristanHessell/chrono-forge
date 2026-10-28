import clsx from 'clsx';
import { use, useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { CardGameState } from '../game';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import { calculateScores } from '../scoring';
import dialogStyles from './Dialog.module.css';
import ownershipStyles from './Ownership.module.css';
import roundScoresDialogStyles from './RoundScoresDialog.module.css';

type Props = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
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
  const players = use(PlayerSetupContext);
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
      aria-labelledby={titleId}
      className={clsx(
        dialogStyles.gameLogDialog,
        roundScoresDialogStyles.roundScoresDialog,
      )}
      ref={dialogRef}
    >
      <div className={dialogStyles.gameLogHeader}>
        <h2 id={titleId}>
          <FormattedMessage
            defaultMessage="Round scores"
            id="roundScores.title"
          />
        </h2>
        <button
          aria-label={intl.formatMessage({
            defaultMessage: 'Close round scores dialog',
            id: 'roundScores.close',
          })}
          className={dialogStyles.gameLogClose}
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p>
        <FormattedMessage
          defaultMessage="Points for each player across rounds."
          id="roundScores.overview"
        />
      </p>
      {rows.length === 0 ? (
        <p className={roundScoresDialogStyles.emptyMessage}>
          <FormattedMessage
            defaultMessage="No rounds played yet."
            id="roundScores.empty"
          />
        </p>
      ) : (
        <>
          <div
            aria-label={intl.formatMessage({
              defaultMessage: 'Score display mode',
              id: 'roundScores.viewLabel',
            })}
            className={roundScoresDialogStyles.viewToggle}
            role="group"
          >
            <button
              aria-pressed={viewMode === 'round'}
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'round' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              onClick={() => {
                setViewMode('round');
              }}
              type="button"
            >
              <FormattedMessage
                defaultMessage="Round points"
                id="roundScores.modeRound"
              />
            </button>
            <button
              aria-pressed={viewMode === 'total'}
              className={clsx(
                roundScoresDialogStyles.toggleButton,
                viewMode === 'total' &&
                  roundScoresDialogStyles.toggleButtonActive,
              )}
              onClick={() => {
                setViewMode('total');
              }}
              type="button"
            >
              <FormattedMessage
                defaultMessage="Cumulative"
                id="roundScores.modeTotal"
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
                      defaultMessage="Round"
                      id="roundScores.round"
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
                        defaultMessage="Round {count, number}"
                        id="roundScores.roundNumber"
                        values={{ count: row.roundNumber }}
                      />
                      {row.isInProgress && (
                        <span className={roundScoresDialogStyles.currentBadge}>
                          <FormattedMessage
                            defaultMessage="(in progress)"
                            id="roundScores.inProgress"
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
                                    // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                                    readonly count: number | bigint;
                                  }>(
                                    {
                                      defaultMessage: 'total: {count, number}',
                                      id: 'roundScores.totalHint',
                                    },
                                    {
                                      count: cumulative,
                                    },
                                  )
                                : intl.formatMessage<{
                                    // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                                    readonly count: number | bigint;
                                  }>(
                                    {
                                      defaultMessage: 'round: {count, number}',
                                      id: 'roundScores.roundHint',
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
                      defaultMessage="Total"
                      id="roundScores.total"
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
