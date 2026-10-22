# TODO

Prompt: Dragging a command like `take control` over the card it's targetting doesn't work

---

Move Game log and Game Scores to the same area as the deck & discard.

- this will make it easier to track what is going on in a game without having to click a couple of buttons to get there.

---

Change the string internationalisation to use `defaultMessage` in addition to the `id` field.

- The intent is to make it easy to read & search the code for specific strings while reading the actual file.
- This change should involve removing `useMessages` and using the `react-intl` hooks & components directly

---

Randomise the turn order

---

Use the real card name in the game log

---

Allow you to undo you own moves as long as new information (such as a card being drawn) hasn't occurred.

---

Add a rules section to the menu

---

Rename `Manipulations` -> `Commands`
Rename category `Political` -> `Politics`.
Rename category `Environmental` -> `Nature`
Rename category `Technological` -> `Tech`

Change the Event cards to have the colour stripe on the right (where the category is), rather than around the card

Add Technology Effects

Add Political Effects

Add Environmental Effects

More Command Cards

- Overwrite a card
- Temporal Echo: Copy a card
- Temporal Shield: Stop all manipulations
- Restore an event? Should be a modal effect

Secret Roles - 8 overall, get 1 at the start

- Biggest local group?
- Longest road?
- Most of the Event types on board (1 point for each you have the most?)

Move card descriptions out of README

Warn on ambiguous characters in code

Move map output files to a different location

Comment through functions

Should a removed event invalidate any of the events that are no longer connected to the timeline?

Event Effects:

- Extra points if X cards are touching?
- Sequential cards of the same colour & owner are locked.
- Free action
