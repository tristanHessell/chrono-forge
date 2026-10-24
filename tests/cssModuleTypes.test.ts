import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveConfig, type ResolvedConfig } from 'vite';
import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import manifest from '../package.json';
import {
  cssModuleTypesPlugin,
  generateCssModuleTypes,
} from '../scripts/css-module-types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let directory: string;
let cssFile: string;
let config: ResolvedConfig;

beforeAll(async () => {
  config = await resolveConfig({ logLevel: 'silent' }, 'build');
});

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'card-css-types-'));
  mkdirSync(path.join(directory, 'src'));
  cssFile = path.join(directory, 'src', 'Card.module.css');
  writeFileSync(cssFile, '.present-class { color: red; }\n');
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

it('generates exact readonly keys and replaces them after a CSS rename', async () => {
  await generateCssModuleTypes(config, path.join(directory, 'src'));
  expect(readFileSync(`${cssFile}.d.ts`, 'utf8')).toContain(
    'readonly presentClass: string',
  );
  writeFileSync(cssFile, '.renamed-class { color: red; }\n');
  await generateCssModuleTypes(config, path.join(directory, 'src'));

  const declaration = readFileSync(`${cssFile}.d.ts`, 'utf8');

  expect(declaration).toContain('readonly renamedClass: string');
  expect(declaration).not.toContain('presentClass');
  expect(declaration).not.toContain('[key: string]');
  expect(readFileSync(`${cssFile}.d.ts.map`, 'utf8')).not.toContain(
    'sourcesContent',
  );
});

it('removes only owned generated declarations after a CSS module is deleted', async () => {
  const handwritten = path.join(directory, 'src', 'Manual.module.css.d.ts');

  writeFileSync(handwritten, 'export default {};\n');
  await generateCssModuleTypes(config, path.join(directory, 'src'));
  unlinkSync(cssFile);
  await generateCssModuleTypes(config, path.join(directory, 'src'));
  expect(existsSync(`${cssFile}.d.ts`)).toBe(false);
  expect(existsSync(`${cssFile}.d.ts.map`)).toBe(false);
  expect(existsSync(handwritten)).toBe(true);
});

it('updates generated types when the dev watcher reports a CSS change', async () => {
  const plugin = cssModuleTypesPlugin();
  const watcher = new EventEmitter();
  const httpServer = new EventEmitter();
  const hook = plugin.configureServer;

  if (typeof hook !== 'function') {
    throw new Error('Missing CSS types dev hook');
  }

  await hook.call(
    {} as never,
    {
      config: { ...config, root: directory },
      watcher,
      httpServer,
    } as never,
  );
  try {
    writeFileSync(cssFile, '.updated-class { color: red; }\n');
    watcher.emit('change', cssFile);
    await expect
      .poll(() => readFileSync(`${cssFile}.d.ts`, 'utf8'))
      .toContain('readonly updatedClass: string');
  } finally {
    httpServer.emit('close');
  }
  expect(watcher.listenerCount('change')).toBe(0);
});

it('fails the real build after a referenced CSS class is removed', () => {
  const scripts = {
    'css:types': manifest.scripts['css:types'],
    typecheck: manifest.scripts.typecheck,
    build: manifest.scripts.build,
  };
  const build = () =>
    spawnSync('npm', ['run', 'build'], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 60_000,
    });

  symlinkSync(
    path.join(root, 'node_modules'),
    path.join(directory, 'node_modules'),
    'junction',
  );
  symlinkSync(
    path.join(root, 'scripts'),
    path.join(directory, 'scripts'),
    'junction',
  );
  writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ type: 'module', scripts }),
  );
  writeFileSync(
    path.join(directory, 'vite.config.js'),
    "export default { css: { modules: { localsConvention: 'camelCaseOnly' } } };\n",
  );
  writeFileSync(
    path.join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'Bundler',
        target: 'ES2022',
      },
      include: ['src'],
    }),
  );
  writeFileSync(
    path.join(directory, 'index.html'),
    '<script type="module" src="/src/main.ts"></script>',
  );
  writeFileSync(
    path.join(directory, 'src', 'main.ts'),
    "import styles from './Card.module.css'; document.body.className = styles.presentClass;\n",
  );
  expect(build().status).toBe(0);
  writeFileSync(cssFile, '.renamed-class { color: red; }\n');

  const failed = build();

  expect(failed.status).not.toBe(0);
  expect(failed.stdout).toContain('TS2339');
  expect(failed.stdout).toContain("Property 'presentClass' does not exist");
}, 120_000);
