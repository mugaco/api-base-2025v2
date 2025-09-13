/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/src/cli-old/'  // Ignorar la carpeta cli-old
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/cli-old/'  // Ignorar pruebas en la carpeta cli-old
  ],
  roots: ['<rootDir>/src'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@entities/(.*)$': '<rootDir>/src/api/entities/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  }
}; 