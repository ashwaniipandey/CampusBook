export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 30000,
  transform: {},
  maxWorkers: 1,
  collectCoverageFrom: ['src/controllers/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
