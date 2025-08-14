# Story 3.3: Container Metrics Visualization - Comprehensive Testing Strategy

**Story ID**: STORY-3.3  
**Feature**: Container Metrics Visualization for MCP Debug Host Platform  
**Created by**: Testing Strategy Sub-Agent  
**Date**: August 8, 2025  
**Version**: 1.0

## Executive Summary

This document outlines a comprehensive testing strategy for Story 3.3: Container Metrics Visualization, encompassing unit testing, integration testing, performance validation, and visual regression testing. The strategy is aligned with the project's quality gates of >80% coverage, <1s response time, and zero memory leaks.

---

## 1. Component Architecture Overview

### Core Components to Test

```
Container Metrics Visualization
├── MetricsCollector (Data Layer)
│   ├── DockerStatsAPI Integration
│   ├── Historical Data Aggregation
│   └── Real-time Metrics Streaming
├── ChartComponents (Presentation Layer)
│   ├── CPUUsageChart
│   ├── MemoryUsageChart
│   ├── NetworkIOChart
│   ├── DiskIOChart
│   └── ContainerHealthChart
├── AlertSystem (Notification Layer)
│   ├── ThresholdManager
│   ├── AlertGenerator
│   └── NotificationDispatcher
└── Dashboard Integration
    ├── MetricsContainer
    ├── TimeRangeSelector
    └── ProjectMetricsView
```

---

## 2. Comprehensive Test Plan

### 2.1 Unit Testing Strategy

#### Test Framework Configuration
```javascript
// dashboard/jest.config.js (Enhanced for Story 3.3)
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/metrics-setup.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/tests/__mocks__/$1'
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Component-specific thresholds for Story 3.3
    'src/components/MetricsVisualization/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/services/MetricsCollector/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/hooks/useContainerMetrics/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testTimeout: 15000, // Increased for metrics processing
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(d3|recharts|chart.js|other-es-modules)/)'
  ],
  // Memory leak detection for long-running charts
  detectLeaks: true,
  detectOpenHandles: true,
  // Performance monitoring
  verbose: process.env.CI === 'true'
};
```

#### Metrics-Specific Test Setup
```javascript
// dashboard/tests/metrics-setup.js
import 'jest-canvas-mock'; // For chart rendering tests
import { server } from './__mocks__/metrics-server';

// Mock performance.now for consistent timing tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB baseline
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
    }
  },
  writable: true
});

// Mock ResizeObserver for chart responsiveness
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver for chart visibility optimization
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Setup metrics API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllTimers();
});

afterAll(() => {
  server.close();
});

// Global metrics test utilities
global.metricsTestUtils = {
  // Generate realistic container metrics data
  generateContainerMetrics: (containerId, timeRange = 60000) => {
    const metrics = [];
    const now = Date.now();
    const interval = 1000; // 1 second intervals
    
    for (let i = timeRange; i >= 0; i -= interval) {
      metrics.push({
        timestamp: new Date(now - i).toISOString(),
        containerId,
        cpu: {
          usage: Math.random() * 80 + 10, // 10-90%
          systemUsage: Math.random() * 100
        },
        memory: {
          usage: Math.random() * 1024 * 1024 * 512, // Up to 512MB
          limit: 1024 * 1024 * 1024, // 1GB limit
          percent: Math.random() * 60 + 20 // 20-80%
        },
        network: {
          rxBytes: Math.floor(Math.random() * 10000),
          txBytes: Math.floor(Math.random() * 5000),
          rxPackets: Math.floor(Math.random() * 100),
          txPackets: Math.floor(Math.random() * 50)
        },
        disk: {
          readBytes: Math.floor(Math.random() * 50000),
          writeBytes: Math.floor(Math.random() * 20000),
          readOps: Math.floor(Math.random() * 100),
          writeOps: Math.floor(Math.random() * 50)
        },
        health: Math.random() > 0.1 ? 'healthy' : 'unhealthy'
      });
    }
    
    return metrics;
  },

  // Simulate high-frequency metrics for stress testing
  generateHighFrequencyMetrics: (containerId, count = 1000) => {
    return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(Date.now() - (count - i) * 100).toISOString(),
      containerId,
      cpu: { usage: Math.sin(i / 10) * 40 + 50 },
      memory: { 
        usage: Math.cos(i / 20) * 200 * 1024 * 1024 + 300 * 1024 * 1024,
        percent: Math.cos(i / 20) * 20 + 50
      }
    }));
  },

  // Memory usage tracking for tests
  measureMemoryUsage: (testFunction) => {
    const before = performance.memory.usedJSHeapSize;
    const result = testFunction();
    const after = performance.memory.usedJSHeapSize;
    
    return {
      result,
      memoryDelta: after - before,
      memoryBefore: before,
      memoryAfter: after
    };
  },

  // Chart rendering performance measurement
  measureChartRenderTime: async (renderFunction) => {
    const start = performance.now();
    const result = await renderFunction();
    const end = performance.now();
    
    return {
      result,
      renderTime: end - start
    };
  }
};
```

---

### 2.2 Test Cases by Component

#### 2.2.1 MetricsCollector Service Tests

```javascript
// tests/unit/services/MetricsCollector.test.js
describe('MetricsCollector Service', () => {
  let metricsCollector;
  
  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  describe('Data Collection', () => {
    test('should collect real-time container metrics', async () => {
      const containerId = 'test-container-123';
      const metrics = await metricsCollector.collect(containerId);
      
      expect(metrics).toMatchObject({
        timestamp: expect.any(String),
        containerId,
        cpu: expect.objectContaining({
          usage: expect.any(Number),
          systemUsage: expect.any(Number)
        }),
        memory: expect.objectContaining({
          usage: expect.any(Number),
          limit: expect.any(Number),
          percent: expect.any(Number)
        }),
        network: expect.objectContaining({
          rxBytes: expect.any(Number),
          txBytes: expect.any(Number)
        }),
        disk: expect.objectContaining({
          readBytes: expect.any(Number),
          writeBytes: expect.any(Number)
        })
      });
    });

    test('should handle collection failures gracefully', async () => {
      const invalidContainerId = 'non-existent-container';
      
      await expect(
        metricsCollector.collect(invalidContainerId)
      ).rejects.toThrow('Container not found');
    });

    test('should batch collect metrics for multiple containers', async () => {
      const containerIds = ['container-1', 'container-2', 'container-3'];
      const startTime = performance.now();
      
      const results = await metricsCollector.batchCollect(containerIds);
      const endTime = performance.now();
      
      expect(results).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(2000); // Batch should be faster
      
      results.forEach((result, index) => {
        expect(result.containerId).toBe(containerIds[index]);
      });
    });
  });

  describe('Data Aggregation', () => {
    test('should aggregate historical metrics correctly', () => {
      const rawMetrics = global.metricsTestUtils.generateContainerMetrics('test', 300000);
      const aggregated = metricsCollector.aggregate(rawMetrics, '5m');
      
      expect(aggregated.length).toBeLessThan(rawMetrics.length);
      expect(aggregated[0]).toMatchObject({
        timestamp: expect.any(String),
        cpu: expect.objectContaining({
          avg: expect.any(Number),
          min: expect.any(Number),
          max: expect.any(Number)
        }),
        memory: expect.objectContaining({
          avg: expect.any(Number),
          min: expect.any(Number),
          max: expect.any(Number)
        })
      });
    });

    test('should handle empty metrics arrays', () => {
      const result = metricsCollector.aggregate([], '1m');
      expect(result).toEqual([]);
    });

    test('should validate aggregation intervals', () => {
      const metrics = global.metricsTestUtils.generateContainerMetrics('test');
      
      expect(() => {
        metricsCollector.aggregate(metrics, '30s');
      }).toThrow('Invalid aggregation interval');
    });
  });

  describe('Performance Requirements', () => {
    test('should collect metrics within 500ms', async () => {
      const startTime = performance.now();
      await metricsCollector.collect('test-container');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should handle high-frequency data without memory leaks', () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      const metrics = global.metricsTestUtils.generateHighFrequencyMetrics('test', 10000);
      
      // Process metrics
      metricsCollector.processMetrics(metrics);
      
      // Force garbage collection (in test environment)
      global.gc?.();
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });
});
```

#### 2.2.2 Chart Component Tests

```javascript
// tests/unit/components/CPUUsageChart.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { CPUUsageChart } from '@/components/MetricsVisualization/CPUUsageChart';

describe('CPUUsageChart Component', () => {
  const mockMetrics = global.metricsTestUtils.generateContainerMetrics('test-container');

  test('should render chart with provided metrics', async () => {
    render(<CPUUsageChart metrics={mockMetrics} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('cpu-usage-chart')).toBeInTheDocument();
    });

    // Verify chart elements
    expect(screen.getByText(/CPU Usage/i)).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  test('should handle real-time updates efficiently', async () => {
    const { rerender } = render(<CPUUsageChart metrics={mockMetrics.slice(0, 10)} />);
    
    const startTime = performance.now();
    
    // Simulate real-time updates
    for (let i = 11; i <= 20; i++) {
      rerender(<CPUUsageChart metrics={mockMetrics.slice(0, i)} />);
      await waitFor(() => {}, { timeout: 100 });
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should update within 1s
  });

  test('should display loading state appropriately', () => {
    render(<CPUUsageChart metrics={[]} loading={true} />);
    
    expect(screen.getByTestId('chart-loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Loading metrics/i)).toBeInTheDocument();
  });

  test('should handle error states gracefully', () => {
    render(<CPUUsageChart metrics={[]} error="Failed to load metrics" />);
    
    expect(screen.getByTestId('chart-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load metrics/i)).toBeInTheDocument();
  });

  test('should be responsive to container resize', async () => {
    const { container } = render(<CPUUsageChart metrics={mockMetrics} />);
    
    // Simulate container resize
    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    Object.defineProperty(chartContainer, 'offsetWidth', { value: 800 });
    Object.defineProperty(chartContainer, 'offsetHeight', { value: 400 });
    
    // Trigger resize
    global.ResizeObserver.mockImplementation((callback) => {
      callback([{
        target: chartContainer,
        contentRect: { width: 800, height: 400 }
      }]);
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
    });
    
    await waitFor(() => {
      expect(chartContainer).toHaveAttribute('data-chart-width', '800');
    });
  });

  test('should optimize performance for large datasets', () => {
    const largeDataset = global.metricsTestUtils.generateHighFrequencyMetrics('test', 5000);
    
    const { renderTime } = global.metricsTestUtils.measureChartRenderTime(() => {
      render(<CPUUsageChart metrics={largeDataset} />);
    });
    
    expect(renderTime).toBeLessThan(2000); // Should render within 2s
  });

  test('should implement proper accessibility attributes', () => {
    render(<CPUUsageChart metrics={mockMetrics} />);
    
    const chart = screen.getByTestId('cpu-usage-chart');
    expect(chart).toHaveAttribute('role', 'img');
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('CPU usage chart'));
    
    // Check for data table alternative
    expect(screen.getByTestId('chart-data-table')).toBeInTheDocument();
  });
});
```

#### 2.2.3 Alert System Tests

```javascript
// tests/unit/services/AlertSystem.test.js
describe('AlertSystem Service', () => {
  let alertSystem;
  
  beforeEach(() => {
    alertSystem = new AlertSystem();
  });

  describe('Threshold Management', () => {
    test('should set and validate threshold configurations', () => {
      const thresholds = {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 }
      };
      
      alertSystem.setThresholds(thresholds);
      const retrieved = alertSystem.getThresholds();
      
      expect(retrieved).toEqual(thresholds);
    });

    test('should validate threshold ranges', () => {
      expect(() => {
        alertSystem.setThresholds({
          cpu: { warning: 95, critical: 80 } // Invalid: warning > critical
        });
      }).toThrow('Warning threshold cannot exceed critical threshold');
    });
  });

  describe('Alert Generation', () => {
    beforeEach(() => {
      alertSystem.setThresholds({
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 }
      });
    });

    test('should generate alerts when thresholds are exceeded', () => {
      const highCpuMetrics = {
        containerId: 'test-container',
        cpu: { usage: 85 },
        memory: { percent: 75 },
        timestamp: new Date().toISOString()
      };
      
      const alerts = alertSystem.checkMetrics(highCpuMetrics);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'warning',
        metric: 'cpu',
        value: 85,
        threshold: 70,
        containerId: 'test-container'
      });
    });

    test('should generate critical alerts appropriately', () => {
      const criticalMetrics = {
        containerId: 'test-container',
        cpu: { usage: 95 },
        memory: { percent: 98 },
        timestamp: new Date().toISOString()
      };
      
      const alerts = alertSystem.checkMetrics(criticalMetrics);
      
      expect(alerts).toHaveLength(2);
      expect(alerts.some(a => a.type === 'critical' && a.metric === 'cpu')).toBe(true);
      expect(alerts.some(a => a.type === 'critical' && a.metric === 'memory')).toBe(true);
    });

    test('should implement alert debouncing', () => {
      const metrics = {
        containerId: 'test-container',
        cpu: { usage: 85 },
        timestamp: new Date().toISOString()
      };
      
      // First alert should be generated
      const firstAlerts = alertSystem.checkMetrics(metrics);
      expect(firstAlerts).toHaveLength(1);
      
      // Immediate repeat should be debounced
      const secondAlerts = alertSystem.checkMetrics(metrics);
      expect(secondAlerts).toHaveLength(0);
      
      // After debounce period, alert should be generated again
      jest.advanceTimersByTime(300000); // 5 minutes
      const thirdAlerts = alertSystem.checkMetrics(metrics);
      expect(thirdAlerts).toHaveLength(1);
    });
  });

  describe('Notification Dispatch', () => {
    test('should dispatch notifications to registered handlers', () => {
      const mockHandler = jest.fn();
      alertSystem.addNotificationHandler('test-handler', mockHandler);
      
      const alert = {
        type: 'warning',
        metric: 'cpu',
        value: 85,
        containerId: 'test-container'
      };
      
      alertSystem.dispatch(alert);
      
      expect(mockHandler).toHaveBeenCalledWith(alert);
    });

    test('should handle notification failures gracefully', () => {
      const failingHandler = jest.fn().mockImplementation(() => {
        throw new Error('Notification failed');
      });
      
      const workingHandler = jest.fn();
      
      alertSystem.addNotificationHandler('failing', failingHandler);
      alertSystem.addNotificationHandler('working', workingHandler);
      
      const alert = { type: 'warning', metric: 'cpu' };
      
      expect(() => {
        alertSystem.dispatch(alert);
      }).not.toThrow();
      
      expect(workingHandler).toHaveBeenCalledWith(alert);
    });
  });
});
```

---

### 2.3 Integration Testing Strategy

#### 2.3.1 Metrics Flow Integration Tests

```javascript
// tests/integration/MetricsFlow.test.js
describe('Metrics Flow Integration', () => {
  test('should collect, process, and display metrics end-to-end', async () => {
    // Setup container
    const containerId = await createTestContainer();
    
    // Start metrics collection
    const metricsCollector = new MetricsCollector();
    await metricsCollector.startCollection(containerId);
    
    // Wait for initial metrics
    await waitFor(() => {
      expect(metricsCollector.hasMetrics(containerId)).toBe(true);
    }, { timeout: 5000 });
    
    // Render dashboard with metrics
    render(<ContainerDashboard containerId={containerId} />);
    
    // Verify charts are displayed
    await waitFor(() => {
      expect(screen.getByTestId('cpu-usage-chart')).toBeInTheDocument();
      expect(screen.getByTestId('memory-usage-chart')).toBeInTheDocument();
      expect(screen.getByTestId('network-io-chart')).toBeInTheDocument();
      expect(screen.getByTestId('disk-io-chart')).toBeInTheDocument();
    });
    
    // Cleanup
    await metricsCollector.stopCollection(containerId);
    await removeTestContainer(containerId);
  });

  test('should handle metrics collection failures gracefully', async () => {
    const nonExistentContainer = 'invalid-container-id';
    
    render(<ContainerDashboard containerId={nonExistentContainer} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Container not found/i)).toBeInTheDocument();
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  test('should maintain real-time updates across multiple charts', async () => {
    const containerId = await createTestContainer();
    
    render(<ContainerDashboard containerId={containerId} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('cpu-usage-chart')).toBeInTheDocument();
    });
    
    // Simulate container load to generate metrics changes
    await generateContainerLoad(containerId);
    
    // Verify all charts update within reasonable time
    await waitFor(() => {
      const cpuChart = screen.getByTestId('cpu-usage-chart');
      const memoryChart = screen.getByTestId('memory-usage-chart');
      
      expect(cpuChart).toHaveAttribute('data-last-update');
      expect(memoryChart).toHaveAttribute('data-last-update');
    }, { timeout: 10000 });
    
    await removeTestContainer(containerId);
  });
});
```

#### 2.3.2 Alert System Integration Tests

```javascript
// tests/integration/AlertSystemIntegration.test.js
describe('Alert System Integration', () => {
  test('should trigger alerts and update UI when thresholds exceeded', async () => {
    const containerId = await createHighLoadContainer();
    
    render(
      <ContainerDashboard containerId={containerId}>
        <AlertDisplay />
      </ContainerDashboard>
    );
    
    // Wait for high resource usage to trigger alerts
    await waitFor(() => {
      expect(screen.getByTestId('alert-notification')).toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Verify alert details
    const alert = screen.getByTestId('alert-notification');
    expect(alert).toHaveTextContent(/CPU usage/i);
    expect(alert).toHaveTextContent(/warning|critical/i);
    
    await removeTestContainer(containerId);
  });

  test('should persist alert history across page refreshes', async () => {
    // Generate alerts
    const containerId = await createHighLoadContainer();
    render(<ContainerDashboard containerId={containerId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('alert-notification')).toBeInTheDocument();
    });
    
    // Simulate page refresh
    render(<ContainerDashboard containerId={containerId} />);
    
    // Navigate to alert history
    fireEvent.click(screen.getByTestId('alert-history-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('alert-history-list')).toBeInTheDocument();
      expect(screen.getByText(/CPU usage/i)).toBeInTheDocument();
    });
    
    await removeTestContainer(containerId);
  });
});
```

---

### 2.4 Performance Testing Strategy

#### 2.4.1 Chart Rendering Performance

```javascript
// tests/performance/ChartPerformance.test.js
describe('Chart Rendering Performance', () => {
  test('should render charts within performance budget', async () => {
    const largeDataset = global.metricsTestUtils.generateHighFrequencyMetrics('test', 10000);
    
    const { renderTime, result } = await global.metricsTestUtils.measureChartRenderTime(
      () => render(<CPUUsageChart metrics={largeDataset} />)
    );
    
    expect(renderTime).toBeLessThan(1000); // 1 second budget
    expect(screen.getByTestId('cpu-usage-chart')).toBeInTheDocument();
  });

  test('should maintain smooth updates during real-time streaming', async () => {
    const initialMetrics = global.metricsTestUtils.generateContainerMetrics('test', 60000);
    const { rerender } = render(<CPUUsageChart metrics={initialMetrics} />);
    
    const updateTimes = [];
    
    // Simulate 30 real-time updates
    for (let i = 0; i < 30; i++) {
      const newMetric = global.metricsTestUtils.generateContainerMetrics('test', 1000)[0];
      const updatedMetrics = [...initialMetrics, newMetric];
      
      const startTime = performance.now();
      rerender(<CPUUsageChart metrics={updatedMetrics} />);
      await waitFor(() => {}, { timeout: 100 });
      const endTime = performance.now();
      
      updateTimes.push(endTime - startTime);
    }
    
    const averageUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
    expect(averageUpdateTime).toBeLessThan(50); // 50ms per update
    
    const maxUpdateTime = Math.max(...updateTimes);
    expect(maxUpdateTime).toBeLessThan(200); // No update should take longer than 200ms
  });

  test('should handle memory efficiently with continuous updates', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    const metrics = global.metricsTestUtils.generateContainerMetrics('test', 10000);
    
    const { rerender } = render(<CPUUsageChart metrics={metrics.slice(0, 100)} />);
    
    // Simulate continuous updates for 5 minutes (300 updates)
    for (let i = 100; i < 400; i++) {
      rerender(<CPUUsageChart metrics={metrics.slice(i - 100, i)} />);
      
      if (i % 50 === 0) {
        // Check memory every 50 updates
        const currentMemory = performance.memory.usedJSHeapSize;
        const memoryGrowth = currentMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
      }
    }
  });
});
```

#### 2.4.2 Data Processing Performance

```javascript
// tests/performance/DataProcessingPerformance.test.js
describe('Data Processing Performance', () => {
  test('should aggregate large datasets within time constraints', () => {
    const largeDataset = global.metricsTestUtils.generateContainerMetrics('test', 3600000); // 1 hour of data
    const metricsCollector = new MetricsCollector();
    
    const startTime = performance.now();
    const aggregated = metricsCollector.aggregate(largeDataset, '5m');
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(2000); // 2 second budget
    expect(aggregated.length).toBeLessThan(largeDataset.length);
    expect(aggregated.length).toBeGreaterThan(0);
  });

  test('should handle concurrent metrics processing efficiently', async () => {
    const containerIds = Array.from({ length: 10 }, (_, i) => `container-${i}`);
    const metricsCollector = new MetricsCollector();
    
    const startTime = performance.now();
    
    const promises = containerIds.map(id => 
      metricsCollector.collect(id).catch(() => null) // Handle failures gracefully
    );
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(5000); // 5 second budget for 10 containers
    expect(results.filter(r => r !== null)).toHaveLength(containerIds.length);
  });
});
```

---

### 2.5 Visual Regression Testing

#### 2.5.1 Playwright Visual Testing Configuration

```javascript
// tests/visual/MetricsVisualTests.spec.js
import { test, expect } from '@playwright/test';

test.describe('Metrics Visualization Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup consistent test data
    await page.route('**/api/metrics/**', async route => {
      const mockMetrics = generateConsistentMetrics();
      await route.fulfill({ json: mockMetrics });
    });
    
    await page.goto('/dashboard/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should maintain consistent chart layouts across screen sizes', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toHaveScreenshot('metrics-desktop.png');
    
    // Tablet view
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toHaveScreenshot('metrics-tablet.png');
    
    // Mobile view (if supported)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toHaveScreenshot('metrics-mobile.png');
  });

  test('should render charts with consistent styling', async ({ page }) => {
    await expect(page.locator('[data-testid="cpu-usage-chart"]')).toHaveScreenshot('cpu-chart.png');
    await expect(page.locator('[data-testid="memory-usage-chart"]')).toHaveScreenshot('memory-chart.png');
    await expect(page.locator('[data-testid="network-io-chart"]')).toHaveScreenshot('network-chart.png');
    await expect(page.locator('[data-testid="disk-io-chart"]')).toHaveScreenshot('disk-chart.png');
  });

  test('should display alerts with proper visual hierarchy', async ({ page }) => {
    // Trigger alert state
    await page.route('**/api/metrics/**', async route => {
      const alertMetrics = generateHighUsageMetrics();
      await route.fulfill({ json: alertMetrics });
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="alert-notification"]');
    
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toHaveScreenshot('metrics-with-alerts.png');
  });

  test('should handle dark theme consistently', async ({ page }) => {
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
    
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toHaveScreenshot('metrics-dark-theme.png');
  });
});
```

---

### 2.6 Data Validation Testing

#### 2.6.1 Data Accuracy Tests

```javascript
// tests/integration/DataValidation.test.js
describe('Metrics Data Validation', () => {
  test('should validate data integrity through collection pipeline', async () => {
    const containerId = await createTestContainer();
    const metricsCollector = new MetricsCollector();
    
    // Collect raw metrics
    const rawMetrics = await metricsCollector.collect(containerId);
    
    // Validate data structure
    expect(rawMetrics).toMatchSchema({
      type: 'object',
      required: ['timestamp', 'containerId', 'cpu', 'memory', 'network', 'disk'],
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        containerId: { type: 'string' },
        cpu: {
          type: 'object',
          required: ['usage', 'systemUsage'],
          properties: {
            usage: { type: 'number', minimum: 0, maximum: 100 },
            systemUsage: { type: 'number', minimum: 0 }
          }
        },
        memory: {
          type: 'object',
          required: ['usage', 'limit', 'percent'],
          properties: {
            usage: { type: 'number', minimum: 0 },
            limit: { type: 'number', minimum: 0 },
            percent: { type: 'number', minimum: 0, maximum: 100 }
          }
        }
      }
    });
    
    // Validate data consistency
    expect(rawMetrics.memory.percent).toBeCloseTo(
      (rawMetrics.memory.usage / rawMetrics.memory.limit) * 100,
      1
    );
    
    await removeTestContainer(containerId);
  });

  test('should handle edge cases in metric values', () => {
    const edgeCases = [
      { cpu: { usage: 0 }, memory: { usage: 0, percent: 0 } }, // Zero usage
      { cpu: { usage: 100 }, memory: { usage: 1073741824, percent: 100 } }, // Max usage
      { cpu: { usage: 50.123456 }, memory: { percent: 33.987654 } } // High precision
    ];
    
    edgeCases.forEach((metrics, index) => {
      const chart = render(<CPUUsageChart metrics={[{ ...metrics, timestamp: new Date().toISOString() }]} />);
      expect(chart.container).toBeInTheDocument();
    });
  });
});
```

---

### 2.7 E2E Testing with Playwright

#### 2.7.1 Complete User Workflows

```javascript
// tests/e2e/MetricsWorkflows.spec.js
import { test, expect } from '@playwright/test';

test.describe('Container Metrics Visualization E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('complete metrics monitoring workflow', async ({ page }) => {
    // Navigate to container metrics
    await page.click('[data-testid="container-list-item"]:first-child');
    await page.click('[data-testid="metrics-tab"]');
    
    // Verify all charts load
    await expect(page.locator('[data-testid="cpu-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-io-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="disk-io-chart"]')).toBeVisible();
    
    // Test time range selection
    await page.click('[data-testid="time-range-selector"]');
    await page.click('[data-testid="time-range-1h"]');
    
    // Verify charts update with new time range
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-loading"]')).toBeHidden({ timeout: 10000 });
    
    // Test alert configuration
    await page.click('[data-testid="alert-config-button"]');
    await page.fill('[data-testid="cpu-warning-threshold"]', '70');
    await page.fill('[data-testid="cpu-critical-threshold"]', '90');
    await page.click('[data-testid="save-thresholds"]');
    
    // Verify alert configuration saved
    await expect(page.locator('[data-testid="alert-config-success"]')).toBeVisible();
    
    // Test export functionality
    await page.click('[data-testid="export-metrics-button"]');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-csv"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/metrics.*\.csv$/);
  });

  test('real-time updates and performance monitoring', async ({ page }) => {
    await page.goto('/dashboard/metrics/test-container');
    
    // Monitor for real-time updates
    let updateCount = 0;
    page.on('response', response => {
      if (response.url().includes('/metrics/stream')) {
        updateCount++;
      }
    });
    
    // Wait for several updates
    await page.waitForTimeout(10000);
    expect(updateCount).toBeGreaterThan(5);
    
    // Verify no performance issues
    const performanceMetrics = await page.evaluate(() => ({
      memory: performance.memory.usedJSHeapSize,
      timing: performance.timing.loadEventEnd - performance.timing.navigationStart
    }));
    
    expect(performanceMetrics.memory).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    expect(performanceMetrics.timing).toBeLessThan(5000); // Less than 5 second load time
  });

  test('error handling and recovery', async ({ page }) => {
    // Start with working metrics
    await page.goto('/dashboard/metrics/test-container');
    await expect(page.locator('[data-testid="cpu-usage-chart"]')).toBeVisible();
    
    // Simulate network failure
    await page.route('**/api/metrics/**', route => route.abort('connectionfailed'));
    
    // Verify error state
    await expect(page.locator('[data-testid="metrics-error"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Restore network and retry
    await page.unroute('**/api/metrics/**');
    await page.click('[data-testid="retry-button"]');
    
    // Verify recovery
    await expect(page.locator('[data-testid="cpu-usage-chart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="metrics-error"]')).toBeHidden();
  });
});
```

---

### 2.8 Accessibility Testing

#### 2.8.1 Automated Accessibility Tests

```javascript
// tests/accessibility/MetricsAccessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Metrics Accessibility', () => {
  test('should pass WCAG 2.1 AA compliance', async ({ page }) => {
    await page.goto('/dashboard/metrics/test-container');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/metrics/test-container');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Time range selector
    await expect(page.locator('[data-testid="time-range-selector"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Alert config button
    await expect(page.locator('[data-testid="alert-config-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Export button
    await expect(page.locator('[data-testid="export-metrics-button"]')).toBeFocused();
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
  });

  test('should provide proper screen reader support', async ({ page }) => {
    await page.goto('/dashboard/metrics/test-container');
    
    // Check aria-labels and roles
    const cpuChart = page.locator('[data-testid="cpu-usage-chart"]');
    await expect(cpuChart).toHaveAttribute('role', 'img');
    await expect(cpuChart).toHaveAttribute('aria-label', /CPU usage chart/i);
    
    // Check data table alternative
    await expect(page.locator('[data-testid="chart-data-table"]')).toHaveAttribute('aria-hidden', 'true');
    
    // Test screen reader mode toggle
    await page.click('[data-testid="sr-mode-toggle"]');
    await expect(page.locator('[data-testid="chart-data-table"]')).toHaveAttribute('aria-hidden', 'false');
  });
});
```

---

## 3. Quality Gates and Success Criteria

### 3.1 Test Coverage Requirements

| Component | Unit Test Coverage | Integration Coverage | E2E Coverage |
|-----------|-------------------|---------------------|--------------|
| MetricsCollector | >90% | >80% | Critical paths |
| Chart Components | >85% | >70% | User interactions |
| Alert System | >90% | >85% | Alert workflows |
| Dashboard Integration | >80% | >90% | Complete workflows |

### 3.2 Performance Benchmarks

| Metric | Target | Maximum | Test Method |
|--------|--------|---------|-------------|
| Chart Render Time | <500ms | <1s | Performance timing API |
| Real-time Update Latency | <200ms | <500ms | WebSocket timing |
| Memory Usage (8h session) | <100MB | <200MB | Chrome DevTools |
| Data Processing Time | <1s per 1000 points | <3s | Synthetic benchmarks |
| API Response Time | <300ms | <1s | Network timing |

### 3.3 Quality Assurance Checklist

#### Pre-deployment Checklist
- [ ] All unit tests passing with >80% coverage
- [ ] Integration tests covering critical data flows
- [ ] Performance tests meeting benchmark requirements
- [ ] Visual regression tests passing
- [ ] Accessibility tests passing WCAG 2.1 AA
- [ ] Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness tested (tablet and up)
- [ ] Error handling scenarios validated
- [ ] Memory leak testing completed
- [ ] Security testing for data sanitization

#### Monitoring and Alerting Setup
- [ ] Performance monitoring dashboards configured
- [ ] Error rate alerting implemented
- [ ] Memory usage monitoring active
- [ ] API response time tracking enabled
- [ ] User experience metrics collection setup

---

## 4. Test Execution Strategy

### 4.1 Development Testing Workflow

```bash
# Local development testing
npm run test:unit:watch          # Continuous unit testing
npm run test:integration:dev     # Integration tests with dev backend
npm run test:performance:local   # Performance benchmarking
npm run test:accessibility:dev   # A11y testing in development
```

### 4.2 CI/CD Pipeline Integration

```yaml
# Enhanced GitHub Actions workflow for Story 3.3
name: Story 3.3 - Container Metrics Testing

on:
  push:
    paths: ['dashboard/src/components/MetricsVisualization/**']
  pull_request:
    paths: ['dashboard/src/components/MetricsVisualization/**']

jobs:
  metrics-unit-tests:
    name: Metrics Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd dashboard && npm ci
      
      - name: Run metrics unit tests
        run: cd dashboard && npm run test:metrics:unit
        env:
          CI: true
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: dashboard/coverage/lcov.info

  metrics-performance-tests:
    name: Metrics Performance Tests
    runs-on: ubuntu-latest
    steps:
      - name: Run performance benchmarks
        run: cd dashboard && npm run test:performance:metrics
      
      - name: Compare against baseline
        run: cd dashboard && npm run benchmark:compare:metrics
        if: github.event_name == 'pull_request'

  metrics-visual-tests:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    steps:
      - name: Install Playwright
        run: cd dashboard && npx playwright install
      
      - name: Run visual tests
        run: cd dashboard && npm run test:visual:metrics
      
      - name: Upload visual test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: visual-test-results
          path: dashboard/test-results/visual/

  quality-gates:
    name: Quality Gates
    needs: [metrics-unit-tests, metrics-performance-tests, metrics-visual-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Evaluate quality gates
        run: |
          echo "Checking quality gates for Story 3.3..."
          # Add quality gate validation logic
```

### 4.3 Monitoring and Continuous Improvement

#### Performance Regression Detection
- Automated performance baseline comparison
- Memory usage trend analysis
- Chart rendering time monitoring
- API response time tracking

#### Test Result Analysis
- Test failure pattern analysis
- Coverage trend monitoring
- Performance benchmark tracking
- Error rate analysis

---

## 5. Summary and Next Steps

This comprehensive testing strategy for Story 3.3: Container Metrics Visualization provides:

**Complete Test Coverage**:
- Unit tests for all components with >80% coverage
- Integration tests for data flow validation
- Performance tests for scalability requirements
- Visual regression tests for UI consistency
- Accessibility tests for WCAG compliance

**Quality Assurance Framework**:
- Automated quality gates in CI/CD pipeline
- Performance benchmarking with baseline comparison
- Memory leak detection and monitoring
- Cross-browser compatibility validation

**Continuous Monitoring**:
- Real-time performance metrics
- Error rate alerting
- User experience monitoring
- Regression detection systems

**Implementation Priority**:
1. **Week 1**: Unit tests and basic integration tests
2. **Week 2**: Performance testing and optimization
3. **Week 3**: Visual regression and accessibility testing
4. **Week 4**: E2E testing and quality gate implementation

This strategy ensures that the Container Metrics Visualization feature meets all quality requirements while maintaining optimal performance and user experience standards.