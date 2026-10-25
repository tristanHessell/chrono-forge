export default {
  '*.{js,jsx,mjs,cjs,ts,tsx}': 'eslint --quiet --fix',
  '*': 'prettier --ignore-unknown',
  '*.{js,jsx,mjs,cjs,ts,tsx,json,jsonc,css,html,md,yaml,yml}':
    'cspell --no-progress --no-must-find-files',
  'package.json': () => 'npm run lint:package',
};
