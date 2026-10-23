import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const formatjs = path.join(root, 'node_modules/@formatjs/cli/bin/formatjs');

const args = (outFile: string) => {
  return [
    'extract',
    'src/**/*.{ts,tsx}',
    '--ignore',
    '**/*.test.*',
    '--out-file',
    outFile,
    '--format',
    'simple',
  ];
};

export const extractMessageCatalog = (outFile = 'src/i18n/en.json') => {
  execFileSync(process.execPath, [formatjs, ...args(outFile)], {
    cwd: root,
    stdio: 'inherit',
  });
};

export const extractMessagesPlugin = (): Plugin => {
  return {
    name: 'extract-message-catalog',
    buildStart: () => {
      extractMessageCatalog();
    },
    configureServer: (server) => {
      server.watcher.add(path.join(root, 'src'));
      server.watcher.on('change', (file) => {
        const sourceFile = path.relative(path.join(root, 'src'), file);

        if (
          !sourceFile.startsWith('..') &&
          /\.tsx?$/.test(file) &&
          !/\.d\.ts$/.test(file) &&
          !/\.test\.[jt]sx?$/.test(file)
        ) {
          try {
            extractMessageCatalog();
          } catch (error) {
            server.config.logger.error(String(error));
          }
        }
      });
    },
  };
};
