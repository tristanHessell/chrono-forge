import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv } from 'node:process';

import { chromium } from 'playwright';

const [output, mode = 'game'] = argv.slice(2);

if (!output || !['game', 'settings'].includes(mode)) {
  throw new Error('Usage: node capture.mjs <output.png> [game|settings]');
}

const outputPath = resolve(output);

await mkdir(dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { height: 900, width: 1280 },
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Start a new game' }).click();
  await page
    .getByRole('combobox', { name: /Controller for/ })
    .selectOption('human');
  await page.getByRole('button', { name: 'Start game' }).click();

  if (mode === 'settings') {
    await page.locator('summary[aria-label="Game menu"]').click();
    await page.getByRole('button', { exact: true, name: 'Settings' }).click();
  }

  await page.screenshot({ path: outputPath });
} finally {
  await browser.close();
}
