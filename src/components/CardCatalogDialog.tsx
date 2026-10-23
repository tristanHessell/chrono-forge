import clsx from 'clsx';
import { type RefObject, useId, useState } from 'react';
import { useIntl } from 'react-intl';

import { loadCardCatalog } from '../cardCatalog';
import { catalogGroups } from '../catalogGroups';
import type { Card } from '../game';
import {
  categoryMessages,
  manipulationNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import cardStyles from './Card.module.css';
import cardCatalogDialogStyles from './CardCatalogDialog.module.css';
import dialogStyles from './Dialog.module.css';
import { HandCardFace } from './HandCardFace';
import { PlayedCard } from './PlayedCard';

type CardView = 'hand' | 'table';
type CardSize = 'standard' | 'compact';

function CatalogCard({ card, view }: { card: Card; view: CardView }) {
  const cardView =
    view === 'table' && card.type === 'event' ? (
      <PlayedCard card={card} />
    ) : (
      <button
        className={`${cardStyles.card} ${cardCatalogDialogStyles.catalogHandCard}`}
        data-card-type={card.type}
        data-event-category={card.category}
        disabled
        type="button"
      >
        <HandCardFace card={card} />
      </button>
    );

  return (
    <li
      className={cardCatalogDialogStyles.catalogEntry}
      data-catalog-card-id={card.id}
    >
      {cardView}
      <code>{card.id}</code>
    </li>
  );
}

export function CardCatalogDialog({
  dialogRef,
}: {
  dialogRef: RefObject<HTMLDialogElement>;
}) {
  const intl = useIntl();
  const titleId = useId();
  const [view, setView] = useState<CardView>('hand');
  const [size, setSize] = useState<CardSize>('standard');
  const { startingCard, deck } = loadCardCatalog();
  const events = deck.filter((card) => card.type === 'event').length;
  const groups = catalogGroups(deck);

  return (
    <dialog
      ref={dialogRef}
      className={clsx(
        dialogStyles.gameLogDialog,
        cardCatalogDialogStyles.cardCatalogDialog,
      )}
      data-card-size={size}
      aria-labelledby={titleId}
    >
      <div
        className={clsx(
          dialogStyles.gameLogHeader,
          cardCatalogDialogStyles.cardCatalogHeader,
        )}
      >
        <h2 id={titleId}>
          {intl.formatMessage({
            id: 'catalog.title',
            defaultMessage: 'All cards',
          })}
        </h2>
        <button
          className={dialogStyles.gameLogClose}
          type="button"
          aria-label={intl.formatMessage({
            id: 'catalog.close',
            defaultMessage: 'Close card catalog',
          })}
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p>
        {intl.formatMessage({
          id: 'catalog.overview',
          defaultMessage:
            'The complete configured deck, not just the cards remaining in this game. Every copy is shown. Hover over or focus an effect icon for its explanation.',
        })}
      </p>
      <label className={cardCatalogDialogStyles.catalogView}>
        {intl.formatMessage({
          id: 'catalog.view',
          defaultMessage: 'Display cards',
        })}
        <select
          value={view}
          onChange={(event) => setView(event.currentTarget.value as CardView)}
        >
          <option value="hand">
            {intl.formatMessage({
              id: 'catalog.view.hand',
              defaultMessage: 'In hand',
            })}
          </option>
          <option value="table">
            {intl.formatMessage({
              id: 'catalog.view.table',
              defaultMessage: 'On table',
            })}
          </option>
        </select>
      </label>
      <label className={cardCatalogDialogStyles.catalogView}>
        {intl.formatMessage({
          id: 'catalog.size',
          defaultMessage: 'Card size',
        })}
        <select
          value={size}
          onChange={(event) => setSize(event.currentTarget.value as CardSize)}
        >
          <option value="standard">
            {intl.formatMessage({
              id: 'catalog.size.standard',
              defaultMessage: 'Standard (124 × 88 px)',
            })}
          </option>
          <option value="compact">
            {intl.formatMessage({
              id: 'catalog.size.compact',
              defaultMessage: 'Compact (104 × 72 px)',
            })}
          </option>
        </select>
      </label>
      <dl className={cardCatalogDialogStyles.catalogSummary}>
        {(
          [
            [
              intl.formatMessage(
                { id: 'catalog.deck', defaultMessage: 'Deck cards' },
                { count: deck.length },
              ),
              deck.length,
            ],
            [intl.formatMessage(startingEventNameMessage), events],
            [
              intl.formatMessage({
                id: 'card.manipulation',
                defaultMessage: 'Command',
              }),
              deck.length - events,
            ],
            [
              intl.formatMessage({
                id: 'catalog.start',
                defaultMessage: 'Starting card',
              }),
              1,
            ],
          ] as const
        ).map(([label, count]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{intl.formatNumber(count)}</dd>
          </div>
        ))}
      </dl>
      <section className={cardCatalogDialogStyles.catalogGroup}>
        <h3>
          {intl.formatMessage({
            id: 'catalog.start',
            defaultMessage: 'Starting card',
          })}{' '}
          <span>
            {intl.formatMessage(
              {
                id: 'catalog.count',
                defaultMessage: '{count, plural, one {# card} other {# cards}}',
              },
              { count: 1 },
            )}
          </span>
        </h3>
        <ul className={cardCatalogDialogStyles.catalogGrid}>
          <CatalogCard card={startingCard} view={view} />
        </ul>
      </section>
      {groups.map(({ id, cards }) => {
        const card = cards[0];
        const label =
          card.type === 'event'
            ? card.category
              ? intl.formatMessage(categoryMessages[card.category])
              : intl.formatMessage({
                  id: 'card.event',
                  defaultMessage: 'Event',
                })
            : intl.formatMessage(manipulationNameMessages[card.action]);

        return (
          <section className={cardCatalogDialogStyles.catalogGroup} key={id}>
            <h3>
              {label}{' '}
              <span>
                {intl.formatMessage(
                  {
                    id: 'catalog.count',
                    defaultMessage:
                      '{count, plural, one {# card} other {# cards}}',
                  },
                  { count: cards.length },
                )}
              </span>
            </h3>
            <ul className={cardCatalogDialogStyles.catalogGrid}>
              {cards.map((entry) => (
                <CatalogCard key={entry.id} card={entry} view={view} />
              ))}
            </ul>
          </section>
        );
      })}
    </dialog>
  );
}
