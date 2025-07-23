# Testing Module

## Overview
Comprehensive testing framework with unit tests, integration tests, and E2E tests.

## Structure
- `tests/` - Test suites
  - `e2e/` - End-to-end tests with Playwright
  - `database/` - Database integration tests
- `unit/` - Unit tests for individual components
- Configuration files:
  - `jest.config.js` - Jest testing framework
  - `playwright.config.js` - Playwright E2E testing
  - `bun.config.ts` - Bun runtime configuration
  - `eslint.config.js` - Code linting rules

## Key Features
- Jest for unit and integration testing
- Playwright for E2E testing
- Database testing with PostgreSQL
- Code coverage reporting
- Automated test execution

## Usage
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run database tests
npm run test:db

# Generate coverage report
npm run test:coverage
```

## Test Categories
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and service integration
- **E2E Tests**: Full application workflow testing
- **Database Tests**: PostgreSQL functionality testing
- **Performance Tests**: Load and performance testing

## CI/CD Integration
Tests are configured to run in CI/CD pipelines with proper environment setup and database provisioning.
