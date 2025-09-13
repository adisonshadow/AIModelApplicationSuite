module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/test/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/test/**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    '!packages/**/*.d.ts',
    '!packages/**/*.stories.{ts,tsx}',
    '!packages/**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/packages/ai_model_application_suite/node_modules/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  projects: [
    {
      displayName: 'unified-suite',
      testMatch: ['<rootDir>/test/ai_model_application_suite/**/*.(test|spec).(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/test/ai_model_application_suite/setupTests.ts']
    }
  ]
};
