import { playwright } from '@vitest/browser-playwright';
import { mergeConfig } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

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
      exclude: [...configDefaults.exclude, '**/.worktrees/**'],
      include: ['src/**/*.test.tsx'],
    },
  }),
);
