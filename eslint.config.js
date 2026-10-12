const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  ...expoConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      '**/*.backup',
      'coverage/**',
      'scratch/**',
      'patch_plugin.js',
      'test-db.js',
      'test-sqlite.ts',
      'test-stats.js',
      '__tests__/stats-node.test.js',
    ],
  },
]);
