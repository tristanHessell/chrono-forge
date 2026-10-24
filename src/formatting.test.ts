import { ESLint } from 'eslint';
import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

const ruleId = '@stylistic/padding-line-between-statements';
const eslint = new ESLint();

describe('import ordering', () => {
  it.each(['ts', 'tsx', 'js'])(
    'rejects unsorted imports in %s',
    async (extension) => {
      const [result] = await eslint.lintText(
        "import { initializeTheme } from './theme';\nimport { StrictMode } from 'react';",
        {
          filePath: `src/formatting-fixture.${extension}`,
        },
      );

      expect(
        result.messages.filter(
          (message) => message.ruleId === 'perfectionist/sort-imports',
        ),
      ).toHaveLength(1);
    },
    30_000,
  );

  it('automatically sorts packages, local modules, named imports and type imports', async () => {
    const fixer = new ESLint({ fix: true });
    const [result] = await fixer.lintText(
      [
        "import { initializeTheme } from './theme';",
        "import { useState, useEffect } from 'react';",
        "import { CardGame } from './game';",
        "import clsx from 'clsx';",
        "import type { Card } from './game';",
      ].join('\n'),
      { filePath: 'src/formatting-fixture.ts' },
    );

    const formatted = await format(result.output!, {
      parser: 'typescript',
      singleQuote: true,
    });
    const [checked] = await eslint.lintText(formatted, {
      filePath: 'src/formatting-fixture.ts',
    });

    expect(formatted.trimEnd()).toBe(
      [
        "import clsx from 'clsx';",
        "import { useEffect, useState } from 'react';",
        '',
        "import type { Card } from './game';",
        "import { CardGame } from './game';",
        "import { initializeTheme } from './theme';",
      ].join('\n'),
    );
    expect(
      checked.messages.filter((message) =>
        message.ruleId?.startsWith('perfectionist/'),
      ),
    ).toEqual([]);
    expect(
      result.messages.filter((message) =>
        message.ruleId?.startsWith('perfectionist/'),
      ),
    ).toEqual([]);
  });

  it('preserves the relative order of side-effect imports', async () => {
    const fixer = new ESLint({ fix: true });
    const [result] = await fixer.lintText(
      [
        "import { StrictMode } from 'react';",
        "import './theme.css';",
        "import './styles.css';",
      ].join('\n'),
      { filePath: 'src/formatting-fixture.ts' },
    );

    expect(result.output).toBe(
      [
        "import './theme.css';",
        "import './styles.css';",
        '',
        "import { StrictMode } from 'react';",
      ].join('\n'),
    );
  });
});

describe('required braces', () => {
  it.each(['ts', 'tsx', 'js'])(
    'rejects unbraced if/else branches in %s',
    async (extension) => {
      const [result] = await eslint.lintText(
        'if (ready) start(); else stop();',
        {
          filePath: `src/formatting-fixture.${extension}`,
        },
      );

      expect(
        result.messages.filter((message) => message.ruleId === 'curly'),
      ).toHaveLength(2);
    },
  );

  it('automatically adds braces, including around early returns', async () => {
    const fixer = new ESLint({ fix: true });
    const [result] = await fixer.lintText(
      'function read(ready: boolean) { if (ready) return 1; else return 0; }',
      {
        filePath: 'src/formatting-fixture.ts',
      },
    );

    expect(
      result.messages.filter((message) => message.ruleId === 'curly'),
    ).toEqual([]);
    expect(result.output).toMatch(/if \(ready\) \{\s*return 1;\s*\}/);
    expect(result.output).toMatch(/else \{\s*return 0;\s*\}/);
  });
});

async function spacingErrors(code: string, extension = 'ts') {
  const [result] = await eslint.lintText(code, {
    filePath: `src/formatting-fixture.${extension}`,
  });

  return result.messages.filter((message) => message.ruleId === ruleId);
}

describe('statement spacing', () => {
  it.each(['ts', 'tsx', 'js'])(
    'requires spacing after variable declarations in %s',
    async (extension) => {
      expect(
        await spacingErrors('const value = 1;\nconsole.log(value);', extension),
      ).toHaveLength(1);
      expect(
        await spacingErrors(
          'const value = 1;\n\nconsole.log(value);',
          extension,
        ),
      ).toEqual([]);
    },
  );

  it('keeps consecutive variable declarations together', async () => {
    expect(
      await spacingErrors(
        'const first = 1;\nlet second = first;\nvar third = second;',
      ),
    ).toEqual([]);
  });

  it.each(['const', 'let', 'var'])(
    'requires spacing before a %s declaration',
    async (kind) => {
      expect(
        await spacingErrors(`console.log(1);\n${kind} value = 1;`),
      ).toHaveLength(1);
      expect(
        await spacingErrors(`console.log(1);\n\n${kind} value = 1;`),
      ).toEqual([]);
    },
  );

  it('requires spacing between a block and a variable declaration', async () => {
    expect(
      await spacingErrors('if (ready) { start(); }\nconst value = 1;'),
    ).toHaveLength(1);
  });

  it('requires spacing before exported variables too', async () => {
    expect(
      await spacingErrors('console.log(1);\nexport const value = 1;'),
    ).toHaveLength(1);
  });

  it('handles exported variable declarations without separating consecutive ones', async () => {
    expect(
      await spacingErrors(
        'export const first = 1;\nexport const second = 2;\nconsole.log(first, second);',
      ),
    ).toHaveLength(1);
  });

  it('requires spacing before a return following another statement', async () => {
    expect(
      await spacingErrors('function read() {\nconsole.log(1);\nreturn 1;\n}'),
    ).toHaveLength(1);
    expect(
      await spacingErrors('function read() {\nconsole.log(1);\n\nreturn 1;\n}'),
    ).toEqual([]);
  });

  it('does not add spacing to a return-only function', async () => {
    expect(await spacingErrors('function read() {\nreturn 1;\n}')).toEqual([]);
    expect(await spacingErrors('const read = () => 1;')).toEqual([]);
  });

  it('automatically fixes spacing around declarations and before returns', async () => {
    const fixer = new ESLint({ fix: true });
    const [result] = await fixer.lintText(
      'function read() {\nconsole.log(0);\nconst value = 1;\nconsole.log(value);\nreturn value;\n}',
      {
        filePath: 'src/formatting-fixture.ts',
      },
    );

    expect(result.output).toBe(
      'function read() {\nconsole.log(0);\n\nconst value = 1;\n\nconsole.log(value);\n\nreturn value;\n}',
    );
  });
});
