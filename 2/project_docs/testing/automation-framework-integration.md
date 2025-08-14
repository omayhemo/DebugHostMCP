# Automation Framework Integration and CI/CD - Story 3.2 Testing Strategy

## Overview

This document outlines the automation framework integration and CI/CD pipeline configuration for the Real-time Log Viewer testing strategy.

## Jest Configuration Enhancement

```javascript
// dashboard/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.stories.{js,jsx}',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Component-specific thresholds
    'src/components/LogViewer/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/hooks/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000,
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(eventemitter3|other-es-modules)/)',
  ],
  // Performance testing configuration
  maxWorkers: process.env.CI ? 2 : '50%',
  // Memory leak detection
  detectLeaks: true,
  // Verbose output in CI
  verbose: process.env.CI === 'true'
};
```

## Test Setup and Global Configuration

```javascript
// dashboard/tests/setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { setupEventSourceMock } from './__mocks__/EventSource';
import { server } from './__mocks__/server';

// React Testing Library configuration
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
});

// Setup MSW for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Setup EventSource mocking
beforeEach(() => {
  setupEventSourceMock();
});

// Global test utilities
global.testUtils = {
  // Wait for real-time updates
  waitForRealtimeUpdate: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (callback()) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for realtime update after ${timeout}ms`));
        }
      }, 50);
    });
  },
  
  // Memory usage monitoring for tests
  measureMemoryUsage: (testFunction) => {
    const before = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const result = testFunction();
    const after = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    return {
      result,
      memoryDelta: after - before,
      memoryBefore: before,
      memoryAfter: after
    };
  },
  
  // Performance timing utilities
  measurePerformance: async (asyncFunction) => {
    const start = performance.now();
    const result = await asyncFunction();
    const end = performance.now();
    
    return {
      result,
      duration: end - start
    };
  }
};

// Console error/warning tracking for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Increase timeout for performance tests
if (process.env.TEST_TYPE === 'performance') {
  jest.setTimeout(30000);
}
```

## Playwright Configuration for E2E Tests

```javascript
// dashboard/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Performance monitoring
    ...devices['Desktop Chrome'],
    // Enable additional dev tools for debugging
    devtools: process.env.DEBUG === 'true'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    // Performance testing project
    {
      name: 'performance',
      testDir: './tests/performance',
      timeout: 60 * 1000,
      use: {
        ...devices['Desktop Chrome'],
        // Throttling for consistent performance testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

## GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/dashboard-tests.yml
name: Dashboard Testing Pipeline

on:
  push:
    branches: [ main, develop ]
    paths: [ 'dashboard/**' ]
  pull_request:
    branches: [ main, develop ]
    paths: [ 'dashboard/**' ]

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: dashboard/package-lock.json
    
    - name: Install dependencies
      run: |
        cd dashboard
        npm ci
    
    - name: Run unit tests
      run: |
        cd dashboard
        npm run test:coverage
      env:
        CI: true
    
    - name: Run integration tests
      run: |
        cd dashboard
        npm run test:integration
      env:
        CI: true
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: dashboard/coverage/lcov.info
        flags: dashboard-unit
        name: dashboard-unit-coverage
    
    - name: Archive test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: unit-test-results-node-${{ matrix.node-version }}
        path: |
          dashboard/coverage/
          dashboard/test-results/

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        cache-dependency-path: dashboard/package-lock.json
    
    - name: Install dependencies
      run: |
        cd dashboard
        npm ci
    
    - name: Run performance tests
      run: |
        cd dashboard
        npm run test:performance
      env:
        TEST_TYPE: performance
        NODE_OPTIONS: --max-old-space-size=4096
    
    - name: Performance benchmark comparison
      run: |
        cd dashboard
        npm run benchmark:compare
      if: github.event_name == 'pull_request'
    
    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-test-results
        path: dashboard/performance-results/

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        cache-dependency-path: dashboard/package-lock.json
    
    - name: Install dependencies
      run: |
        cd dashboard
        npm ci
    
    - name: Install Playwright browsers
      run: |
        cd dashboard
        npx playwright install --with-deps
    
    - name: Start backend services
      run: |
        # Start MCP Debug Host backend
        npm start &
        sleep 10
      env:
        NODE_ENV: test
    
    - name: Run E2E tests
      run: |
        cd dashboard
        npx playwright test
      env:
        BASE_URL: http://localhost:3000
    
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: e2e-test-results
        path: |
          dashboard/test-results/
          dashboard/playwright-report/

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        cache-dependency-path: dashboard/package-lock.json
    
    - name: Install dependencies
      run: |
        cd dashboard
        npm ci
    
    - name: Install Playwright browsers
      run: |
        cd dashboard
        npx playwright install chromium
    
    - name: Run accessibility tests
      run: |
        cd dashboard
        npm run test:accessibility
    
    - name: Upload accessibility results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: accessibility-test-results
        path: dashboard/accessibility-results/

  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    needs: [unit-tests, performance-tests, e2e-tests, accessibility-tests]
    if: always()
    
    steps:
    - name: Check test results
      run: |
        echo "Unit tests: ${{ needs.unit-tests.result }}"
        echo "Performance tests: ${{ needs.performance-tests.result }}"
        echo "E2E tests: ${{ needs.e2e-tests.result }}"
        echo "Accessibility tests: ${{ needs.accessibility-tests.result }}"
        
        if [ "${{ needs.unit-tests.result }}" != "success" ]; then
          echo "Unit tests failed - blocking deployment"
          exit 1
        fi
        
        if [ "${{ needs.e2e-tests.result }}" != "success" ]; then
          echo "E2E tests failed - blocking deployment"
          exit 1
        fi
        
        # Performance tests are informational but don't block
        if [ "${{ needs.performance-tests.result }}" != "success" ]; then
          echo "Performance tests failed - review required"
        fi
        
        # Accessibility tests are strongly recommended but don't block
        if [ "${{ needs.accessibility-tests.result }}" != "success" ]; then
          echo "Accessibility tests failed - review required"
        fi
```

## Package.json Scripts for Testing

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:performance": "jest --testPathPattern=tests/performance --runInBand",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:accessibility": "playwright test --project=accessibility",
    "test:debug": "jest --detectOpenHandles --forceExit",
    "test:ci": "npm run test:coverage && npm run test:e2e",
    "benchmark": "node scripts/benchmark.js",
    "benchmark:compare": "node scripts/benchmark-compare.js"
  }
}
```

## Test Execution Strategy

### Test Execution Order

1. **Pre-commit hooks**: Lint, format, basic unit tests
2. **Development**: 
   - Unit tests (watch mode)
   - Integration tests (on demand)
   - Component-level E2E tests
3. **CI Pipeline**:
   - Unit + Integration tests (parallel across Node versions)
   - Performance tests (baseline comparison)
   - Full E2E test suite (cross-browser)
   - Accessibility validation
4. **Pre-deployment**: Full test suite with quality gates

### Quality Gates and Success Criteria

| Test Type | Coverage Threshold | Performance Threshold | Success Criteria |
|-----------|-------------------|----------------------|------------------|
| Unit Tests | >70% | <500ms average | All tests pass |
| Integration | >60% | <2s per test | All tests pass |
| E2E Tests | N/A | <30s per scenario | All critical paths pass |
| Performance | N/A | <500ms streaming latency | No regressions >20% |
| Accessibility | N/A | WCAG AA compliance | Zero violations |

### Monitoring and Reporting

- **Test Results Dashboard**: Aggregate results across all test types
- **Performance Trends**: Track streaming latency, search performance over time
- **Coverage Reports**: Component-level coverage with trend analysis
- **Error Analysis**: Categorize and track test failures by component/feature
- **Accessibility Metrics**: WCAG compliance score and violation trends

## Summary

This automation framework provides:

- **Comprehensive CI/CD Pipeline**: Multi-stage validation with quality gates
- **Cross-Browser Testing**: Ensures compatibility across major browsers
- **Performance Monitoring**: Continuous performance regression detection
- **Accessibility Validation**: Automated WCAG compliance checking
- **Scalable Test Execution**: Optimized for both local development and CI environments