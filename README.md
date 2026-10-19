# Chrono-Forge

A browser-based card game starter built with React, TypeScript, Vite, and
[boardgame.io](https://boardgame.io/).

## Getting started

```bash
nvm install
nvm use
npm ci
npm run dev
```

Then open the local URL printed by Vite.

`.nvmrc` selects the Node.js version for local development and CI.
Use `npm ci` for reproducible installs from `package-lock.json`.
See [CLAUDE.md](./CLAUDE.md) for repository rules, architecture, and contributor guidance.

## Commands

- `npm run check` runs the full quality checks for the repository.
- `npm run dev` starts the development server.
- `npm run build` type-checks and creates a production build.
- `npm run lint` runs ESLint and package.json linting.
- `npm run lint:package` checks package.json and exact dependency versions.
- `npm run lint:staged` checks the staged files before a commit.
- `npm run lint:fix` applies ESLint's automatic fixes, including blank-line spacing.
- `npm run spellcheck` checks spelling in source, configuration, and documentation.
- `npm run test` runs the Vitest unit-test suite once.
- `npm run test:simulation` manually runs 100 computer-vs-computer games and saves reports.
- `npm run format` applies ESLint fixes, then formats the repository with Prettier.
- `npm run format:check` verifies formatting without changing files.
- `npm run preview` serves the production build locally.

### Commit and pull request checks

The pre-commit hook checks staged files without automatic changes.
The **Quality checks** workflow runs the full checks on pull requests and pushes to `main`.
See [CLAUDE.md](./CLAUDE.md#commit-and-pull-request-checks) for hook setup and workflow details.

## Debugging and simulations

### Debugging with game logs

Use **Game Log** to read the action history, including player names, card names,
placements. Card references are highlighted; drawn-card details are hidden.
The modal also shows the initial seed and player
count. **Export JSON** reveals a copyable JSON replay; **Import JSON** accepts
that text and recreates the game. Only confirmed actions are logged: draft
selections, replacements, movements, and returns to hand are omitted.
Undo and redo are not entries: undo removes the undone card use from the log,
redo restores it, and a new action after undo replaces that abandoned branch.
The JSON replay contains the resulting card uses, not the debugging history.
A confirmed Event is a single action recording its final card and position. Exporting while
a card is unconfirmed replays the last confirmed state, not that draft. Earlier
JSON logs using the same rules version are converted on import. Leave the
action count blank to replay everything, enter `0` for the initial deal, or enter
an action count to inspect an intermediate state. Importing automatically selects
the recorded player count and replaces the current game only after validation.
Computers are paused while viewing logs and after loading a replay; use
**Resume computer** when ready to continue. **New game** creates a fresh seed.

Logs recreate game data, not view settings such as zoom or visual hand order.
They reveal all hands and the seeded deck order, so treat them as debugging data.
Replays require matching game rules and card definitions.
Logs from sessions before the log feature cannot be recovered.

### Manual computer simulation

Run `npm run test:simulation` when you want to compare the two computer seats
over 100 games. This uses the real game client, including card effects,
Manipulations, turn refills, discards, and end-game scoring. Player 1 starts each
game; all players use the same strategy, with a different shuffle seed per game.
Two players is the default; choose three or four with `SIMULATION_PLAYERS`:

```bash
SIMULATION_PLAYERS=3 npm run test:simulation
SIMULATION_PLAYERS=4 npm run test:simulation
```

The command prints a win/draw summary and average score breakdowns, then saves
timestamped JSON and Markdown reports in `simulation-results/` (ignored by Git
and formatting). Each game records its seed, winner, score breakdowns, turns,
action history, card counts, timing, and any failure. The summary includes total
batch wall-clock time and average rounds per game. A round is one rotation through
the seats, including the final partial round; empty-handed seats are skipped.
Each tied game records all tied leaders, separately from outright wins.
Discard counts include only cards explicitly discarded from a hand, including
unused Manipulations discarded that way. Used Manipulations and overwritten Events
are excluded, even though they remain in the physical discard pile.
Average scores and activity
counts include completed games only. To repeat the same batch, run:

```bash
SIMULATION_SEED=my-seed npm run test:simulation
```

The simulation asserts legal boards, card conservation, successful moves, and
completed games. It stops a stuck game after 150 moves, records the failure,
continues the batch, and fails the simulation after writing the report if any
game failed. The separate configuration selects `simulations/**/*.simulation.ts`;
these files do not match the normal test pattern, so `npm test`, build, lint, and
format checks do not execute this batch.

## Playing the game

Open **Menu** for New game, Players, the theme, and Game Log.
Choose 2, 3, or 4 players with the Players selector (this starts a new game).
Player 0 is you; the other seats are computers, with visible hands and individually
labelled cards and scores. Each player starts with five cards, takes two actions,
and refills to five from the shared 46-card deck. Turns rotate through the seats;
empty hands are skipped, and the game ends only when every hand and the deck are empty.

Each computer evaluates legal placements for points, draw
effects, and future plays; if no placement is possible, it discards. Decisions
use only its hand and the public board, not your hand or the deck order. Its hand
remains visible for this prototype. Computer moves run locally after a short
delay. Undo/redo pauses the computer so restored positions can be inspected;
click Resume computer to continue. New game resumes normal computer play.

Event categories are Political (red border), Technological (yellow border), and Environmental (green border).
Each decade has one card from each category.
Categories do not change placement rules or card effects.

Choose a hand card to reveal valid positions beside the cards on the table.
You can place cards to the left, right, above, or below existing cards.
A newly placed card stays movable until you confirm it with the control on the card.
The pending card remains marked in your hand.
Select another hand card to replace it at the pending position.

Drag a hand card to a valid position or onto the pending card to replace it.
Drag a pending card between valid positions to change its location.
The preview snaps to the target position during the drag.
Drag the pending card back to your hand to cancel its placement.

Drag a card across your hand to reorder it live. Neighboring cards slide into
their new positions as you drag, and releasing keeps the displayed order.
Keyboard users can focus a card and press Alt + Left
or Right. Manual ordering only affects the display, survives draws and plays,
and can be replaced by the Date sort control.

Cards cannot be placed when doing so would complete a 2×2 square of four
orthogonally adjacent cards.

Drag a hand card or an unconfirmed card onto the Discard area beside the deck to
discard it as one of your two actions. You can also select a card and click
Discard. The discard pile is retained throughout the game and supports undo/redo.

Each new card must have a later date than every orthogonally adjacent card,
following the existing arrow directions. Equal dates cannot touch. The same
rules apply when moving or replacing a pending card.

Connections show an arrow on the newer card pointing from the older linked card
toward it. Paths can merge when their incoming links are perpendicular, but
links approaching from opposite sides are blocked from meeting head-to-head.
The 2×2 square restriction still applies.

Played and pending cards carry an owner label and color-coded border, with a
legend above the table distinguishing your cards from the other player's.

The game alternates turns through boardgame.io, starting with your hand. Only
the active player's cards can be selected or dragged. A player with no cards is
skipped when the deck is exhausted.

Each game begins with a neutral 0 card already in the center of the
table. Players place their first cards adjacent to it.

Cards use a horizontal, landscape layout in both hands and on the table. The
46-card deck contains 30 Event cards showing decades from 1900 to 1990, with three
copies of each decade, plus sixteen Manipulation cards. Cards use a discriminated
union with `type: 'event'` or `type: 'manipulation'`.
All 1940 cards have a `draw-one` effect in the catalog:
confirming one draws a card into the active player's hand before turn
progression. An empty deck skips the draw, and discarding never triggers effects.
Effect cards show a bottom-left icon; hovering or focusing a card in your hand
explains it. Cards on the table display the icon without a tooltip.

There are four each of **Time Jump**, **Time Swap**, **Take Control**, and
**Remove Event**, all listed in
the TypeScript catalog. Select a Manipulation card in your hand, then select a highlighted
Event on the board. For Time Jump, choose a highlighted empty destination or
overwrite a removed Event; for
Time Swap, choose a highlighted second Event. Cancel targeting to change your mind
without spending an action. If no legal targets exist, the card can be discarded.
While choosing a Time Jump destination, both hands temporarily fold away to give
the board more space and expose its destination slots. Completing or cancelling
the move restores the hands; after a move, the camera centers the moved Event.
Either player's Events can be targeted, but the neutral starting card cannot move.
The entire resulting board must obey the existing date, adjacency, square, and
arrow-direction rules. Ownership and removed status are preserved. Original
placement order is preserved for active Events moved to empty spaces. A removed
Event jumping to an empty space can establish new links after the existing Events,
so it can connect to a card played after its original placement (provided its
date is later). It remains removed and earns no points. When Time Jump overwrites a removed Event,
the moved Event inherits that destination's link directions and placement order,
and the overwritten Event enters the discard pile. Removing the source must not
disconnect the remaining timeline.
Time Jump cannot move a card into an empty space adjacent to another removed
Event, even when the moved card is also removed. Valid overwrites remain allowed;
the moving card's old position is excluded when checking removed neighbors.
Each use costs one action and puts the Manipulation card in the discard pile;
it does not earn a base point or trigger the moved Events' play effects again.
Bonuses are recalculated for the resulting timelines. The computer also uses
Manipulation cards, and all operations support undo/redo.

**Take Control** changes another player's Event to your ownership, transferring
its base point and any valid bonus. It preserves the Event's date, position,
placement order, and removed status, and does not trigger play effects again.
**Remove Event** marks an Event as removed instead of deleting it. Removed Events
are crossed out and labelled on the board; they earn no points or bonuses, and a
removed 1900 cannot qualify a 1990 for its bonus. They still retain their dates,
links, and occupied positions for placement rules, and can still be moved,
swapped, or taken over. Removal cannot target the starting card or an already
removed Event.

A removed Event can be overwritten by a valid Event from your hand, using the
normal select/drag and confirmation flow. Valid destinations show **Overwrite**.
Empty positions adjacent to a removed Event cannot receive a new Event, even
when they also touch an active Event. Existing neighboring Events remain valid.
The replacement inherits the position's existing link directions: it must be
later than upstream neighbors and earlier than downstream neighbors. The whole
board must stay legal, including square, direction, and connectivity rules.
On confirmation the old Event enters the discard pile, the new Event
earns its own points and triggers its play effect, and one action is spent.
Cancelling an unconfirmed overwrite leaves the old removed Event unchanged.

All 1990 cards have a `timeline-1900-bonus` effect. Each confirmed card awards its
owner one extra point if a path of arrows leads from a 1900 card to it. The 1900
may belong to either player; a separate branch connected only through the neutral
starting card does not qualify. Multiple qualifying paths still award only one
point per 1990 card. Each player also gets one base point for every card they
confirmed on the board. The neutral starting card, pending cards, and discarded
cards score no points. Totals include base points plus valid bonuses and update
with undo/redo. At game end, the result shows every player's breakdown and announces the
winner or a tie.
The game initially deals five cards to each player. Each turn consists of two
actions: confirm an Event on the board, use a Manipulation, or discard a card. Selecting, moving, or
replacing an unconfirmed card does not use an action. After the second action,
draw enough cards to refill the active player's hand to five, then pass the turn.
Draw effects happen immediately and count toward that refill. If a player runs
out of cards before the second action, their turn ends early and refills.
When the deck has fewer cards than needed, draw only what remains. Once the deck
is empty, play out the remaining hands with up to two actions per turn. The game
ends when all hands and the deck are empty, then final scores are shown.

The played-card board has its own scrollable viewport and can be zoomed from
60% to 160% with the floating controls in its top-right corner or the mouse wheel.
Hold the left mouse button on
empty board space and drag to pan the board in any direction.

The top-right Undo and Redo controls are test-history tools: after a confirmed
play, Undo removes that played card and restores the active player, hand, and draw deck, while
Redo restores the play.

The New game control fully resets the deck, board, hands, and starting player.
Turns advance automatically after two actions, and refills use the remaining
deck while preserving the played board.

See [CLAUDE.md](./CLAUDE.md#architecture) for the source module map and test guidance.
