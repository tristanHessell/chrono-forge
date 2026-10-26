import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

type Result = {
  definitions: {
    name: string;
    file: string;
    cssLine: string;
    cssClass: string;
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
        name: 'gameLogReadable',
        file: 'src/components/GameLogView.module.css',
        cssLine: '.game-log-readable {',
        cssClass: 'game-log-readable',
      },
      {
        name: 'cardTypeName',
        file: 'src/components/Card.module.css',
        cssLine: '.card-type-name {',
        cssClass: 'card-type-name',
      },
    ]);
  });

  it('supplies editor types that reject unknown class names', () => {
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(2339);
    expect(result.diagnostics[0].text).toContain('thisClassDoesNotExist');
  });
});
