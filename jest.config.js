module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  globals: {
    'ts-jest': {
      diagnostics: { ignoreCodes: ['TS2593', 'TS2304'] },
      tsconfig: {
        types: ['jest'],
      },
    }
  }
};
