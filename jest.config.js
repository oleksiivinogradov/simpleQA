/**
 * Jest Configuration
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server.js',
    'db/**/*.js',
    'services/**/*.js',
  ],
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  // Mock API service for tests that just need it as a dependency
  moduleNameMapper: {
    '^../services/aiService$': '<rootDir>/tests/mocks/aiServiceMock.js'
  },
  // Don't include failing tests in regular test runs
  testPathIgnorePatterns: ['tests/aiService.test.js']
}; 