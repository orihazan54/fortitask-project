module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!tests/**',
    '!fixtures/**',
    '!server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  }
}; 