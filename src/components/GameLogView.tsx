import clsx from 'clsx';
import { useContext, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import type { Card, PlayerId } from '../game';
import type { GameLog } from '../gameLog';
import { summarizeGameLog } from '../gameLogSummary';
import { useMessages } from '../i18n/useMessages';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import gameLogViewStyles from './GameLogView.module.css';
import ownershipStyles from './Ownership.module.css';

export function GameLogView({ log }: { log: GameLog }) {
  const t = useMessages();
  const players = useContext(PlayerSetupContext);
  const items = useMemo(() => summarizeGameLog(log), [log]);
  const playerReference = (id: string) => {
    const player = getPlayer(players, id as PlayerId);

    return (
      <strong
        className={clsx(
          gameLogViewStyles.logPlayerReference,
          ownershipStyles[`owner${player.id}`],
        )}
      >
        {player.name}
      </strong>
    );
  };
  const cardName = (card?: Card): string => {
    if (!card) {
      return t('log.unknownCard');
    }
    if (card.type === 'manipulation') {
      return t(`manipulation.${card.action}.name`);
    }

    return t('log.eventCard', {
      date: String(card.number),
      category: card.category
        ? t(`card.category.${card.category}`)
        : t('owner.neutral'),
    });
  };
  const cardReference = (card?: Card) => (
    <strong
      className={gameLogViewStyles.logCardReference}
      data-event-category={card?.category}
      data-card-type={card?.type}
    >
      {cardName(card)}
    </strong>
  );

  return (
    <section
      className={gameLogViewStyles.gameLogReadable}
      aria-label={t('log.history')}
    >
      <dl className={gameLogViewStyles.gameLogMetadata}>
        <div>
          <dt>{t('log.seed')}</dt>
          <dd>
            <code>{log.seed}</code>
          </dd>
        </div>
        <div>
          <dt>{t('game.players')}</dt>
          <dd>{log.numPlayers}</dd>
        </div>
      </dl>
      <p>
        <FormattedMessage
          id="log.started"
          values={{ player: playerReference('0') }}
        />
      </p>
      {items.length === 0 ? (
        <p>{t('log.empty')}</p>
      ) : (
        <ol className={gameLogViewStyles.gameLogEntries}>
          {items.map((item) => {
            const values = {
              card: cardReference(item.card),
              target: cardReference(item.target),
              second: cardReference(item.secondTarget),
              action: item.move,
              row: item.position?.row ?? 0,
              column: item.position?.column ?? 0,
            };
            const description = (() => {
              switch (item.move) {
                case 'playEvent':
                  return 'log.action.confirm';
                case 'confirmPlacement':
                  return 'log.action.confirm';
                case 'replacePendingCard':
                  return 'log.action.replace';
                case 'movePendingCard':
                  return 'log.action.move';
                case 'returnPendingCard':
                  return 'log.action.return';
                case 'discardCard':
                  return 'log.action.discard';
                case 'manipulate':
                  return item.card?.type === 'manipulation'
                    ? `log.action.${item.card.action}`
                    : 'log.action.other';
                default:
                  return 'log.action.other';
              }
            })();

            return (
              <li key={item.index}>
                <small>
                  <FormattedMessage
                    id="log.entry"
                    values={{
                      player: playerReference(item.player),
                      count: item.turn,
                    }}
                  />
                </small>
                <span>
                  <FormattedMessage id={description} values={values} />
                </span>
                {item.nextPlayer && (
                  <small>
                    <FormattedMessage
                      id="log.nextPlayer"
                      values={{ player: playerReference(item.nextPlayer) }}
                    />
                  </small>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
