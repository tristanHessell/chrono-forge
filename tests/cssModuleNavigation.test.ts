import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

type Result = {
  definitions: {
    cssClass: string;
    cssLine: string;
    file: string;
    name: string;
  }[];
  diagnostics: { code: number; text: string }[];
};

let result: Result;

describe('cssModuleNavigation', () => {
  beforeAll(() => {
    const fixture = fileURLToPath(
      new URL('./fixtures/cssModuleNavigation.cjs', import.meta.url),
    );

    result = JSON.parse(
      execFileSync(process.execPath, [fixture], {
        encoding: 'utf8',
        timeout: 20000,
      }),
    ) as Result;
  }, 25000);

  it('navigates camelCase default-import references to their original CSS classes', () => {
    expect(result.definitions).toStrictEqual([
      {
        cssClass: 'game-log-readable',
        cssLine: '.game-log-readable {',
        file: 'src/components/GameLogView.module.css',
        name: 'gameLogReadable',
      },
      {
        cssClass: 'card-type-name',
        cssLine: '.card-type-name {',
        file: 'src/components/Card.module.css',
        name: 'cardTypeName',
      },
    ]);
  });

  it('supplies editor types that reject unknown class names', () => {
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(2339);
    expect(result.diagnostics[0].text).toContain('thisClassDoesNotExist');
  });
});
