import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['simulations/**/*.simulation.ts'],
    testTimeout: 120_000,
    fileParallelism: false,
    disableConsoleIntercept: true,
  },
});
