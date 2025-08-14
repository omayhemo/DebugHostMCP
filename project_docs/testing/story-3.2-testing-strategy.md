# Testing Strategy: Story 3.2 - Real-time Log Viewer Component

**Created**: August 7, 2025  
**Component**: Real-time Log Viewer for React Dashboard  
**Context**: Phase 3 User Interface Development  
**Testing Agent**: Testing Strategy Sub-agent  

## Overview

This testing strategy defines comprehensive validation approaches for the Real-time Log Viewer component, ensuring robust functionality, performance, and user experience across all scenarios.

## Test Architecture

### Test Environment Setup


### 2.3 WebSocket/SSE Resilience Testing

```javascript
// /dashboard/tests/integration/connectionResilience.test.js
describe('Connection Resilience Integration', () => {
  let mockEventSource;
  let connectionManager;
  
  beforeEach(() => {
    mockEventSource = createMockEventSource();
    global.EventSource = jest.fn(() => mockEventSource);
    connectionManager = new LogStreamConnectionManager();
  });

## 6. Test Data Strategy and Mock Setup

### 6.1 Mock Data Generation

```javascript
// /dashboard/tests/__fixtures__/logFixtures.js
class LogFixtureGenerator {
  static generateMockLogs(count = 100, options = {}) {
    const {
      containerId = 'test-container',
      levels = ['info', 'warn', 'error', 'debug'],
      streams = ['stdout', 'stderr'],
      timeRange = 3600000, // 1 hour
      patterns = []
    } = options;
    
    const logs = [];
    const baseTime = Date.now() - timeRange;
    
    for (let i = 0; i < count; i++) {
      const log = {
        id: `${containerId}-${i + 1}`,
        containerId,
        timestamp: baseTime + Math.floor((timeRange * i) / count),
        level: levels[Math.floor(Math.random() * levels.length)],
        stream: streams[Math.floor(Math.random() * streams.length)],
        message: this.generateLogMessage(i, patterns)
      };
      
      logs.push(log);
    }
    
    return logs.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  static generateLogMessage(index, patterns = []) {
    const defaultPatterns = [
      'Starting application server',
      'Database connection established',
      'Processing user request {userId}',
      'API response time: {responseTime}ms',
      'Memory usage: {memory}MB',
      'Error: Connection timeout after 30s',
      'Warning: High CPU usage detected',
      'Debug: Processing batch {batchId}',
      'Request from IP {ipAddress}',
      'Cache miss for key: {cacheKey}'
    ];
    
    const allPatterns = [...defaultPatterns, ...patterns];
    const pattern = allPatterns[Math.floor(Math.random() * allPatterns.length)];
    
    // Replace placeholders with realistic values
    return pattern
      .replace('{userId}', Math.floor(Math.random() * 10000))
      .replace('{responseTime}', Math.floor(Math.random() * 2000) + 50)
      .replace('{memory}', Math.floor(Math.random() * 512) + 64)
      .replace('{batchId}', `batch-${Math.floor(Math.random() * 1000)}`)
      .replace('{ipAddress}', this.generateIPAddress())
      .replace('{cacheKey}', `cache-${Math.floor(Math.random() * 10000)}`);
  }
  
  static generateIPAddress() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
  
  static generateLargeMockDataset(size = 100000) {
    const chunks = [];
    const chunkSize = 10000;
    
    for (let i = 0; i < size; i += chunkSize) {
      const remaining = Math.min(chunkSize, size - i);
      const chunk = this.generateMockLogs(remaining, {
        containerId: `performance-container-${Math.floor(i / chunkSize)}`,
        timeRange: 86400000 // 24 hours
      });
      chunks.push(...chunk);
    }
    
    return chunks;
  }
  
  static generateErrorScenarioLogs() {
    const errorPatterns = [
      'Error: ECONNREFUSED Connection refused',
      'TypeError: Cannot read property "id" of undefined',
      'SyntaxError: Unexpected token } in JSON',
      'ReferenceError: database is not defined',
      'Error: Request timeout after 30000ms',
      'ValidationError: Required field "email" is missing',
      'AuthenticationError: Invalid credentials provided',
      'PermissionError: Access denied for resource',
      'DatabaseError: Connection pool exhausted',
      'NetworkError: DNS resolution failed'
    ];
    
    return this.generateMockLogs(100, {
      levels: ['error'],
      patterns: errorPatterns
    });
  }
  
  static generatePerformanceLogs() {
    const performancePatterns = [
      'Response time: {responseTime}ms for endpoint /api/users',
      'Database query completed in {queryTime}ms',
      'Memory usage: {memory}MB (limit: 512MB)',
      'CPU usage: {cpu}% (cores: 4)',
      'Active connections: {connections}',
      'Cache hit ratio: {hitRatio}%',
      'Queue size: {queueSize} items',
      'Throughput: {throughput} requests/sec'
    ];
    
    return this.generateMockLogs(500, {
      patterns: performancePatterns.map(pattern => 
        pattern
          .replace('{responseTime}', Math.floor(Math.random() * 5000) + 100)
          .replace('{queryTime}', Math.floor(Math.random() * 1000) + 10)
          .replace('{memory}', Math.floor(Math.random() * 400) + 100)
          .replace('{cpu}', Math.floor(Math.random() * 80) + 10)
          .replace('{connections}', Math.floor(Math.random() * 1000) + 50)
          .replace('{hitRatio}', Math.floor(Math.random() * 40) + 60)
          .replace('{queueSize}', Math.floor(Math.random() * 100))
          .replace('{throughput}', Math.floor(Math.random() * 500) + 50)
      )
    });
  }
}

module.exports = LogFixtureGenerator;
```

### 6.2 SSE Mock Implementation

```javascript
// /dashboard/tests/__mocks__/EventSource.js
class MockEventSource {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.readyState = MockEventSource.CONNECTING;
    this.listeners = new Map();
    this.simulationState = {
      connected: false,
      messageQueue: [],
      errorState: null
    };
    
    // Auto-connect after a short delay
    setTimeout(() => {
      if (this.simulationState.errorState) {
        this.simulateError(this.simulationState.errorState);
      } else {
        this.simulateConnection();
      }
    }, 10);
  }
  
  static get CONNECTING() { return 0; }
  static get OPEN() { return 1; }
  static get CLOSED() { return 2; }
  
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(listener);
  }
  
  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      const listeners = this.listeners.get(type);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  close() {
    this.readyState = MockEventSource.CLOSED;
    this.simulationState.connected = false;
    this.dispatchEvent({ type: 'close' });
  }
  
  dispatchEvent(event) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
  
  simulateConnection() {
    this.readyState = MockEventSource.OPEN;
    this.simulationState.connected = true;
    this.dispatchEvent({ type: 'open' });
    
    // Process any queued messages
    this.simulationState.messageQueue.forEach(message => {
      this.dispatchEvent(message);
    });
    this.simulationState.messageQueue = [];
  }
  
  simulateMessage(data) {
    const event = {
      type: 'message',
      data: typeof data === 'string' ? data : JSON.stringify(data)
    };
    
    if (this.simulationState.connected) {
      this.dispatchEvent(event);
    } else {
      this.simulationState.messageQueue.push(event);
    }
  }
  
  simulateError(error) {
    this.readyState = MockEventSource.CLOSED;
    this.simulationState.connected = false;
    this.simulationState.errorState = error;
    this.dispatchEvent({ 
      type: 'error', 
      ...error 
    });
  }
  
  simulateClose() {
    this.close();
  }
  
  // Test utilities
  getListenerCount(type) {
    return this.listeners.get(type)?.length || 0;
  }
  
  isConnected() {
    return this.simulationState.connected;
  }
  
  getQueuedMessageCount() {
    return this.simulationState.messageQueue.length;
  }
}

// Factory function for creating mock instances
function createMockEventSource(options = {}) {
  return new MockEventSource('mock://test-url', options);
}

// Global mock setup for Jest
const originalEventSource = global.EventSource;

function setupEventSourceMock() {
  global.EventSource = MockEventSource;
}

function restoreEventSource() {
  global.EventSource = originalEventSource;
}

module.exports = {
  MockEventSource,
  createMockEventSource,
  setupEventSourceMock,
  restoreEventSource
};
```

### 6.3 API Response Mocks

```javascript
// /dashboard/tests/__mocks__/apiMocks.js
import { LogFixtureGenerator } from '../__fixtures__/logFixtures';

class ApiMockManager {
  static createLogApiMocks() {
    return {
      // GET /api/logs/:containerId
      getLogs: (containerId, params) => {
        const {
          limit = 100,
          offset = 0,
          level,
          search,
          since,
          until
        } = params;
        
        let logs = LogFixtureGenerator.generateMockLogs(1000, {
          containerId
        });
        
        // Apply filters
        if (level) {
          logs = logs.filter(log => log.level === level);
        }
        
        if (search) {
          logs = logs.filter(log => 
            log.message.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (since) {
          const sinceTime = new Date(since).getTime();
          logs = logs.filter(log => log.timestamp >= sinceTime);
        }
        
        if (until) {
          const untilTime = new Date(until).getTime();
          logs = logs.filter(log => log.timestamp <= untilTime);
        }
        
        // Apply pagination
        const total = logs.length;
        const paginatedLogs = logs.slice(offset, offset + limit);
        
        return {
          logs: paginatedLogs,
          total,
          hasMore: offset + limit < total,
          pagination: {
            limit,
            offset,
            total
          }
        };
      },
      
      // GET /api/logs/:containerId/search
      searchLogs: (containerId, params) => {
        const {
          query,
          limit = 100,
          includeFacets = false
        } = params;
        
        const logs = LogFixtureGenerator.generateMockLogs(1000, {
          containerId
        });
        
        // Simple search implementation
        const matchedLogs = logs.filter(log => {
          if (query.startsWith('level:')) {
            const level = query.split(':')[1];
            return log.level === level;
          }
          
          return log.message.toLowerCase().includes(query.toLowerCase());
        }).slice(0, limit);
        
        const response = {
          query,
          results: [{
            containerName: containerId,
            matches: matchedLogs.length,
            logs: matchedLogs
          }],
          totalMatches: matchedLogs.length,
          searchTime: Math.floor(Math.random() * 100) + 50
        };
        
        if (includeFacets) {
          response.facets = {
            levels: {
              info: Math.floor(Math.random() * 500),
              warn: Math.floor(Math.random() * 100),
              error: Math.floor(Math.random() * 50),
              debug: Math.floor(Math.random() * 200)
            },
            timeRanges: {
              last_hour: Math.floor(Math.random() * 100),
              last_24h: Math.floor(Math.random() * 500),
              last_7d: Math.floor(Math.random() * 1000)
            },
            containers: {
              [containerId]: matchedLogs.length
            }
          };
        }
        
        return response;
      },
      
      // POST /api/logs/:containerId/export
      exportLogs: (containerId, params) => {
        const { format, filters = {} } = params;
        
        const logs = LogFixtureGenerator.generateMockLogs(100, {
          containerId,
          ...filters
        });
        
        let content;
        let contentType;
        let filename;
        
        switch (format) {
          case 'json':
            content = JSON.stringify(logs, null, 2);
            contentType = 'application/json';
            filename = `${containerId}_logs_${Date.now()}.json`;
            break;
            
          case 'csv':
            const headers = ['Timestamp', 'Level', 'Stream', 'Message'];
            const rows = logs.map(log => [
              new Date(log.timestamp).toISOString(),
              log.level,
              log.stream,
              `"${log.message.replace(/"/g, '""')}"`
            ]);
            content = [headers, ...rows].map(row => row.join(',')).join('\n');
            contentType = 'text/csv';
            filename = `${containerId}_logs_${Date.now()}.csv`;
            break;
            
          case 'text':
            content = logs.map(log => 
              `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
            ).join('\n');
            contentType = 'text/plain';
            filename = `${containerId}_logs_${Date.now()}.txt`;
            break;
            
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
        
        return {
          content,
          contentType,
          filename,
          logCount: logs.length
        };
      }
    };
  }
  
  static createErrorScenarios() {
    return {
      serverError: () => ({
        status: 500,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      
      notFound: (containerId) => ({
        status: 404,
        error: `Container '${containerId}' not found`,
        code: 'CONTAINER_NOT_FOUND'
      }),
      
      rateLimit: () => ({
        status: 429,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        retryAfter: 60
      }),
      
      badRequest: (message) => ({
        status: 400,
        error: message || 'Bad request',
        code: 'BAD_REQUEST'
      })
    };
  }
}

module.exports = ApiMockManager;
```

### 6.4 Performance Test Data Generators

```javascript
// /dashboard/tests/__fixtures__/performanceFixtures.js
class PerformanceFixtureGenerator {
  static generateHighVolumeLogStream(duration = 10000, logsPerSecond = 100) {
    const totalLogs = Math.floor((duration / 1000) * logsPerSecond);
    const logs = [];
    const startTime = Date.now();
    
    for (let i = 0; i < totalLogs; i++) {
      const timestamp = startTime + Math.floor((i / logsPerSecond) * 1000);
      
      logs.push({
        id: `perf-${i + 1}`,
        timestamp,
        level: this.getRandomLevel(),
        stream: Math.random() > 0.5 ? 'stdout' : 'stderr',
        message: `High volume log entry ${i + 1} - ${this.generateRandomText()}`
      });
    }
    
    return logs;
  }
  
  static generateMemoryIntensiveLogs(count = 1000, messageSizeKB = 1) {
    const messageSize = messageSizeKB * 1024;
    const logs = [];
    
    for (let i = 0; i < count; i++) {
      logs.push({
        id: `memory-${i + 1}`,
        timestamp: Date.now() + i * 1000,
        level: 'info',
        stream: 'stdout',
        message: 'M'.repeat(messageSize) // Memory-intensive message
      });
    }
    
    return logs;
  }
  
  static generateSearchComplexityData(complexity = 'high') {
    const patterns = {
      low: {
        count: 1000,
        uniqueTerms: 50,
        messageLength: 100
      },
      medium: {
        count: 10000,
        uniqueTerms: 500,
        messageLength: 500
      },
      high: {
        count: 100000,
        uniqueTerms: 5000,
        messageLength: 1000
      }
    };
    
    const config = patterns[complexity];
    const terms = this.generateUniqueTerms(config.uniqueTerms);
    const logs = [];
    
    for (let i = 0; i < config.count; i++) {
      const selectedTerms = this.selectRandomTerms(terms, 5);
      const message = this.generateMessageWithTerms(selectedTerms, config.messageLength);
      
      logs.push({
        id: `search-${i + 1}`,
        timestamp: Date.now() - Math.random() * 86400000, // Random within last 24h
        level: this.getRandomLevel(),
        stream: 'stdout',
        message
      });
    }
    
    return logs;
  }
  
  static generateUniqueTerms(count) {
    const terms = [];
    const prefixes = ['error', 'warn', 'info', 'debug', 'trace'];
    const subjects = ['database', 'user', 'api', 'cache', 'memory', 'cpu', 'network'];
    const actions = ['connect', 'process', 'validate', 'execute', 'timeout', 'retry'];
    
    for (let i = 0; i < count; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      terms.push(`${prefix}-${subject}-${action}-${i}`);
    }
    
    return terms;
  }
  
  static selectRandomTerms(terms, count) {
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(terms[Math.floor(Math.random() * terms.length)]);
    }
    return selected;
  }
  
  static generateMessageWithTerms(terms, targetLength) {
    let message = terms.join(' ');
    
    while (message.length < targetLength) {
      message += ` ${this.generateRandomText()} ${terms[Math.floor(Math.random() * terms.length)]}`;
    }
    
    return message.substring(0, targetLength);
  }
  
  static generateRandomText(length = 50) {
    const chars = 'abcdefghijklmnopqrstuvwxyz ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  static getRandomLevel() {
    const levels = ['info', 'warn', 'error', 'debug'];
    const weights = [0.6, 0.2, 0.1, 0.1]; // Info logs are most common
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return levels[i];
      }
    }
    
    return 'info';
  }
}

module.exports = PerformanceFixtureGenerator;
```

## 7. Automation Framework Integration and CI/CD

For detailed automation framework configuration, CI/CD pipeline setup, and test execution strategy, see the companion document:

**[Automation Framework Integration](./automation-framework-integration.md)**

This includes:
- Jest and Playwright configuration
- GitHub Actions CI/CD pipeline
- Quality gates and success criteria
- Performance monitoring and reporting
- Test execution order and scheduling

## Summary

This comprehensive testing strategy ensures robust validation of the Real-time Log Viewer component across all critical dimensions:

- **Unit Testing**: Validates individual components and hooks with >70% coverage threshold
- **Integration Testing**: Ensures proper SSE connections and API interactions with <2s performance
- **UI Testing**: Validates end-user workflows and accessibility with WCAG AA compliance
- **Performance Testing**: Ensures streaming latency <500ms and search response <2s
- **Error Scenarios**: Validates graceful handling of connection failures, malformed data, and API errors
- **Test Data Strategy**: Provides realistic mock data for all test scenarios
- **Automation Framework**: Enables continuous validation through comprehensive CI/CD pipeline

The strategy balances comprehensive coverage with practical execution, providing confidence in the component's reliability while maintaining development velocity. All tests are designed to run efficiently in both development and CI environments, with appropriate quality gates to ensure production readiness.
```

## 7. Automation Framework Integration and CI/CD

### 7.1 Jest Configuration Enhancement

```javascript
// dashboard/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  moduleNameMapping: {
    '^@/(.*)
```

## 3. UI Testing Strategy

### 3.1 End-to-End User Interaction Testing

```javascript
// /dashboard/tests/e2e/logViewer.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('Log Viewer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock server for consistent testing
    await page.route('/api/logs/**', async (route) => {
      const url = new URL(route.request().url());
      const mockData = generateE2EMockData(url.pathname, url.searchParams);
      await route.fulfill({ json: mockData });
    });
    
    // Navigate to log viewer
    await page.goto('/dashboard/logs/test-container');
  });

  test('displays logs with proper formatting and styling', async ({ page }) => {
    // Wait for logs to load
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check log entries are displayed
    const logEntries = await page.locator('[data-testid="log-entry"]').count();
    expect(logEntries).toBeGreaterThan(0);
    
    // Verify timestamp formatting
    const firstTimestamp = await page.locator('[data-testid="log-timestamp"]').first().textContent();
    expect(firstTimestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    
    // Verify level-based styling
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]');
    await expect(errorLogs.first()).toHaveClass(/error/);
    
    const infoLogs = page.locator('[data-testid="log-entry"][data-level="info"]');
    await expect(infoLogs.first()).toHaveClass(/info/);
  });

  test('implements infinite scroll for log pagination', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Scroll to bottom to trigger loading more logs
    await page.locator('[data-testid="log-container"]').scrollTo({ top: 'bottom' });
    
    // Wait for new logs to load
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount,
      { timeout: 5000 }
    );
    
    const newCount = await page.locator('[data-testid="log-entry"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('filters logs by level correctly', async ({ page }) => {
    // Open level filter dropdown
    await page.click('[data-testid="level-filter-button"]');
    
    // Select "Error" filter
    await page.click('[data-testid="level-filter-error"]');
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Verify only error logs are shown
    const visibleLogs = page.locator('[data-testid="log-entry"]:visible');
    const count = await visibleLogs.count();
    
    for (let i = 0; i < count; i++) {
      const level = await visibleLogs.nth(i).getAttribute('data-level');
      expect(level).toBe('error');
    }
  });

  test('search functionality works with real-time updates', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Type in search box
    await page.fill('[data-testid="log-search-input"]', 'database');
    
    // Wait for search results
    await page.waitForTimeout(600); // Account for debounce
    
    // Verify filtered results
    const searchResults = page.locator('[data-testid="log-entry"]:visible');
    const count = await searchResults.count();
    
    for (let i = 0; i < count; i++) {
      const message = await searchResults.nth(i).locator('[data-testid="log-message"]').textContent();
      expect(message.toLowerCase()).toContain('database');
    }
    
    // Clear search
    await page.fill('[data-testid="log-search-input"]', '');
    await page.waitForTimeout(600);
    
    // Verify all logs are shown again
    const allLogs = await page.locator('[data-testid="log-entry"]:visible').count();
    expect(allLogs).toBeGreaterThan(count);
  });

  test('export functionality generates correct files', async ({ page }) => {
    // Setup download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select JSON format
    await page.click('[data-testid="export-format-json"]');
    
    // Confirm export
    await page.click('[data-testid="export-confirm"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/.*\.json$/);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('real-time log streaming updates UI correctly', async ({ page }) => {
    // Setup SSE mock
    await page.evaluate(() => {
      // Mock EventSource
      window.mockEventSource = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn()
      };
      global.EventSource = jest.fn(() => window.mockEventSource);
    });
    
    // Wait for initial setup
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Simulate new log message
    await page.evaluate(() => {
      const messageHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      
      messageHandler({
        data: JSON.stringify({
          id: 'new-log-' + Date.now(),
          timestamp: Date.now(),
          level: 'info',
          message: 'New real-time log entry',
          stream: 'stdout'
        })
      });
    });
    
    // Wait for UI update
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount
    );
    
    // Verify new log appears
    const newLog = page.locator('[data-testid="log-entry"]').last();
    await expect(newLog.locator('[data-testid="log-message"]')).toContainText('New real-time log entry');
  });

  test('handles connection status indicators', async ({ page }) => {
    // Initially should show connected
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
    
    // Simulate connection loss
    await page.evaluate(() => {
      const errorHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      errorHandler({ type: 'error' });
    });
    
    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/disconnected/);
    
    // Should show reconnecting indicator
    await expect(page.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
  });
});

## 4. Performance Testing Strategy

### 4.1 Streaming Performance Tests

```javascript
// /dashboard/tests/performance/streaming.test.js
describe('Log Streaming Performance', () => {
  test('handles high-frequency log streams efficiently', async () => {
    const performanceMonitor = new PerformanceMonitor();
    const logStream = new LogStreamingService();
    
    performanceMonitor.startTest('high-frequency-streaming');
    
    await logStream.connect('test-container');
    
    // Simulate 1000 logs per second for 10 seconds
    const logBatch = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      timestamp: Date.now() + i,
      level: 'info',
      message: `High frequency log ${i + 1}`,
      stream: 'stdout'
    }));
    
    const startTime = performance.now();
    
    for (let second = 0; second < 10; second++) {
      for (const log of logBatch) {
        mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    performanceMonitor.endTest('high-frequency-streaming');
    
    // Should process 10,000 logs in under 2 seconds
    expect(processingTime).toBeLessThan(2000);
    
    // Memory usage should remain stable
    const memoryStats = performanceMonitor.getMemoryStats();
    expect(memoryStats.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });

  test('maintains low latency for real-time updates', async () => {
    const latencyTracker = new LatencyTracker();
    const logStream = new LogStreamingService();
    
    logStream.onMessage((log) => {
      const latency = Date.now() - log.timestamp;
      latencyTracker.recordLatency(latency);
    });
    
    await logStream.connect('test-container');
    
    // Send 100 logs with timestamp tracking
    for (let i = 0; i < 100; i++) {
      const log = {
        id: i,
        timestamp: Date.now(),
        level: 'info',
        message: `Latency test log ${i}`,
        stream: 'stdout'
      };
      
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await waitFor(() => latencyTracker.getSampleCount() === 100);
    
    // Average latency should be under 50ms
    expect(latencyTracker.getAverageLatency()).toBeLessThan(50);
    
    // 95th percentile should be under 100ms
    expect(latencyTracker.getPercentile(95)).toBeLessThan(100);
  });

  test('handles backpressure gracefully', async () => {
    const logStream = new LogStreamingService({ 
      bufferSize: 1000,
      backpressureThreshold: 800 
    });
    
    const backpressureEvents = [];
    logStream.on('backpressure', (event) => backpressureEvents.push(event));
    
    await logStream.connect('test-container');
    
    // Flood with logs faster than processing
    const floodLogs = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
      message: `Flood log ${i}`,
      level: 'info'
    }));
    
    // Send all logs at once
    floodLogs.forEach(log => {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    });
    
    await waitFor(() => backpressureEvents.length > 0, { timeout: 5000 });
    
    // Should trigger backpressure handling
    expect(backpressureEvents).toHaveLength(1);
    expect(backpressureEvents[0].action).toBe('throttle');
    
    // Should maintain buffer limits
    const bufferStats = logStream.getBufferStats();
    expect(bufferStats.size).toBeLessThanOrEqual(1000);
  });
});
```

### 4.2 Search Performance Tests

```javascript
// /dashboard/tests/performance/search.test.js
describe('Log Search Performance', () => {
  let searchService;
  let performanceMonitor;
  
  beforeEach(() => {
    searchService = new LogSearchService();
    performanceMonitor = new PerformanceMonitor();
    
    // Setup test data - 100k log entries
    const testLogs = generateLargeMockDataset(100000);
    searchService.indexLogs('performance-test-container', testLogs);
  });

  test('search completes within performance thresholds', async () => {
    const searchQueries = [
      'error database connection',
      'level:warn memory usage',
      '/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/', // IP regex
      'response time performance'
    ];
    
    const results = [];
    
    for (const query of searchQueries) {
      performanceMonitor.startTimer('search');
      
      const result = await searchService.search(query, {
        containers: ['performance-test-container'],
        limit: 100
      });
      
      const searchTime = performanceMonitor.endTimer('search');
      
      results.push({
        query,
        searchTime,
        resultCount: result.totalMatches
      });
      
      // Each search should complete in under 500ms
      expect(searchTime).toBeLessThan(500);
    }
    
    // Average search time should be under 200ms
    const averageTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    expect(averageTime).toBeLessThan(200);
  });

  test('concurrent searches maintain performance', async () => {
    const concurrentSearches = 10;
    const searchPromises = [];
    
    performanceMonitor.startTest('concurrent-search');
    
    // Launch concurrent searches
    for (let i = 0; i < concurrentSearches; i++) {
      const promise = searchService.search(`concurrent test ${i}`, {
        containers: ['performance-test-container']
      });
      searchPromises.push(promise);
    }
    
    const results = await Promise.all(searchPromises);
    
    performanceMonitor.endTest('concurrent-search');
    
    // All searches should complete
    expect(results).toHaveLength(concurrentSearches);
    
    // Total time should be reasonable (not serial execution)
    const totalTime = performanceMonitor.getTestDuration('concurrent-search');
    expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 10 concurrent searches
  });

  test('memory usage remains stable during intensive search', async () => {
    const initialMemory = performanceMonitor.getCurrentMemoryUsage();
    
    // Perform 100 different searches
    for (let i = 0; i < 100; i++) {
      await searchService.search(`intensive search ${i}`, {
        containers: ['performance-test-container'],
        limit: 50
      });
      
      // Force garbage collection every 10 searches
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = performanceMonitor.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (under 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 4.3 Memory Usage Monitoring

```javascript
// /dashboard/tests/performance/memory.test.js
describe('Memory Usage Performance', () => {
  test('log buffer implements proper memory management', async () => {
    const logBuffer = new LogBuffer({ 
      maxSize: 10000,
      memoryThreshold: 100 * 1024 * 1024 // 100MB
    });
    
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.startMonitoring();
    
    // Add logs until threshold is approached
    let logCount = 0;
    while (memoryMonitor.getCurrentUsage() < 90 * 1024 * 1024) { // 90MB
      const log = {
        id: logCount++,
        timestamp: Date.now(),
        message: 'x'.repeat(1000), // 1KB message
        level: 'info'
      };
      
      logBuffer.addLog(log);
      
      if (logCount % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Should trigger automatic cleanup
    expect(logBuffer.getStats().cleaned).toBe(true);
    expect(memoryMonitor.getCurrentUsage()).toBeLessThan(100 * 1024 * 1024);
    
    memoryMonitor.stopMonitoring();
  });

  test('component unmounting releases memory properly', async () => {
    const { unmount } = render(<LogViewer containerId="memory-test" />);
    
    // Simulate heavy log streaming
    const logStream = new LogStreamingService();
    await logStream.connect('memory-test');
    
    // Add many logs to component
    for (let i = 0; i < 5000; i++) {
      mockEventSource.simulateMessage({
        data: JSON.stringify({
          id: i,
          message: `Memory test log ${i}`,
          timestamp: Date.now()
        })
      });
    }
    
    const beforeUnmount = performance.memory?.usedJSHeapSize || 0;
    
    // Unmount component
    unmount();
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUnmount = performance.memory?.usedJSHeapSize || 0;
    const memoryFreed = beforeUnmount - afterUnmount;
    
    // Should free significant memory
    expect(memoryFreed).toBeGreaterThan(0);
  });
});
```

## 5. Error Scenario Testing

### 5.1 Connection Failure Testing

```javascript
// /dashboard/tests/errorScenarios/connectionFailures.test.js
describe('Connection Failure Scenarios', () => {
  test('handles initial connection failures gracefully', async () => {
    // Mock failed connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 2 // CLOSED
      };
      
      // Immediately trigger error
      setTimeout(() => {
        const errorHandler = mockES.addEventListener.mock.calls
          .find(call => call[0] === 'error')?.[1];
        if (errorHandler) {
          errorHandler({ type: 'error', message: 'Connection failed' });
        }
      }, 0);
      
      return mockES;
    });
    
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    
    logStream.onError(errorHandler);
    
    try {
      await logStream.connect('test-container');
    } catch (error) {
      expect(error.message).toContain('Connection failed');
    }
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'connection_error',
        message: expect.stringContaining('Connection failed')
      })
    );
  });

  test('handles network timeout scenarios', async () => {
    jest.useFakeTimers();
    
    // Mock slow connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 0 // CONNECTING
      };
      
      // Never connect (timeout scenario)
      return mockES;
    });
    
    const logStream = new LogStreamingService({ connectionTimeout: 5000 });
    const timeoutHandler = jest.fn();
    
    logStream.onTimeout(timeoutHandler);
    
    const connectionPromise = logStream.connect('test-container');
    
    // Fast forward time
    jest.advanceTimersByTime(6000);
    
    await expect(connectionPromise).rejects.toThrow('Connection timeout');
    expect(timeoutHandler).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('recovers from intermittent connection drops', async () => {
    let connectionAttempt = 0;
    const maxAttempts = 3;
    
    global.EventSource = jest.fn().mockImplementation(() => {
      connectionAttempt++;
      
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: connectionAttempt >= maxAttempts ? 1 : 2
      };
      
      if (connectionAttempt < maxAttempts) {
        // Fail first few attempts
        setTimeout(() => {
          const errorHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'error')?.[1];
          if (errorHandler) {
            errorHandler({ type: 'error', message: 'Temporary failure' });
          }
        }, 100);
      } else {
        // Succeed on final attempt
        setTimeout(() => {
          const openHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'open')?.[1];
          if (openHandler) {
            openHandler({ type: 'open' });
          }
        }, 100);
      }
      
      return mockES;
    });
    
    const logStream = new LogStreamingService({
      retryAttempts: 5,
      retryDelay: 100
    });
    
    const reconnectHandler = jest.fn();
    logStream.onReconnect(reconnectHandler);
    
    await logStream.connect('test-container');
    
    expect(connectionAttempt).toBe(maxAttempts);
    expect(reconnectHandler).toHaveBeenCalledTimes(maxAttempts - 1);
  });
});
```

### 5.2 Malformed Data Handling

```javascript
// /dashboard/tests/errorScenarios/malformedData.test.js
describe('Malformed Data Handling', () => {
  test('handles malformed JSON in SSE messages', async () => {
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    const messageHandler = jest.fn();
    
    logStream.onError(errorHandler);
    logStream.onMessage(messageHandler);
    
    await logStream.connect('test-container');
    
    // Send malformed JSON
    const malformedMessages = [
      'invalid-json',
      '{"incomplete": ',
      '{"id": 1, "message":}',
      '[[{"malformed": true}',
      'null-message'
    ];
    
    for (const malformed of malformedMessages) {
      mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1]({ data: malformed });
    }
    
    // Should handle all malformed messages gracefully
    expect(errorHandler).toHaveBeenCalledTimes(malformedMessages.length);
    expect(messageHandler).not.toHaveBeenCalled();
    
    // Subsequent valid messages should work
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1]({
        data: JSON.stringify({ id: 1, message: 'Valid message' })
      });
    
    expect(messageHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Valid message' })
    );
  });

  test('validates log entry structure', async () => {
    const logValidator = new LogEntryValidator();
    
    const invalidLogs = [
      {}, // Missing required fields
      { id: 1 }, // Missing message
      { message: 'test' }, // Missing timestamp
      { id: 'invalid', message: 'test', timestamp: 'invalid' }, // Wrong types
      { id: 1, message: null, timestamp: Date.now() }, // Null message
      { id: 1, message: 'test', timestamp: Date.now(), level: 'invalid' } // Invalid level
    ];
    
    const validationErrors = [];
    
    for (const log of invalidLogs) {
      const result = logValidator.validate(log);
      if (!result.valid) {
        validationErrors.push(result.errors);
      }
    }
    
    expect(validationErrors).toHaveLength(invalidLogs.length);
    
    // Test valid log passes validation
    const validLog = {
      id: 1,
      message: 'Valid log message',
      timestamp: Date.now(),
      level: 'info',
      stream: 'stdout'
    };
    
    const validResult = logValidator.validate(validLog);
    expect(validResult.valid).toBe(true);
  });
});
```

### 5.3 API Error Handling

```javascript
// /dashboard/tests/errorScenarios/apiErrors.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('API Error Handling', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      // Default to server error for testing
      return res(ctx.status(500), ctx.json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR' 
      }));
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('handles 404 container not found errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ 
          error: 'Container not found',
          code: 'CONTAINER_NOT_FOUND' 
        }));
      })
    );
    
    const { render } = await import('@testing-library/react');
    const errorBoundaryHandler = jest.fn();
    
    render(
      <ErrorBoundary onError={errorBoundaryHandler}>
        <LogViewer containerId="nonexistent-container" />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Container not found/)).toBeInTheDocument();
    });
    
    expect(errorBoundaryHandler).not.toHaveBeenCalled(); // Should handle gracefully
  });

  test('handles rate limiting errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(
          ctx.status(429), 
          ctx.set('Retry-After', '60'),
          ctx.json({ 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED' 
          })
        );
      })
    );
    
    const logApi = new LogApiClient();
    const rateLimitHandler = jest.fn();
    
    logApi.onRateLimit(rateLimitHandler);
    
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Rate limit exceeded');
    
    expect(rateLimitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
        code: 'RATE_LIMITED'
      })
    );
  });

  test('implements circuit breaker for repeated failures', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000
    });
    
    const logApi = new LogApiClient({ circuitBreaker });
    
    // Trigger circuit breaker with repeated failures
    for (let i = 0; i < 4; i++) {
      await expect(logApi.getLogs('test-container'))
        .rejects.toThrow();
    }
    
    // Should be in open state (failing fast)
    expect(circuitBreaker.getState()).toBe('open');
    
    // Next call should fail fast without API call
    const startTime = Date.now();
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Circuit breaker is open');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(10); // Failed fast
  });
});
```
```

### 3.2 Accessibility Testing

```javascript
// /dashboard/tests/e2e/accessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Log Viewer Accessibility', () => {
  test('meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Search input
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Level filter
    await expect(page.locator('[data-testid="level-filter-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Export button
    await expect(page.locator('[data-testid="export-button"]')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+f'); // Focus search
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
  });

  test('provides screen reader compatible content', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check ARIA labels
    const searchInput = page.locator('[data-testid="log-search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search logs'));
    
    // Check log level announcements
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]').first();
    await expect(errorLogs).toHaveAttribute('aria-label', expect.stringContaining('Error level'));
    
    // Check live region for real-time updates
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
```

  test('handles connection drops and reconnects', async () => {
    const connectionSpy = jest.fn();
    const disconnectionSpy = jest.fn();
    
    connectionManager.on('connected', connectionSpy);
    connectionManager.on('disconnected', disconnectionSpy);
    
    // Initial connection
    await connectionManager.connect('test-container');
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    
    // Simulate connection drop
    mockEventSource.simulateError({ type: 'error' });
    expect(disconnectionSpy).toHaveBeenCalledTimes(1);
    
    // Wait for automatic reconnection
    await waitFor(() => {
      expect(connectionSpy).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  test('implements exponential backoff for reconnection', async () => {
    const reconnectAttempts = [];
    connectionManager.on('reconnectAttempt', (attempt) => {
      reconnectAttempts.push({ attempt, timestamp: Date.now() });
    });
    
    // Force multiple connection failures
    for (let i = 0; i < 3; i++) {
      await connectionManager.connect('test-container');
      mockEventSource.simulateError({ type: 'error' });
    }
    
    // Verify exponential backoff
    expect(reconnectAttempts.length).toBe(3);
    const delays = reconnectAttempts.slice(1).map((attempt, index) => 
      attempt.timestamp - reconnectAttempts[index].timestamp
    );
    
    // Each delay should be longer than the previous (exponential backoff)
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  test('handles browser tab visibility changes', async () => {
    const visibilityHandler = jest.fn();
    connectionManager.on('visibilityChange', visibilityHandler);
    
    // Simulate tab going hidden (user switches tabs)
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: true });
    
    // Simulate tab becoming visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: false });
  });

  test('handles server-sent heartbeat messages', async () => {
    const heartbeatHandler = jest.fn();
    connectionManager.on('heartbeat', heartbeatHandler);
    
    // Simulate heartbeat event
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'heartbeat')?.[1]({ 
        data: JSON.stringify({ timestamp: Date.now() })
      });
    
    expect(heartbeatHandler).toHaveBeenCalled();
  });

  test('maintains connection state during rapid reconnections', async () => {
    const stateChanges = [];
    connectionManager.on('stateChange', (state) => stateChanges.push(state));
    
    // Rapid connection changes
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    
    // Should have proper state transitions
    expect(stateChanges).toContain('connecting');
    expect(stateChanges).toContain('connected');
    expect(stateChanges).toContain('disconnected');
    expect(stateChanges).toContain('reconnecting');
  });

  test('implements connection pooling for multiple containers', async () => {
    const containers = ['container-1', 'container-2', 'container-3'];
    const connections = [];
    
    // Connect to multiple containers
    for (const container of containers) {
      const connection = await connectionManager.connect(container);
      connections.push(connection);
    }
    
    // Verify all connections are active
    expect(connections).toHaveLength(3);
    expect(connections.every(conn => conn.isConnected())).toBe(true);
    
    // Verify connection pooling limits
    const poolStats = connectionManager.getPoolStats();
    expect(poolStats.active).toBe(3);
    expect(poolStats.max).toBeGreaterThanOrEqual(3);
  });
});
```

### 2.4 Data Flow Integration Testing

```javascript
// /dashboard/tests/integration/dataFlow.test.js
describe('Log Data Flow Integration', () => {
  test('maintains data consistency through streaming', async () => {
    const dataStore = new LogDataStore();
    const streamer = new LogStreamingService();
    
    // Track data flow
    const receivedLogs = [];
    streamer.onMessage((log) => {
      dataStore.addLog(log);
      receivedLogs.push(log);
    });
    
    await streamer.connect('test-container');
    
    // Simulate log sequence
    const logSequence = [
      { id: 1, message: 'Log 1', timestamp: Date.now() },
      { id: 2, message: 'Log 2', timestamp: Date.now() + 1000 },
      { id: 3, message: 'Log 3', timestamp: Date.now() + 2000 }
    ];
    
    for (const log of logSequence) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => receivedLogs.length === 3);
    
    // Verify data consistency
    expect(dataStore.getLogs()).toHaveLength(3);
    expect(dataStore.getLogs().map(l => l.id)).toEqual([1, 2, 3]);
    expect(receivedLogs.map(l => l.message)).toEqual(['Log 1', 'Log 2', 'Log 3']);
  });

  test('handles out-of-order log delivery', async () => {
    const dataStore = new LogDataStore({ sortByTimestamp: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send logs out of order
    const logs = [
      { id: 3, message: 'Third log', timestamp: Date.now() + 2000 },
      { id: 1, message: 'First log', timestamp: Date.now() },
      { id: 2, message: 'Second log', timestamp: Date.now() + 1000 }
    ];
    
    for (const log of logs) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => dataStore.getLogs().length === 3);
    
    // Verify proper ordering
    const sortedLogs = dataStore.getLogs();
    expect(sortedLogs.map(l => l.id)).toEqual([1, 2, 3]);
  });

  test('handles duplicate log prevention', async () => {
    const dataStore = new LogDataStore({ preventDuplicates: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send duplicate logs
    const log = { id: 1, message: 'Duplicate log', timestamp: Date.now() };
    
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    
    await waitFor(() => dataStore.getLogs().length === 1);
    
    // Should only have one instance
    expect(dataStore.getLogs()).toHaveLength(1);
    expect(dataStore.getLogs()[0].id).toBe(1);
  });
});
```
  });

  test('handles network connectivity changes', async () => {
    const networkHandler = jest.fn();
    connectionManager.on('networkChange', networkHandler);
    
    // Simulate network offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: false });
    
    // Simulate network back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: true });
  });
});
```
/dashboard/tests/
├── __mocks__/              # Mocks and test doubles
├── __fixtures__/           # Test data fixtures
├── unit/                   # Component unit tests
├── integration/            # API integration tests
├── e2e/                    # End-to-end UI tests
├── performance/            # Performance benchmarks
└── utils/                  # Testing utilities
```

### Testing Stack Integration
- **Framework**: Jest with React Testing Library
- **UI Testing**: Playwright for E2E tests
- **Performance**: Lighthouse CI + Custom metrics
- **Coverage**: Istanbul with >70% threshold
- **Mocking**: MSW for API mocking, EventSource mocks for SSE

## 1. Unit Testing Strategy

### 1.1 React Components Testing

#### LogViewer Main Component
```javascript
// /dashboard/tests/unit/components/LogViewer.test.jsx
describe('LogViewer Component', () => {
  test('renders with initial loading state', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });

## 2. Integration Testing Strategy

### 2.1 SSE Connection Testing

#### Real-time Log Streaming
```javascript
// /dashboard/tests/integration/logStreaming.test.js
describe('Log Streaming Integration', () => {
  let mockEventSource;
  let logStreamingService;
  
  beforeEach(() => {
    // Mock EventSource for SSE testing
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    };
    
    global.EventSource = jest.fn(() => mockEventSource);
    logStreamingService = new LogStreamingService();
  });

  test('establishes SSE connection with correct headers', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    expect(global.EventSource).toHaveBeenCalledWith(
      '/api/logs/stream/test-container',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream'
        })
      })
    );
  });

  test('handles SSE message parsing correctly', () => {
    const mockHandler = jest.fn();
    logStreamingService.onMessage(mockHandler);
    
    // Simulate SSE message event
    const messageEvent = {
      type: 'message',
      data: JSON.stringify({
        id: '123',
        timestamp: Date.now(),
        level: 'info',
        message: 'Test log entry',
        stream: 'stdout'
      })
    };
    
    // Trigger the message handler
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](messageEvent);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      message: 'Test log entry'
    }));
  });

  test('handles malformed SSE messages gracefully', () => {
    const mockErrorHandler = jest.fn();
    const mockMessageHandler = jest.fn();
    
    logStreamingService.onError(mockErrorHandler);
    logStreamingService.onMessage(mockMessageHandler);
    
    // Send malformed JSON
    const malformedEvent = {
      type: 'message',
      data: 'invalid-json-{malformed'
    };
    
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](malformedEvent);
    
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parse_error',
        message: expect.stringContaining('Invalid JSON')
      })
    );
    expect(mockMessageHandler).not.toHaveBeenCalled();
  });

  test('implements proper connection lifecycle', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    // Verify connection is established
    expect(connection.isConnected()).toBe(true);
    
    // Simulate connection close
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'close')[1]({ type: 'close' });
    
    expect(connection.isConnected()).toBe(false);
    
    // Cleanup
    await connection.disconnect();
    expect(mockEventSource.close).toHaveBeenCalled();
  });

  test('handles server-sent events with different event types', () => {
    const handlers = {
      log: jest.fn(),
      status: jest.fn(),
      error: jest.fn()
    };
    
    Object.entries(handlers).forEach(([type, handler]) => {
      logStreamingService.on(type, handler);
    });
    
    // Test different event types
    const events = [
      { type: 'log', data: JSON.stringify({ message: 'Log entry' }) },
      { type: 'status', data: JSON.stringify({ connected: true }) },
      { type: 'error', data: JSON.stringify({ error: 'Connection lost' }) }
    ];
    
    events.forEach(event => {
      const handler = mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === event.type)?.[1];
      if (handler) handler(event);
    });
    
    expect(handlers.log).toHaveBeenCalledWith({ message: 'Log entry' });
    expect(handlers.status).toHaveBeenCalledWith({ connected: true });
    expect(handlers.error).toHaveBeenCalledWith({ error: 'Connection lost' });
  });
});
```

### 2.2 API Endpoints Testing

#### Log Fetching API
```javascript
// /dashboard/tests/integration/logApi.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('Log API Integration', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      const { containerId } = req.params;
      const { limit, level, search, since, until } = req.url.searchParams;
      
      // Mock response based on query parameters
      const mockLogs = generateMockLogs({
        containerId,
        limit: parseInt(limit) || 100,
        level,
        search,
        since,
        until
      });
      
      return res(ctx.json({
        logs: mockLogs,
        total: mockLogs.length,
        hasMore: mockLogs.length >= (parseInt(limit) || 100)
      }));
    }),
    
    rest.get('/api/logs/:containerId/search', (req, res, ctx) => {
      const { containerId } = req.params;
      const { q, limit, facets } = req.url.searchParams;
      
      const searchResults = performMockSearch({
        containerId,
        query: q,
        limit: parseInt(limit) || 100,
        includeFacets: facets === 'true'
      });
      
      return res(ctx.json(searchResults));
    }),
    
    rest.post('/api/logs/:containerId/export', (req, res, ctx) => {
      const { containerId } = req.params;
      const { format, filters } = req.body;
      
      const exportData = generateMockExport(containerId, format, filters);
      
      return res(
        ctx.set('Content-Type', getContentType(format)),
        ctx.set('Content-Disposition', `attachment; filename=${containerId}_logs.${format}`),
        ctx.text(exportData)
      );
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('fetches logs with pagination', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      limit: 50,
      offset: 0
    });
    
    expect(response.logs).toHaveLength(50);
    expect(response.total).toBeGreaterThanOrEqual(50);
    expect(response.hasMore).toBeDefined();
  });

  test('applies filters correctly', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      level: 'error',
      since: new Date('2025-08-07T00:00:00Z').toISOString()
    });
    
    expect(response.logs.every(log => log.level === 'error')).toBe(true);
    expect(response.logs.every(log => 
      new Date(log.timestamp) >= new Date('2025-08-07T00:00:00Z')
    )).toBe(true);
  });

  test('handles search queries with facets', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.searchLogs('test-container', {
      query: 'database error',
      includeFacets: true
    });
    
    expect(response.results).toBeDefined();
    expect(response.facets).toBeDefined();
    expect(response.facets.levels).toBeDefined();
    expect(response.facets.timeRanges).toBeDefined();
  });

  test('exports logs in different formats', async () => {
    const logApi = new LogApiClient();
    
    // Test JSON export
    const jsonExport = await logApi.exportLogs('test-container', {
      format: 'json',
      filters: { level: 'error' }
    });
    
    expect(jsonExport.headers.get('content-type')).toContain('application/json');
    const jsonData = JSON.parse(await jsonExport.text());
    expect(Array.isArray(jsonData)).toBe(true);
    
    // Test CSV export
    const csvExport = await logApi.exportLogs('test-container', {
      format: 'csv'
    });
    
    expect(csvExport.headers.get('content-type')).toContain('text/csv');
    const csvText = await csvExport.text();
    expect(csvText).toContain('Timestamp,Level,Stream,Message');
  });

  test('handles API error responses gracefully', async () => {
    // Mock server error
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );
    
    const logApi = new LogApiClient();
    
    await expect(logApi.getLogs('test-container')).rejects.toThrow(
      expect.objectContaining({
        status: 500,
        message: expect.stringContaining('Internal server error')
      })
    );
  });
});
```

  test('handles empty log state correctly', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  test('displays logs with proper formatting', () => {
    const mockLogs = [
      { id: 1, timestamp: Date.now(), level: 'info', message: 'Test log' }
    ];
    render(<LogViewer containerId="test-container" initialLogs={mockLogs} />);
    expect(screen.getByText('Test log')).toBeInTheDocument();
  });

  test('applies level-based styling', () => {
    const errorLog = { level: 'error', message: 'Error occurred' };
    render(<LogViewer logs={[errorLog]} />);
    const logElement = screen.getByText('Error occurred');
    expect(logElement).toHaveClass('log-level-error');
  });
});
```

#### Log Search Component
```javascript
// /dashboard/tests/unit/components/LogSearch.test.jsx
describe('LogSearch Component', () => {
  test('updates search query on input change', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    expect(onSearch).toHaveBeenCalledWith('error');
  });

  test('handles advanced search syntax', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'level:error database' } });
    
    expect(onSearch).toHaveBeenCalledWith('level:error database');
  });

  test('provides search suggestions', () => {
    render(<LogSearch suggestions={['error', 'warning', 'database']} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'err' } });
    
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
```

#### Log Level Filter Component
```javascript
// /dashboard/tests/unit/components/LogLevelFilter.test.jsx
describe('LogLevelFilter Component', () => {
  test('renders all log levels as options', () => {
    render(<LogLevelFilter onFilterChange={jest.fn()} />);
    
    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  test('calls onFilterChange when level selected', () => {
    const onFilterChange = jest.fn();
    render(<LogLevelFilter onFilterChange={onFilterChange} />);
    
    fireEvent.click(screen.getByText('Error'));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });
});
```

### 1.2 Custom Hooks Testing

#### useLogStream Hook
```javascript
// /dashboard/tests/unit/hooks/useLogStream.test.js
describe('useLogStream Hook', () => {
  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  test('establishes SSE connection when enabled', () => {
    const mockEventSource = jest.fn();
    global.EventSource = mockEventSource;
    
    renderHook(() => useLogStream('test-container', { enabled: true }));
    
    expect(mockEventSource).toHaveBeenCalledWith('/api/logs/stream/test-container');
  });

  test('handles incoming log messages', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      // Simulate SSE message
      const mockEvent = { data: JSON.stringify({ 
        id: 1, message: 'New log', level: 'info' 
      })};
      result.current.handleMessage(mockEvent);
    });
    
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('New log');
  });

  test('handles connection errors gracefully', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      result.current.handleError({ type: 'error', message: 'Connection failed' });
    });
    
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.isConnected).toBe(false);
  });

  test('implements automatic reconnection on disconnect', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLogStream('test-container', { 
      autoReconnect: true, 
      reconnectDelay: 1000 
    }));
    
    act(() => {
      result.current.handleClose();
    });
    
    expect(result.current.reconnectAttempt).toBe(0);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.reconnectAttempt).toBe(1);
    jest.useRealTimers();
  });
});
```

#### useLogSearch Hook
```javascript
// /dashboard/tests/unit/hooks/useLogSearch.test.js
describe('useLogSearch Hook', () => {
  test('debounces search queries', async () => {
    jest.useFakeTimers();
    const mockSearchFn = jest.fn();
    
    const { result } = renderHook(() => useLogSearch(mockSearchFn, { debounce: 300 }));
    
    act(() => {
      result.current.search('first');
      result.current.search('second');
      result.current.search('final');
    });
    
    // Should not call immediately
    expect(mockSearchFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only call once with final query
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('final');
    
    jest.useRealTimers();
  });

  test('caches search results', () => {
    const { result } = renderHook(() => useLogSearch(jest.fn(), { 
      cacheEnabled: true 
    }));
    
    const mockResults = [{ id: 1, message: 'test' }];
    
    act(() => {
      result.current.setCachedResults('test-query', mockResults);
    });
    
    const cached = result.current.getCachedResults('test-query');
    expect(cached).toEqual(mockResults);
  });
});
```

### 1.3 Utility Functions Testing

```javascript
// /dashboard/tests/unit/utils/logUtils.test.js
describe('Log Utilities', () => {
  test('formatLogLevel applies correct styling', () => {
    expect(formatLogLevel('error')).toEqual({
      className: 'log-level-error',
      color: '#dc3545',
      icon: 'error'
    });
  });

  test('parseTimestamp formats correctly', () => {
    const timestamp = 1691234567890;
    const formatted = parseTimestamp(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('filterLogsByLevel returns correct subset', () => {
    const logs = [
      { level: 'info', message: 'Info log' },
      { level: 'error', message: 'Error log' },
      { level: 'warn', message: 'Warning log' }
    ];
    
    const filtered = filterLogsByLevel(logs, 'error');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Error log');
  });
});
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "test-strategy-analysis", "content": "Analyze existing testing infrastructure and React component requirements", "status": "completed"}, {"id": "unit-test-strategy", "content": "Define unit testing approach for React components and custom hooks", "status": "completed"}, {"id": "integration-test-strategy", "content": "Design integration testing for SSE connections and API endpoints", "status": "in_progress"}, {"id": "ui-test-strategy", "content": "Define UI testing for user interactions and component behaviors", "status": "pending"}, {"id": "performance-test-strategy", "content": "Design performance testing for streaming, search, and memory usage", "status": "pending"}, {"id": "error-scenario-testing", "content": "Plan error scenario testing (connection failures, API errors, malformed data)", "status": "pending"}, {"id": "test-data-strategy", "content": "Define test data strategy and mock setup requirements", "status": "pending"}, {"id": "automation-framework", "content": "Plan automation framework integration and CI/CD considerations", "status": "pending"}]: '<rootDir>/src/$1',
    '^@tests/(.*)
```

## 3. UI Testing Strategy

### 3.1 End-to-End User Interaction Testing

```javascript
// /dashboard/tests/e2e/logViewer.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('Log Viewer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock server for consistent testing
    await page.route('/api/logs/**', async (route) => {
      const url = new URL(route.request().url());
      const mockData = generateE2EMockData(url.pathname, url.searchParams);
      await route.fulfill({ json: mockData });
    });
    
    // Navigate to log viewer
    await page.goto('/dashboard/logs/test-container');
  });

  test('displays logs with proper formatting and styling', async ({ page }) => {
    // Wait for logs to load
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check log entries are displayed
    const logEntries = await page.locator('[data-testid="log-entry"]').count();
    expect(logEntries).toBeGreaterThan(0);
    
    // Verify timestamp formatting
    const firstTimestamp = await page.locator('[data-testid="log-timestamp"]').first().textContent();
    expect(firstTimestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    
    // Verify level-based styling
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]');
    await expect(errorLogs.first()).toHaveClass(/error/);
    
    const infoLogs = page.locator('[data-testid="log-entry"][data-level="info"]');
    await expect(infoLogs.first()).toHaveClass(/info/);
  });

  test('implements infinite scroll for log pagination', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Scroll to bottom to trigger loading more logs
    await page.locator('[data-testid="log-container"]').scrollTo({ top: 'bottom' });
    
    // Wait for new logs to load
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount,
      { timeout: 5000 }
    );
    
    const newCount = await page.locator('[data-testid="log-entry"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('filters logs by level correctly', async ({ page }) => {
    // Open level filter dropdown
    await page.click('[data-testid="level-filter-button"]');
    
    // Select "Error" filter
    await page.click('[data-testid="level-filter-error"]');
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Verify only error logs are shown
    const visibleLogs = page.locator('[data-testid="log-entry"]:visible');
    const count = await visibleLogs.count();
    
    for (let i = 0; i < count; i++) {
      const level = await visibleLogs.nth(i).getAttribute('data-level');
      expect(level).toBe('error');
    }
  });

  test('search functionality works with real-time updates', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Type in search box
    await page.fill('[data-testid="log-search-input"]', 'database');
    
    // Wait for search results
    await page.waitForTimeout(600); // Account for debounce
    
    // Verify filtered results
    const searchResults = page.locator('[data-testid="log-entry"]:visible');
    const count = await searchResults.count();
    
    for (let i = 0; i < count; i++) {
      const message = await searchResults.nth(i).locator('[data-testid="log-message"]').textContent();
      expect(message.toLowerCase()).toContain('database');
    }
    
    // Clear search
    await page.fill('[data-testid="log-search-input"]', '');
    await page.waitForTimeout(600);
    
    // Verify all logs are shown again
    const allLogs = await page.locator('[data-testid="log-entry"]:visible').count();
    expect(allLogs).toBeGreaterThan(count);
  });

  test('export functionality generates correct files', async ({ page }) => {
    // Setup download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select JSON format
    await page.click('[data-testid="export-format-json"]');
    
    // Confirm export
    await page.click('[data-testid="export-confirm"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/.*\.json$/);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('real-time log streaming updates UI correctly', async ({ page }) => {
    // Setup SSE mock
    await page.evaluate(() => {
      // Mock EventSource
      window.mockEventSource = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn()
      };
      global.EventSource = jest.fn(() => window.mockEventSource);
    });
    
    // Wait for initial setup
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Simulate new log message
    await page.evaluate(() => {
      const messageHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      
      messageHandler({
        data: JSON.stringify({
          id: 'new-log-' + Date.now(),
          timestamp: Date.now(),
          level: 'info',
          message: 'New real-time log entry',
          stream: 'stdout'
        })
      });
    });
    
    // Wait for UI update
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount
    );
    
    // Verify new log appears
    const newLog = page.locator('[data-testid="log-entry"]').last();
    await expect(newLog.locator('[data-testid="log-message"]')).toContainText('New real-time log entry');
  });

  test('handles connection status indicators', async ({ page }) => {
    // Initially should show connected
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
    
    // Simulate connection loss
    await page.evaluate(() => {
      const errorHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      errorHandler({ type: 'error' });
    });
    
    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/disconnected/);
    
    // Should show reconnecting indicator
    await expect(page.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
  });
});

## 4. Performance Testing Strategy

### 4.1 Streaming Performance Tests

```javascript
// /dashboard/tests/performance/streaming.test.js
describe('Log Streaming Performance', () => {
  test('handles high-frequency log streams efficiently', async () => {
    const performanceMonitor = new PerformanceMonitor();
    const logStream = new LogStreamingService();
    
    performanceMonitor.startTest('high-frequency-streaming');
    
    await logStream.connect('test-container');
    
    // Simulate 1000 logs per second for 10 seconds
    const logBatch = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      timestamp: Date.now() + i,
      level: 'info',
      message: `High frequency log ${i + 1}`,
      stream: 'stdout'
    }));
    
    const startTime = performance.now();
    
    for (let second = 0; second < 10; second++) {
      for (const log of logBatch) {
        mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    performanceMonitor.endTest('high-frequency-streaming');
    
    // Should process 10,000 logs in under 2 seconds
    expect(processingTime).toBeLessThan(2000);
    
    // Memory usage should remain stable
    const memoryStats = performanceMonitor.getMemoryStats();
    expect(memoryStats.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });

  test('maintains low latency for real-time updates', async () => {
    const latencyTracker = new LatencyTracker();
    const logStream = new LogStreamingService();
    
    logStream.onMessage((log) => {
      const latency = Date.now() - log.timestamp;
      latencyTracker.recordLatency(latency);
    });
    
    await logStream.connect('test-container');
    
    // Send 100 logs with timestamp tracking
    for (let i = 0; i < 100; i++) {
      const log = {
        id: i,
        timestamp: Date.now(),
        level: 'info',
        message: `Latency test log ${i}`,
        stream: 'stdout'
      };
      
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await waitFor(() => latencyTracker.getSampleCount() === 100);
    
    // Average latency should be under 50ms
    expect(latencyTracker.getAverageLatency()).toBeLessThan(50);
    
    // 95th percentile should be under 100ms
    expect(latencyTracker.getPercentile(95)).toBeLessThan(100);
  });

  test('handles backpressure gracefully', async () => {
    const logStream = new LogStreamingService({ 
      bufferSize: 1000,
      backpressureThreshold: 800 
    });
    
    const backpressureEvents = [];
    logStream.on('backpressure', (event) => backpressureEvents.push(event));
    
    await logStream.connect('test-container');
    
    // Flood with logs faster than processing
    const floodLogs = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
      message: `Flood log ${i}`,
      level: 'info'
    }));
    
    // Send all logs at once
    floodLogs.forEach(log => {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    });
    
    await waitFor(() => backpressureEvents.length > 0, { timeout: 5000 });
    
    // Should trigger backpressure handling
    expect(backpressureEvents).toHaveLength(1);
    expect(backpressureEvents[0].action).toBe('throttle');
    
    // Should maintain buffer limits
    const bufferStats = logStream.getBufferStats();
    expect(bufferStats.size).toBeLessThanOrEqual(1000);
  });
});
```

### 4.2 Search Performance Tests

```javascript
// /dashboard/tests/performance/search.test.js
describe('Log Search Performance', () => {
  let searchService;
  let performanceMonitor;
  
  beforeEach(() => {
    searchService = new LogSearchService();
    performanceMonitor = new PerformanceMonitor();
    
    // Setup test data - 100k log entries
    const testLogs = generateLargeMockDataset(100000);
    searchService.indexLogs('performance-test-container', testLogs);
  });

  test('search completes within performance thresholds', async () => {
    const searchQueries = [
      'error database connection',
      'level:warn memory usage',
      '/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/', // IP regex
      'response time performance'
    ];
    
    const results = [];
    
    for (const query of searchQueries) {
      performanceMonitor.startTimer('search');
      
      const result = await searchService.search(query, {
        containers: ['performance-test-container'],
        limit: 100
      });
      
      const searchTime = performanceMonitor.endTimer('search');
      
      results.push({
        query,
        searchTime,
        resultCount: result.totalMatches
      });
      
      // Each search should complete in under 500ms
      expect(searchTime).toBeLessThan(500);
    }
    
    // Average search time should be under 200ms
    const averageTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    expect(averageTime).toBeLessThan(200);
  });

  test('concurrent searches maintain performance', async () => {
    const concurrentSearches = 10;
    const searchPromises = [];
    
    performanceMonitor.startTest('concurrent-search');
    
    // Launch concurrent searches
    for (let i = 0; i < concurrentSearches; i++) {
      const promise = searchService.search(`concurrent test ${i}`, {
        containers: ['performance-test-container']
      });
      searchPromises.push(promise);
    }
    
    const results = await Promise.all(searchPromises);
    
    performanceMonitor.endTest('concurrent-search');
    
    // All searches should complete
    expect(results).toHaveLength(concurrentSearches);
    
    // Total time should be reasonable (not serial execution)
    const totalTime = performanceMonitor.getTestDuration('concurrent-search');
    expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 10 concurrent searches
  });

  test('memory usage remains stable during intensive search', async () => {
    const initialMemory = performanceMonitor.getCurrentMemoryUsage();
    
    // Perform 100 different searches
    for (let i = 0; i < 100; i++) {
      await searchService.search(`intensive search ${i}`, {
        containers: ['performance-test-container'],
        limit: 50
      });
      
      // Force garbage collection every 10 searches
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = performanceMonitor.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (under 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 4.3 Memory Usage Monitoring

```javascript
// /dashboard/tests/performance/memory.test.js
describe('Memory Usage Performance', () => {
  test('log buffer implements proper memory management', async () => {
    const logBuffer = new LogBuffer({ 
      maxSize: 10000,
      memoryThreshold: 100 * 1024 * 1024 // 100MB
    });
    
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.startMonitoring();
    
    // Add logs until threshold is approached
    let logCount = 0;
    while (memoryMonitor.getCurrentUsage() < 90 * 1024 * 1024) { // 90MB
      const log = {
        id: logCount++,
        timestamp: Date.now(),
        message: 'x'.repeat(1000), // 1KB message
        level: 'info'
      };
      
      logBuffer.addLog(log);
      
      if (logCount % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Should trigger automatic cleanup
    expect(logBuffer.getStats().cleaned).toBe(true);
    expect(memoryMonitor.getCurrentUsage()).toBeLessThan(100 * 1024 * 1024);
    
    memoryMonitor.stopMonitoring();
  });

  test('component unmounting releases memory properly', async () => {
    const { unmount } = render(<LogViewer containerId="memory-test" />);
    
    // Simulate heavy log streaming
    const logStream = new LogStreamingService();
    await logStream.connect('memory-test');
    
    // Add many logs to component
    for (let i = 0; i < 5000; i++) {
      mockEventSource.simulateMessage({
        data: JSON.stringify({
          id: i,
          message: `Memory test log ${i}`,
          timestamp: Date.now()
        })
      });
    }
    
    const beforeUnmount = performance.memory?.usedJSHeapSize || 0;
    
    // Unmount component
    unmount();
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUnmount = performance.memory?.usedJSHeapSize || 0;
    const memoryFreed = beforeUnmount - afterUnmount;
    
    // Should free significant memory
    expect(memoryFreed).toBeGreaterThan(0);
  });
});
```

## 5. Error Scenario Testing

### 5.1 Connection Failure Testing

```javascript
// /dashboard/tests/errorScenarios/connectionFailures.test.js
describe('Connection Failure Scenarios', () => {
  test('handles initial connection failures gracefully', async () => {
    // Mock failed connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 2 // CLOSED
      };
      
      // Immediately trigger error
      setTimeout(() => {
        const errorHandler = mockES.addEventListener.mock.calls
          .find(call => call[0] === 'error')?.[1];
        if (errorHandler) {
          errorHandler({ type: 'error', message: 'Connection failed' });
        }
      }, 0);
      
      return mockES;
    });
    
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    
    logStream.onError(errorHandler);
    
    try {
      await logStream.connect('test-container');
    } catch (error) {
      expect(error.message).toContain('Connection failed');
    }
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'connection_error',
        message: expect.stringContaining('Connection failed')
      })
    );
  });

  test('handles network timeout scenarios', async () => {
    jest.useFakeTimers();
    
    // Mock slow connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 0 // CONNECTING
      };
      
      // Never connect (timeout scenario)
      return mockES;
    });
    
    const logStream = new LogStreamingService({ connectionTimeout: 5000 });
    const timeoutHandler = jest.fn();
    
    logStream.onTimeout(timeoutHandler);
    
    const connectionPromise = logStream.connect('test-container');
    
    // Fast forward time
    jest.advanceTimersByTime(6000);
    
    await expect(connectionPromise).rejects.toThrow('Connection timeout');
    expect(timeoutHandler).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('recovers from intermittent connection drops', async () => {
    let connectionAttempt = 0;
    const maxAttempts = 3;
    
    global.EventSource = jest.fn().mockImplementation(() => {
      connectionAttempt++;
      
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: connectionAttempt >= maxAttempts ? 1 : 2
      };
      
      if (connectionAttempt < maxAttempts) {
        // Fail first few attempts
        setTimeout(() => {
          const errorHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'error')?.[1];
          if (errorHandler) {
            errorHandler({ type: 'error', message: 'Temporary failure' });
          }
        }, 100);
      } else {
        // Succeed on final attempt
        setTimeout(() => {
          const openHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'open')?.[1];
          if (openHandler) {
            openHandler({ type: 'open' });
          }
        }, 100);
      }
      
      return mockES;
    });
    
    const logStream = new LogStreamingService({
      retryAttempts: 5,
      retryDelay: 100
    });
    
    const reconnectHandler = jest.fn();
    logStream.onReconnect(reconnectHandler);
    
    await logStream.connect('test-container');
    
    expect(connectionAttempt).toBe(maxAttempts);
    expect(reconnectHandler).toHaveBeenCalledTimes(maxAttempts - 1);
  });
});
```

### 5.2 Malformed Data Handling

```javascript
// /dashboard/tests/errorScenarios/malformedData.test.js
describe('Malformed Data Handling', () => {
  test('handles malformed JSON in SSE messages', async () => {
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    const messageHandler = jest.fn();
    
    logStream.onError(errorHandler);
    logStream.onMessage(messageHandler);
    
    await logStream.connect('test-container');
    
    // Send malformed JSON
    const malformedMessages = [
      'invalid-json',
      '{"incomplete": ',
      '{"id": 1, "message":}',
      '[[{"malformed": true}',
      'null-message'
    ];
    
    for (const malformed of malformedMessages) {
      mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1]({ data: malformed });
    }
    
    // Should handle all malformed messages gracefully
    expect(errorHandler).toHaveBeenCalledTimes(malformedMessages.length);
    expect(messageHandler).not.toHaveBeenCalled();
    
    // Subsequent valid messages should work
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1]({
        data: JSON.stringify({ id: 1, message: 'Valid message' })
      });
    
    expect(messageHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Valid message' })
    );
  });

  test('validates log entry structure', async () => {
    const logValidator = new LogEntryValidator();
    
    const invalidLogs = [
      {}, // Missing required fields
      { id: 1 }, // Missing message
      { message: 'test' }, // Missing timestamp
      { id: 'invalid', message: 'test', timestamp: 'invalid' }, // Wrong types
      { id: 1, message: null, timestamp: Date.now() }, // Null message
      { id: 1, message: 'test', timestamp: Date.now(), level: 'invalid' } // Invalid level
    ];
    
    const validationErrors = [];
    
    for (const log of invalidLogs) {
      const result = logValidator.validate(log);
      if (!result.valid) {
        validationErrors.push(result.errors);
      }
    }
    
    expect(validationErrors).toHaveLength(invalidLogs.length);
    
    // Test valid log passes validation
    const validLog = {
      id: 1,
      message: 'Valid log message',
      timestamp: Date.now(),
      level: 'info',
      stream: 'stdout'
    };
    
    const validResult = logValidator.validate(validLog);
    expect(validResult.valid).toBe(true);
  });
});
```

### 5.3 API Error Handling

```javascript
// /dashboard/tests/errorScenarios/apiErrors.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('API Error Handling', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      // Default to server error for testing
      return res(ctx.status(500), ctx.json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR' 
      }));
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('handles 404 container not found errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ 
          error: 'Container not found',
          code: 'CONTAINER_NOT_FOUND' 
        }));
      })
    );
    
    const { render } = await import('@testing-library/react');
    const errorBoundaryHandler = jest.fn();
    
    render(
      <ErrorBoundary onError={errorBoundaryHandler}>
        <LogViewer containerId="nonexistent-container" />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Container not found/)).toBeInTheDocument();
    });
    
    expect(errorBoundaryHandler).not.toHaveBeenCalled(); // Should handle gracefully
  });

  test('handles rate limiting errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(
          ctx.status(429), 
          ctx.set('Retry-After', '60'),
          ctx.json({ 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED' 
          })
        );
      })
    );
    
    const logApi = new LogApiClient();
    const rateLimitHandler = jest.fn();
    
    logApi.onRateLimit(rateLimitHandler);
    
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Rate limit exceeded');
    
    expect(rateLimitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
        code: 'RATE_LIMITED'
      })
    );
  });

  test('implements circuit breaker for repeated failures', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000
    });
    
    const logApi = new LogApiClient({ circuitBreaker });
    
    // Trigger circuit breaker with repeated failures
    for (let i = 0; i < 4; i++) {
      await expect(logApi.getLogs('test-container'))
        .rejects.toThrow();
    }
    
    // Should be in open state (failing fast)
    expect(circuitBreaker.getState()).toBe('open');
    
    // Next call should fail fast without API call
    const startTime = Date.now();
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Circuit breaker is open');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(10); // Failed fast
  });
});
```
```

### 3.2 Accessibility Testing

```javascript
// /dashboard/tests/e2e/accessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Log Viewer Accessibility', () => {
  test('meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Search input
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Level filter
    await expect(page.locator('[data-testid="level-filter-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Export button
    await expect(page.locator('[data-testid="export-button"]')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+f'); // Focus search
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
  });

  test('provides screen reader compatible content', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check ARIA labels
    const searchInput = page.locator('[data-testid="log-search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search logs'));
    
    // Check log level announcements
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]').first();
    await expect(errorLogs).toHaveAttribute('aria-label', expect.stringContaining('Error level'));
    
    // Check live region for real-time updates
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
```

  test('handles connection drops and reconnects', async () => {
    const connectionSpy = jest.fn();
    const disconnectionSpy = jest.fn();
    
    connectionManager.on('connected', connectionSpy);
    connectionManager.on('disconnected', disconnectionSpy);
    
    // Initial connection
    await connectionManager.connect('test-container');
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    
    // Simulate connection drop
    mockEventSource.simulateError({ type: 'error' });
    expect(disconnectionSpy).toHaveBeenCalledTimes(1);
    
    // Wait for automatic reconnection
    await waitFor(() => {
      expect(connectionSpy).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  test('implements exponential backoff for reconnection', async () => {
    const reconnectAttempts = [];
    connectionManager.on('reconnectAttempt', (attempt) => {
      reconnectAttempts.push({ attempt, timestamp: Date.now() });
    });
    
    // Force multiple connection failures
    for (let i = 0; i < 3; i++) {
      await connectionManager.connect('test-container');
      mockEventSource.simulateError({ type: 'error' });
    }
    
    // Verify exponential backoff
    expect(reconnectAttempts.length).toBe(3);
    const delays = reconnectAttempts.slice(1).map((attempt, index) => 
      attempt.timestamp - reconnectAttempts[index].timestamp
    );
    
    // Each delay should be longer than the previous (exponential backoff)
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  test('handles browser tab visibility changes', async () => {
    const visibilityHandler = jest.fn();
    connectionManager.on('visibilityChange', visibilityHandler);
    
    // Simulate tab going hidden (user switches tabs)
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: true });
    
    // Simulate tab becoming visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: false });
  });

  test('handles server-sent heartbeat messages', async () => {
    const heartbeatHandler = jest.fn();
    connectionManager.on('heartbeat', heartbeatHandler);
    
    // Simulate heartbeat event
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'heartbeat')?.[1]({ 
        data: JSON.stringify({ timestamp: Date.now() })
      });
    
    expect(heartbeatHandler).toHaveBeenCalled();
  });

  test('maintains connection state during rapid reconnections', async () => {
    const stateChanges = [];
    connectionManager.on('stateChange', (state) => stateChanges.push(state));
    
    // Rapid connection changes
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    
    // Should have proper state transitions
    expect(stateChanges).toContain('connecting');
    expect(stateChanges).toContain('connected');
    expect(stateChanges).toContain('disconnected');
    expect(stateChanges).toContain('reconnecting');
  });

  test('implements connection pooling for multiple containers', async () => {
    const containers = ['container-1', 'container-2', 'container-3'];
    const connections = [];
    
    // Connect to multiple containers
    for (const container of containers) {
      const connection = await connectionManager.connect(container);
      connections.push(connection);
    }
    
    // Verify all connections are active
    expect(connections).toHaveLength(3);
    expect(connections.every(conn => conn.isConnected())).toBe(true);
    
    // Verify connection pooling limits
    const poolStats = connectionManager.getPoolStats();
    expect(poolStats.active).toBe(3);
    expect(poolStats.max).toBeGreaterThanOrEqual(3);
  });
});
```

### 2.4 Data Flow Integration Testing

```javascript
// /dashboard/tests/integration/dataFlow.test.js
describe('Log Data Flow Integration', () => {
  test('maintains data consistency through streaming', async () => {
    const dataStore = new LogDataStore();
    const streamer = new LogStreamingService();
    
    // Track data flow
    const receivedLogs = [];
    streamer.onMessage((log) => {
      dataStore.addLog(log);
      receivedLogs.push(log);
    });
    
    await streamer.connect('test-container');
    
    // Simulate log sequence
    const logSequence = [
      { id: 1, message: 'Log 1', timestamp: Date.now() },
      { id: 2, message: 'Log 2', timestamp: Date.now() + 1000 },
      { id: 3, message: 'Log 3', timestamp: Date.now() + 2000 }
    ];
    
    for (const log of logSequence) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => receivedLogs.length === 3);
    
    // Verify data consistency
    expect(dataStore.getLogs()).toHaveLength(3);
    expect(dataStore.getLogs().map(l => l.id)).toEqual([1, 2, 3]);
    expect(receivedLogs.map(l => l.message)).toEqual(['Log 1', 'Log 2', 'Log 3']);
  });

  test('handles out-of-order log delivery', async () => {
    const dataStore = new LogDataStore({ sortByTimestamp: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send logs out of order
    const logs = [
      { id: 3, message: 'Third log', timestamp: Date.now() + 2000 },
      { id: 1, message: 'First log', timestamp: Date.now() },
      { id: 2, message: 'Second log', timestamp: Date.now() + 1000 }
    ];
    
    for (const log of logs) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => dataStore.getLogs().length === 3);
    
    // Verify proper ordering
    const sortedLogs = dataStore.getLogs();
    expect(sortedLogs.map(l => l.id)).toEqual([1, 2, 3]);
  });

  test('handles duplicate log prevention', async () => {
    const dataStore = new LogDataStore({ preventDuplicates: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send duplicate logs
    const log = { id: 1, message: 'Duplicate log', timestamp: Date.now() };
    
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    
    await waitFor(() => dataStore.getLogs().length === 1);
    
    // Should only have one instance
    expect(dataStore.getLogs()).toHaveLength(1);
    expect(dataStore.getLogs()[0].id).toBe(1);
  });
});
```
  });

  test('handles network connectivity changes', async () => {
    const networkHandler = jest.fn();
    connectionManager.on('networkChange', networkHandler);
    
    // Simulate network offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: false });
    
    // Simulate network back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: true });
  });
});
```
/dashboard/tests/
├── __mocks__/              # Mocks and test doubles
├── __fixtures__/           # Test data fixtures
├── unit/                   # Component unit tests
├── integration/            # API integration tests
├── e2e/                    # End-to-end UI tests
├── performance/            # Performance benchmarks
└── utils/                  # Testing utilities
```

### Testing Stack Integration
- **Framework**: Jest with React Testing Library
- **UI Testing**: Playwright for E2E tests
- **Performance**: Lighthouse CI + Custom metrics
- **Coverage**: Istanbul with >70% threshold
- **Mocking**: MSW for API mocking, EventSource mocks for SSE

## 1. Unit Testing Strategy

### 1.1 React Components Testing

#### LogViewer Main Component
```javascript
// /dashboard/tests/unit/components/LogViewer.test.jsx
describe('LogViewer Component', () => {
  test('renders with initial loading state', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });

## 2. Integration Testing Strategy

### 2.1 SSE Connection Testing

#### Real-time Log Streaming
```javascript
// /dashboard/tests/integration/logStreaming.test.js
describe('Log Streaming Integration', () => {
  let mockEventSource;
  let logStreamingService;
  
  beforeEach(() => {
    // Mock EventSource for SSE testing
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    };
    
    global.EventSource = jest.fn(() => mockEventSource);
    logStreamingService = new LogStreamingService();
  });

  test('establishes SSE connection with correct headers', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    expect(global.EventSource).toHaveBeenCalledWith(
      '/api/logs/stream/test-container',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream'
        })
      })
    );
  });

  test('handles SSE message parsing correctly', () => {
    const mockHandler = jest.fn();
    logStreamingService.onMessage(mockHandler);
    
    // Simulate SSE message event
    const messageEvent = {
      type: 'message',
      data: JSON.stringify({
        id: '123',
        timestamp: Date.now(),
        level: 'info',
        message: 'Test log entry',
        stream: 'stdout'
      })
    };
    
    // Trigger the message handler
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](messageEvent);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      message: 'Test log entry'
    }));
  });

  test('handles malformed SSE messages gracefully', () => {
    const mockErrorHandler = jest.fn();
    const mockMessageHandler = jest.fn();
    
    logStreamingService.onError(mockErrorHandler);
    logStreamingService.onMessage(mockMessageHandler);
    
    // Send malformed JSON
    const malformedEvent = {
      type: 'message',
      data: 'invalid-json-{malformed'
    };
    
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](malformedEvent);
    
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parse_error',
        message: expect.stringContaining('Invalid JSON')
      })
    );
    expect(mockMessageHandler).not.toHaveBeenCalled();
  });

  test('implements proper connection lifecycle', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    // Verify connection is established
    expect(connection.isConnected()).toBe(true);
    
    // Simulate connection close
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'close')[1]({ type: 'close' });
    
    expect(connection.isConnected()).toBe(false);
    
    // Cleanup
    await connection.disconnect();
    expect(mockEventSource.close).toHaveBeenCalled();
  });

  test('handles server-sent events with different event types', () => {
    const handlers = {
      log: jest.fn(),
      status: jest.fn(),
      error: jest.fn()
    };
    
    Object.entries(handlers).forEach(([type, handler]) => {
      logStreamingService.on(type, handler);
    });
    
    // Test different event types
    const events = [
      { type: 'log', data: JSON.stringify({ message: 'Log entry' }) },
      { type: 'status', data: JSON.stringify({ connected: true }) },
      { type: 'error', data: JSON.stringify({ error: 'Connection lost' }) }
    ];
    
    events.forEach(event => {
      const handler = mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === event.type)?.[1];
      if (handler) handler(event);
    });
    
    expect(handlers.log).toHaveBeenCalledWith({ message: 'Log entry' });
    expect(handlers.status).toHaveBeenCalledWith({ connected: true });
    expect(handlers.error).toHaveBeenCalledWith({ error: 'Connection lost' });
  });
});
```

### 2.2 API Endpoints Testing

#### Log Fetching API
```javascript
// /dashboard/tests/integration/logApi.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('Log API Integration', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      const { containerId } = req.params;
      const { limit, level, search, since, until } = req.url.searchParams;
      
      // Mock response based on query parameters
      const mockLogs = generateMockLogs({
        containerId,
        limit: parseInt(limit) || 100,
        level,
        search,
        since,
        until
      });
      
      return res(ctx.json({
        logs: mockLogs,
        total: mockLogs.length,
        hasMore: mockLogs.length >= (parseInt(limit) || 100)
      }));
    }),
    
    rest.get('/api/logs/:containerId/search', (req, res, ctx) => {
      const { containerId } = req.params;
      const { q, limit, facets } = req.url.searchParams;
      
      const searchResults = performMockSearch({
        containerId,
        query: q,
        limit: parseInt(limit) || 100,
        includeFacets: facets === 'true'
      });
      
      return res(ctx.json(searchResults));
    }),
    
    rest.post('/api/logs/:containerId/export', (req, res, ctx) => {
      const { containerId } = req.params;
      const { format, filters } = req.body;
      
      const exportData = generateMockExport(containerId, format, filters);
      
      return res(
        ctx.set('Content-Type', getContentType(format)),
        ctx.set('Content-Disposition', `attachment; filename=${containerId}_logs.${format}`),
        ctx.text(exportData)
      );
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('fetches logs with pagination', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      limit: 50,
      offset: 0
    });
    
    expect(response.logs).toHaveLength(50);
    expect(response.total).toBeGreaterThanOrEqual(50);
    expect(response.hasMore).toBeDefined();
  });

  test('applies filters correctly', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      level: 'error',
      since: new Date('2025-08-07T00:00:00Z').toISOString()
    });
    
    expect(response.logs.every(log => log.level === 'error')).toBe(true);
    expect(response.logs.every(log => 
      new Date(log.timestamp) >= new Date('2025-08-07T00:00:00Z')
    )).toBe(true);
  });

  test('handles search queries with facets', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.searchLogs('test-container', {
      query: 'database error',
      includeFacets: true
    });
    
    expect(response.results).toBeDefined();
    expect(response.facets).toBeDefined();
    expect(response.facets.levels).toBeDefined();
    expect(response.facets.timeRanges).toBeDefined();
  });

  test('exports logs in different formats', async () => {
    const logApi = new LogApiClient();
    
    // Test JSON export
    const jsonExport = await logApi.exportLogs('test-container', {
      format: 'json',
      filters: { level: 'error' }
    });
    
    expect(jsonExport.headers.get('content-type')).toContain('application/json');
    const jsonData = JSON.parse(await jsonExport.text());
    expect(Array.isArray(jsonData)).toBe(true);
    
    // Test CSV export
    const csvExport = await logApi.exportLogs('test-container', {
      format: 'csv'
    });
    
    expect(csvExport.headers.get('content-type')).toContain('text/csv');
    const csvText = await csvExport.text();
    expect(csvText).toContain('Timestamp,Level,Stream,Message');
  });

  test('handles API error responses gracefully', async () => {
    // Mock server error
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );
    
    const logApi = new LogApiClient();
    
    await expect(logApi.getLogs('test-container')).rejects.toThrow(
      expect.objectContaining({
        status: 500,
        message: expect.stringContaining('Internal server error')
      })
    );
  });
});
```

  test('handles empty log state correctly', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  test('displays logs with proper formatting', () => {
    const mockLogs = [
      { id: 1, timestamp: Date.now(), level: 'info', message: 'Test log' }
    ];
    render(<LogViewer containerId="test-container" initialLogs={mockLogs} />);
    expect(screen.getByText('Test log')).toBeInTheDocument();
  });

  test('applies level-based styling', () => {
    const errorLog = { level: 'error', message: 'Error occurred' };
    render(<LogViewer logs={[errorLog]} />);
    const logElement = screen.getByText('Error occurred');
    expect(logElement).toHaveClass('log-level-error');
  });
});
```

#### Log Search Component
```javascript
// /dashboard/tests/unit/components/LogSearch.test.jsx
describe('LogSearch Component', () => {
  test('updates search query on input change', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    expect(onSearch).toHaveBeenCalledWith('error');
  });

  test('handles advanced search syntax', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'level:error database' } });
    
    expect(onSearch).toHaveBeenCalledWith('level:error database');
  });

  test('provides search suggestions', () => {
    render(<LogSearch suggestions={['error', 'warning', 'database']} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'err' } });
    
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
```

#### Log Level Filter Component
```javascript
// /dashboard/tests/unit/components/LogLevelFilter.test.jsx
describe('LogLevelFilter Component', () => {
  test('renders all log levels as options', () => {
    render(<LogLevelFilter onFilterChange={jest.fn()} />);
    
    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  test('calls onFilterChange when level selected', () => {
    const onFilterChange = jest.fn();
    render(<LogLevelFilter onFilterChange={onFilterChange} />);
    
    fireEvent.click(screen.getByText('Error'));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });
});
```

### 1.2 Custom Hooks Testing

#### useLogStream Hook
```javascript
// /dashboard/tests/unit/hooks/useLogStream.test.js
describe('useLogStream Hook', () => {
  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  test('establishes SSE connection when enabled', () => {
    const mockEventSource = jest.fn();
    global.EventSource = mockEventSource;
    
    renderHook(() => useLogStream('test-container', { enabled: true }));
    
    expect(mockEventSource).toHaveBeenCalledWith('/api/logs/stream/test-container');
  });

  test('handles incoming log messages', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      // Simulate SSE message
      const mockEvent = { data: JSON.stringify({ 
        id: 1, message: 'New log', level: 'info' 
      })};
      result.current.handleMessage(mockEvent);
    });
    
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('New log');
  });

  test('handles connection errors gracefully', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      result.current.handleError({ type: 'error', message: 'Connection failed' });
    });
    
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.isConnected).toBe(false);
  });

  test('implements automatic reconnection on disconnect', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLogStream('test-container', { 
      autoReconnect: true, 
      reconnectDelay: 1000 
    }));
    
    act(() => {
      result.current.handleClose();
    });
    
    expect(result.current.reconnectAttempt).toBe(0);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.reconnectAttempt).toBe(1);
    jest.useRealTimers();
  });
});
```

#### useLogSearch Hook
```javascript
// /dashboard/tests/unit/hooks/useLogSearch.test.js
describe('useLogSearch Hook', () => {
  test('debounces search queries', async () => {
    jest.useFakeTimers();
    const mockSearchFn = jest.fn();
    
    const { result } = renderHook(() => useLogSearch(mockSearchFn, { debounce: 300 }));
    
    act(() => {
      result.current.search('first');
      result.current.search('second');
      result.current.search('final');
    });
    
    // Should not call immediately
    expect(mockSearchFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only call once with final query
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('final');
    
    jest.useRealTimers();
  });

  test('caches search results', () => {
    const { result } = renderHook(() => useLogSearch(jest.fn(), { 
      cacheEnabled: true 
    }));
    
    const mockResults = [{ id: 1, message: 'test' }];
    
    act(() => {
      result.current.setCachedResults('test-query', mockResults);
    });
    
    const cached = result.current.getCachedResults('test-query');
    expect(cached).toEqual(mockResults);
  });
});
```

### 1.3 Utility Functions Testing

```javascript
// /dashboard/tests/unit/utils/logUtils.test.js
describe('Log Utilities', () => {
  test('formatLogLevel applies correct styling', () => {
    expect(formatLogLevel('error')).toEqual({
      className: 'log-level-error',
      color: '#dc3545',
      icon: 'error'
    });
  });

  test('parseTimestamp formats correctly', () => {
    const timestamp = 1691234567890;
    const formatted = parseTimestamp(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('filterLogsByLevel returns correct subset', () => {
    const logs = [
      { level: 'info', message: 'Info log' },
      { level: 'error', message: 'Error log' },
      { level: 'warn', message: 'Warning log' }
    ];
    
    const filtered = filterLogsByLevel(logs, 'error');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Error log');
  });
});
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "test-strategy-analysis", "content": "Analyze existing testing infrastructure and React component requirements", "status": "completed"}, {"id": "unit-test-strategy", "content": "Define unit testing approach for React components and custom hooks", "status": "completed"}, {"id": "integration-test-strategy", "content": "Design integration testing for SSE connections and API endpoints", "status": "in_progress"}, {"id": "ui-test-strategy", "content": "Define UI testing for user interactions and component behaviors", "status": "pending"}, {"id": "performance-test-strategy", "content": "Design performance testing for streaming, search, and memory usage", "status": "pending"}, {"id": "error-scenario-testing", "content": "Plan error scenario testing (connection failures, API errors, malformed data)", "status": "pending"}, {"id": "test-data-strategy", "content": "Define test data strategy and mock setup requirements", "status": "pending"}, {"id": "automation-framework", "content": "Plan automation framework integration and CI/CD considerations", "status": "pending"}]: '<rootDir>/tests/$1'
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
    '^.+\\.(js|jsx)
```

## 3. UI Testing Strategy

### 3.1 End-to-End User Interaction Testing

```javascript
// /dashboard/tests/e2e/logViewer.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('Log Viewer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock server for consistent testing
    await page.route('/api/logs/**', async (route) => {
      const url = new URL(route.request().url());
      const mockData = generateE2EMockData(url.pathname, url.searchParams);
      await route.fulfill({ json: mockData });
    });
    
    // Navigate to log viewer
    await page.goto('/dashboard/logs/test-container');
  });

  test('displays logs with proper formatting and styling', async ({ page }) => {
    // Wait for logs to load
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check log entries are displayed
    const logEntries = await page.locator('[data-testid="log-entry"]').count();
    expect(logEntries).toBeGreaterThan(0);
    
    // Verify timestamp formatting
    const firstTimestamp = await page.locator('[data-testid="log-timestamp"]').first().textContent();
    expect(firstTimestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    
    // Verify level-based styling
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]');
    await expect(errorLogs.first()).toHaveClass(/error/);
    
    const infoLogs = page.locator('[data-testid="log-entry"][data-level="info"]');
    await expect(infoLogs.first()).toHaveClass(/info/);
  });

  test('implements infinite scroll for log pagination', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Scroll to bottom to trigger loading more logs
    await page.locator('[data-testid="log-container"]').scrollTo({ top: 'bottom' });
    
    // Wait for new logs to load
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount,
      { timeout: 5000 }
    );
    
    const newCount = await page.locator('[data-testid="log-entry"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('filters logs by level correctly', async ({ page }) => {
    // Open level filter dropdown
    await page.click('[data-testid="level-filter-button"]');
    
    // Select "Error" filter
    await page.click('[data-testid="level-filter-error"]');
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Verify only error logs are shown
    const visibleLogs = page.locator('[data-testid="log-entry"]:visible');
    const count = await visibleLogs.count();
    
    for (let i = 0; i < count; i++) {
      const level = await visibleLogs.nth(i).getAttribute('data-level');
      expect(level).toBe('error');
    }
  });

  test('search functionality works with real-time updates', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Type in search box
    await page.fill('[data-testid="log-search-input"]', 'database');
    
    // Wait for search results
    await page.waitForTimeout(600); // Account for debounce
    
    // Verify filtered results
    const searchResults = page.locator('[data-testid="log-entry"]:visible');
    const count = await searchResults.count();
    
    for (let i = 0; i < count; i++) {
      const message = await searchResults.nth(i).locator('[data-testid="log-message"]').textContent();
      expect(message.toLowerCase()).toContain('database');
    }
    
    // Clear search
    await page.fill('[data-testid="log-search-input"]', '');
    await page.waitForTimeout(600);
    
    // Verify all logs are shown again
    const allLogs = await page.locator('[data-testid="log-entry"]:visible').count();
    expect(allLogs).toBeGreaterThan(count);
  });

  test('export functionality generates correct files', async ({ page }) => {
    // Setup download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select JSON format
    await page.click('[data-testid="export-format-json"]');
    
    // Confirm export
    await page.click('[data-testid="export-confirm"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/.*\.json$/);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('real-time log streaming updates UI correctly', async ({ page }) => {
    // Setup SSE mock
    await page.evaluate(() => {
      // Mock EventSource
      window.mockEventSource = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn()
      };
      global.EventSource = jest.fn(() => window.mockEventSource);
    });
    
    // Wait for initial setup
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Simulate new log message
    await page.evaluate(() => {
      const messageHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      
      messageHandler({
        data: JSON.stringify({
          id: 'new-log-' + Date.now(),
          timestamp: Date.now(),
          level: 'info',
          message: 'New real-time log entry',
          stream: 'stdout'
        })
      });
    });
    
    // Wait for UI update
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount
    );
    
    // Verify new log appears
    const newLog = page.locator('[data-testid="log-entry"]').last();
    await expect(newLog.locator('[data-testid="log-message"]')).toContainText('New real-time log entry');
  });

  test('handles connection status indicators', async ({ page }) => {
    // Initially should show connected
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
    
    // Simulate connection loss
    await page.evaluate(() => {
      const errorHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      errorHandler({ type: 'error' });
    });
    
    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/disconnected/);
    
    // Should show reconnecting indicator
    await expect(page.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
  });
});

## 4. Performance Testing Strategy

### 4.1 Streaming Performance Tests

```javascript
// /dashboard/tests/performance/streaming.test.js
describe('Log Streaming Performance', () => {
  test('handles high-frequency log streams efficiently', async () => {
    const performanceMonitor = new PerformanceMonitor();
    const logStream = new LogStreamingService();
    
    performanceMonitor.startTest('high-frequency-streaming');
    
    await logStream.connect('test-container');
    
    // Simulate 1000 logs per second for 10 seconds
    const logBatch = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      timestamp: Date.now() + i,
      level: 'info',
      message: `High frequency log ${i + 1}`,
      stream: 'stdout'
    }));
    
    const startTime = performance.now();
    
    for (let second = 0; second < 10; second++) {
      for (const log of logBatch) {
        mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    performanceMonitor.endTest('high-frequency-streaming');
    
    // Should process 10,000 logs in under 2 seconds
    expect(processingTime).toBeLessThan(2000);
    
    // Memory usage should remain stable
    const memoryStats = performanceMonitor.getMemoryStats();
    expect(memoryStats.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });

  test('maintains low latency for real-time updates', async () => {
    const latencyTracker = new LatencyTracker();
    const logStream = new LogStreamingService();
    
    logStream.onMessage((log) => {
      const latency = Date.now() - log.timestamp;
      latencyTracker.recordLatency(latency);
    });
    
    await logStream.connect('test-container');
    
    // Send 100 logs with timestamp tracking
    for (let i = 0; i < 100; i++) {
      const log = {
        id: i,
        timestamp: Date.now(),
        level: 'info',
        message: `Latency test log ${i}`,
        stream: 'stdout'
      };
      
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await waitFor(() => latencyTracker.getSampleCount() === 100);
    
    // Average latency should be under 50ms
    expect(latencyTracker.getAverageLatency()).toBeLessThan(50);
    
    // 95th percentile should be under 100ms
    expect(latencyTracker.getPercentile(95)).toBeLessThan(100);
  });

  test('handles backpressure gracefully', async () => {
    const logStream = new LogStreamingService({ 
      bufferSize: 1000,
      backpressureThreshold: 800 
    });
    
    const backpressureEvents = [];
    logStream.on('backpressure', (event) => backpressureEvents.push(event));
    
    await logStream.connect('test-container');
    
    // Flood with logs faster than processing
    const floodLogs = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
      message: `Flood log ${i}`,
      level: 'info'
    }));
    
    // Send all logs at once
    floodLogs.forEach(log => {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    });
    
    await waitFor(() => backpressureEvents.length > 0, { timeout: 5000 });
    
    // Should trigger backpressure handling
    expect(backpressureEvents).toHaveLength(1);
    expect(backpressureEvents[0].action).toBe('throttle');
    
    // Should maintain buffer limits
    const bufferStats = logStream.getBufferStats();
    expect(bufferStats.size).toBeLessThanOrEqual(1000);
  });
});
```

### 4.2 Search Performance Tests

```javascript
// /dashboard/tests/performance/search.test.js
describe('Log Search Performance', () => {
  let searchService;
  let performanceMonitor;
  
  beforeEach(() => {
    searchService = new LogSearchService();
    performanceMonitor = new PerformanceMonitor();
    
    // Setup test data - 100k log entries
    const testLogs = generateLargeMockDataset(100000);
    searchService.indexLogs('performance-test-container', testLogs);
  });

  test('search completes within performance thresholds', async () => {
    const searchQueries = [
      'error database connection',
      'level:warn memory usage',
      '/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/', // IP regex
      'response time performance'
    ];
    
    const results = [];
    
    for (const query of searchQueries) {
      performanceMonitor.startTimer('search');
      
      const result = await searchService.search(query, {
        containers: ['performance-test-container'],
        limit: 100
      });
      
      const searchTime = performanceMonitor.endTimer('search');
      
      results.push({
        query,
        searchTime,
        resultCount: result.totalMatches
      });
      
      // Each search should complete in under 500ms
      expect(searchTime).toBeLessThan(500);
    }
    
    // Average search time should be under 200ms
    const averageTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    expect(averageTime).toBeLessThan(200);
  });

  test('concurrent searches maintain performance', async () => {
    const concurrentSearches = 10;
    const searchPromises = [];
    
    performanceMonitor.startTest('concurrent-search');
    
    // Launch concurrent searches
    for (let i = 0; i < concurrentSearches; i++) {
      const promise = searchService.search(`concurrent test ${i}`, {
        containers: ['performance-test-container']
      });
      searchPromises.push(promise);
    }
    
    const results = await Promise.all(searchPromises);
    
    performanceMonitor.endTest('concurrent-search');
    
    // All searches should complete
    expect(results).toHaveLength(concurrentSearches);
    
    // Total time should be reasonable (not serial execution)
    const totalTime = performanceMonitor.getTestDuration('concurrent-search');
    expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 10 concurrent searches
  });

  test('memory usage remains stable during intensive search', async () => {
    const initialMemory = performanceMonitor.getCurrentMemoryUsage();
    
    // Perform 100 different searches
    for (let i = 0; i < 100; i++) {
      await searchService.search(`intensive search ${i}`, {
        containers: ['performance-test-container'],
        limit: 50
      });
      
      // Force garbage collection every 10 searches
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = performanceMonitor.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (under 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 4.3 Memory Usage Monitoring

```javascript
// /dashboard/tests/performance/memory.test.js
describe('Memory Usage Performance', () => {
  test('log buffer implements proper memory management', async () => {
    const logBuffer = new LogBuffer({ 
      maxSize: 10000,
      memoryThreshold: 100 * 1024 * 1024 // 100MB
    });
    
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.startMonitoring();
    
    // Add logs until threshold is approached
    let logCount = 0;
    while (memoryMonitor.getCurrentUsage() < 90 * 1024 * 1024) { // 90MB
      const log = {
        id: logCount++,
        timestamp: Date.now(),
        message: 'x'.repeat(1000), // 1KB message
        level: 'info'
      };
      
      logBuffer.addLog(log);
      
      if (logCount % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Should trigger automatic cleanup
    expect(logBuffer.getStats().cleaned).toBe(true);
    expect(memoryMonitor.getCurrentUsage()).toBeLessThan(100 * 1024 * 1024);
    
    memoryMonitor.stopMonitoring();
  });

  test('component unmounting releases memory properly', async () => {
    const { unmount } = render(<LogViewer containerId="memory-test" />);
    
    // Simulate heavy log streaming
    const logStream = new LogStreamingService();
    await logStream.connect('memory-test');
    
    // Add many logs to component
    for (let i = 0; i < 5000; i++) {
      mockEventSource.simulateMessage({
        data: JSON.stringify({
          id: i,
          message: `Memory test log ${i}`,
          timestamp: Date.now()
        })
      });
    }
    
    const beforeUnmount = performance.memory?.usedJSHeapSize || 0;
    
    // Unmount component
    unmount();
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUnmount = performance.memory?.usedJSHeapSize || 0;
    const memoryFreed = beforeUnmount - afterUnmount;
    
    // Should free significant memory
    expect(memoryFreed).toBeGreaterThan(0);
  });
});
```

## 5. Error Scenario Testing

### 5.1 Connection Failure Testing

```javascript
// /dashboard/tests/errorScenarios/connectionFailures.test.js
describe('Connection Failure Scenarios', () => {
  test('handles initial connection failures gracefully', async () => {
    // Mock failed connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 2 // CLOSED
      };
      
      // Immediately trigger error
      setTimeout(() => {
        const errorHandler = mockES.addEventListener.mock.calls
          .find(call => call[0] === 'error')?.[1];
        if (errorHandler) {
          errorHandler({ type: 'error', message: 'Connection failed' });
        }
      }, 0);
      
      return mockES;
    });
    
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    
    logStream.onError(errorHandler);
    
    try {
      await logStream.connect('test-container');
    } catch (error) {
      expect(error.message).toContain('Connection failed');
    }
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'connection_error',
        message: expect.stringContaining('Connection failed')
      })
    );
  });

  test('handles network timeout scenarios', async () => {
    jest.useFakeTimers();
    
    // Mock slow connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 0 // CONNECTING
      };
      
      // Never connect (timeout scenario)
      return mockES;
    });
    
    const logStream = new LogStreamingService({ connectionTimeout: 5000 });
    const timeoutHandler = jest.fn();
    
    logStream.onTimeout(timeoutHandler);
    
    const connectionPromise = logStream.connect('test-container');
    
    // Fast forward time
    jest.advanceTimersByTime(6000);
    
    await expect(connectionPromise).rejects.toThrow('Connection timeout');
    expect(timeoutHandler).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('recovers from intermittent connection drops', async () => {
    let connectionAttempt = 0;
    const maxAttempts = 3;
    
    global.EventSource = jest.fn().mockImplementation(() => {
      connectionAttempt++;
      
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: connectionAttempt >= maxAttempts ? 1 : 2
      };
      
      if (connectionAttempt < maxAttempts) {
        // Fail first few attempts
        setTimeout(() => {
          const errorHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'error')?.[1];
          if (errorHandler) {
            errorHandler({ type: 'error', message: 'Temporary failure' });
          }
        }, 100);
      } else {
        // Succeed on final attempt
        setTimeout(() => {
          const openHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'open')?.[1];
          if (openHandler) {
            openHandler({ type: 'open' });
          }
        }, 100);
      }
      
      return mockES;
    });
    
    const logStream = new LogStreamingService({
      retryAttempts: 5,
      retryDelay: 100
    });
    
    const reconnectHandler = jest.fn();
    logStream.onReconnect(reconnectHandler);
    
    await logStream.connect('test-container');
    
    expect(connectionAttempt).toBe(maxAttempts);
    expect(reconnectHandler).toHaveBeenCalledTimes(maxAttempts - 1);
  });
});
```

### 5.2 Malformed Data Handling

```javascript
// /dashboard/tests/errorScenarios/malformedData.test.js
describe('Malformed Data Handling', () => {
  test('handles malformed JSON in SSE messages', async () => {
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    const messageHandler = jest.fn();
    
    logStream.onError(errorHandler);
    logStream.onMessage(messageHandler);
    
    await logStream.connect('test-container');
    
    // Send malformed JSON
    const malformedMessages = [
      'invalid-json',
      '{"incomplete": ',
      '{"id": 1, "message":}',
      '[[{"malformed": true}',
      'null-message'
    ];
    
    for (const malformed of malformedMessages) {
      mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1]({ data: malformed });
    }
    
    // Should handle all malformed messages gracefully
    expect(errorHandler).toHaveBeenCalledTimes(malformedMessages.length);
    expect(messageHandler).not.toHaveBeenCalled();
    
    // Subsequent valid messages should work
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1]({
        data: JSON.stringify({ id: 1, message: 'Valid message' })
      });
    
    expect(messageHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Valid message' })
    );
  });

  test('validates log entry structure', async () => {
    const logValidator = new LogEntryValidator();
    
    const invalidLogs = [
      {}, // Missing required fields
      { id: 1 }, // Missing message
      { message: 'test' }, // Missing timestamp
      { id: 'invalid', message: 'test', timestamp: 'invalid' }, // Wrong types
      { id: 1, message: null, timestamp: Date.now() }, // Null message
      { id: 1, message: 'test', timestamp: Date.now(), level: 'invalid' } // Invalid level
    ];
    
    const validationErrors = [];
    
    for (const log of invalidLogs) {
      const result = logValidator.validate(log);
      if (!result.valid) {
        validationErrors.push(result.errors);
      }
    }
    
    expect(validationErrors).toHaveLength(invalidLogs.length);
    
    // Test valid log passes validation
    const validLog = {
      id: 1,
      message: 'Valid log message',
      timestamp: Date.now(),
      level: 'info',
      stream: 'stdout'
    };
    
    const validResult = logValidator.validate(validLog);
    expect(validResult.valid).toBe(true);
  });
});
```

### 5.3 API Error Handling

```javascript
// /dashboard/tests/errorScenarios/apiErrors.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('API Error Handling', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      // Default to server error for testing
      return res(ctx.status(500), ctx.json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR' 
      }));
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('handles 404 container not found errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ 
          error: 'Container not found',
          code: 'CONTAINER_NOT_FOUND' 
        }));
      })
    );
    
    const { render } = await import('@testing-library/react');
    const errorBoundaryHandler = jest.fn();
    
    render(
      <ErrorBoundary onError={errorBoundaryHandler}>
        <LogViewer containerId="nonexistent-container" />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Container not found/)).toBeInTheDocument();
    });
    
    expect(errorBoundaryHandler).not.toHaveBeenCalled(); // Should handle gracefully
  });

  test('handles rate limiting errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(
          ctx.status(429), 
          ctx.set('Retry-After', '60'),
          ctx.json({ 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED' 
          })
        );
      })
    );
    
    const logApi = new LogApiClient();
    const rateLimitHandler = jest.fn();
    
    logApi.onRateLimit(rateLimitHandler);
    
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Rate limit exceeded');
    
    expect(rateLimitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
        code: 'RATE_LIMITED'
      })
    );
  });

  test('implements circuit breaker for repeated failures', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000
    });
    
    const logApi = new LogApiClient({ circuitBreaker });
    
    // Trigger circuit breaker with repeated failures
    for (let i = 0; i < 4; i++) {
      await expect(logApi.getLogs('test-container'))
        .rejects.toThrow();
    }
    
    // Should be in open state (failing fast)
    expect(circuitBreaker.getState()).toBe('open');
    
    // Next call should fail fast without API call
    const startTime = Date.now();
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Circuit breaker is open');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(10); // Failed fast
  });
});
```
```

### 3.2 Accessibility Testing

```javascript
// /dashboard/tests/e2e/accessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Log Viewer Accessibility', () => {
  test('meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Search input
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Level filter
    await expect(page.locator('[data-testid="level-filter-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Export button
    await expect(page.locator('[data-testid="export-button"]')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+f'); // Focus search
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
  });

  test('provides screen reader compatible content', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check ARIA labels
    const searchInput = page.locator('[data-testid="log-search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search logs'));
    
    // Check log level announcements
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]').first();
    await expect(errorLogs).toHaveAttribute('aria-label', expect.stringContaining('Error level'));
    
    // Check live region for real-time updates
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
```

  test('handles connection drops and reconnects', async () => {
    const connectionSpy = jest.fn();
    const disconnectionSpy = jest.fn();
    
    connectionManager.on('connected', connectionSpy);
    connectionManager.on('disconnected', disconnectionSpy);
    
    // Initial connection
    await connectionManager.connect('test-container');
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    
    // Simulate connection drop
    mockEventSource.simulateError({ type: 'error' });
    expect(disconnectionSpy).toHaveBeenCalledTimes(1);
    
    // Wait for automatic reconnection
    await waitFor(() => {
      expect(connectionSpy).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  test('implements exponential backoff for reconnection', async () => {
    const reconnectAttempts = [];
    connectionManager.on('reconnectAttempt', (attempt) => {
      reconnectAttempts.push({ attempt, timestamp: Date.now() });
    });
    
    // Force multiple connection failures
    for (let i = 0; i < 3; i++) {
      await connectionManager.connect('test-container');
      mockEventSource.simulateError({ type: 'error' });
    }
    
    // Verify exponential backoff
    expect(reconnectAttempts.length).toBe(3);
    const delays = reconnectAttempts.slice(1).map((attempt, index) => 
      attempt.timestamp - reconnectAttempts[index].timestamp
    );
    
    // Each delay should be longer than the previous (exponential backoff)
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  test('handles browser tab visibility changes', async () => {
    const visibilityHandler = jest.fn();
    connectionManager.on('visibilityChange', visibilityHandler);
    
    // Simulate tab going hidden (user switches tabs)
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: true });
    
    // Simulate tab becoming visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: false });
  });

  test('handles server-sent heartbeat messages', async () => {
    const heartbeatHandler = jest.fn();
    connectionManager.on('heartbeat', heartbeatHandler);
    
    // Simulate heartbeat event
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'heartbeat')?.[1]({ 
        data: JSON.stringify({ timestamp: Date.now() })
      });
    
    expect(heartbeatHandler).toHaveBeenCalled();
  });

  test('maintains connection state during rapid reconnections', async () => {
    const stateChanges = [];
    connectionManager.on('stateChange', (state) => stateChanges.push(state));
    
    // Rapid connection changes
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    
    // Should have proper state transitions
    expect(stateChanges).toContain('connecting');
    expect(stateChanges).toContain('connected');
    expect(stateChanges).toContain('disconnected');
    expect(stateChanges).toContain('reconnecting');
  });

  test('implements connection pooling for multiple containers', async () => {
    const containers = ['container-1', 'container-2', 'container-3'];
    const connections = [];
    
    // Connect to multiple containers
    for (const container of containers) {
      const connection = await connectionManager.connect(container);
      connections.push(connection);
    }
    
    // Verify all connections are active
    expect(connections).toHaveLength(3);
    expect(connections.every(conn => conn.isConnected())).toBe(true);
    
    // Verify connection pooling limits
    const poolStats = connectionManager.getPoolStats();
    expect(poolStats.active).toBe(3);
    expect(poolStats.max).toBeGreaterThanOrEqual(3);
  });
});
```

### 2.4 Data Flow Integration Testing

```javascript
// /dashboard/tests/integration/dataFlow.test.js
describe('Log Data Flow Integration', () => {
  test('maintains data consistency through streaming', async () => {
    const dataStore = new LogDataStore();
    const streamer = new LogStreamingService();
    
    // Track data flow
    const receivedLogs = [];
    streamer.onMessage((log) => {
      dataStore.addLog(log);
      receivedLogs.push(log);
    });
    
    await streamer.connect('test-container');
    
    // Simulate log sequence
    const logSequence = [
      { id: 1, message: 'Log 1', timestamp: Date.now() },
      { id: 2, message: 'Log 2', timestamp: Date.now() + 1000 },
      { id: 3, message: 'Log 3', timestamp: Date.now() + 2000 }
    ];
    
    for (const log of logSequence) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => receivedLogs.length === 3);
    
    // Verify data consistency
    expect(dataStore.getLogs()).toHaveLength(3);
    expect(dataStore.getLogs().map(l => l.id)).toEqual([1, 2, 3]);
    expect(receivedLogs.map(l => l.message)).toEqual(['Log 1', 'Log 2', 'Log 3']);
  });

  test('handles out-of-order log delivery', async () => {
    const dataStore = new LogDataStore({ sortByTimestamp: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send logs out of order
    const logs = [
      { id: 3, message: 'Third log', timestamp: Date.now() + 2000 },
      { id: 1, message: 'First log', timestamp: Date.now() },
      { id: 2, message: 'Second log', timestamp: Date.now() + 1000 }
    ];
    
    for (const log of logs) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => dataStore.getLogs().length === 3);
    
    // Verify proper ordering
    const sortedLogs = dataStore.getLogs();
    expect(sortedLogs.map(l => l.id)).toEqual([1, 2, 3]);
  });

  test('handles duplicate log prevention', async () => {
    const dataStore = new LogDataStore({ preventDuplicates: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send duplicate logs
    const log = { id: 1, message: 'Duplicate log', timestamp: Date.now() };
    
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    
    await waitFor(() => dataStore.getLogs().length === 1);
    
    // Should only have one instance
    expect(dataStore.getLogs()).toHaveLength(1);
    expect(dataStore.getLogs()[0].id).toBe(1);
  });
});
```
  });

  test('handles network connectivity changes', async () => {
    const networkHandler = jest.fn();
    connectionManager.on('networkChange', networkHandler);
    
    // Simulate network offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: false });
    
    // Simulate network back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: true });
  });
});
```
/dashboard/tests/
├── __mocks__/              # Mocks and test doubles
├── __fixtures__/           # Test data fixtures
├── unit/                   # Component unit tests
├── integration/            # API integration tests
├── e2e/                    # End-to-end UI tests
├── performance/            # Performance benchmarks
└── utils/                  # Testing utilities
```

### Testing Stack Integration
- **Framework**: Jest with React Testing Library
- **UI Testing**: Playwright for E2E tests
- **Performance**: Lighthouse CI + Custom metrics
- **Coverage**: Istanbul with >70% threshold
- **Mocking**: MSW for API mocking, EventSource mocks for SSE

## 1. Unit Testing Strategy

### 1.1 React Components Testing

#### LogViewer Main Component
```javascript
// /dashboard/tests/unit/components/LogViewer.test.jsx
describe('LogViewer Component', () => {
  test('renders with initial loading state', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });

## 2. Integration Testing Strategy

### 2.1 SSE Connection Testing

#### Real-time Log Streaming
```javascript
// /dashboard/tests/integration/logStreaming.test.js
describe('Log Streaming Integration', () => {
  let mockEventSource;
  let logStreamingService;
  
  beforeEach(() => {
    // Mock EventSource for SSE testing
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    };
    
    global.EventSource = jest.fn(() => mockEventSource);
    logStreamingService = new LogStreamingService();
  });

  test('establishes SSE connection with correct headers', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    expect(global.EventSource).toHaveBeenCalledWith(
      '/api/logs/stream/test-container',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream'
        })
      })
    );
  });

  test('handles SSE message parsing correctly', () => {
    const mockHandler = jest.fn();
    logStreamingService.onMessage(mockHandler);
    
    // Simulate SSE message event
    const messageEvent = {
      type: 'message',
      data: JSON.stringify({
        id: '123',
        timestamp: Date.now(),
        level: 'info',
        message: 'Test log entry',
        stream: 'stdout'
      })
    };
    
    // Trigger the message handler
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](messageEvent);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      message: 'Test log entry'
    }));
  });

  test('handles malformed SSE messages gracefully', () => {
    const mockErrorHandler = jest.fn();
    const mockMessageHandler = jest.fn();
    
    logStreamingService.onError(mockErrorHandler);
    logStreamingService.onMessage(mockMessageHandler);
    
    // Send malformed JSON
    const malformedEvent = {
      type: 'message',
      data: 'invalid-json-{malformed'
    };
    
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](malformedEvent);
    
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parse_error',
        message: expect.stringContaining('Invalid JSON')
      })
    );
    expect(mockMessageHandler).not.toHaveBeenCalled();
  });

  test('implements proper connection lifecycle', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    // Verify connection is established
    expect(connection.isConnected()).toBe(true);
    
    // Simulate connection close
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'close')[1]({ type: 'close' });
    
    expect(connection.isConnected()).toBe(false);
    
    // Cleanup
    await connection.disconnect();
    expect(mockEventSource.close).toHaveBeenCalled();
  });

  test('handles server-sent events with different event types', () => {
    const handlers = {
      log: jest.fn(),
      status: jest.fn(),
      error: jest.fn()
    };
    
    Object.entries(handlers).forEach(([type, handler]) => {
      logStreamingService.on(type, handler);
    });
    
    // Test different event types
    const events = [
      { type: 'log', data: JSON.stringify({ message: 'Log entry' }) },
      { type: 'status', data: JSON.stringify({ connected: true }) },
      { type: 'error', data: JSON.stringify({ error: 'Connection lost' }) }
    ];
    
    events.forEach(event => {
      const handler = mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === event.type)?.[1];
      if (handler) handler(event);
    });
    
    expect(handlers.log).toHaveBeenCalledWith({ message: 'Log entry' });
    expect(handlers.status).toHaveBeenCalledWith({ connected: true });
    expect(handlers.error).toHaveBeenCalledWith({ error: 'Connection lost' });
  });
});
```

### 2.2 API Endpoints Testing

#### Log Fetching API
```javascript
// /dashboard/tests/integration/logApi.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('Log API Integration', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      const { containerId } = req.params;
      const { limit, level, search, since, until } = req.url.searchParams;
      
      // Mock response based on query parameters
      const mockLogs = generateMockLogs({
        containerId,
        limit: parseInt(limit) || 100,
        level,
        search,
        since,
        until
      });
      
      return res(ctx.json({
        logs: mockLogs,
        total: mockLogs.length,
        hasMore: mockLogs.length >= (parseInt(limit) || 100)
      }));
    }),
    
    rest.get('/api/logs/:containerId/search', (req, res, ctx) => {
      const { containerId } = req.params;
      const { q, limit, facets } = req.url.searchParams;
      
      const searchResults = performMockSearch({
        containerId,
        query: q,
        limit: parseInt(limit) || 100,
        includeFacets: facets === 'true'
      });
      
      return res(ctx.json(searchResults));
    }),
    
    rest.post('/api/logs/:containerId/export', (req, res, ctx) => {
      const { containerId } = req.params;
      const { format, filters } = req.body;
      
      const exportData = generateMockExport(containerId, format, filters);
      
      return res(
        ctx.set('Content-Type', getContentType(format)),
        ctx.set('Content-Disposition', `attachment; filename=${containerId}_logs.${format}`),
        ctx.text(exportData)
      );
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('fetches logs with pagination', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      limit: 50,
      offset: 0
    });
    
    expect(response.logs).toHaveLength(50);
    expect(response.total).toBeGreaterThanOrEqual(50);
    expect(response.hasMore).toBeDefined();
  });

  test('applies filters correctly', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      level: 'error',
      since: new Date('2025-08-07T00:00:00Z').toISOString()
    });
    
    expect(response.logs.every(log => log.level === 'error')).toBe(true);
    expect(response.logs.every(log => 
      new Date(log.timestamp) >= new Date('2025-08-07T00:00:00Z')
    )).toBe(true);
  });

  test('handles search queries with facets', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.searchLogs('test-container', {
      query: 'database error',
      includeFacets: true
    });
    
    expect(response.results).toBeDefined();
    expect(response.facets).toBeDefined();
    expect(response.facets.levels).toBeDefined();
    expect(response.facets.timeRanges).toBeDefined();
  });

  test('exports logs in different formats', async () => {
    const logApi = new LogApiClient();
    
    // Test JSON export
    const jsonExport = await logApi.exportLogs('test-container', {
      format: 'json',
      filters: { level: 'error' }
    });
    
    expect(jsonExport.headers.get('content-type')).toContain('application/json');
    const jsonData = JSON.parse(await jsonExport.text());
    expect(Array.isArray(jsonData)).toBe(true);
    
    // Test CSV export
    const csvExport = await logApi.exportLogs('test-container', {
      format: 'csv'
    });
    
    expect(csvExport.headers.get('content-type')).toContain('text/csv');
    const csvText = await csvExport.text();
    expect(csvText).toContain('Timestamp,Level,Stream,Message');
  });

  test('handles API error responses gracefully', async () => {
    // Mock server error
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );
    
    const logApi = new LogApiClient();
    
    await expect(logApi.getLogs('test-container')).rejects.toThrow(
      expect.objectContaining({
        status: 500,
        message: expect.stringContaining('Internal server error')
      })
    );
  });
});
```

  test('handles empty log state correctly', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  test('displays logs with proper formatting', () => {
    const mockLogs = [
      { id: 1, timestamp: Date.now(), level: 'info', message: 'Test log' }
    ];
    render(<LogViewer containerId="test-container" initialLogs={mockLogs} />);
    expect(screen.getByText('Test log')).toBeInTheDocument();
  });

  test('applies level-based styling', () => {
    const errorLog = { level: 'error', message: 'Error occurred' };
    render(<LogViewer logs={[errorLog]} />);
    const logElement = screen.getByText('Error occurred');
    expect(logElement).toHaveClass('log-level-error');
  });
});
```

#### Log Search Component
```javascript
// /dashboard/tests/unit/components/LogSearch.test.jsx
describe('LogSearch Component', () => {
  test('updates search query on input change', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    expect(onSearch).toHaveBeenCalledWith('error');
  });

  test('handles advanced search syntax', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'level:error database' } });
    
    expect(onSearch).toHaveBeenCalledWith('level:error database');
  });

  test('provides search suggestions', () => {
    render(<LogSearch suggestions={['error', 'warning', 'database']} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'err' } });
    
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
```

#### Log Level Filter Component
```javascript
// /dashboard/tests/unit/components/LogLevelFilter.test.jsx
describe('LogLevelFilter Component', () => {
  test('renders all log levels as options', () => {
    render(<LogLevelFilter onFilterChange={jest.fn()} />);
    
    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  test('calls onFilterChange when level selected', () => {
    const onFilterChange = jest.fn();
    render(<LogLevelFilter onFilterChange={onFilterChange} />);
    
    fireEvent.click(screen.getByText('Error'));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });
});
```

### 1.2 Custom Hooks Testing

#### useLogStream Hook
```javascript
// /dashboard/tests/unit/hooks/useLogStream.test.js
describe('useLogStream Hook', () => {
  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  test('establishes SSE connection when enabled', () => {
    const mockEventSource = jest.fn();
    global.EventSource = mockEventSource;
    
    renderHook(() => useLogStream('test-container', { enabled: true }));
    
    expect(mockEventSource).toHaveBeenCalledWith('/api/logs/stream/test-container');
  });

  test('handles incoming log messages', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      // Simulate SSE message
      const mockEvent = { data: JSON.stringify({ 
        id: 1, message: 'New log', level: 'info' 
      })};
      result.current.handleMessage(mockEvent);
    });
    
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('New log');
  });

  test('handles connection errors gracefully', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      result.current.handleError({ type: 'error', message: 'Connection failed' });
    });
    
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.isConnected).toBe(false);
  });

  test('implements automatic reconnection on disconnect', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLogStream('test-container', { 
      autoReconnect: true, 
      reconnectDelay: 1000 
    }));
    
    act(() => {
      result.current.handleClose();
    });
    
    expect(result.current.reconnectAttempt).toBe(0);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.reconnectAttempt).toBe(1);
    jest.useRealTimers();
  });
});
```

#### useLogSearch Hook
```javascript
// /dashboard/tests/unit/hooks/useLogSearch.test.js
describe('useLogSearch Hook', () => {
  test('debounces search queries', async () => {
    jest.useFakeTimers();
    const mockSearchFn = jest.fn();
    
    const { result } = renderHook(() => useLogSearch(mockSearchFn, { debounce: 300 }));
    
    act(() => {
      result.current.search('first');
      result.current.search('second');
      result.current.search('final');
    });
    
    // Should not call immediately
    expect(mockSearchFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only call once with final query
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('final');
    
    jest.useRealTimers();
  });

  test('caches search results', () => {
    const { result } = renderHook(() => useLogSearch(jest.fn(), { 
      cacheEnabled: true 
    }));
    
    const mockResults = [{ id: 1, message: 'test' }];
    
    act(() => {
      result.current.setCachedResults('test-query', mockResults);
    });
    
    const cached = result.current.getCachedResults('test-query');
    expect(cached).toEqual(mockResults);
  });
});
```

### 1.3 Utility Functions Testing

```javascript
// /dashboard/tests/unit/utils/logUtils.test.js
describe('Log Utilities', () => {
  test('formatLogLevel applies correct styling', () => {
    expect(formatLogLevel('error')).toEqual({
      className: 'log-level-error',
      color: '#dc3545',
      icon: 'error'
    });
  });

  test('parseTimestamp formats correctly', () => {
    const timestamp = 1691234567890;
    const formatted = parseTimestamp(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('filterLogsByLevel returns correct subset', () => {
    const logs = [
      { level: 'info', message: 'Info log' },
      { level: 'error', message: 'Error log' },
      { level: 'warn', message: 'Warning log' }
    ];
    
    const filtered = filterLogsByLevel(logs, 'error');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Error log');
  });
});
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "test-strategy-analysis", "content": "Analyze existing testing infrastructure and React component requirements", "status": "completed"}, {"id": "unit-test-strategy", "content": "Define unit testing approach for React components and custom hooks", "status": "completed"}, {"id": "integration-test-strategy", "content": "Design integration testing for SSE connections and API endpoints", "status": "in_progress"}, {"id": "ui-test-strategy", "content": "Define UI testing for user interactions and component behaviors", "status": "pending"}, {"id": "performance-test-strategy", "content": "Design performance testing for streaming, search, and memory usage", "status": "pending"}, {"id": "error-scenario-testing", "content": "Plan error scenario testing (connection failures, API errors, malformed data)", "status": "pending"}, {"id": "test-data-strategy", "content": "Define test data strategy and mock setup requirements", "status": "pending"}, {"id": "automation-framework", "content": "Plan automation framework integration and CI/CD considerations", "status": "pending"}]: 'babel-jest'
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

### 7.2 Test Setup and Global Configuration

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

### 7.3 Playwright Configuration for E2E Tests

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

### 7.4 GitHub Actions CI/CD Pipeline

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

### 7.5 Package.json Scripts for Testing

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

## 8. Test Execution Strategy

### 8.1 Test Execution Order

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

### 8.2 Quality Gates and Success Criteria

| Test Type | Coverage Threshold | Performance Threshold | Success Criteria |
|-----------|-------------------|----------------------|------------------|
| Unit Tests | >70% | <500ms average | All tests pass |
| Integration | >60% | <2s per test | All tests pass |
| E2E Tests | N/A | <30s per scenario | All critical paths pass |
| Performance | N/A | <500ms streaming latency | No regressions >20% |
| Accessibility | N/A | WCAG AA compliance | Zero violations |

### 8.3 Monitoring and Reporting

- **Test Results Dashboard**: Aggregate results across all test types
- **Performance Trends**: Track streaming latency, search performance over time
- **Coverage Reports**: Component-level coverage with trend analysis
- **Error Analysis**: Categorize and track test failures by component/feature
- **Accessibility Metrics**: WCAG compliance score and violation trends

## Summary

This comprehensive testing strategy ensures robust validation of the Real-time Log Viewer component across all critical dimensions:

- **Unit Testing**: Validates individual components and hooks
- **Integration Testing**: Ensures proper SSE connections and API interactions  
- **UI Testing**: Validates end-user workflows and accessibility
- **Performance Testing**: Ensures streaming and search meet latency requirements
- **Error Scenarios**: Validates graceful handling of failures
- **Test Data**: Provides realistic and varied test scenarios
- **Automation**: Enables continuous validation through CI/CD

The strategy balances comprehensive coverage with practical execution, providing confidence in the component's reliability while maintaining development velocity.
```

## 3. UI Testing Strategy

### 3.1 End-to-End User Interaction Testing

```javascript
// /dashboard/tests/e2e/logViewer.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('Log Viewer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock server for consistent testing
    await page.route('/api/logs/**', async (route) => {
      const url = new URL(route.request().url());
      const mockData = generateE2EMockData(url.pathname, url.searchParams);
      await route.fulfill({ json: mockData });
    });
    
    // Navigate to log viewer
    await page.goto('/dashboard/logs/test-container');
  });

  test('displays logs with proper formatting and styling', async ({ page }) => {
    // Wait for logs to load
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check log entries are displayed
    const logEntries = await page.locator('[data-testid="log-entry"]').count();
    expect(logEntries).toBeGreaterThan(0);
    
    // Verify timestamp formatting
    const firstTimestamp = await page.locator('[data-testid="log-timestamp"]').first().textContent();
    expect(firstTimestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    
    // Verify level-based styling
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]');
    await expect(errorLogs.first()).toHaveClass(/error/);
    
    const infoLogs = page.locator('[data-testid="log-entry"][data-level="info"]');
    await expect(infoLogs.first()).toHaveClass(/info/);
  });

  test('implements infinite scroll for log pagination', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Scroll to bottom to trigger loading more logs
    await page.locator('[data-testid="log-container"]').scrollTo({ top: 'bottom' });
    
    // Wait for new logs to load
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount,
      { timeout: 5000 }
    );
    
    const newCount = await page.locator('[data-testid="log-entry"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('filters logs by level correctly', async ({ page }) => {
    // Open level filter dropdown
    await page.click('[data-testid="level-filter-button"]');
    
    // Select "Error" filter
    await page.click('[data-testid="level-filter-error"]');
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Verify only error logs are shown
    const visibleLogs = page.locator('[data-testid="log-entry"]:visible');
    const count = await visibleLogs.count();
    
    for (let i = 0; i < count; i++) {
      const level = await visibleLogs.nth(i).getAttribute('data-level');
      expect(level).toBe('error');
    }
  });

  test('search functionality works with real-time updates', async ({ page }) => {
    // Wait for initial logs
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Type in search box
    await page.fill('[data-testid="log-search-input"]', 'database');
    
    // Wait for search results
    await page.waitForTimeout(600); // Account for debounce
    
    // Verify filtered results
    const searchResults = page.locator('[data-testid="log-entry"]:visible');
    const count = await searchResults.count();
    
    for (let i = 0; i < count; i++) {
      const message = await searchResults.nth(i).locator('[data-testid="log-message"]').textContent();
      expect(message.toLowerCase()).toContain('database');
    }
    
    // Clear search
    await page.fill('[data-testid="log-search-input"]', '');
    await page.waitForTimeout(600);
    
    // Verify all logs are shown again
    const allLogs = await page.locator('[data-testid="log-entry"]:visible').count();
    expect(allLogs).toBeGreaterThan(count);
  });

  test('export functionality generates correct files', async ({ page }) => {
    // Setup download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select JSON format
    await page.click('[data-testid="export-format-json"]');
    
    // Confirm export
    await page.click('[data-testid="export-confirm"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/.*\.json$/);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('real-time log streaming updates UI correctly', async ({ page }) => {
    // Setup SSE mock
    await page.evaluate(() => {
      // Mock EventSource
      window.mockEventSource = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn()
      };
      global.EventSource = jest.fn(() => window.mockEventSource);
    });
    
    // Wait for initial setup
    await page.waitForSelector('[data-testid="log-entry"]');
    const initialCount = await page.locator('[data-testid="log-entry"]').count();
    
    // Simulate new log message
    await page.evaluate(() => {
      const messageHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      
      messageHandler({
        data: JSON.stringify({
          id: 'new-log-' + Date.now(),
          timestamp: Date.now(),
          level: 'info',
          message: 'New real-time log entry',
          stream: 'stdout'
        })
      });
    });
    
    // Wait for UI update
    await page.waitForFunction(
      (initial) => document.querySelectorAll('[data-testid="log-entry"]').length > initial,
      initialCount
    );
    
    // Verify new log appears
    const newLog = page.locator('[data-testid="log-entry"]').last();
    await expect(newLog.locator('[data-testid="log-message"]')).toContainText('New real-time log entry');
  });

  test('handles connection status indicators', async ({ page }) => {
    // Initially should show connected
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
    
    // Simulate connection loss
    await page.evaluate(() => {
      const errorHandler = window.mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      errorHandler({ type: 'error' });
    });
    
    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toHaveClass(/disconnected/);
    
    // Should show reconnecting indicator
    await expect(page.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
  });
});

## 4. Performance Testing Strategy

### 4.1 Streaming Performance Tests

```javascript
// /dashboard/tests/performance/streaming.test.js
describe('Log Streaming Performance', () => {
  test('handles high-frequency log streams efficiently', async () => {
    const performanceMonitor = new PerformanceMonitor();
    const logStream = new LogStreamingService();
    
    performanceMonitor.startTest('high-frequency-streaming');
    
    await logStream.connect('test-container');
    
    // Simulate 1000 logs per second for 10 seconds
    const logBatch = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      timestamp: Date.now() + i,
      level: 'info',
      message: `High frequency log ${i + 1}`,
      stream: 'stdout'
    }));
    
    const startTime = performance.now();
    
    for (let second = 0; second < 10; second++) {
      for (const log of logBatch) {
        mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    performanceMonitor.endTest('high-frequency-streaming');
    
    // Should process 10,000 logs in under 2 seconds
    expect(processingTime).toBeLessThan(2000);
    
    // Memory usage should remain stable
    const memoryStats = performanceMonitor.getMemoryStats();
    expect(memoryStats.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });

  test('maintains low latency for real-time updates', async () => {
    const latencyTracker = new LatencyTracker();
    const logStream = new LogStreamingService();
    
    logStream.onMessage((log) => {
      const latency = Date.now() - log.timestamp;
      latencyTracker.recordLatency(latency);
    });
    
    await logStream.connect('test-container');
    
    // Send 100 logs with timestamp tracking
    for (let i = 0; i < 100; i++) {
      const log = {
        id: i,
        timestamp: Date.now(),
        level: 'info',
        message: `Latency test log ${i}`,
        stream: 'stdout'
      };
      
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await waitFor(() => latencyTracker.getSampleCount() === 100);
    
    // Average latency should be under 50ms
    expect(latencyTracker.getAverageLatency()).toBeLessThan(50);
    
    // 95th percentile should be under 100ms
    expect(latencyTracker.getPercentile(95)).toBeLessThan(100);
  });

  test('handles backpressure gracefully', async () => {
    const logStream = new LogStreamingService({ 
      bufferSize: 1000,
      backpressureThreshold: 800 
    });
    
    const backpressureEvents = [];
    logStream.on('backpressure', (event) => backpressureEvents.push(event));
    
    await logStream.connect('test-container');
    
    // Flood with logs faster than processing
    const floodLogs = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
      message: `Flood log ${i}`,
      level: 'info'
    }));
    
    // Send all logs at once
    floodLogs.forEach(log => {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    });
    
    await waitFor(() => backpressureEvents.length > 0, { timeout: 5000 });
    
    // Should trigger backpressure handling
    expect(backpressureEvents).toHaveLength(1);
    expect(backpressureEvents[0].action).toBe('throttle');
    
    // Should maintain buffer limits
    const bufferStats = logStream.getBufferStats();
    expect(bufferStats.size).toBeLessThanOrEqual(1000);
  });
});
```

### 4.2 Search Performance Tests

```javascript
// /dashboard/tests/performance/search.test.js
describe('Log Search Performance', () => {
  let searchService;
  let performanceMonitor;
  
  beforeEach(() => {
    searchService = new LogSearchService();
    performanceMonitor = new PerformanceMonitor();
    
    // Setup test data - 100k log entries
    const testLogs = generateLargeMockDataset(100000);
    searchService.indexLogs('performance-test-container', testLogs);
  });

  test('search completes within performance thresholds', async () => {
    const searchQueries = [
      'error database connection',
      'level:warn memory usage',
      '/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/', // IP regex
      'response time performance'
    ];
    
    const results = [];
    
    for (const query of searchQueries) {
      performanceMonitor.startTimer('search');
      
      const result = await searchService.search(query, {
        containers: ['performance-test-container'],
        limit: 100
      });
      
      const searchTime = performanceMonitor.endTimer('search');
      
      results.push({
        query,
        searchTime,
        resultCount: result.totalMatches
      });
      
      // Each search should complete in under 500ms
      expect(searchTime).toBeLessThan(500);
    }
    
    // Average search time should be under 200ms
    const averageTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    expect(averageTime).toBeLessThan(200);
  });

  test('concurrent searches maintain performance', async () => {
    const concurrentSearches = 10;
    const searchPromises = [];
    
    performanceMonitor.startTest('concurrent-search');
    
    // Launch concurrent searches
    for (let i = 0; i < concurrentSearches; i++) {
      const promise = searchService.search(`concurrent test ${i}`, {
        containers: ['performance-test-container']
      });
      searchPromises.push(promise);
    }
    
    const results = await Promise.all(searchPromises);
    
    performanceMonitor.endTest('concurrent-search');
    
    // All searches should complete
    expect(results).toHaveLength(concurrentSearches);
    
    // Total time should be reasonable (not serial execution)
    const totalTime = performanceMonitor.getTestDuration('concurrent-search');
    expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 10 concurrent searches
  });

  test('memory usage remains stable during intensive search', async () => {
    const initialMemory = performanceMonitor.getCurrentMemoryUsage();
    
    // Perform 100 different searches
    for (let i = 0; i < 100; i++) {
      await searchService.search(`intensive search ${i}`, {
        containers: ['performance-test-container'],
        limit: 50
      });
      
      // Force garbage collection every 10 searches
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = performanceMonitor.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (under 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 4.3 Memory Usage Monitoring

```javascript
// /dashboard/tests/performance/memory.test.js
describe('Memory Usage Performance', () => {
  test('log buffer implements proper memory management', async () => {
    const logBuffer = new LogBuffer({ 
      maxSize: 10000,
      memoryThreshold: 100 * 1024 * 1024 // 100MB
    });
    
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.startMonitoring();
    
    // Add logs until threshold is approached
    let logCount = 0;
    while (memoryMonitor.getCurrentUsage() < 90 * 1024 * 1024) { // 90MB
      const log = {
        id: logCount++,
        timestamp: Date.now(),
        message: 'x'.repeat(1000), // 1KB message
        level: 'info'
      };
      
      logBuffer.addLog(log);
      
      if (logCount % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Should trigger automatic cleanup
    expect(logBuffer.getStats().cleaned).toBe(true);
    expect(memoryMonitor.getCurrentUsage()).toBeLessThan(100 * 1024 * 1024);
    
    memoryMonitor.stopMonitoring();
  });

  test('component unmounting releases memory properly', async () => {
    const { unmount } = render(<LogViewer containerId="memory-test" />);
    
    // Simulate heavy log streaming
    const logStream = new LogStreamingService();
    await logStream.connect('memory-test');
    
    // Add many logs to component
    for (let i = 0; i < 5000; i++) {
      mockEventSource.simulateMessage({
        data: JSON.stringify({
          id: i,
          message: `Memory test log ${i}`,
          timestamp: Date.now()
        })
      });
    }
    
    const beforeUnmount = performance.memory?.usedJSHeapSize || 0;
    
    // Unmount component
    unmount();
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUnmount = performance.memory?.usedJSHeapSize || 0;
    const memoryFreed = beforeUnmount - afterUnmount;
    
    // Should free significant memory
    expect(memoryFreed).toBeGreaterThan(0);
  });
});
```

## 5. Error Scenario Testing

### 5.1 Connection Failure Testing

```javascript
// /dashboard/tests/errorScenarios/connectionFailures.test.js
describe('Connection Failure Scenarios', () => {
  test('handles initial connection failures gracefully', async () => {
    // Mock failed connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 2 // CLOSED
      };
      
      // Immediately trigger error
      setTimeout(() => {
        const errorHandler = mockES.addEventListener.mock.calls
          .find(call => call[0] === 'error')?.[1];
        if (errorHandler) {
          errorHandler({ type: 'error', message: 'Connection failed' });
        }
      }, 0);
      
      return mockES;
    });
    
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    
    logStream.onError(errorHandler);
    
    try {
      await logStream.connect('test-container');
    } catch (error) {
      expect(error.message).toContain('Connection failed');
    }
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'connection_error',
        message: expect.stringContaining('Connection failed')
      })
    );
  });

  test('handles network timeout scenarios', async () => {
    jest.useFakeTimers();
    
    // Mock slow connection
    global.EventSource = jest.fn().mockImplementation(() => {
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: 0 // CONNECTING
      };
      
      // Never connect (timeout scenario)
      return mockES;
    });
    
    const logStream = new LogStreamingService({ connectionTimeout: 5000 });
    const timeoutHandler = jest.fn();
    
    logStream.onTimeout(timeoutHandler);
    
    const connectionPromise = logStream.connect('test-container');
    
    // Fast forward time
    jest.advanceTimersByTime(6000);
    
    await expect(connectionPromise).rejects.toThrow('Connection timeout');
    expect(timeoutHandler).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('recovers from intermittent connection drops', async () => {
    let connectionAttempt = 0;
    const maxAttempts = 3;
    
    global.EventSource = jest.fn().mockImplementation(() => {
      connectionAttempt++;
      
      const mockES = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: connectionAttempt >= maxAttempts ? 1 : 2
      };
      
      if (connectionAttempt < maxAttempts) {
        // Fail first few attempts
        setTimeout(() => {
          const errorHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'error')?.[1];
          if (errorHandler) {
            errorHandler({ type: 'error', message: 'Temporary failure' });
          }
        }, 100);
      } else {
        // Succeed on final attempt
        setTimeout(() => {
          const openHandler = mockES.addEventListener.mock.calls
            .find(call => call[0] === 'open')?.[1];
          if (openHandler) {
            openHandler({ type: 'open' });
          }
        }, 100);
      }
      
      return mockES;
    });
    
    const logStream = new LogStreamingService({
      retryAttempts: 5,
      retryDelay: 100
    });
    
    const reconnectHandler = jest.fn();
    logStream.onReconnect(reconnectHandler);
    
    await logStream.connect('test-container');
    
    expect(connectionAttempt).toBe(maxAttempts);
    expect(reconnectHandler).toHaveBeenCalledTimes(maxAttempts - 1);
  });
});
```

### 5.2 Malformed Data Handling

```javascript
// /dashboard/tests/errorScenarios/malformedData.test.js
describe('Malformed Data Handling', () => {
  test('handles malformed JSON in SSE messages', async () => {
    const logStream = new LogStreamingService();
    const errorHandler = jest.fn();
    const messageHandler = jest.fn();
    
    logStream.onError(errorHandler);
    logStream.onMessage(messageHandler);
    
    await logStream.connect('test-container');
    
    // Send malformed JSON
    const malformedMessages = [
      'invalid-json',
      '{"incomplete": ',
      '{"id": 1, "message":}',
      '[[{"malformed": true}',
      'null-message'
    ];
    
    for (const malformed of malformedMessages) {
      mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1]({ data: malformed });
    }
    
    // Should handle all malformed messages gracefully
    expect(errorHandler).toHaveBeenCalledTimes(malformedMessages.length);
    expect(messageHandler).not.toHaveBeenCalled();
    
    // Subsequent valid messages should work
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1]({
        data: JSON.stringify({ id: 1, message: 'Valid message' })
      });
    
    expect(messageHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Valid message' })
    );
  });

  test('validates log entry structure', async () => {
    const logValidator = new LogEntryValidator();
    
    const invalidLogs = [
      {}, // Missing required fields
      { id: 1 }, // Missing message
      { message: 'test' }, // Missing timestamp
      { id: 'invalid', message: 'test', timestamp: 'invalid' }, // Wrong types
      { id: 1, message: null, timestamp: Date.now() }, // Null message
      { id: 1, message: 'test', timestamp: Date.now(), level: 'invalid' } // Invalid level
    ];
    
    const validationErrors = [];
    
    for (const log of invalidLogs) {
      const result = logValidator.validate(log);
      if (!result.valid) {
        validationErrors.push(result.errors);
      }
    }
    
    expect(validationErrors).toHaveLength(invalidLogs.length);
    
    // Test valid log passes validation
    const validLog = {
      id: 1,
      message: 'Valid log message',
      timestamp: Date.now(),
      level: 'info',
      stream: 'stdout'
    };
    
    const validResult = logValidator.validate(validLog);
    expect(validResult.valid).toBe(true);
  });
});
```

### 5.3 API Error Handling

```javascript
// /dashboard/tests/errorScenarios/apiErrors.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('API Error Handling', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      // Default to server error for testing
      return res(ctx.status(500), ctx.json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR' 
      }));
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('handles 404 container not found errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ 
          error: 'Container not found',
          code: 'CONTAINER_NOT_FOUND' 
        }));
      })
    );
    
    const { render } = await import('@testing-library/react');
    const errorBoundaryHandler = jest.fn();
    
    render(
      <ErrorBoundary onError={errorBoundaryHandler}>
        <LogViewer containerId="nonexistent-container" />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Container not found/)).toBeInTheDocument();
    });
    
    expect(errorBoundaryHandler).not.toHaveBeenCalled(); // Should handle gracefully
  });

  test('handles rate limiting errors', async () => {
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(
          ctx.status(429), 
          ctx.set('Retry-After', '60'),
          ctx.json({ 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED' 
          })
        );
      })
    );
    
    const logApi = new LogApiClient();
    const rateLimitHandler = jest.fn();
    
    logApi.onRateLimit(rateLimitHandler);
    
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Rate limit exceeded');
    
    expect(rateLimitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
        code: 'RATE_LIMITED'
      })
    );
  });

  test('implements circuit breaker for repeated failures', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000
    });
    
    const logApi = new LogApiClient({ circuitBreaker });
    
    // Trigger circuit breaker with repeated failures
    for (let i = 0; i < 4; i++) {
      await expect(logApi.getLogs('test-container'))
        .rejects.toThrow();
    }
    
    // Should be in open state (failing fast)
    expect(circuitBreaker.getState()).toBe('open');
    
    // Next call should fail fast without API call
    const startTime = Date.now();
    await expect(logApi.getLogs('test-container'))
      .rejects.toThrow('Circuit breaker is open');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(10); // Failed fast
  });
});
```
```

### 3.2 Accessibility Testing

```javascript
// /dashboard/tests/e2e/accessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Log Viewer Accessibility', () => {
  test('meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Search input
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Level filter
    await expect(page.locator('[data-testid="level-filter-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Export button
    await expect(page.locator('[data-testid="export-button"]')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+f'); // Focus search
    await expect(page.locator('[data-testid="log-search-input"]')).toBeFocused();
  });

  test('provides screen reader compatible content', async ({ page }) => {
    await page.goto('/dashboard/logs/test-container');
    await page.waitForSelector('[data-testid="log-entry"]');
    
    // Check ARIA labels
    const searchInput = page.locator('[data-testid="log-search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search logs'));
    
    // Check log level announcements
    const errorLogs = page.locator('[data-testid="log-entry"][data-level="error"]').first();
    await expect(errorLogs).toHaveAttribute('aria-label', expect.stringContaining('Error level'));
    
    // Check live region for real-time updates
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
```

  test('handles connection drops and reconnects', async () => {
    const connectionSpy = jest.fn();
    const disconnectionSpy = jest.fn();
    
    connectionManager.on('connected', connectionSpy);
    connectionManager.on('disconnected', disconnectionSpy);
    
    // Initial connection
    await connectionManager.connect('test-container');
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    
    // Simulate connection drop
    mockEventSource.simulateError({ type: 'error' });
    expect(disconnectionSpy).toHaveBeenCalledTimes(1);
    
    // Wait for automatic reconnection
    await waitFor(() => {
      expect(connectionSpy).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  test('implements exponential backoff for reconnection', async () => {
    const reconnectAttempts = [];
    connectionManager.on('reconnectAttempt', (attempt) => {
      reconnectAttempts.push({ attempt, timestamp: Date.now() });
    });
    
    // Force multiple connection failures
    for (let i = 0; i < 3; i++) {
      await connectionManager.connect('test-container');
      mockEventSource.simulateError({ type: 'error' });
    }
    
    // Verify exponential backoff
    expect(reconnectAttempts.length).toBe(3);
    const delays = reconnectAttempts.slice(1).map((attempt, index) => 
      attempt.timestamp - reconnectAttempts[index].timestamp
    );
    
    // Each delay should be longer than the previous (exponential backoff)
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  test('handles browser tab visibility changes', async () => {
    const visibilityHandler = jest.fn();
    connectionManager.on('visibilityChange', visibilityHandler);
    
    // Simulate tab going hidden (user switches tabs)
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: true });
    
    // Simulate tab becoming visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    
    expect(visibilityHandler).toHaveBeenCalledWith({ hidden: false });
  });

  test('handles server-sent heartbeat messages', async () => {
    const heartbeatHandler = jest.fn();
    connectionManager.on('heartbeat', heartbeatHandler);
    
    // Simulate heartbeat event
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'heartbeat')?.[1]({ 
        data: JSON.stringify({ timestamp: Date.now() })
      });
    
    expect(heartbeatHandler).toHaveBeenCalled();
  });

  test('maintains connection state during rapid reconnections', async () => {
    const stateChanges = [];
    connectionManager.on('stateChange', (state) => stateChanges.push(state));
    
    // Rapid connection changes
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    await connectionManager.connect('test-container');
    mockEventSource.simulateError({ type: 'error' });
    
    // Should have proper state transitions
    expect(stateChanges).toContain('connecting');
    expect(stateChanges).toContain('connected');
    expect(stateChanges).toContain('disconnected');
    expect(stateChanges).toContain('reconnecting');
  });

  test('implements connection pooling for multiple containers', async () => {
    const containers = ['container-1', 'container-2', 'container-3'];
    const connections = [];
    
    // Connect to multiple containers
    for (const container of containers) {
      const connection = await connectionManager.connect(container);
      connections.push(connection);
    }
    
    // Verify all connections are active
    expect(connections).toHaveLength(3);
    expect(connections.every(conn => conn.isConnected())).toBe(true);
    
    // Verify connection pooling limits
    const poolStats = connectionManager.getPoolStats();
    expect(poolStats.active).toBe(3);
    expect(poolStats.max).toBeGreaterThanOrEqual(3);
  });
});
```

### 2.4 Data Flow Integration Testing

```javascript
// /dashboard/tests/integration/dataFlow.test.js
describe('Log Data Flow Integration', () => {
  test('maintains data consistency through streaming', async () => {
    const dataStore = new LogDataStore();
    const streamer = new LogStreamingService();
    
    // Track data flow
    const receivedLogs = [];
    streamer.onMessage((log) => {
      dataStore.addLog(log);
      receivedLogs.push(log);
    });
    
    await streamer.connect('test-container');
    
    // Simulate log sequence
    const logSequence = [
      { id: 1, message: 'Log 1', timestamp: Date.now() },
      { id: 2, message: 'Log 2', timestamp: Date.now() + 1000 },
      { id: 3, message: 'Log 3', timestamp: Date.now() + 2000 }
    ];
    
    for (const log of logSequence) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => receivedLogs.length === 3);
    
    // Verify data consistency
    expect(dataStore.getLogs()).toHaveLength(3);
    expect(dataStore.getLogs().map(l => l.id)).toEqual([1, 2, 3]);
    expect(receivedLogs.map(l => l.message)).toEqual(['Log 1', 'Log 2', 'Log 3']);
  });

  test('handles out-of-order log delivery', async () => {
    const dataStore = new LogDataStore({ sortByTimestamp: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send logs out of order
    const logs = [
      { id: 3, message: 'Third log', timestamp: Date.now() + 2000 },
      { id: 1, message: 'First log', timestamp: Date.now() },
      { id: 2, message: 'Second log', timestamp: Date.now() + 1000 }
    ];
    
    for (const log of logs) {
      mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    }
    
    await waitFor(() => dataStore.getLogs().length === 3);
    
    // Verify proper ordering
    const sortedLogs = dataStore.getLogs();
    expect(sortedLogs.map(l => l.id)).toEqual([1, 2, 3]);
  });

  test('handles duplicate log prevention', async () => {
    const dataStore = new LogDataStore({ preventDuplicates: true });
    const streamer = new LogStreamingService();
    
    streamer.onMessage((log) => dataStore.addLog(log));
    await streamer.connect('test-container');
    
    // Send duplicate logs
    const log = { id: 1, message: 'Duplicate log', timestamp: Date.now() };
    
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    mockEventSource.simulateMessage({ data: JSON.stringify(log) });
    
    await waitFor(() => dataStore.getLogs().length === 1);
    
    // Should only have one instance
    expect(dataStore.getLogs()).toHaveLength(1);
    expect(dataStore.getLogs()[0].id).toBe(1);
  });
});
```
  });

  test('handles network connectivity changes', async () => {
    const networkHandler = jest.fn();
    connectionManager.on('networkChange', networkHandler);
    
    // Simulate network offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: false });
    
    // Simulate network back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    expect(networkHandler).toHaveBeenCalledWith({ online: true });
  });
});
```
/dashboard/tests/
├── __mocks__/              # Mocks and test doubles
├── __fixtures__/           # Test data fixtures
├── unit/                   # Component unit tests
├── integration/            # API integration tests
├── e2e/                    # End-to-end UI tests
├── performance/            # Performance benchmarks
└── utils/                  # Testing utilities
```

### Testing Stack Integration
- **Framework**: Jest with React Testing Library
- **UI Testing**: Playwright for E2E tests
- **Performance**: Lighthouse CI + Custom metrics
- **Coverage**: Istanbul with >70% threshold
- **Mocking**: MSW for API mocking, EventSource mocks for SSE

## 1. Unit Testing Strategy

### 1.1 React Components Testing

#### LogViewer Main Component
```javascript
// /dashboard/tests/unit/components/LogViewer.test.jsx
describe('LogViewer Component', () => {
  test('renders with initial loading state', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });

## 2. Integration Testing Strategy

### 2.1 SSE Connection Testing

#### Real-time Log Streaming
```javascript
// /dashboard/tests/integration/logStreaming.test.js
describe('Log Streaming Integration', () => {
  let mockEventSource;
  let logStreamingService;
  
  beforeEach(() => {
    // Mock EventSource for SSE testing
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    };
    
    global.EventSource = jest.fn(() => mockEventSource);
    logStreamingService = new LogStreamingService();
  });

  test('establishes SSE connection with correct headers', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    expect(global.EventSource).toHaveBeenCalledWith(
      '/api/logs/stream/test-container',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream'
        })
      })
    );
  });

  test('handles SSE message parsing correctly', () => {
    const mockHandler = jest.fn();
    logStreamingService.onMessage(mockHandler);
    
    // Simulate SSE message event
    const messageEvent = {
      type: 'message',
      data: JSON.stringify({
        id: '123',
        timestamp: Date.now(),
        level: 'info',
        message: 'Test log entry',
        stream: 'stdout'
      })
    };
    
    // Trigger the message handler
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](messageEvent);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      message: 'Test log entry'
    }));
  });

  test('handles malformed SSE messages gracefully', () => {
    const mockErrorHandler = jest.fn();
    const mockMessageHandler = jest.fn();
    
    logStreamingService.onError(mockErrorHandler);
    logStreamingService.onMessage(mockMessageHandler);
    
    // Send malformed JSON
    const malformedEvent = {
      type: 'message',
      data: 'invalid-json-{malformed'
    };
    
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](malformedEvent);
    
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parse_error',
        message: expect.stringContaining('Invalid JSON')
      })
    );
    expect(mockMessageHandler).not.toHaveBeenCalled();
  });

  test('implements proper connection lifecycle', async () => {
    const connection = await logStreamingService.connect('test-container');
    
    // Verify connection is established
    expect(connection.isConnected()).toBe(true);
    
    // Simulate connection close
    mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'close')[1]({ type: 'close' });
    
    expect(connection.isConnected()).toBe(false);
    
    // Cleanup
    await connection.disconnect();
    expect(mockEventSource.close).toHaveBeenCalled();
  });

  test('handles server-sent events with different event types', () => {
    const handlers = {
      log: jest.fn(),
      status: jest.fn(),
      error: jest.fn()
    };
    
    Object.entries(handlers).forEach(([type, handler]) => {
      logStreamingService.on(type, handler);
    });
    
    // Test different event types
    const events = [
      { type: 'log', data: JSON.stringify({ message: 'Log entry' }) },
      { type: 'status', data: JSON.stringify({ connected: true }) },
      { type: 'error', data: JSON.stringify({ error: 'Connection lost' }) }
    ];
    
    events.forEach(event => {
      const handler = mockEventSource.addEventListener.mock.calls
        .find(call => call[0] === event.type)?.[1];
      if (handler) handler(event);
    });
    
    expect(handlers.log).toHaveBeenCalledWith({ message: 'Log entry' });
    expect(handlers.status).toHaveBeenCalledWith({ connected: true });
    expect(handlers.error).toHaveBeenCalledWith({ error: 'Connection lost' });
  });
});
```

### 2.2 API Endpoints Testing

#### Log Fetching API
```javascript
// /dashboard/tests/integration/logApi.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

describe('Log API Integration', () => {
  const server = setupServer(
    rest.get('/api/logs/:containerId', (req, res, ctx) => {
      const { containerId } = req.params;
      const { limit, level, search, since, until } = req.url.searchParams;
      
      // Mock response based on query parameters
      const mockLogs = generateMockLogs({
        containerId,
        limit: parseInt(limit) || 100,
        level,
        search,
        since,
        until
      });
      
      return res(ctx.json({
        logs: mockLogs,
        total: mockLogs.length,
        hasMore: mockLogs.length >= (parseInt(limit) || 100)
      }));
    }),
    
    rest.get('/api/logs/:containerId/search', (req, res, ctx) => {
      const { containerId } = req.params;
      const { q, limit, facets } = req.url.searchParams;
      
      const searchResults = performMockSearch({
        containerId,
        query: q,
        limit: parseInt(limit) || 100,
        includeFacets: facets === 'true'
      });
      
      return res(ctx.json(searchResults));
    }),
    
    rest.post('/api/logs/:containerId/export', (req, res, ctx) => {
      const { containerId } = req.params;
      const { format, filters } = req.body;
      
      const exportData = generateMockExport(containerId, format, filters);
      
      return res(
        ctx.set('Content-Type', getContentType(format)),
        ctx.set('Content-Disposition', `attachment; filename=${containerId}_logs.${format}`),
        ctx.text(exportData)
      );
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('fetches logs with pagination', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      limit: 50,
      offset: 0
    });
    
    expect(response.logs).toHaveLength(50);
    expect(response.total).toBeGreaterThanOrEqual(50);
    expect(response.hasMore).toBeDefined();
  });

  test('applies filters correctly', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.getLogs('test-container', {
      level: 'error',
      since: new Date('2025-08-07T00:00:00Z').toISOString()
    });
    
    expect(response.logs.every(log => log.level === 'error')).toBe(true);
    expect(response.logs.every(log => 
      new Date(log.timestamp) >= new Date('2025-08-07T00:00:00Z')
    )).toBe(true);
  });

  test('handles search queries with facets', async () => {
    const logApi = new LogApiClient();
    const response = await logApi.searchLogs('test-container', {
      query: 'database error',
      includeFacets: true
    });
    
    expect(response.results).toBeDefined();
    expect(response.facets).toBeDefined();
    expect(response.facets.levels).toBeDefined();
    expect(response.facets.timeRanges).toBeDefined();
  });

  test('exports logs in different formats', async () => {
    const logApi = new LogApiClient();
    
    // Test JSON export
    const jsonExport = await logApi.exportLogs('test-container', {
      format: 'json',
      filters: { level: 'error' }
    });
    
    expect(jsonExport.headers.get('content-type')).toContain('application/json');
    const jsonData = JSON.parse(await jsonExport.text());
    expect(Array.isArray(jsonData)).toBe(true);
    
    // Test CSV export
    const csvExport = await logApi.exportLogs('test-container', {
      format: 'csv'
    });
    
    expect(csvExport.headers.get('content-type')).toContain('text/csv');
    const csvText = await csvExport.text();
    expect(csvText).toContain('Timestamp,Level,Stream,Message');
  });

  test('handles API error responses gracefully', async () => {
    // Mock server error
    server.use(
      rest.get('/api/logs/:containerId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );
    
    const logApi = new LogApiClient();
    
    await expect(logApi.getLogs('test-container')).rejects.toThrow(
      expect.objectContaining({
        status: 500,
        message: expect.stringContaining('Internal server error')
      })
    );
  });
});
```

  test('handles empty log state correctly', () => {
    render(<LogViewer containerId="test-container" />);
    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  test('displays logs with proper formatting', () => {
    const mockLogs = [
      { id: 1, timestamp: Date.now(), level: 'info', message: 'Test log' }
    ];
    render(<LogViewer containerId="test-container" initialLogs={mockLogs} />);
    expect(screen.getByText('Test log')).toBeInTheDocument();
  });

  test('applies level-based styling', () => {
    const errorLog = { level: 'error', message: 'Error occurred' };
    render(<LogViewer logs={[errorLog]} />);
    const logElement = screen.getByText('Error occurred');
    expect(logElement).toHaveClass('log-level-error');
  });
});
```

#### Log Search Component
```javascript
// /dashboard/tests/unit/components/LogSearch.test.jsx
describe('LogSearch Component', () => {
  test('updates search query on input change', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    expect(onSearch).toHaveBeenCalledWith('error');
  });

  test('handles advanced search syntax', () => {
    const onSearch = jest.fn();
    render(<LogSearch onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'level:error database' } });
    
    expect(onSearch).toHaveBeenCalledWith('level:error database');
  });

  test('provides search suggestions', () => {
    render(<LogSearch suggestions={['error', 'warning', 'database']} />);
    
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'err' } });
    
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
```

#### Log Level Filter Component
```javascript
// /dashboard/tests/unit/components/LogLevelFilter.test.jsx
describe('LogLevelFilter Component', () => {
  test('renders all log levels as options', () => {
    render(<LogLevelFilter onFilterChange={jest.fn()} />);
    
    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  test('calls onFilterChange when level selected', () => {
    const onFilterChange = jest.fn();
    render(<LogLevelFilter onFilterChange={onFilterChange} />);
    
    fireEvent.click(screen.getByText('Error'));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });
});
```

### 1.2 Custom Hooks Testing

#### useLogStream Hook
```javascript
// /dashboard/tests/unit/hooks/useLogStream.test.js
describe('useLogStream Hook', () => {
  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  test('establishes SSE connection when enabled', () => {
    const mockEventSource = jest.fn();
    global.EventSource = mockEventSource;
    
    renderHook(() => useLogStream('test-container', { enabled: true }));
    
    expect(mockEventSource).toHaveBeenCalledWith('/api/logs/stream/test-container');
  });

  test('handles incoming log messages', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      // Simulate SSE message
      const mockEvent = { data: JSON.stringify({ 
        id: 1, message: 'New log', level: 'info' 
      })};
      result.current.handleMessage(mockEvent);
    });
    
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('New log');
  });

  test('handles connection errors gracefully', () => {
    const { result } = renderHook(() => useLogStream('test-container'));
    
    act(() => {
      result.current.handleError({ type: 'error', message: 'Connection failed' });
    });
    
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.isConnected).toBe(false);
  });

  test('implements automatic reconnection on disconnect', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLogStream('test-container', { 
      autoReconnect: true, 
      reconnectDelay: 1000 
    }));
    
    act(() => {
      result.current.handleClose();
    });
    
    expect(result.current.reconnectAttempt).toBe(0);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.reconnectAttempt).toBe(1);
    jest.useRealTimers();
  });
});
```

#### useLogSearch Hook
```javascript
// /dashboard/tests/unit/hooks/useLogSearch.test.js
describe('useLogSearch Hook', () => {
  test('debounces search queries', async () => {
    jest.useFakeTimers();
    const mockSearchFn = jest.fn();
    
    const { result } = renderHook(() => useLogSearch(mockSearchFn, { debounce: 300 }));
    
    act(() => {
      result.current.search('first');
      result.current.search('second');
      result.current.search('final');
    });
    
    // Should not call immediately
    expect(mockSearchFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only call once with final query
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('final');
    
    jest.useRealTimers();
  });

  test('caches search results', () => {
    const { result } = renderHook(() => useLogSearch(jest.fn(), { 
      cacheEnabled: true 
    }));
    
    const mockResults = [{ id: 1, message: 'test' }];
    
    act(() => {
      result.current.setCachedResults('test-query', mockResults);
    });
    
    const cached = result.current.getCachedResults('test-query');
    expect(cached).toEqual(mockResults);
  });
});
```

### 1.3 Utility Functions Testing

```javascript
// /dashboard/tests/unit/utils/logUtils.test.js
describe('Log Utilities', () => {
  test('formatLogLevel applies correct styling', () => {
    expect(formatLogLevel('error')).toEqual({
      className: 'log-level-error',
      color: '#dc3545',
      icon: 'error'
    });
  });

  test('parseTimestamp formats correctly', () => {
    const timestamp = 1691234567890;
    const formatted = parseTimestamp(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('filterLogsByLevel returns correct subset', () => {
    const logs = [
      { level: 'info', message: 'Info log' },
      { level: 'error', message: 'Error log' },
      { level: 'warn', message: 'Warning log' }
    ];
    
    const filtered = filterLogsByLevel(logs, 'error');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Error log');
  });
});
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "test-strategy-analysis", "content": "Analyze existing testing infrastructure and React component requirements", "status": "completed"}, {"id": "unit-test-strategy", "content": "Define unit testing approach for React components and custom hooks", "status": "completed"}, {"id": "integration-test-strategy", "content": "Design integration testing for SSE connections and API endpoints", "status": "in_progress"}, {"id": "ui-test-strategy", "content": "Define UI testing for user interactions and component behaviors", "status": "pending"}, {"id": "performance-test-strategy", "content": "Design performance testing for streaming, search, and memory usage", "status": "pending"}, {"id": "error-scenario-testing", "content": "Plan error scenario testing (connection failures, API errors, malformed data)", "status": "pending"}, {"id": "test-data-strategy", "content": "Define test data strategy and mock setup requirements", "status": "pending"}, {"id": "automation-framework", "content": "Plan automation framework integration and CI/CD considerations", "status": "pending"}]