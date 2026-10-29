import clsx from 'clsx';
import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { loadCardCatalog } from '../cardCatalog';
import { catalogGroups } from '../catalogGroups';
import type { Card } from '../game';
import {
  categoryMessages,
  commandNameMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
import { AriaDescription } from './AriaDescription';
import cardStyles from './Card.module.css';
import cardCatalogDialogStyles from './CardCatalogDialog.module.css';
import dialogStyles from './Dialog.module.css';
import { HandCardFace } from './HandCardFace';
import { PlayedCard } from './PlayedCard';

type CardView = 'hand' | 'table';
type CardSize = 'compact' | 'standard';

function CatalogCard({
  card,
  onShowDetails,
  view,
}: {
  card: Card;
  onShowDetails: (card: Card) => void;
  view: CardView;
}) {
  const cardView =
    view === 'table' && card.type === 'event' ? (
      <PlayedCard card={card} onShowDetails={onShowDetails} />
    ) : (
      <div
        aria-describedby="card-catalog-helper-message"
        className={clsx(
          cardStyles.card,
          cardCatalogDialogStyles.catalogHandCard,
        )}
        data-card-type={card.type}
        data-event-category={card.category}
        onDoubleClick={() => {
          onShowDetails(card);
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'Enter') {
            event.preventDefault();
            onShowDetails(card);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <AriaDescription id="card-catalog-helper-message">
          <FormattedMessage
            defaultMessage="Double-click or press Alt + Enter to view card details."
            id="card.detailsHint"
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
  const { deck, startingCard } = loadCardCatalog();
  const events = deck.filter((card) => card.type === 'event').length;
  const groups = catalogGroups(deck);

  return (
    <dialog
      aria-labelledby={titleId}
      className={clsx(
        dialogStyles.gameLogDialog,
        cardCatalogDialogStyles.cardCatalogDialog,
      )}
      data-card-size={size}
      ref={dialogRef}
    >
      <div
        className={clsx(
          dialogStyles.gameLogHeader,
          cardCatalogDialogStyles.cardCatalogHeader,
        )}
      >
        <h2 id={titleId}>
          <FormattedMessage defaultMessage="All cards" id="catalog.title" />
        </h2>
        <button
          aria-label={intl.formatMessage({
            defaultMessage: 'Close card catalog',
            id: 'catalog.close',
          })}
          className={dialogStyles.gameLogClose}
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p>
        <FormattedMessage
          defaultMessage="The complete configured deck, not just the cards remaining in this game. Every copy is shown. Double-click a card to view its details and effects."
          id="catalog.overview"
        />
      </p>
      <label className={cardCatalogDialogStyles.catalogView}>
        <FormattedMessage defaultMessage="Display cards" id="catalog.view" />
        <select
          onChange={(event) => {
            setView(event.currentTarget.value as CardView);
          }}
          value={view}
        >
          <option value="hand">
            <FormattedMessage defaultMessage="In hand" id="catalog.view.hand" />
          </option>
          <option value="table">
            <FormattedMessage
              defaultMessage="On table"
              id="catalog.view.table"
            />
          </option>
        </select>
      </label>
      <label className={cardCatalogDialogStyles.catalogView}>
        <FormattedMessage defaultMessage="Card size" id="catalog.size" />
        <select
          onChange={(event) => {
            setSize(event.currentTarget.value as CardSize);
          }}
          value={size}
        >
          <option value="standard">
            <FormattedMessage
              defaultMessage="Standard (124 × 88 px)"
              id="catalog.size.standard"
            />
          </option>
          <option value="compact">
            <FormattedMessage
              defaultMessage="Compact (104 × 72 px)"
              id="catalog.size.compact"
            />
          </option>
        </select>
      </label>
      <dl className={cardCatalogDialogStyles.catalogSummary}>
        {(
          [
            [
              intl.formatMessage({
                defaultMessage: 'Deck cards',
                id: 'catalog.deck',
              }),
              deck.length,
            ],
            [intl.formatMessage(startingEventNameMessage), events],
            [
              intl.formatMessage({
                defaultMessage: 'Command',
                id: 'card.command',
              }),
              deck.length - events,
            ],
            [
              intl.formatMessage({
                defaultMessage: 'Starting card',
                id: 'catalog.start',
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
          <FormattedMessage defaultMessage="Starting card" id="catalog.start" />
          <span>
            <FormattedMessage
              defaultMessage="{count, plural, one {# card} other {# cards}}"
              id="catalog.count"
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
      {groups.map(({ cards, id }) => {
        const card = cards[0];
        const label =
          card.type === 'event'
            ? card.category
              ? intl.formatMessage(categoryMessages[card.category])
              : intl.formatMessage({
                  defaultMessage: 'Event',
                  id: 'card.event',
                })
            : intl.formatMessage(commandNameMessages[card.action]);

        return (
          <section className={cardCatalogDialogStyles.catalogGroup} key={id}>
            <h3>
              {label}
              <span>
                <FormattedMessage
                  defaultMessage="{count, plural, one {# card} other {# cards}}"
                  id="catalog.count"
                  values={{ count: cards.length }}
                />
              </span>
            </h3>
            <ul className={cardCatalogDialogStyles.catalogGrid}>
              {cards.map((entry) => (
                <CatalogCard
                  card={entry}
                  key={entry.id}
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
