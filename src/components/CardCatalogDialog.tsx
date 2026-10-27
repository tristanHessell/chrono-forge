import clsx from 'clsx';
import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { loadCardCatalog } from '../cardCatalog';
import { catalogGroups } from '../catalogGroups';
import type { Card } from '../game';
import {
  categoryMessages,
  manipulationNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import { AriaDescription } from './AriaDescription';
import cardStyles from './Card.module.css';
import cardCatalogDialogStyles from './CardCatalogDialog.module.css';
import dialogStyles from './Dialog.module.css';
import { HandCardFace } from './HandCardFace';
import { PlayedCard } from './PlayedCard';

type CardView = 'hand' | 'table';
type CardSize = 'standard' | 'compact';

function CatalogCard({
  card,
  view,
  onShowDetails,
}: {
  card: Card;
  view: CardView;
  onShowDetails: (card: Card) => void;
}) {
  const cardView =
    view === 'table' && card.type === 'event' ? (
      <PlayedCard card={card} onShowDetails={onShowDetails} />
    ) : (
      <div
        className={clsx(
          cardStyles.card,
          cardCatalogDialogStyles.catalogHandCard,
        )}
        data-card-type={card.type}
        data-event-category={card.category}
        role="button"
        tabIndex={0}
        aria-describedby="card-catalog-helper-message"
        onDoubleClick={() => {
          onShowDetails(card);
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'Enter') {
            event.preventDefault();
            onShowDetails(card);
          }
        }}
      >
        <AriaDescription id="card-catalog-helper-message">
          <FormattedMessage
            id="card.detailsHint"
            defaultMessage="Double-click or press Alt + Enter to view card details."
          />
        </AriaDescription>
        <HandCardFace card={card} />
      </div>
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
  onShowDetails,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  onShowDetails: (card: Card) => void;
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
          <FormattedMessage id="catalog.title" defaultMessage="All cards" />
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
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p>
        <FormattedMessage
          id="catalog.overview"
          defaultMessage="The complete configured deck, not just the cards remaining in this game. Every copy is shown. Double-click a card to view its details and effects."
        />
      </p>
      <label className={cardCatalogDialogStyles.catalogView}>
        <FormattedMessage id="catalog.view" defaultMessage="Display cards" />
        <select
          value={view}
          onChange={(event) => {
            setView(event.currentTarget.value as CardView);
          }}
        >
          <option value="hand">
            <FormattedMessage id="catalog.view.hand" defaultMessage="In hand" />
          </option>
          <option value="table">
            <FormattedMessage
              id="catalog.view.table"
              defaultMessage="On table"
            />
          </option>
        </select>
      </label>
      <label className={cardCatalogDialogStyles.catalogView}>
        <FormattedMessage id="catalog.size" defaultMessage="Card size" />
        <select
          value={size}
          onChange={(event) => {
            setSize(event.currentTarget.value as CardSize);
          }}
        >
          <option value="standard">
            <FormattedMessage
              id="catalog.size.standard"
              defaultMessage="Standard (124 × 88 px)"
            />
          </option>
          <option value="compact">
            <FormattedMessage
              id="catalog.size.compact"
              defaultMessage="Compact (104 × 72 px)"
            />
          </option>
        </select>
      </label>
      <dl className={cardCatalogDialogStyles.catalogSummary}>
        {(
          [
            [
              intl.formatMessage({
                id: 'catalog.deck',
                defaultMessage: 'Deck cards',
              }),
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
          <FormattedMessage id="catalog.start" defaultMessage="Starting card" />
          <span>
            <FormattedMessage
              id="catalog.count"
              defaultMessage="{count, plural, one {# card} other {# cards}}"
              values={{ count: 1 }}
            />
          </span>
        </h3>
        <ul className={cardCatalogDialogStyles.catalogGrid}>
          <CatalogCard
            card={startingCard}
            onShowDetails={onShowDetails}
            view={view}
          />
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
              {label}
              <span>
                <FormattedMessage
                  id="catalog.count"
                  defaultMessage="{count, plural, one {# card} other {# cards}}"
                  values={{ count: cards.length }}
                />
              </span>
            </h3>
            <ul className={cardCatalogDialogStyles.catalogGrid}>
              {cards.map((entry) => (
                <CatalogCard
                  key={entry.id}
                  card={entry}
                  onShowDetails={onShowDetails}
                  view={view}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </dialog>
  );
}
