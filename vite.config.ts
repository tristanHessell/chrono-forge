import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { cssModuleTypesPlugin } from './scripts/css-module-types.ts';
import { extractMessagesPlugin } from './scripts/message-catalog.ts';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/chrono-forge/' : '/',
  plugins: [extractMessagesPlugin(), react(), cssModuleTypesPlugin()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
