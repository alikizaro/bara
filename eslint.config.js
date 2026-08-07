const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: ['convex/_generated/**', 'coverage/**', 'dist/**'],
  },
  expoConfig,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
