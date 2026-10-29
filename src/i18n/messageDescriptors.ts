import { defineMessages, type TypedMessageDescriptor } from 'react-intl';

import type {
  CardEffect,
  CommandAction,
  EventCategory,
  EventName,
} from '../game';
import type { Theme } from '../theme';

type DescriptorMap<Key extends string> = Record<Key, TypedMessageDescriptor>;

export const categoryMessages = defineMessages({
  nature: {
    defaultMessage: 'Nature',
    id: 'card.category.nature',
  },
  politics: { defaultMessage: 'Politics', id: 'card.category.politics' },
  tech: { defaultMessage: 'Tech', id: 'card.category.tech' },
}) satisfies DescriptorMap<EventCategory>;

export const commandNameMessages = defineMessages({
  'remove-event': {
    defaultMessage: 'Remove Event',
    id: 'command.remove-event.name',
  },
  'take-control': {
    defaultMessage: 'Take Control',
    id: 'command.take-control.name',
  },
  'time-jump': {
    defaultMessage: 'Time Jump',
    id: 'command.time-jump.name',
  },
  'time-swap': {
    defaultMessage: 'Time Swap',
    id: 'command.time-swap.name',
  },
}) satisfies DescriptorMap<CommandAction>;

export const commandDescriptionMessages = defineMessages({
  'remove-event': {
    defaultMessage:
      'Mark an Event as removed. It stays on the board but scores no points or bonuses and no longer qualifies as a 1900 bonus source. It can still be moved, swapped, or overwritten with a valid Event. The starting card cannot be targeted.',
    id: 'command.remove-event.description',
  },
  'take-control': {
    defaultMessage:
      "Gain control of another player's Event card. Its points and any valid bonus become yours. A removed Event stays removed. The starting card cannot be targeted.",
    id: 'command.take-control.description',
  },
  'time-jump': {
    defaultMessage:
      "Move an Event card to a valid empty position or overwrite a removed Event. Empty destinations cannot touch another removed Event. A removed card can establish new links to earlier-dated active neighbors even if they were played after it. An overwrite preserves the destination's link directions and discards the replaced Event. Ownership and removed status stay with the moved card. The entire board must remain legal. The starting card cannot move.",
    id: 'command.time-jump.description',
  },
  'time-swap': {
    defaultMessage:
      'Swap two Event cards while keeping the board legal. The starting card cannot be swapped.',
    id: 'command.time-swap.description',
  },
}) satisfies DescriptorMap<CommandAction>;

export const effectNameMessages = defineMessages({
  'draw-one': { defaultMessage: 'Draw one card', id: 'effect.draw-one.name' },
  'free-action': {
    defaultMessage: 'Free action',
    id: 'effect.free-action.name',
  },
  'timeline-1900-bonus': {
    defaultMessage: '1900 timeline bonus',
    id: 'effect.timeline-1900-bonus.name',
  },
}) satisfies DescriptorMap<CardEffect>;

export const effectDescriptionMessages = defineMessages({
  'draw-one': {
    defaultMessage:
      'When you confirm this Event card, draw one card from the deck into your hand. If the deck is empty, nothing is drawn. Discarding does not trigger this effect.',
    id: 'effect.draw-one.description',
  },
  'free-action': {
    defaultMessage:
      'When you confirm this Event card, it does not count as one of your two actions this turn. You can still take up to two other actions.',
    id: 'effect.free-action.description',
  },
  'timeline-1900-bonus': {
    defaultMessage:
      'Worth 1 extra point to the player who played this card if its timeline includes a 1900 Event card. Follow the arrows from 1900 to this card; a separate branch does not qualify. Each card awards this bonus only once.',
    id: 'effect.timeline-1900-bonus.description',
  },
}) satisfies DescriptorMap<CardEffect>;

export const eventNameMessages = defineMessages({
  'assembly-lines': {
    defaultMessage: 'Assembly Lines',
    id: 'card.name.assembly-lines',
  },
  'atomic-age': { defaultMessage: 'Atomic Age', id: 'card.name.atomic-age' },
  'civil-rights': {
    defaultMessage: 'Civil Rights',
    id: 'card.name.civil-rights',
  },
  'climate-summit': {
    defaultMessage: 'Climate Summit',
    id: 'card.name.climate-summit',
  },
  'cold-war': { defaultMessage: 'Cold War', id: 'card.name.cold-war' },
  'conservation-movement': {
    defaultMessage: 'Conservation Movement',
    id: 'card.name.conservation-movement',
  },
  'democratic-change': {
    defaultMessage: 'Democratic Change',
    id: 'card.name.democratic-change',
  },
  detente: { defaultMessage: 'Détente', id: 'card.name.detente' },
  'dust-bowl': { defaultMessage: 'Dust Bowl', id: 'card.name.dust-bowl' },
  'earth-day': { defaultMessage: 'Earth Day', id: 'card.name.earth-day' },
  'european-union': {
    defaultMessage: 'European Union',
    id: 'card.name.european-union',
  },
  'global-conflict': {
    defaultMessage: 'Global Conflict',
    id: 'card.name.global-conflict',
  },
  'green-revolution': {
    defaultMessage: 'Green Revolution',
    id: 'card.name.green-revolution',
  },
  'imperial-alliances': {
    defaultMessage: 'Imperial Alliances',
    id: 'card.name.imperial-alliances',
  },
  'internet-expansion': {
    defaultMessage: 'Internet Expansion',
    id: 'card.name.internet-expansion',
  },
  microprocessor: {
    defaultMessage: 'Microprocessor',
    id: 'card.name.microprocessor',
  },
  'moon-landing': {
    defaultMessage: 'Moon Landing',
    id: 'card.name.moon-landing',
  },
  'national-parks': {
    defaultMessage: 'National Parks',
    id: 'card.name.national-parks',
  },
  'new-deal': { defaultMessage: 'New Deal', id: 'card.name.new-deal' },
  'ozone-hole': { defaultMessage: 'Ozone Hole', id: 'card.name.ozone-hole' },
  'personal-computers': {
    defaultMessage: 'Personal Computers',
    id: 'card.name.personal-computers',
  },
  'powered-flight': {
    defaultMessage: 'Powered Flight',
    id: 'card.name.powered-flight',
  },
  'radar-discovery': {
    defaultMessage: 'Radar Discovery',
    id: 'card.name.radar-discovery',
  },
  'radio-age': { defaultMessage: 'Radio Age', id: 'card.name.radio-age' },
  'silent-spring': {
    defaultMessage: 'Silent Spring',
    id: 'card.name.silent-spring',
  },
  'smog-crisis': { defaultMessage: 'Smog Crisis', id: 'card.name.smog-crisis' },
  'space-race': { defaultMessage: 'Space Race', id: 'card.name.space-race' },
  suffrage: { defaultMessage: 'Suffrage', id: 'card.name.suffrage' },
  'timeline-origin': {
    defaultMessage: 'Timeline Origin',
    id: 'card.name.timeline-origin',
  },
  'united-nations': {
    defaultMessage: 'United Nations',
    id: 'card.name.united-nations',
  },
  'wildlife-refuges': {
    defaultMessage: 'Wildlife Refuges',
    id: 'card.name.wildlife-refuges',
  },
}) satisfies DescriptorMap<EventName>;

export const startingEventNameMessage: TypedMessageDescriptor = defineMessages({
  startingEventNameMessage: {
    defaultMessage: 'Event',
    id: 'card.event',
  },
}).startingEventNameMessage;

export const themeMessages = defineMessages({
  dark: { defaultMessage: 'Dark', id: 'theme.dark' },
  'greyscale-dark': {
    defaultMessage: 'Greyscale Dark',
    id: 'theme.greyscale-dark',
  },
  'greyscale-light': {
    defaultMessage: 'Greyscale Light',
    id: 'theme.greyscale-light',
  },
  light: { defaultMessage: 'Light', id: 'theme.light' },
}) satisfies DescriptorMap<Theme>;
