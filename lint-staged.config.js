export default {
  '*': 'prettier --write --ignore-unknown',
  '*.{js,jsx,mjs,cjs,ts,tsx,json,jsonc,css,html,md,yaml,yml}':
    'cspell --no-progress --no-must-find-files',
  '*.{js,jsx,mjs,cjs,ts,tsx}': 'eslint --quiet --fix',
  'package.json': () => 'npm run lint:package',
};
