import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
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
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['sample file.ts', 'src/formatting-fixture.*'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
