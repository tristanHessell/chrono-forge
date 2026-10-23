import clsx from 'clsx';
import { type CSSProperties, type ReactNode, useContext } from 'react';
import { useIntl } from 'react-intl';

import { eventCardNameMessage } from '../eventCardName';
import type { EventCard, PlacedCard } from '../game';
import { positionKey } from '../gameRules';
import {
  categoryMessages,
  effectDescriptionMessages,
  startingEventNameMessage,
} from '../i18n/messageDescriptors';
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

export function PlayedCard ({
  card,
  style,
  links,
  isLatest,
  onTarget,
  selected,
}: PlayedCardProps) {
  const intl = useIntl();
  const players = useContext(PlayerSetupContext);
  const owner = 'owner' in card ? card.owner : 'neutral';
  const ownerName =
    owner === 'neutral'
      ? intl.formatMessage({ id: 'owner.neutral', defaultMessage: 'Start' })
      : getPlayer(players, owner).name;
  const ownerDescription =
    owner === 'neutral'
      ? intl.formatMessage({
          id: 'card.owner.start',
          defaultMessage: 'starting card',
        })
      : owner === '0'
        ? intl.formatMessage({
            id: 'card.owner.you',
            defaultMessage: 'placed by you',
          })
        : intl.formatMessage(
            { id: 'card.owner.player', defaultMessage: 'placed by {name}' },
            { name: ownerName },
          );

  return (
    <div
      aria-label={intl.formatMessage(
        {
          id: 'card.label',
          defaultMessage:
            '{name}, {category, select, political {Politics} technological {Tech} environmental {Nature} other {Event}} card {number, number, ::group-off}, {owner}{latest, select, yes {, latest played card} other {}}',
        },
        {
          name: intl.formatMessage(eventCardNameMessage(card)),
          number: card.number,
          category: card.category ?? 'neutral',
          owner: ownerDescription,
          latest: isLatest ? 'yes' : 'no',
        },
      )}
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
          ? intl.formatMessage({
              id: 'card.removedDescription',
              defaultMessage:
                'Removed Event: scores no points and does not qualify for bonuses. It still has its date and links, can be moved or swapped, and can be overwritten by a valid Event.',
            })
          : card.effect
            ? intl.formatMessage(effectDescriptionMessages[card.effect])
            : undefined
      }
      style={style}
    >
      {links}
      <CardEffect effect={card.effect} />
      <strong>{intl.formatNumber(card.number, { useGrouping: false })}</strong>
      <CardEventName card={card} />
      <span className={cardStyles.cardTypeName}>
        {intl.formatMessage(
          'removed' in card && card.removed
            ? { id: 'card.removed', defaultMessage: 'Removed' }
            : card.category
              ? categoryMessages[card.category]
              : startingEventNameMessage,
        )}
      </span>
      {'owner' in card && (
        <span className={cardStyles.ownerBadge}>{ownerName}</span>
      )}
    </div>
  );
}
