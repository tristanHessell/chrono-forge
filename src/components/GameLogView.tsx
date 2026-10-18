import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import type { Card } from '../game';
import type { GameLog } from '../gameLog';
import { summarizeGameLog } from '../gameLogSummary';
import { useMessages } from '../i18n/useMessages';

export function GameLogView({ log }: { log: GameLog }) {
  const t = useMessages();
  const items = useMemo(() => summarizeGameLog(log), [log]);
  const playerName = (id: string) => t('log.player', { count: Number(id) + 1 });
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
      className="log-card-reference"
      data-event-category={card?.category}
      data-card-type={card?.type}
    >
      {cardName(card)}
    </strong>
  );

  return (
    <section className="game-log-readable" aria-label={t('log.history')}>
      <dl className="game-log-metadata">
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
      <p>{t('log.started', { player: playerName('0') })}</p>
      {items.length === 0 ? (
        <p>{t('log.empty')}</p>
      ) : (
        <ol className="game-log-entries">
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
                  {t('log.entry', {
                    player: playerName(item.player),
                    count: item.turn,
                  })}
                </small>
                <span>
                  <FormattedMessage id={description} values={values} />
                </span>
                {item.nextPlayer && (
                  <small>
                    {t('log.nextPlayer', {
                      player: playerName(item.nextPlayer),
                    })}
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
