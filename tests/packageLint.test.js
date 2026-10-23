import { NpmPackageJsonLint } from 'npm-package-json-lint';
import { describe, expect, it } from 'vitest';

import config from '../.npmpackagejsonlintrc.json';
import manifest from '../package.json';

function lintManifest (packageJsonObject) {
  return new NpmPackageJsonLint({
    packageJsonObject,
    packageJsonFilePath: 'package.json',
    config,
  }).lint();
}

describe.each(['dependencies', 'devDependencies', 'peerDependencies'])(
  'exact versions in %s',
  (section) => {
    const lint = (version) => lintManifest({ [section]: { example: version } });

    it.each(['1.2.3', '0.1.0', '2.0.0-beta.1', '1.2.3+build.1'])(
      'accepts the exact version %s',
      (version) => {
        expect(lint(version).errorCount).toBe(0);
      },
    );

    it.each(['^1.2.3', '~1.2.3', '>=1.2.3', '*'])(
      'rejects the non-exact version %s',
      (version) => {
        expect(lint(version).errorCount).toBeGreaterThan(0);
      },
    );
  },
);

it.each(['^1.2.3', '~1.2.3', '*', 'latest', 'file:../package'])(
  'does not validate optional dependency version %s',
  (version) => {
    const optionalManifest = {
      ...manifest,
      optionalDependencies: { example: version },
    };

    expect(lintManifest(optionalManifest).errorCount).toBe(0);
  },
);

it('accepts the real package manifest', () => {
  expect(lintManifest(manifest).errorCount).toBe(0);
});
