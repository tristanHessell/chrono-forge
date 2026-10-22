# TODO

Change the card catalog to use the actual card component from the game, rather than using a component like Catalog Card.

- The intent is to reduce the amount of code duplication and to ensure that there is a small number of ways to represent a card in the codebase.
- Eventually, I want to the user to be able to use a dropdown to select how the card should be displayed - from the hand or from the table.
- For now, just use the cards in the hand

---

Add settings on the dialog that will allow the user to see the cards as if they were in the hand or placed on the table.

- This should be a dropdown.

---

Add settings to show the cards in the different sizes - with the intent of allowing me to check the cards to see if their contents are fitting correctly.

- These changes should include naming the different sizes that are available in the theme and then having a dropdown to configure it on the card catalog page.

---

Prompt: Dragging a command like `take control` over the card it's targetting doesn't work

---

Move Game log to a place that makes it more easy to get to.

- You'll find that its hard to track what's going on against computers.
- Move it to the same line as the deck/discard

---

Slow down computers turns, so you can see individual moves happening.

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
