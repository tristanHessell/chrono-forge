import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import config from '../lint-staged.config.js';
import manifest from '../package.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

it('checks staged files without automatic fixes or simulated games', () => {
  expect(config['*.{js,jsx,mjs,cjs,ts,tsx}']).toBe('eslint --max-warnings=0');
  expect(config['*']).toBe('prettier --check --ignore-unknown');
  expect(config['package.json']()).toBe('npm run lint:package');
  expect(JSON.stringify(config)).not.toMatch(/--fix|--write|test:simulation/);
  expect(manifest.scripts.prepare).toBe('husky && npm run css:types');
  expect(manifest.scripts.dev).toBe('vite');
  expect(manifest.scripts.build).toBe('npm run typecheck && vite build');
  expect(manifest.scripts['messages:check']).toBe(
    'node scripts/check-message-catalog.ts',
  );
  expect(manifest.scripts.messages).toContain('formatjs extract');
  expect(readFileSync(join(root, '.husky/pre-commit'), 'utf8')).toContain(
    'npm run messages:check',
  );
  expect(manifest.scripts.check).toBe(
    'npm run lint && npm run format:check && npm run spellcheck && npm test && npm run build',
  );
});

it('runs the full checks on pull requests with limited permissions', () => {
  const workflow = readFileSync(
    join(root, '.github/workflows/quality.yml'),
    'utf8',
  );

  expect(workflow).toContain('  pull_request:');
  expect(workflow).toContain('  workflow_dispatch:');
  expect(workflow).toContain('  contents: read');
  expect(workflow).toContain('persist-credentials: false');
  expect(workflow).toContain('node-version-file: .nvmrc');
  expect(workflow).toContain('run: npm ci');
  expect(workflow).toContain('run: npm run messages:check');
  expect(workflow).toContain('run: npm run check');
  expect(workflow).not.toContain('pull_request_target');
  expect(workflow.match(/uses: actions\/[\w-]+@[a-f0-9]{40}/g)).toHaveLength(2);
});

it('blocks invalid staged files and preserves unstaged changes during a valid commit', () => {
  const directory = mkdtempSync(join(tmpdir(), 'card-game-hook-'));
  const run = (command, args) =>
    spawnSync(command, args, {
      cwd: directory,
      encoding: 'utf8',
      timeout: 20_000,
      env: { ...process.env, HUSKY: '1', GIT_TERMINAL_PROMPT: '0' },
    });
  const git = (...args) => run('git', args);
  const succeed = (result) =>
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  const sample = join(directory, 'sample file.ts');
  const valid = 'export const value = 1;\n';

  try {
    mkdirSync(join(directory, '.husky'));
    symlinkSync(
      join(root, 'node_modules'),
      join(directory, 'node_modules'),
      'dir',
    );
    for (const file of [
      'lint-staged.config.js',
      'eslint.config.js',
      'cspell.json',
      '.prettierrc.json',
      '.npmpackagejsonlintrc.json',
    ]) {
      copyFileSync(join(root, file), join(directory, file));
    }
    writeFileSync(
      join(directory, '.husky/pre-commit'),
      'npm run lint:staged\n',
    );
    writeFileSync(join(directory, '.gitignore'), 'node_modules/\n.husky/_/\n');
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify(
        {
          name: 'hook-test',
          private: true,
          type: 'module',
          scripts: {
            'lint:staged': manifest.scripts['lint:staged'],
            'lint:package': manifest.scripts['lint:package'],
            'messages:check': 'true',
          },
        },
        null,
        2,
      ) + '\n',
    );
    writeFileSync(sample, valid);
    succeed(git('init', '--quiet'));
    succeed(git('config', 'user.name', 'Hook Test'));
    succeed(git('config', 'user.email', 'hook-test@example.invalid'));
    succeed(git('config', 'core.hooksPath', '.husky/_'));
    succeed(git('add', '.'));
    succeed(git('commit', '--quiet', '-m', 'test: initialise the fixture'));
    succeed(run(process.execPath, [join(root, 'node_modules/husky/bin.js')]));

    for (const invalid of [
      'export const value: any = 1;\n',
      'export const value=1\n',
    ]) {
      writeFileSync(sample, invalid);
      succeed(git('add', 'sample file.ts'));

      const result = git('commit', '-m', 'test: reject invalid code');

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(/eslint|prettier/);
      expect(git('rev-list', '--count', 'HEAD').stdout.trim()).toBe('1');
    }
    writeFileSync(sample, valid + '\nexport const next = 2;\n');
    succeed(git('add', 'sample file.ts'));
    writeFileSync(sample, valid + '\nexport const next: any=2\n');
    succeed(git('commit', '--quiet', '-m', 'test: accept valid staged code'));
    expect(git('show', 'HEAD:sample file.ts').stdout).toBe(
      valid + '\nexport const next = 2;\n',
    );
    expect(readFileSync(sample, 'utf8')).toBe(
      valid + '\nexport const next: any=2\n',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 60_000);
