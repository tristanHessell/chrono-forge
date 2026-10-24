import { defineMessages, type MessageDescriptor } from 'react-intl';

import type {
  CardEffect,
  EventCategory,
  EventName,
  ManipulationAction,
} from '../game';
import type { Theme } from '../theme';

type DescriptorMap<Key extends string> = Record<Key, MessageDescriptor>;

export const categoryMessages: DescriptorMap<EventCategory> = defineMessages({
  environmental: {
    id: 'card.category.environmental',
    defaultMessage: 'Nature',
  },
  political: { id: 'card.category.political', defaultMessage: 'Politics' },
  technological: { id: 'card.category.technological', defaultMessage: 'Tech' },
});

export const manipulationNameMessages: DescriptorMap<ManipulationAction> =
  defineMessages({
    'remove-event': {
      id: 'manipulation.remove-event.name',
      defaultMessage: 'Remove Event',
    },
    'take-control': {
      id: 'manipulation.take-control.name',
      defaultMessage: 'Take Control',
    },
    'time-jump': {
      id: 'manipulation.time-jump.name',
      defaultMessage: 'Time Jump',
    },
    'time-swap': {
      id: 'manipulation.time-swap.name',
      defaultMessage: 'Time Swap',
    },
  });

export const manipulationDescriptionMessages: DescriptorMap<ManipulationAction> =
  defineMessages({
    'remove-event': {
      id: 'manipulation.remove-event.description',
      defaultMessage:
        'Mark an Event as removed. It stays on the board but scores no points or bonuses and no longer qualifies as a 1900 bonus source. It can still be moved, swapped, or overwritten with a valid Event. The starting card cannot be targeted.',
    },
    'take-control': {
      id: 'manipulation.take-control.description',
      defaultMessage:
        "Gain control of another player's Event card. Its points and any valid bonus become yours. A removed Event stays removed. The starting card cannot be targeted.",
    },
    'time-jump': {
      id: 'manipulation.time-jump.description',
      defaultMessage:
        "Move an Event card to a valid empty position or overwrite a removed Event. Empty destinations cannot touch another removed Event. A removed card can establish new links to earlier-dated active neighbors even if they were played after it. An overwrite preserves the destination's link directions and discards the replaced Event. Ownership and removed status stay with the moved card. The entire board must remain legal. The starting card cannot move.",
    },
    'time-swap': {
      id: 'manipulation.time-swap.description',
      defaultMessage:
        'Swap two Event cards while keeping the board legal. The starting card cannot be swapped.',
    },
  });

export const effectNameMessages: DescriptorMap<CardEffect> = defineMessages({
  'draw-one': { id: 'effect.draw-one.name', defaultMessage: 'Draw one card' },
  'free-action': {
    id: 'effect.free-action.name',
    defaultMessage: 'Free action',
  },
  'timeline-1900-bonus': {
    id: 'effect.timeline-1900-bonus.name',
    defaultMessage: '1900 timeline bonus',
  },
});

export const effectDescriptionMessages: DescriptorMap<CardEffect> =
  defineMessages({
    'draw-one': {
      id: 'effect.draw-one.description',
      defaultMessage:
        'When you confirm this Event card, draw one card from the deck into your hand. If the deck is empty, nothing is drawn. Discarding does not trigger this effect.',
    },
    'free-action': {
      id: 'effect.free-action.description',
      defaultMessage:
        'When you confirm this Event card, it does not count as one of your two actions this turn. You can still take up to two other actions.',
    },
    'timeline-1900-bonus': {
      id: 'effect.timeline-1900-bonus.description',
      defaultMessage:
        'Worth 1 extra point to the player who played this card if its timeline includes a 1900 Event card. Follow the arrows from 1900 to this card; a separate branch does not qualify. Each card awards this bonus only once.',
    },
  });

export const eventNameMessages: DescriptorMap<EventName> = defineMessages({
  'assembly-lines': {
    id: 'card.name.assembly-lines',
    defaultMessage: 'Assembly Lines',
  },
  'atomic-age': { id: 'card.name.atomic-age', defaultMessage: 'Atomic Age' },
  'civil-rights': {
    id: 'card.name.civil-rights',
    defaultMessage: 'Civil Rights',
  },
  'climate-summit': {
    id: 'card.name.climate-summit',
    defaultMessage: 'Climate Summit',
  },
  'cold-war': { id: 'card.name.cold-war', defaultMessage: 'Cold War' },
  'conservation-movement': {
    id: 'card.name.conservation-movement',
    defaultMessage: 'Conservation Movement',
  },
  'democratic-change': {
    id: 'card.name.democratic-change',
    defaultMessage: 'Democratic Change',
  },
  detente: { id: 'card.name.detente', defaultMessage: 'Détente' },
  'dust-bowl': { id: 'card.name.dust-bowl', defaultMessage: 'Dust Bowl' },
  'earth-day': { id: 'card.name.earth-day', defaultMessage: 'Earth Day' },
  'european-union': {
    id: 'card.name.european-union',
    defaultMessage: 'European Union',
  },
  'global-conflict': {
    id: 'card.name.global-conflict',
    defaultMessage: 'Global Conflict',
  },
  'green-revolution': {
    id: 'card.name.green-revolution',
    defaultMessage: 'Green Revolution',
  },
  'imperial-alliances': {
    id: 'card.name.imperial-alliances',
    defaultMessage: 'Imperial Alliances',
  },
  'internet-expansion': {
    id: 'card.name.internet-expansion',
    defaultMessage: 'Internet Expansion',
  },
  microprocessor: {
    id: 'card.name.microprocessor',
    defaultMessage: 'Microprocessor',
  },
  'moon-landing': {
    id: 'card.name.moon-landing',
    defaultMessage: 'Moon Landing',
  },
  'national-parks': {
    id: 'card.name.national-parks',
    defaultMessage: 'National Parks',
  },
  'new-deal': { id: 'card.name.new-deal', defaultMessage: 'New Deal' },
  'ozone-hole': { id: 'card.name.ozone-hole', defaultMessage: 'Ozone Hole' },
  'personal-computers': {
    id: 'card.name.personal-computers',
    defaultMessage: 'Personal Computers',
  },
  'powered-flight': {
    id: 'card.name.powered-flight',
    defaultMessage: 'Powered Flight',
  },
  'radar-discovery': {
    id: 'card.name.radar-discovery',
    defaultMessage: 'Radar Discovery',
  },
  'radio-age': { id: 'card.name.radio-age', defaultMessage: 'Radio Age' },
  'silent-spring': {
    id: 'card.name.silent-spring',
    defaultMessage: 'Silent Spring',
  },
  'smog-crisis': { id: 'card.name.smog-crisis', defaultMessage: 'Smog Crisis' },
  'space-race': { id: 'card.name.space-race', defaultMessage: 'Space Race' },
  suffrage: { id: 'card.name.suffrage', defaultMessage: 'Suffrage' },
  'timeline-origin': {
    id: 'card.name.timeline-origin',
    defaultMessage: 'Timeline Origin',
  },
  'united-nations': {
    id: 'card.name.united-nations',
    defaultMessage: 'United Nations',
  },
  'wildlife-refuges': {
    id: 'card.name.wildlife-refuges',
    defaultMessage: 'Wildlife Refuges',
  },
});

export const startingEventNameMessage: MessageDescriptor = defineMessages({
  startingEventNameMessage: {
    id: 'card.event',
    defaultMessage: 'Event',
  },
}).startingEventNameMessage;

export const themeMessages: DescriptorMap<Theme> = defineMessages({
  dark: { id: 'theme.dark', defaultMessage: 'Dark' },
  'greyscale-dark': {
    id: 'theme.greyscale-dark',
    defaultMessage: 'Greyscale Dark',
  },
  'greyscale-light': {
    id: 'theme.greyscale-light',
    defaultMessage: 'Greyscale Light',
  },
  light: { id: 'theme.light', defaultMessage: 'Light' },
});
