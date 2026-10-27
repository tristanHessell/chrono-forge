import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import formatjs from 'eslint-plugin-formatjs';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const variableDeclaration = {
  selector:
    ':matches(VariableDeclaration, ExportNamedDeclaration[declaration.type="VariableDeclaration"])',
};

export default defineConfig(
  { ignores: ['dist', '**/*.module.css.d.ts'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended, comments.recommended],
    plugins: {
      '@stylistic': stylistic,
      perfectionist,
    },
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        { allowWholeFile: true },
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['side-effect', 'side-effect-style'],
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          newlinesBetween: 1,
          fallbackSort: { type: 'type-import-first' },
        },
      ],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      'perfectionist/sort-named-imports': 'error',
      curly: ['error', 'all'],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: variableDeclaration, next: '*' },
        { blankLine: 'always', prev: '*', next: variableDeclaration },
        {
          blankLine: 'any',
          prev: variableDeclaration,
          next: variableDeclaration,
        },
        { blankLine: 'always', prev: '*', next: 'return' },
        // Always put a line between a block of `if` statements and anything after it
        { blankLine: 'always', next: '*', prev: ['if'] },
        { blankLine: 'always', next: 'if', prev: ['*'] },
        {
          blankLine: 'any',
          next: ['if'],
          prev: ['if'],
        },
      ],
    },
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      eslintReact.configs['recommended-typescript'],
      jsxA11y.flatConfigs.strict,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['simulations/*.ts', 'vitest.browser.config.ts'],
          defaultProject: 'tsconfig.node.json',
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      formatjs: formatjs,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportDeclaration[importKind='type'][source.value='react']",
          message:
            "Type-only imports are forbidden from 'react'. Use the global React namespace instead.",
        },
        {
          selector:
            "ImportSpecifier[importKind='type'][parent.source.value='react']",
          message:
            "Inline type imports are forbidden from 'react'. Use the global React namespace instead.",
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@eslint-react/no-use-context': 'error',
      '@eslint-react/naming-convention-ref-name': 'error',
      '@eslint-react/no-array-index-key': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@stylistic/jsx-curly-brace-presence': ['error', 'never'],
      'formatjs/no-offset': 'error',
      'formatjs/enforce-id': 'error',
      'formatjs/enforce-default-message': ['error', 'literal'],
      // We don't need descriptions at the moment, to enable if l10n becomes a priority
      'formatjs/enforce-description': 'off',
      'formatjs/enforce-placeholders': 'off',
      'formatjs/enforce-message-types': ['error', { generateTypes: true }],
      'formatjs/no-multiple-whitespaces': 'error',
      // This rule warns when you have plurals next to each other - not a problem for this codebase.
      'formatjs/no-multiple-plurals': 'off',
      'formatjs/no-complex-selectors': ['error', { limit: 20 }],
      'formatjs/no-useless-message': 'error',
      'formatjs/prefer-pound-in-plural': 'error',
      'formatjs/no-missing-icu-plural-one-placeholders': 'error',
      'formatjs/enforce-plural-rules': [
        'error',
        {
          one: true,
          other: true,
        },
      ],
      'formatjs/no-literal-string-in-jsx': [
        'error',
        {
          props: {
            include: [['*', '{label,placeholder,title}']],
          },
        },
      ],
      'formatjs/no-literal-string-in-object': 'error',
      'formatjs/prefer-full-sentence': 'error',
      'formatjs/prefer-formatted-message': 'error',
      'formatjs/no-invalid-icu': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: {
      vitest: vitest,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    rules: {
      'vitest/consistent-each-for': 'error',
      'vitest/consistent-test-filename': 'error',
      'vitest/consistent-vitest-vi': 'error',
      'vitest/expect-expect': 'error',
      'vitest/hoisted-apis-on-top': 'error',
      'vitest/max-nested-describe': 'error',
      'vitest/no-alias-methods': 'error',
      'vitest/no-commented-out-tests': 'error',
      // TODO enforce this
      'vitest/no-conditional-expect': 'warn',
      'vitest/no-conditional-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/no-import-node-test': 'error',
      'vitest/no-importing-vitest-globals': 'off',
      'vitest/no-interpolation-in-snapshots': 'error',
      'vitest/no-large-snapshots': 'error',
      'vitest/no-mocks-import': 'error',
      'vitest/no-restricted-matchers': 'error',
      'vitest/no-restricted-vi-methods': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/no-test-prefixes': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/no-unneeded-async-expect-function': 'error',
      'vitest/padding-around-after-all-blocks': 'error',
      'vitest/padding-around-after-each-blocks': 'error',
      'vitest/padding-around-all': 'error',
      'vitest/padding-around-before-all-blocks': 'error',
      'vitest/padding-around-before-each-blocks': 'error',
      'vitest/padding-around-describe-blocks': 'error',
      'vitest/padding-around-expect-groups': 'error',
      'vitest/padding-around-test-blocks': 'error',
      'vitest/prefer-called-exactly-once-with': 'error',
      'vitest/prefer-called-once': 'off',
      'vitest/prefer-called-times': 'error',
      'vitest/prefer-called-with': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-each': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/prefer-expect-resolves': 'error',
      'vitest/prefer-expect-type-of': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      // TODO enforce this rule once we've sorted out the non-deterministic tests (e.g. componentStyles).
      'vitest/prefer-strict-boolean-matchers': 'off',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-import-in-mock': 'error',
      'vitest/prefer-importing-vitest-globals': 'error',
      'vitest/prefer-lowercase-title': 'error',
      'vitest/prefer-mock-promise-shorthand': 'error',
      'vitest/prefer-snapshot-hint': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-to-be-falsy': 'off',
      'vitest/prefer-to-be-object': 'error',
      'vitest/prefer-to-be-truthy': 'off',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-been-called-times': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-todo': 'error',
      'vitest/prefer-vi-mocked': 'error',
      'vitest/require-awaited-expect-poll': 'error',
      'vitest/require-hook': 'error',
      'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
      // This rule doesn't seem particularly useful, off as it gets noisy, quickly.
      'vitest/require-mock-type-parameters': 'off',
      'vitest/require-test-timeout': 'off',
      // TODO enforce this
      'vitest/require-to-throw-message': 'warn',
      'vitest/unbound-method': 'error',
      'vitest/valid-describe-callback': 'error',
      'vitest/valid-expect-in-promise': 'error',
      'vitest/valid-expect': 'error',
      'vitest/valid-title': 'error',
      // TODO is this useful?
      'vitest/prefer-expect-assertions': 'off',
      // We absolutely want to use hooks for test setup and configuration
      'vitest/no-hooks': 'off',
      'vitest/prefer-describe-function-title': 'error',
      // This is not a priority right now, but can be a good steer for the agents
      'vitest/max-expects': 'off',
      // TODO enforce this
      'vitest/no-conditional-in-test': 'warn',
      'vitest/require-top-level-describe': 'error',
      'vitest/consistent-test-it': [
        'error',
        { fn: 'it', withinDescribe: 'it' },
      ],
      'vitest/warn-todo': 'error',
      'vitest/prefer-mock-return-shorthand': 'error',
    },
  },
);
