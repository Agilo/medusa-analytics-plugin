const { loadEnv } = require('@medusajs/framework/utils');
loadEnv('test', process.cwd());

module.exports = {
  transform: {
    '^.+\\.[jt]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
        },
      },
    ],
  },
  testEnvironment: 'node',
  testTimeout: 10000,
  moduleFileExtensions: ['js', 'ts', 'json'],
  modulePathIgnorePatterns: ['dist/'],
  setupFiles: ['<rootDir>/integration-tests/setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/integration-tests/setup.js'],
  testMatch:
    process.env.TEST_TYPE === 'integration:http'
      ? ['<rootDir>/integration-tests/http/*.spec.[jt]s']
      : process.env.TEST_TYPE === 'unit'
      ? ['<rootDir>/unit-tests/**/*.spec.[jt]s']
      : undefined,
};
