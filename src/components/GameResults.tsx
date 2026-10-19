import type { PlacedCard, PlayerId } from '../game';
import { useMessages } from '../i18n/useMessages';
import { calculateScoreBreakdown } from '../scoring';
import gameResultsStyles from './GameResults.module.css';
import ownershipStyles from './Ownership.module.css';

export function GameResults({
  played,
  playerIds = ['0', '1'],
}: {
  played: PlacedCard[];
  playerIds?: PlayerId[];
}) {
  const t = useMessages();
  const scores = calculateScoreBreakdown(played);
  const highest = Math.max(...playerIds.map((id) => scores[id]?.total ?? 0));
  const winners = playerIds.filter(
    (id) => (scores[id]?.total ?? 0) === highest,
  );

  return (
    <div className={gameResultsStyles.gameResults} role="status">
      <strong>
        {winners.length === 1
          ? t('score.result', { winner: winners[0] })
          : t('score.tie', {
              players: winners.map((id) => t(`owner.${id}`)).join(', '),
            })}
      </strong>
      <div className={gameResultsStyles.scoreBreakdown}>
        {playerIds.map((owner) => (
          <span className={ownershipStyles[`owner${owner}`]} key={owner}>
            {t('score.breakdown', {
              owner,
              ...(scores[owner] ?? { base: 0, bonus: 0, total: 0 }),
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
