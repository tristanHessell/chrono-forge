import { useContext } from 'react';

import type { PlacedCard, PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import { calculateScoreBreakdown } from '../scoring';
import controlsStyles from './Controls.module.css';
import gameResultsStyles from './GameResults.module.css';
import ownershipStyles from './Ownership.module.css';

export function GameResults({
  played,
  playerIds = ['0', '1'],
  onOpenRoundScores,
}: {
  played: PlacedCard[];
  playerIds?: PlayerId[];
  onOpenRoundScores?: () => void;
}) {
  const t = useMessages();
  const players = useContext(PlayerSetupContext);
  const scores = calculateScoreBreakdown(played);
  const highest = Math.max(...playerIds.map((id) => scores[id]?.total ?? 0));
  const winners = playerIds.filter(
    (id) => (scores[id]?.total ?? 0) === highest,
  );

  return (
    <div className={gameResultsStyles.gameResults} role="status">
      <div className={gameResultsStyles.headerRow}>
        <strong className={gameResultsStyles.resultTitle}>
          {winners.length === 1
            ? t(winners[0] === '0' ? 'score.youWin' : 'score.playerWins', {
                name: getPlayer(players, winners[0]).name,
              })
            : t('score.tie', {
                players: winners
                  .map((id) => getPlayer(players, id).name)
                  .join(', '),
              })}
        </strong>
        {onOpenRoundScores && (
          <button
            className={controlsStyles.historyButton}
            type="button"
            onClick={onOpenRoundScores}
          >
            {t('roundScores.title')}
          </button>
        )}
      </div>
      <div className={gameResultsStyles.scoreBreakdown}>
        {playerIds.map((owner) => (
          <span className={ownershipStyles[`owner${owner}`]} key={owner}>
            {t('score.breakdown', {
              name: getPlayer(players, owner).name,
              ...(scores[owner] ?? { base: 0, bonus: 0, total: 0 }),
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
