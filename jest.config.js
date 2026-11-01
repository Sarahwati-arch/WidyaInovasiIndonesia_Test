module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
};
