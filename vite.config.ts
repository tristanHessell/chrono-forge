import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { cssModuleTypesPlugin } from './scripts/css-module-types.ts';

export default defineConfig({
  plugins: [react(), cssModuleTypesPlugin()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
