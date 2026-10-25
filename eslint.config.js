import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import formatjs from 'eslint-plugin-formatjs';
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
    plugins: {
      '@stylistic': stylistic,
      perfectionist,
    },
    rules: {
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
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['simulations/*.ts'],
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
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'formatjs/no-offset': 'error',
      'formatjs/enforce-id': 'error',
      'formatjs/enforce-default-message': ['error', 'literal'],
      // We don't need descriptions at the moment, to enable if l10n becomes a priority
      'formatjs/enforce-description': 'off',
      'formatjs/enforce-placeholders': 'off',
      'formatjs/enforce-message-types': ['error', { generateTypes: true }],
      'formatjs/enforce-plural-rules': ['error', { other: true }],
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
    files: ['sample file.ts', 'src/formatting-fixture.*'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
