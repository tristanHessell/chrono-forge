import clsx from 'clsx';
import { useContext, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { eventCardNameMessage } from '../eventCardName';
import type { Card, PlayerId } from '../game';
import type { GameLog } from '../gameLog';
import { summarizeGameLog } from '../gameLogSummary';
import { manipulationNameMessages } from '../i18n/messageDescriptors';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import gameLogViewStyles from './GameLogView.module.css';
import ownershipStyles from './Ownership.module.css';

export function GameLogView({ log }: { log: GameLog }) {
  const intl = useIntl();
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
      return intl.formatMessage({
        id: 'log.unknownCard',
        defaultMessage: 'a card',
      });
    }
    if (card.type === 'manipulation') {
      return intl.formatMessage(manipulationNameMessages[card.action]);
    }

    return intl.formatMessage(eventCardNameMessage(card));
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
      aria-label={intl.formatMessage({
        id: 'log.history',
        defaultMessage: 'Game action history',
      })}
    >
      <dl className={gameLogViewStyles.gameLogMetadata}>
        <div>
          <dt>
            <FormattedMessage id="log.seed" defaultMessage="Initial seed" />
          </dt>
          <dd>
            <code>{log.seed}</code>
          </dd>
        </div>
        <div>
          <dt>
            <FormattedMessage id="game.players" defaultMessage="Players" />
          </dt>
          <dd>{log.numPlayers}</dd>
        </div>
      </dl>
      <p>
        <FormattedMessage
          id="log.started"
          defaultMessage="Game started. {player} takes the first turn."
          values={{ player: playerReference('0') }}
        />
      </p>
      {items.length === 0 ? (
        <p>
          <FormattedMessage id="log.empty" defaultMessage="No actions yet." />
        </p>
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
                  return {
                    id: 'log.action.confirm',
                    defaultMessage:
                      'Confirmed {card} at row {row}, column {column}.',
                  };
                case 'confirmPlacement':
                  return {
                    id: 'log.action.confirm',
                    defaultMessage:
                      'Confirmed {card} at row {row}, column {column}.',
                  };
                case 'replacePendingCard':
                  return {
                    id: 'log.action.replace',
                    defaultMessage:
                      'Replaced the unconfirmed card with {card}.',
                  };
                case 'movePendingCard':
                  return {
                    id: 'log.action.move',
                    defaultMessage:
                      'Moved unconfirmed {card} to row {row}, column {column}.',
                  };
                case 'returnPendingCard':
                  return {
                    id: 'log.action.return',
                    defaultMessage: 'Returned unconfirmed {card} to hand.',
                  };
                case 'discardCard':
                  return {
                    id: 'log.action.discard',
                    defaultMessage: 'Discarded {card}.',
                  };
                case 'manipulate':
                  return item.card?.type === 'manipulation'
                    ? {
                        id: `log.action.${item.card.action}`,
                        defaultMessage:
                          item.card.action === 'time-jump'
                            ? 'Used {card} to move {target} to row {row}, column {column}.'
                            : item.card.action === 'time-swap'
                              ? 'Used {card} to swap {target} with {second}.'
                              : item.card.action === 'take-control'
                                ? 'Used {card} to gain ownership of {target}.'
                                : 'Used {card} to remove {target} from scoring.',
                      }
                    : {
                        id: 'log.action.other',
                        defaultMessage: 'Debug event: {action}.',
                      };
                default:
                  return {
                    id: 'log.action.other',
                    defaultMessage: 'Debug event: {action}.',
                  };
              }
            })();

            return (
              <li key={item.index}>
                <small>
                  <FormattedMessage
                    id="log.entry"
                    defaultMessage="Turn {count} · {player}"
                    values={{
                      player: playerReference(item.player),
                      count: item.turn,
                    }}
                  />
                </small>
                <span>
                  <FormattedMessage {...description} values={values} />
                </span>
                {item.nextPlayer && (
                  <small>
                    <FormattedMessage
                      id="log.nextPlayer"
                      defaultMessage="Next turn: {player}."
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
