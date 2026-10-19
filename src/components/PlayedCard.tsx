import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { useIntl } from 'react-intl';

import type { PlacedCard } from '../game';
import { positionKey } from '../gameRules';
import { useMessages } from '../i18n/useMessages';
import cardStyles from './Card.module.css';
import { CardEffect } from './CardEffect';
import ownershipStyles from './Ownership.module.css';
import playedCardStyles from './PlayedCard.module.css';

type PlayedCardProps = {
  card: PlacedCard;
  style: CSSProperties;
  links: ReactNode;
  isLatest: boolean;
  onTarget?: () => void;
  selected?: boolean;
};

export function PlayedCard({
  card,
  style,
  links,
  isLatest,
  onTarget,
  selected,
}: PlayedCardProps) {
  const t = useMessages();
  const intl = useIntl();

  return (
    <div
      aria-label={t('card.label', {
        number: card.number,
        category: card.category ?? 'neutral',
        owner: card.owner,
        latest: isLatest ? 'yes' : 'no',
      })}
      className={clsx(
        cardStyles.card,
        playedCardStyles.playedCard,
        card.owner === 'neutral'
          ? ownershipStyles.ownerNeutral
          : ownershipStyles[`owner${card.owner}`],
        {
          [playedCardStyles.latestCard]: isLatest,
          [playedCardStyles.manipulationTarget]: Boolean(onTarget),
          [playedCardStyles.manipulationSelected]: selected,
          [playedCardStyles.removedCard]: card.removed,
        },
      )}
      data-card-type={card.type}
      data-event-category={card.category}
      data-owner={card.owner}
      data-position={positionKey(card)}
      data-removed={card.removed || undefined}
      role={onTarget ? 'button' : 'img'}
      tabIndex={onTarget || card.effect ? 0 : undefined}
      aria-pressed={onTarget ? Boolean(selected) : undefined}
      onClick={onTarget}
      onKeyDown={(event) => {
        if (onTarget && ['Enter', ' '].includes(event.key)) {
          event.preventDefault();
          onTarget();
        }
      }}
      aria-description={
        card.removed
          ? t('card.removedDescription')
          : card.effect
            ? t(`effect.${card.effect}.description`)
            : undefined
      }
      style={style}
    >
      {links}
      <CardEffect effect={card.effect} />
      {isLatest && (
        <span className={playedCardStyles.latestBadge}>{t('card.latest')}</span>
      )}
      <strong>{intl.formatNumber(card.number, { useGrouping: false })}</strong>
      <span className={cardStyles.cardTypeName}>
        {t(
          card.removed
            ? 'card.removed'
            : card.category
              ? `card.category.${card.category}`
              : 'card.event',
        )}
      </span>
      <span className={cardStyles.ownerBadge}>{t(`owner.${card.owner}`)}</span>
    </div>
  );
}
