// Jest configuration for comprehensive backend testing of academic assignment management system
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageDirectory: './coverage',
  // Comprehensive code coverage collection excluding test files and server entry point
  collectCoverageFrom: [
    '**/*.js',
    '!tests/**',
    '!fixtures/**',
    '!server.js'
  ],
  // Strict coverage thresholds for high-quality code assurance
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  }
}; 