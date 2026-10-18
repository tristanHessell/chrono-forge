import { useMemo } from 'react';

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
              card: cardName(item.card),
              target: cardName(item.target),
              second: cardName(item.secondTarget),
              row: item.position?.row ?? 0,
              column: item.position?.column ?? 0,
            };
            const description = (() => {
              switch (item.move) {
                case 'playEvent':
                  return t('log.action.confirm', values);
                case 'confirmPlacement':
                  return t('log.action.confirm', values);
                case 'replacePendingCard':
                  return t('log.action.replace', values);
                case 'movePendingCard':
                  return t('log.action.move', values);
                case 'returnPendingCard':
                  return t('log.action.return', values);
                case 'discardCard':
                  return t('log.action.discard', values);
                case 'manipulate':
                  return item.card?.type === 'manipulation'
                    ? t(`log.action.${item.card.action}`, values)
                    : t('log.action.other', { action: item.move });
                default:
                  return t('log.action.other', { action: item.move });
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
                <span>{description}</span>
                {item.drawn.length > 0 && (
                  <span>
                    {t('log.drawn', {
                      cards: item.drawn.map(cardName).join(', '),
                    })}
                  </span>
                )}
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
