# CLAUDE.md

This file gives rules to Claude Code for work in this repository.

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

TODO

## Tooling notes

- ESLint uses the flat config format, in `eslint.config.js`, with ESLint 10 and `typescript-eslint`.
  Reference the flat preset from `eslint-plugin-react-hooks` as `reactHooks.configs.flat['recommended-latest']` - do not use the old top-level export.
  `eslint-config-prettier` must be the last entry in the config, to stop ESLint rules from conflicting with Prettier rules.
- Stylelint uses `stylelint-config-standard`, `stylelint-config-css-modules`, and the recommended config from `stylelint-plugin-defensive-css`. It overrides `selector-class-pattern` to `^[a-z][a-zA-Z0-9]*$` because `stylelint-config-css-modules` does not itself relax that rule for camelCase class names, and allows intentional global/theme selectors in `defensive-css/require-pure-selectors`.
- cspell uses the config file `cspell.json`, set to British English (`en-GB`).
  Add a genuinely new, correct project word to the `words` list; do not turn off a spelling check.
- markdownlint uses `.markdownlint-cli2.jsonc` for all Markdown files, including files in hidden directories.
  Use the default rules except `MD013` for one sentence per line and `MD033` for the README logo image.
- npm-package-json-lint uses the config file `.npmpackagejsonlintrc.json`.
  The rules `prefer-absolute-version-dependencies` and `prefer-absolute-version-devDependencies` require an exact version for each package in `dependencies` and in `devDependencies` - no `^` and no `~` prefix.
  Pin a new dependency to its exact installed version, from `package-lock.json`, when you add it.
- The file `.nvmrc` sets the Node version for this project.
  Run `nvm use` to switch to this version locally.
  The GitHub Actions workflow reads the same file, through the setting `node-version-file: .nvmrc` in `actions/setup-node`, so CI and local development never drift apart.
  To change the Node version, edit only the file `.nvmrc`.
