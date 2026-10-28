import { playwright } from '@vitest/browser-playwright';
import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
      },
      css: { include: [/\.module\.css$/] },
      include: ['src/**/*.test.tsx'],
    },
  }),
);
