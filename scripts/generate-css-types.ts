import { resolveConfig } from 'vite';

import { generateCssModuleTypes } from './css-module-types.ts';

const config = await resolveConfig({ logLevel: 'silent' }, 'build');

await generateCssModuleTypes(config);
