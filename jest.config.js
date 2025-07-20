module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/docs/'
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
    'scripts/**/*.js',
    '!server/node_modules/**',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/*.config.js',
    '!**/dist/**'
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
  
  // Transform patterns
  transform: {},
  
  // Module path mapping
  modulePathIgnorePatterns: ['<rootDir>/coverage/'],
  
  // Global variables available in tests
  globals: {
    NODE_ENV: 'test'
  },
  
  // Test result processor
  testResultsProcessor: undefined,
  
  // Watch mode settings
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/uploads/'
  ]
};