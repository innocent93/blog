module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/routes/docs.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 10000
};
