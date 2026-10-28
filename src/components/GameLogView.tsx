import clsx from 'clsx';
import { use, useMemo } from 'react';
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
  const players = use(PlayerSetupContext);
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
        defaultMessage: 'a card',
        id: 'log.unknownCard',
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
      data-card-type={card?.type}
      data-event-category={card?.category}
    >
      {cardName(card)}
    </strong>
  );

  return (
    <section
      aria-label={intl.formatMessage({
        defaultMessage: 'Game action history',
        id: 'log.history',
      })}
      className={gameLogViewStyles.gameLogReadable}
    >
      <dl className={gameLogViewStyles.gameLogMetadata}>
        <div>
          <dt>
            <FormattedMessage defaultMessage="Initial seed" id="log.seed" />
          </dt>
          <dd>
            <code>{log.seed}</code>
          </dd>
        </div>
        <div>
          <dt>
            <FormattedMessage defaultMessage="Players" id="game.players" />
          </dt>
          <dd>{log.numPlayers}</dd>
        </div>
      </dl>
      <p>
        <FormattedMessage
          defaultMessage="Game started. {player} takes the first turn."
          id="log.started"
          values={{ player: playerReference('0') }}
        />
      </p>
      {items.length === 0 ? (
        <p>
          <FormattedMessage defaultMessage="No actions yet." id="log.empty" />
        </p>
      ) : (
        <ol className={gameLogViewStyles.gameLogEntries}>
          {items.map((item) => {
            const values = {
              action: item.move,
              card: cardReference(item.card),
              column: item.position?.column ?? 0,
              row: item.position?.row ?? 0,
              second: cardReference(item.secondTarget),
              target: cardReference(item.target),
            };
            const description = (() => {
              switch (item.move) {
                case 'playEvent':
                  return {
                    defaultMessage:
                      'Confirmed {card} at row {row}, column {column}.',
                    id: 'log.action.confirm',
                  };
                case 'confirmPlacement':
                  return {
                    defaultMessage:
                      'Confirmed {card} at row {row}, column {column}.',
                    id: 'log.action.confirm',
                  };
                case 'replacePendingCard':
                  return {
                    defaultMessage:
                      'Replaced the unconfirmed card with {card}.',
                    id: 'log.action.replace',
                  };
                case 'movePendingCard':
                  return {
                    defaultMessage:
                      'Moved unconfirmed {card} to row {row}, column {column}.',
                    id: 'log.action.move',
                  };
                case 'returnPendingCard':
                  return {
                    defaultMessage: 'Returned unconfirmed {card} to hand.',
                    id: 'log.action.return',
                  };
                case 'discardCard':
                  return {
                    defaultMessage: 'Discarded {card}.',
                    id: 'log.action.discard',
                  };
                case 'manipulate':
                  return item.card?.type === 'manipulation'
                    ? {
                        defaultMessage:
                          item.card.action === 'time-jump'
                            ? 'Used {card} to move {target} to row {row}, column {column}.'
                            : item.card.action === 'time-swap'
                              ? 'Used {card} to swap {target} with {second}.'
                              : item.card.action === 'take-control'
                                ? 'Used {card} to gain ownership of {target}.'
                                : 'Used {card} to remove {target} from scoring.',
                        id: `log.action.${item.card.action}`,
                      }
                    : {
                        defaultMessage: 'Debug event: {action}.',
                        id: 'log.action.other',
                      };
                default:
                  return {
                    defaultMessage: 'Debug event: {action}.',
                    id: 'log.action.other',
                  };
              }
            })();

            return (
              <li key={item.index}>
                <small>
                  <FormattedMessage
                    defaultMessage="Turn {count} · {player}"
                    id="log.entry"
                    values={{
                      count: item.turn,
                      player: playerReference(item.player),
                    }}
                  />
                </small>
                <span>
                  <FormattedMessage {...description} values={values} />
                </span>
                {item.nextPlayer && (
                  <small>
                    <FormattedMessage
                      defaultMessage="Next turn: {player}."
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
