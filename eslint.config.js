import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const variableDeclaration = {
  selector:
    ':matches(VariableDeclaration, ExportNamedDeclaration[declaration.type="VariableDeclaration"])',
};

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
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
      ],
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
);
