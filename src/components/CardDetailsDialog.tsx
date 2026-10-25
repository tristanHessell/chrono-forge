import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { useIntl } from 'react-intl';

import { eventCardNameMessage } from '../eventCardName';
import type { Card } from '../game';
import {
  categoryMessages,
  effectDescriptionMessages,
  effectNameMessages,
  manipulationDescriptionMessages,
  manipulationNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import cardStyles from './Card.module.css';
import cardDetailsStyles from './CardDetailsDialog.module.css';
import dialogStyles from './Dialog.module.css';
import { HandCardFace } from './HandCardFace';

export function CardDetailsDialog({
  card,
  onClose,
}: {
  card: Card | null;
  onClose: () => void;
}) {
  const intl = useIntl();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const cardName =
    card?.type === 'event'
      ? intl.formatMessage(eventCardNameMessage(card))
      : card
        ? intl.formatMessage(manipulationNameMessages[card.action])
        : '';
  const cardType =
    card?.type === 'manipulation'
      ? intl.formatMessage({
          id: 'card.manipulation',
          defaultMessage: 'Command',
        })
      : card?.category
        ? intl.formatMessage(categoryMessages[card.category])
        : intl.formatMessage(startingEventNameMessage);
  const effects =
    card?.type === 'manipulation'
      ? [
          {
            name: intl.formatMessage(manipulationNameMessages[card.action]),
            description: intl.formatMessage(
              manipulationDescriptionMessages[card.action],
            ),
          },
        ]
      : card?.effects?.map((effect) => ({
          name: intl.formatMessage(effectNameMessages[effect]),
          description: intl.formatMessage(effectDescriptionMessages[effect]),
        }));

  useEffect(() => {
    const dialog = dialogRef.current;

    if (card && dialog && !dialog.open) {
      dialog.showModal();
    }

    if (!card && dialog?.open) {
      dialog.close();
    }
  }, [card]);

  if (!card) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className={clsx(dialogStyles.gameLogDialog, cardDetailsStyles.dialog)}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className={dialogStyles.gameLogHeader}>
        <h2 id={titleId}>{cardName}</h2>
        <button
          className={dialogStyles.gameLogClose}
          type="button"
          aria-label={intl.formatMessage({
            id: 'card.details.close',
            defaultMessage: 'Close card details',
          })}
          onClick={() => dialogRef.current?.close()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className={cardDetailsStyles.details}>
        <div
          aria-hidden="true"
          className={clsx(cardStyles.card, cardDetailsStyles.preview)}
          data-card-type={card.type}
          data-event-category={card.category}
        >
          <HandCardFace card={card} />
        </div>
        <dl className={cardDetailsStyles.metadata}>
          {card.type === 'event' && (
            <div>
              <dt>
                {intl.formatMessage({
                  id: 'card.details.year',
                  defaultMessage: 'Year',
                })}
              </dt>
              <dd>{intl.formatNumber(card.number, { useGrouping: false })}</dd>
            </div>
          )}
          <div>
            <dt>
              {intl.formatMessage({
                id: 'card.details.type',
                defaultMessage: 'Type',
              })}
            </dt>
            <dd>{cardType}</dd>
          </div>
        </dl>
        <section className={cardDetailsStyles.effects}>
          <h3>
            {intl.formatMessage({
              id: 'card.details.effects',
              defaultMessage: 'Effects',
            })}
          </h3>
          {effects?.length ? (
            <ul>
              {effects.map(({ name, description }) => (
                <li key={name}>
                  <strong>{name}</strong>
                  <p>{description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {intl.formatMessage({
                id: 'card.details.noEffects',
                defaultMessage: 'No special effects.',
              })}
            </p>
          )}
        </section>
      </div>
    </dialog>
  );
}
