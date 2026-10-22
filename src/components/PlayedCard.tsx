import clsx from 'clsx';
import { type CSSProperties, type ReactNode, useContext } from 'react';
import { useIntl } from 'react-intl';

import { eventCardNameMessageId } from '../eventCardName';
import type { EventCard, PlacedCard } from '../game';
import { positionKey } from '../gameRules';
import { useMessages } from '../i18n/useMessages';
import { getPlayer, PlayerSetupContext } from '../playerSetup';
import cardStyles from './Card.module.css';
import { CardEffect } from './CardEffect';
import { CardEventName } from './CardEventName';
import ownershipStyles from './Ownership.module.css';
import playedCardStyles from './PlayedCard.module.css';

type PlayedCardProps = {
  card: PlacedCard | EventCard;
  style?: CSSProperties;
  links?: ReactNode;
  isLatest?: boolean;
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
  const players = useContext(PlayerSetupContext);
  const owner = 'owner' in card ? card.owner : 'neutral';
  const ownerName =
    owner === 'neutral' ? t('owner.neutral') : getPlayer(players, owner).name;
  const ownerDescription =
    owner === 'neutral'
      ? t('card.owner.start')
      : owner === '0'
        ? t('card.owner.you')
        : t('card.owner.player', { name: ownerName });

  return (
    <div
      aria-label={t('card.label', {
        name: t(eventCardNameMessageId(card)),
        number: card.number,
        category: card.category ?? 'neutral',
        owner: ownerDescription,
        latest: isLatest ? 'yes' : 'no',
      })}
      className={clsx(
        cardStyles.card,
        playedCardStyles.playedCard,
        owner === 'neutral'
          ? ownershipStyles.ownerNeutral
          : ownershipStyles[`owner${owner}`],
        {
          [playedCardStyles.latestCard]: isLatest,
          [playedCardStyles.manipulationTarget]: Boolean(onTarget),
          [playedCardStyles.manipulationSelected]: selected,
          [playedCardStyles.removedCard]:
            'removed' in card && Boolean(card.removed),
        },
      )}
      data-card-type={card.type}
      data-event-category={card.category}
      data-owner={'owner' in card ? owner : undefined}
      data-position={'row' in card ? positionKey(card) : undefined}
      data-removed={'removed' in card ? card.removed || undefined : undefined}
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
        'removed' in card && card.removed
          ? t('card.removedDescription')
          : card.effect
            ? t(`effect.${card.effect}.description`)
            : undefined
      }
      style={style}
    >
      {links}
      <CardEffect effect={card.effect} />
      <strong>{intl.formatNumber(card.number, { useGrouping: false })}</strong>
      <CardEventName card={card} />
      <span className={cardStyles.cardTypeName}>
        {t(
          'removed' in card && card.removed
            ? 'card.removed'
            : card.category
              ? `card.category.${card.category}`
              : 'card.event',
        )}
      </span>
      {'owner' in card && (
        <span className={cardStyles.ownerBadge}>{ownerName}</span>
      )}
    </div>
  );
}
