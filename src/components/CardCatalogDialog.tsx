import clsx from 'clsx';
import { type RefObject, useId } from 'react';
import { useIntl } from 'react-intl';

import { loadCardCatalog } from '../cardCatalog';
import { catalogGroups } from '../catalogGroups';
import type { Card } from '../game';
import { useMessages } from '../i18n/useMessages';
import cardStyles from './Card.module.css';
import cardCatalogDialogStyles from './CardCatalogDialog.module.css';
import { CardEffect } from './CardEffect';
import dialogStyles from './Dialog.module.css';

function CatalogCard({ card }: { card: Card }) {
  const t = useMessages();
  const intl = useIntl();

  return (
    <li
      className={cardCatalogDialogStyles.catalogEntry}
      data-catalog-card-id={card.id}
    >
      <div
        className={cardStyles.card}
        data-card-type={card.type}
        data-event-category={card.category}
      >
        <CardEffect
          effect={card.type === 'manipulation' ? card.action : card.effect}
          showTooltip
        />
        <strong
          className={
            card.type === 'manipulation'
              ? cardStyles.manipulationName
              : undefined
          }
        >
          {card.type === 'event'
            ? intl.formatNumber(card.number, { useGrouping: false })
            : t(`manipulation.${card.action}.name`)}
        </strong>
        <span className={cardStyles.cardTypeName}>
          {t(
            card.type === 'manipulation'
              ? 'card.manipulation'
              : card.category
                ? `card.category.${card.category}`
                : 'owner.neutral',
          )}
        </span>
      </div>
      <code>{card.id}</code>
      {card.effect && <small>{t(`effect.${card.effect}.name`)}</small>}
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
          <CatalogCard card={startingCard} />
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
                <CatalogCard key={entry.id} card={entry} />
              ))}
            </ul>
          </section>
        );
      })}
    </dialog>
  );
}
