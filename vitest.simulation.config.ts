import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    fileParallelism: false,
    include: ['simulations/**/*.simulation.ts'],
    testTimeout: 120_000,
  },
});
