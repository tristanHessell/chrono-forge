# Manipulations

Manipulations are command cards. The deck contains four copies of each command.
Each use costs one action and moves the command card to the discard pile. A
command does not score a base point. It does not trigger Event effects again.

Choose a command in your hand, then choose a highlighted Event on the board.
The starting card cannot be targeted. If no legal target exists, discard the
command. The whole board must remain legal after the change. Recalculate
bonuses after each command.

See [Game rules](./game-rules.md) for placement, arrows, square limits, and
scoring.

## Time Jump

Move an Event to a highlighted empty position or overwrite a removed Event. The
move can target either player's Event. It cannot target the neutral starting
card.

The move preserves ownership and removed status. It preserves the original
placement order when the new links remain valid. Otherwise, it places the Event
after the existing Events when its date allows it. The source position must not
leave the remaining timeline disconnected.

A removed Event moved to an empty position stays removed and scores no points.
An empty destination cannot touch another removed Event. A valid overwrite of a
removed Event is allowed.

When the move overwrites a removed Event, the moved Event inherits that
position's link directions and placement order. The overwritten Event enters
the discard pile.

## Time Swap

Swap two Event cards. The board must stay legal after the swap. The starting
card cannot be swapped.

## Take Control

Take control of another player's Event. The Event keeps its date, position,
placement order, and removed status. Its base point and any valid bonus transfer
to the new owner. The move does not trigger its effect again.

## Remove Event

Mark an Event as removed. It stays on the board with its date and links, but it
scores no points or bonuses. A removed 1900 cannot provide a bonus to a 1990.
The card can still be moved, swapped, or taken over. Its position does not block
adjacent placements or count as occupied for the 2×2 square check.

The command cannot target the starting card or an Event that is already removed.

## Overwrite a removed Event

Play a valid Event from your hand into a removed Event's position. The new Event
must follow the position's existing link directions. It must be later than
upstream neighbors and earlier than downstream neighbors. The full board must
remain legal, including its links and square limits.

On confirmation, the removed Event enters the discard pile. The new Event scores
as its owner and triggers its play effect. The player spends one action. If the
player cancels before confirmation, the removed Event stays in place.
