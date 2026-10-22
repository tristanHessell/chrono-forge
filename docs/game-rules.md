# Game rules

This document describes setup, turns, card placement, and scoring.
See [Manipulations](./manipulations.md) for the four command cards.

## Players and setup

The game supports two to four players. Player 0 is human. The other seats use
computer players. Each player starts with five cards.

The shared deck has 46 cards:

- 30 Event cards: one Politics, Tech, and Nature card for each decade from 1900
  through 1990.
- 16 Manipulation cards: four copies of each command.

A neutral Event numbered 0 starts in the center of the table. It belongs to no
player and does not score. Each player's first Event must touch this card.

## Turns and actions

Each turn has up to two actions. A player can confirm an Event, use a
Manipulation, or discard a card for each action. Selecting, moving, or replacing
an unconfirmed Event does not use an action.

After the second action, the active player draws cards until their hand has five
cards, then the next player takes a turn. If a player has no cards before their
second action, their turn ends and they refill. When the deck has fewer cards
than needed, the player draws only the cards that remain.

After the deck runs out, players take up to two actions with their remaining
hands. Empty hands are skipped. The game ends when all hands and the deck are
empty.

## Place Events

Place an Event in an empty position that touches at least one card above, below,
to the left, or to the right. Diagonal contact does not count.

The new Event must have a later date than every orthogonal neighbor. Equal dates
cannot touch. When a move changes existing links, the full board must still
follow these date rules.

A move is illegal if it completes a 2×2 square of four orthogonally adjacent
cards. Removed Events do not count as occupied cards for this square check.

Arrows point from an older Event toward a newer Event. Paths can merge when the
incoming links are perpendicular. Links cannot meet head-to-head from opposite
sides. The connected timeline must remain valid after each confirmed move.

These placement rules also apply when a player moves or replaces an unconfirmed
Event. See [Manipulations](./manipulations.md) for how board changes affect
existing links.

## Draws and discards

All 1940 Events have the `draw-one` effect. Confirming one draws a card into the
active player's hand before turn progression. The draw counts toward the next
refill. If the deck is empty, no card is drawn. Discarding a card does not
trigger its effect.

A player can discard a card from their hand as an action. An unconfirmed Event
can also be discarded as an action. The discard pile remains in the game and
supports undo and redo.

## Scoring

Each player's Events on the board score one base point each. The neutral starting
card, pending cards, discarded cards, and removed Events score no points.

All 1990 Events have the `timeline-1900-bonus` effect. A 1990 scores one extra
point for its owner when an arrow path leads from a 1900 Event to that card. The
1900 can belong to either player. A branch that connects to the neutral starting
card but not to a 1900 does not qualify. Each 1990 awards this bonus only once,
even if several paths qualify.

The game shows each player's base points and bonuses at the end. The player with
the highest total wins. Equal totals produce a tie.
