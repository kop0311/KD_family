const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environments for different types of tests
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/server/**/__tests__/**/*.js',
        '<rootDir>/server/**/?(*.)+(spec|test).js',
        '<rootDir>/test/**/*.test.js'
      ],
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/app/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
        '<rootDir>/components/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/test/setup-client.js'],
    },
  ],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/docs/',
    '/tests/e2e/',
    '/.next/',
    '/out/',
    '/legacy/'
  ],

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    'hooks/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/*.config.js',
    '!**/dist/**',
    '!**/.next/**',
    '!**/out/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  setupFiles: ['<rootDir>/test/env.js'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/store/(.*)$': '<rootDir>/store/$1',
  },

  // Verbose output
  verbose: true,

  // Exit after tests complete
  forceExit: true,

  // Clear mocks after each test
  clearMocks: true,

  // Test reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'KD Family Test Report'
    }]
  ],

  // Module path mapping
  modulePathIgnorePatterns: ['<rootDir>/coverage/'],

  // Global variables available in tests
  globals: {
    NODE_ENV: 'test'
  },

  // Watch mode settings
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/uploads/',
    '/.next/',
    '/out/'
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);