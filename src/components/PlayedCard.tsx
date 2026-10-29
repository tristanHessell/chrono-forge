import clsx from 'clsx';
import { use, useEffect, useRef } from 'react';
import type { MessageValue } from 'react-intl';
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
import { AriaDescription } from './AriaDescription';
import cardStyles from './Card.module.css';
import { CardEffects } from './CardEffect';
import { CardEventName } from './CardEventName';
import ownershipStyles from './Ownership.module.css';
import playedCardStyles from './PlayedCard.module.css';

type PlayedCardProps = {
  card: EventCard | PlacedCard;
  isLatest?: boolean;
  links?: React.ReactNode;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onShowDetails?: (card: EventCard) => void;
  onTarget?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
};

export function PlayedCard({
  card,
  isLatest,
  links,
  onDragOver,
  onDrop,
  onShowDetails,
  onTarget,
  selected,
  style,
}: PlayedCardProps) {
  const targetClickTimerRef = useRef<null | number>(null);
  const intl = useIntl();
  const players = use(PlayerSetupContext);
  const owner = 'owner' in card ? card.owner : 'neutral';
  const ownerName =
    owner === 'neutral'
      ? intl.formatMessage({ defaultMessage: 'Start', id: 'owner.neutral' })
      : getPlayer(players, owner).name;
  const ownerDescription =
    owner === 'neutral'
      ? intl.formatMessage({
          defaultMessage: 'starting card',
          id: 'card.owner.start',
        })
      : owner === '0'
        ? intl.formatMessage({
            defaultMessage: 'placed by you',
            id: 'card.owner.you',
          })
        : intl.formatMessage<{ readonly name: MessageValue }>(
            { defaultMessage: 'placed by {name}', id: 'card.owner.player' },
            { name: ownerName },
          );

  useEffect(
    () => () => {
      if (targetClickTimerRef.current !== null) {
        window.clearTimeout(targetClickTimerRef.current);
      }
    },
    [],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- TODO this element is interactive, the whole app needs to be modified to handle roles better
    <div
      aria-describedby={`${card.id}-details-description`}
      aria-label={intl.formatMessage<{
        readonly category: string;
        readonly latest: string;
        readonly name: MessageValue;
        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
        readonly number: number | bigint;
        readonly owner: MessageValue;
      }>(
        {
          defaultMessage:
            '{name}, {category, select, politics {Politics} tech {Tech} nature {Nature} other {Event}} card {number, number, ::group-off}, {owner}{latest, select, yes {, latest played card} other {}}',
          id: 'card.label',
        },
        {
          category: card.category ?? 'neutral',
          latest: isLatest ? 'yes' : 'no',
          name: intl.formatMessage(eventCardNameMessage(card)),
          number: card.number,
          owner: ownerDescription,
        },
      )}
      aria-pressed={onTarget ? Boolean(selected) : undefined}
      className={clsx(
        cardStyles.card,
        playedCardStyles.playedCard,
        owner === 'neutral'
          ? ownershipStyles.ownerNeutral
          : ownershipStyles[`owner${owner}`],
        {
          [playedCardStyles.commandSelected]: selected,
          [playedCardStyles.commandTarget]: Boolean(onTarget),
          [playedCardStyles.latestCard]: isLatest,
          [playedCardStyles.removedCard]:
            'removed' in card && Boolean(card.removed),
        },
      )}
      data-card-type={card.type}
      data-event-category={card.category}
      data-owner={'owner' in card ? owner : undefined}
      data-position={'row' in card ? positionKey(card) : undefined}
      data-removed={'removed' in card ? card.removed || undefined : undefined}
      onClick={(event) => {
        if (!onTarget) {
          return;
        }

        if (event.detail === 0) {
          onTarget();

          return;
        }

        if (targetClickTimerRef.current !== null) {
          window.clearTimeout(targetClickTimerRef.current);
          targetClickTimerRef.current = null;
        }

        if (event.detail > 1) {
          return;
        }

        targetClickTimerRef.current = window.setTimeout(() => {
          targetClickTimerRef.current = null;
          onTarget();
        }, 500);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();

        if (targetClickTimerRef.current !== null) {
          window.clearTimeout(targetClickTimerRef.current);
          targetClickTimerRef.current = null;
        }

        onShowDetails?.(card);
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={(event) => {
        if (event.altKey && event.key === 'Enter') {
          event.preventDefault();
          onShowDetails?.(card);

          return;
        }

        if (onTarget && ['Enter', ' '].includes(event.key)) {
          event.preventDefault();
          onTarget();
        }
      }}
      role={onTarget || onShowDetails ? 'button' : 'img'}
      style={style}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- TODO this element is interactive, the whole app needs to be modified to handle roles better
      tabIndex={
        onTarget || onShowDetails || card.effects?.length ? 0 : undefined
      }
    >
      {links}
      <AriaDescription id={`${card.id}-details-description`}>
        {[
          'removed' in card && card.removed
            ? intl.formatMessage({
                defaultMessage:
                  'Removed Event: scores no points and does not qualify for bonuses. It still has its date and links, can be moved or swapped, and can be overwritten by a valid Event.',
                id: 'card.removedDescription',
              })
            : card.effects?.length
              ? intl.formatList(
                  card.effects.map((effect) =>
                    intl.formatMessage(effectDescriptionMessages[effect]),
                  ),
                )
              : '',
          onShowDetails
            ? intl.formatMessage({
                defaultMessage:
                  'Double-click or press Alt + Enter to view card details.',
                id: 'card.detailsHint',
              })
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      </AriaDescription>
      <CardEffects effects={card.effects} />
      <strong>{intl.formatNumber(card.number, { useGrouping: false })}</strong>
      <CardEventName card={card} />
      <span className={cardStyles.cardTypeName}>
        {'removed' in card && card.removed
          ? intl.formatMessage({
              defaultMessage: 'Removed',
              id: 'card.removed',
            })
          : intl.formatMessage(
              card.category
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
