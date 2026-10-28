import { use } from 'react';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PlacedCard, PlayerId } from '../game';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
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
  const intl = useIntl();
  const players = use(PlayerSetupContext);
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
            ? intl.formatMessage(
                winners[0] === '0'
                  ? {
                      defaultMessage: 'Game over — you win!',
                      id: 'score.youWin',
                    }
                  : {
                      defaultMessage: 'Game over — {name} wins!',
                      id: 'score.playerWins',
                    },
                { name: getPlayer(players, winners[0]).name },
              )
            : intl.formatMessage<{ readonly players: MessageValue }>(
                {
                  defaultMessage: "Game over — it's a tie! ({players})",
                  id: 'score.tie',
                },
                {
                  players: winners
                    .map((id) => getPlayer(players, id).name)
                    .join(', '),
                },
              )}
        </strong>
      </div>
      <div className={gameResultsStyles.scoreBreakdown}>
        {playerIds.map((owner) => (
          <span className={ownershipStyles[`owner${owner}`]} key={owner}>
            <FormattedMessage
              defaultMessage="{name}: {base, plural,
                one {# card point}
                other {# card points}
              } + {bonus, plural,
                one {# bonus point}
                other {# bonus points}
              } = {total, number} total"
              id="score.breakdown"
              values={{
                name: getPlayer(players, owner).name,
                ...(scores[owner] ?? { base: 0, bonus: 0, total: 0 }),
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
