import clsx from 'clsx';
import { type RefObject, useId, useState } from 'react';
import { useIntl } from 'react-intl';

import { loadCardCatalog } from '../cardCatalog';
import { catalogGroups } from '../catalogGroups';
import type { Card } from '../game';
import { useMessages } from '../i18n/useMessages';
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
  const t = useMessages();
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
        <h2 id={titleId}>{t('catalog.title')}</h2>
        <button
          className={dialogStyles.gameLogClose}
          type="button"
          aria-label={t('catalog.close')}
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p>{t('catalog.overview')}</p>
      <label className={cardCatalogDialogStyles.catalogView}>
        {t('catalog.view')}
        <select
          value={view}
          onChange={(event) => setView(event.currentTarget.value as CardView)}
        >
          <option value="hand">{t('catalog.view.hand')}</option>
          <option value="table">{t('catalog.view.table')}</option>
        </select>
      </label>
      <label className={cardCatalogDialogStyles.catalogView}>
        {t('catalog.size')}
        <select
          value={size}
          onChange={(event) => setSize(event.currentTarget.value as CardSize)}
        >
          <option value="standard">{t('catalog.size.standard')}</option>
          <option value="compact">{t('catalog.size.compact')}</option>
        </select>
      </label>
      <dl className={cardCatalogDialogStyles.catalogSummary}>
        {(
          [
            ['catalog.deck', deck.length],
            ['card.event', events],
            ['card.manipulation', deck.length - events],
            ['catalog.start', 1],
          ] as const
        ).map(([label, count]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd>{intl.formatNumber(count)}</dd>
          </div>
        ))}
      </dl>
      <section className={cardCatalogDialogStyles.catalogGroup}>
        <h3>
          {t('catalog.start')} <span>{t('catalog.count', { count: 1 })}</span>
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
              ? t(`card.category.${card.category}`)
              : t('card.event')
            : t(`manipulation.${card.action}.name`);

        return (
          <section className={cardCatalogDialogStyles.catalogGroup} key={id}>
            <h3>
              {label} <span>{t('catalog.count', { count: cards.length })}</span>
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
