# Event effect additions

Use this table to track proposed and completed Event effects. Keep existing
rows. Add the effect ID after you define it in `CardEffect`. Link to the change
when a pull request or commit exists.

| Effect ID   | Behavior                                                                                                         | Event cards     | Status      | Tests                                     | Contributor or change link |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | --------------- | ----------- | ----------------------------------------- | -------------------------- |
| TBD         | Award extra points when a set number of Events touch this card. Define the number and scoring rule.              | TBD             | Proposed    | TBD                                       | TBD                        |
| TBD         | Lock sequential Events that share a category and owner. Define what sequential means and what the lock prevents. | TBD             | Proposed    | TBD                                       | TBD                        |
| free-action | Confirming the Event does not use one of the player's two actions that turn.                                     | All 1910 Events | Implemented | `cardEffects.test.ts`, `turnFlow.test.ts` | TBD                        |
