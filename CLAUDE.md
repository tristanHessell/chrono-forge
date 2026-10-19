# CLAUDE.md

This file gives repository rules to Claude Code and Codex.

## Writing style for non-user text

Write all text in ASD-STE100 (Simplified Technical English) style, except text that a visitor to the website sees (page headings, button labels, body copy).
This rule covers code comments, commit messages, pull request text, and the prose in `CLAUDE.md` and `README.md`.

This project is a software project, not an aircraft maintenance manual.
Do not restrict words to the ASD-STE100 approved word list - that list has no entries for terms like "component" or "repository".
Instead, follow the structural and grammar rules below:

- Write short sentences.
  Use 20 words or fewer in an instruction.
  Use 25 words or fewer in a statement.
- Write one idea in each sentence.
  Split a sentence with "and", "which", or a dash into 2 or more sentences.
- Use the active voice.
  Write "Run the build", not "The build is run".
- Use simple verb forms: the simple present tense, the simple past tense, or the imperative mood.
  Do not use continuous or perfect tenses.
- Use articles.
  Write "the file", not "file".
- Do not chain more than 3 nouns together.
  Write "the config file for ESLint", not "the ESLint config file settings".
- Use the same word for the same idea each time.
  Do not swap in a synonym.
- Do not use idioms or slang.
- Use a numbered or bulleted list for a sequence of steps.

## Branch workflow

Prefer the latest `origin/main` as the base for each new task.
Do not base a new task on an earlier task's unmerged branch.
Use a different base only when the user requests it or the task requires an existing branch.
For a continuation, keep the task's existing branch unless the user requests a new base.

1. Check the current branch and working tree before switching branches.
2. Preserve existing changes and commits.
   Do not discard unrelated work.
3. Fetch `origin` before creating a task branch.
   If the fetch fails, report that the latest `main` is not verified.
4. Create the new task branch from `origin/main`.
   Use the `codex/` prefix for Codex branches unless the user specifies another name.
5. Verify that the branch contains the fetched `origin/main` before starting the task.

## Commit message format

Write each commit message in the Conventional Commits format: `type(scope): description`.

- Use one of these types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, or `chore`.
- Add a scope in parentheses when it helps, for example `fix(workflow):` or `feat(gallery):`.
  Skip the scope when the change touches many areas.
- Write the description in the imperative mood, in lower case, with no full stop at the end - for example `fix(workflow): remove invalid secrets reference from if condition`.
- Add `!` after the type or scope for a breaking change, for example `feat!: drop support for Node 18`, and explain the break in a `BREAKING CHANGE:` footer.
- Add a body when the summary line needs more context.
  Write the body in the ASD-STE100 style above, and explain why the change was made, not just what changed.
- Add an attribution footer to every commit that an agent contributes to.
  For Codex, use `Co-Authored-By: Codex <noreply@openai.com>`.
  For Claude, keep the attribution footer from its system instructions, for example `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
  Separate the footer from the body with a blank line.
  Keep the attribution footer as the last line.

## Commands

```bash
npm ci
npm run check
npm run lint:staged
```

Run `npm run check` before you submit work.
The command checks lint, formatting, spelling, unit tests, and the production build.
The manual simulations stay outside the quality checks.
The pre-commit hook uses Husky and `lint-staged` to check staged files without automatic changes.
The GitHub Actions workflow runs the full quality checks on pull requests and pushes to `main`.

## Architecture

Chrono-Forge uses React, TypeScript, Vite, and boardgame.io.
The local client supports two to four players.
The human uses player ID `0`.
The other seats use computer players.

- `src/main.tsx` mounts the application with the internationalisation provider and theme setup.
- `src/App.tsx` creates seeded client sessions.
  A new game or player count change creates a new session.
- `src/game.ts` defines the state, moves, turn progression, undo history, and end conditions.
- `src/cards/` contains one TypeScript file for each card, including the neutral starting card.
  Edit these typed definitions to change the cards.
  Give each copy a unique ID.
  Register each card in `src/cards/index.ts`.
  Preserve the deck order to keep existing seeded replays compatible.
- `src/cardCatalog.ts` validates the catalog and copies its cards for each game.
- `src/gameRules.ts` contains pure placement rules and destination discovery.
- `src/manipulationRules.ts` validates and applies Manipulations.
- `src/scoring.ts` calculates base points and timeline bonuses.
- `src/computer.ts` chooses actions from the computer's hand and the public board.
  Do not give the computer access to other hands or the deck order.
- `src/useComputerOpponent.ts` schedules computer actions and handles pauses.
- `src/GameBoard.tsx` coordinates board interactions and dispatches moves.
- `src/components/` contains the hands, cards, slots, toolbar, results, and log modal.
- `src/handOrder.ts` manages visual hand order.
  Visual order does not change game state.
- `src/gameLog.ts` exports confirmed card uses and replays seeded games.
  `src/gameLogSummary.ts` creates human-readable descriptions.
- `src/theme.ts` selects light or dark themes with optional greyscale variants.
  The styles use theme variables.
- Component styles use adjacent `*.module.css` files.
  Vite exports camelCase class names for TypeScript dot notation.
  `scripts/css-module-types.ts` generates exact readonly declarations from Vite's CSS module exports.
  Declaration maps link properties to the original CSS selectors without an editor plugin.
  Installation, tests, builds, and Vite's dev watcher keep these generated files current.
  Do not edit or commit generated `*.module.css.d.ts` files or their maps.
  Shared card, appearance, ownership, control, and dialog modules supply reusable styles.
  `src/styles/theme.css` contains global theme tokens.
  `src/styles/global.css` contains the page reset and base element styles.
  Use data attributes for interaction targets instead of CSS class names.

Keep shared rule checks in the rule modules.
Use the same rules for moves, UI destinations, and computer decisions.
Keep the game state independent of translated labels and view settings.

### Game logs

Build logs from the current applied history.
Exclude pending placements, undone actions, abandoned branches, and undo or redo commands.
Record each confirmed Event with its final card and position.
Show card references distinctly in the modal.
Do not show drawn cards in the human-readable log.

Replays require matching rules and card definitions.
Increment `rulesVersion` in `src/gameLog.ts` for incompatible changes.
Validate an imported log before replacing the current session.
Keep computers paused during log inspection and after import.

### Internationalisation

The UI uses `react-intl`.
`src/i18n/en.json` contains the English messages.
`GameIntlProvider` wraps the application.
English browser locales determine number formatting.
Other languages currently use English.

- Use the typed `useMessages` hook for UI text and accessibility labels.
- Use `useIntl` for numbers and percentages.
- Keep card IDs, state types, and move names independent of the locale.
- Preserve message IDs and ICU placeholders when translating the catalog.
- Register each new catalog and locale in `GameIntlProvider`.

The boardgame.io developer panel uses the library's own English text.

### Tests

Keep unit tests beside the source in `*.test.ts` or `*.test.tsx` files.
Vitest processes CSS modules to test scoped classes and shared compositions.
The `tests/` directory contains tests for the quality tools.
Add regression tests for changes to placement rules, Manipulations, scoring, turns, or replay behaviour.
Use deterministic seeds or fixtures to reproduce game cases.

The manual simulations use the real game client.
`vitest.simulation.config.ts` selects `simulations/**/*.simulation.ts` separately from the normal tests.
Do not add these simulations to `npm run check` or the pull request workflow.
Simulation reports belong in the ignored `simulation-results/` directory.
Count only explicit hand discards in the discard statistics.
Exclude used Manipulations and overwritten Events from those statistics.

## Code style

- Put a blank line before and after each group of variable declarations, including exported variables.
  Consecutive declarations can stay together.
- Put a blank line before each return statement.
  A function with only a return statement needs no extra blank line.
- Use braces for all control-flow bodies, including single-statement `if` and `else` branches.
- Order imports by side effects, Node built-ins, third-party packages, absolute paths, then relative paths.
  Preserve the relative order of side-effect imports.
  Separate the groups with blank lines.
  Sort module paths and named imports alphabetically.
  Put type-only imports before value imports from the same module.
- Use Prettier with semicolons, single quotes, trailing commas, and an 80-character line width.

Run `npm run format` to apply ESLint fixes and Prettier formatting.
Run `npm run lint:fix` to apply only ESLint fixes.

## Commit and pull request checks

`npm ci` and `npm install` install the Husky hook and generate CSS types through `npm run prepare`.
Run `npm run prepare` if the hooks need installation again.
The pre-commit hook checks staged files with ESLint, Prettier, and CSpell.
It also checks `package.json` when that file changes.
The checks do not fix files automatically.
Partially staged files keep their unstaged changes.
Fix failures before staging the corrected files.

The **Quality checks** workflow also supports manual runs.
It uses a read-only token and action versions pinned to commit IDs.
Repository administrators can require this check through branch protection.

## Tooling notes

- ESLint 9 uses the flat config in `eslint.config.js` with `typescript-eslint`.
  React Hooks and React Refresh rules check the React code.
  `@stylistic` checks blank lines.
  `eslint-plugin-simple-import-sort` checks import order.
- Prettier uses `.prettierrc.json`.
  ESLint and Prettier both contribute to the formatting checks.
- CSpell uses `cspell.json` with English and British English dictionaries.
  It checks source, configuration, documentation, and the GitHub workflow.
  It excludes dependencies, generated builds, and the lockfile.
  Add correct project words to its `words` list.
  Do not disable a spelling check to hide an error.
  Editor extensions can use the same configuration.
- npm-package-json-lint uses the config file `.npmpackagejsonlintrc.json`.
  Runtime, development, and peer dependencies require exact versions without `^` or `~` prefixes.
  Optional dependencies are excluded from package validation.
  `.npmrc` sets `save-exact=true` for new installations.
  Pin each new dependency to its installed version from `package-lock.json`.
  Commit the lockfile with dependency changes.
- The file `.nvmrc` sets the Node version for this project.
  Run `nvm use` to switch to this version locally.
  The GitHub workflow reads the same file through `node-version-file: .nvmrc` in `actions/setup-node`.
  Change the Node version in `.nvmrc` instead of duplicating it in the workflow.
