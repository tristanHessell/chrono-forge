# Command card additions

Use this table to track proposed and completed Command cards. Keep existing
rows. Add the action ID after you define it in `CommandAction`. Link to the
change when a pull request or commit exists.

| Command          | Behavior                                                               | Copies | Status      | Tests               | Contributor or change link                                       |
| ---------------- | ---------------------------------------------------------------------- | ------ | ----------- | ------------------- | ---------------------------------------------------------------- |
| Event Reclaim    | Replace any Event with an Event from hand, or restore a removed Event. | 4      | Implemented | Rules, game, replay | [PR #80](https://github.com/tristanHessell/chrono-forge/pull/80) |
| Overwrite a card | Included in Event Reclaim.                                             | 4      | Implemented | Rules, game, replay | [PR #80](https://github.com/tristanHessell/chrono-forge/pull/80) |
| Temporal Echo    | Copy a card. Define which card data and effects the copy receives.     | TBD    | Proposed    | TBD                 | TBD                                                              |
| Temporal Shield  | Stop all Commands. Define the duration and scope.                      | TBD    | Proposed    | TBD                 | TBD                                                              |
| Restore an Event | Included in Event Reclaim as a Command mode.                           | 4      | Implemented | Rules, game, replay | [PR #80](https://github.com/tristanHessell/chrono-forge/pull/80) |
