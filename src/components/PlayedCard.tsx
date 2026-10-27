import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import {
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useContext,
} from 'react';
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
  card: PlacedCard | EventCard;
  style?: CSSProperties;
  links?: ReactNode;
  isLatest?: boolean;
  onTarget?: () => void;
  onShowDetails?: (card: EventCard) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  selected?: boolean;
};

export function PlayedCard({
  card,
  style,
  links,
  isLatest,
  onTarget,
  onShowDetails,
  onDragOver,
  onDrop,
  selected,
}: PlayedCardProps) {
  const targetClickTimer = useRef<number | null>(null);
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
        : intl.formatMessage<{ readonly name: MessageValue }>(
            { id: 'card.owner.player', defaultMessage: 'placed by {name}' },
            { name: ownerName },
          );

  useEffect(
    () => () => {
      if (targetClickTimer.current !== null) {
        window.clearTimeout(targetClickTimer.current);
      }
    },
    [],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- TODO this element is interactive, the whole app needs to be modified to handle roles better
    <div
      aria-label={intl.formatMessage<{
        readonly category: string;
        readonly latest: string;
        readonly name: MessageValue;
        readonly number: number | bigint;
        readonly owner: MessageValue;
      }>(
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
      role={onTarget || onShowDetails ? 'button' : 'img'}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- TODO this element is interactive, the whole app needs to be modified to handle roles better
      tabIndex={
        onTarget || onShowDetails || card.effects?.length ? 0 : undefined
      }
      aria-pressed={onTarget ? Boolean(selected) : undefined}
      onClick={(event) => {
        if (!onTarget) {
          return;
        }

        if (event.detail === 0) {
          onTarget();

          return;
        }

        if (targetClickTimer.current !== null) {
          window.clearTimeout(targetClickTimer.current);
          targetClickTimer.current = null;
        }

        if (event.detail > 1) {
          return;
        }

        targetClickTimer.current = window.setTimeout(() => {
          targetClickTimer.current = null;
          onTarget();
        }, 500);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();

        if (targetClickTimer.current !== null) {
          window.clearTimeout(targetClickTimer.current);
          targetClickTimer.current = null;
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
      aria-describedby={`${card.id}-details-description`}
      style={style}
    >
      {links}
      <AriaDescription id={`${card.id}-details-description`}>
        {[
          'removed' in card && card.removed
            ? intl.formatMessage({
                id: 'card.removedDescription',
                defaultMessage:
                  'Removed Event: scores no points and does not qualify for bonuses. It still has its date and links, can be moved or swapped, and can be overwritten by a valid Event.',
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
                id: 'card.detailsHint',
                defaultMessage:
                  'Double-click or press Alt + Enter to view card details.',
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
              id: 'card.removed',
              defaultMessage: 'Removed',
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
