import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractMessageCatalog } from './message-catalog.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDirectory = mkdtempSync(
  path.join(os.tmpdir(), 'chrono-forge-messages-'),
);
const generatedPath = path.join(temporaryDirectory, 'en.json');
const catalogPath = path.join(root, 'src/i18n/en.json');

try {
  extractMessageCatalog(generatedPath);

  const current = JSON.stringify(JSON.parse(readFileSync(catalogPath, 'utf8')));
  const generated = JSON.stringify(
    JSON.parse(readFileSync(generatedPath, 'utf8')),
  );

  if (current !== generated) {
    throw new Error('src/i18n/en.json is out of date. Run npm run messages.');
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
