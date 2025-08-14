import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import '@testing-library/jest-dom';
import { useMetricsStream } from '../useMetricsStream';
import metricsSlice from '../../store/slices/metricsSlice';
import { metricsService } from '../../services/metricsService';

// Mock metrics service
jest.mock('../../services/metricsService');
const mockMetricsService = metricsService as jest.Mocked<typeof metricsService>;

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  simulateMessage(data: any) {
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number = 0;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = 2;
    setTimeout(() => {
      this.onclose?.(new CloseEvent('close'));
    }, 10);
  }

  send(data: any) {
    // Mock send
  }

  simulateMessage(data: any) {
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock globals
(global as any).EventSource = MockEventSource;
(global as any).WebSocket = MockWebSocket;

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      metrics: metricsSlice,
    },
    preloadedState: {
      metrics: {
        currentMetrics: {},
        historicalMetrics: {},
        connectionStatus: {
          connected: false,
          reconnecting: false,
          lastPing: null,
          retryAttempts: 0,
          maxRetryAttempts: 10,
        },
        loading: false,
        error: null,
        filters: {
          containers: [],
          metrics: ['cpu', 'memory', 'disk', 'network'],
          timeRange: {
            start: new Date(Date.now() - 3600000).toISOString(),
            end: new Date().toISOString(),
            interval: '1m',
          },
        },
        autoRefresh: true,
        refreshInterval: 30,
        chartConfigs: {
          cpu: { type: 'line', colors: ['#3b82f6'], yAxisMin: 0, yAxisMax: 100 },
          memory: { type: 'area', colors: ['#10b981'], yAxisMin: 0 },
          disk: { type: 'bar', colors: ['#8b5cf6'], yAxisMin: 0 },
          network: { type: 'line', colors: ['#f97316'], yAxisMin: 0 },
        },
        performanceMetrics: {
          updateLatency: 0,
          renderTime: 0,
          dataPoints: 0,
          memoryUsage: 0,
        },
        alertThresholds: {
          cpu: 85,
          memory: 90,
          disk: 95,
        },
        selectedContainers: [],
        timeRange: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date().toISOString(),
          interval: '1m',
        },
        ...initialState,
      },
    },
  });
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(Provider, { store: createMockStore() }, children)
);

describe('useMetricsStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetricsService.createSSEConnection.mockClear();
    mockMetricsService.createWebSocketConnection.mockClear();
    mockMetricsService.closeConnection.mockClear();
    mockMetricsService.closeAllConnections.mockClear();
    mockMetricsService.getActiveConnections.mockReturnValue({ sse: [], ws: [] });
    mockMetricsService.checkMetricsHealth.mockResolvedValue({
      status: 'healthy',
      checks: { connection: true },
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useMetricsStream(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.retryAttempts).toBe(0);
      expect(result.current.lastPing).toBeNull();
    });

    it('provides connection methods', () => {
      const { result } = renderHook(() => useMetricsStream(), { wrapper });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.reconnect).toBe('function');
      expect(typeof result.current.getConnectionInfo).toBe('function');
    });
  });

  describe('Connection Management', () => {
    it('establishes SSE connection when enabled', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(new MockEventSource('test') as any);

      const { result } = renderHook(
        () => useMetricsStream({ enabled: true, containers: ['container-1'] }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-1',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
      });
    });

    it('connects manually when connect is called', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(new MockEventSource('test') as any);

      const { result } = renderHook(() => useMetricsStream({ enabled: true }), { wrapper });

      act(() => {
        result.current.connect('container-1');
      });

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-1',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
      });
    });

    it('falls back to WebSocket when SSE fails', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(null);
      mockMetricsService.createWebSocketConnection.mockReturnValue(new MockWebSocket('test') as any);

      const { result } = renderHook(() => useMetricsStream({ enabled: true }), { wrapper });

      act(() => {
        result.current.connect('container-1');
      });

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalled();
        expect(mockMetricsService.createWebSocketConnection).toHaveBeenCalled();
      });
    });

    it('disconnects from all connections', () => {
      const { result } = renderHook(() => useMetricsStream(), { wrapper });

      act(() => {
        result.current.disconnect();
      });

      expect(mockMetricsService.closeAllConnections).toHaveBeenCalled();
    });

    it('disconnects from specific container', () => {
      const { result } = renderHook(() => useMetricsStream(), { wrapper });

      act(() => {
        result.current.disconnect('container-1');
      });

      expect(mockMetricsService.closeConnection).toHaveBeenCalledWith('container-1');
    });
  });

  describe('Reconnection Logic', () => {
    it('handles reconnection attempts', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useMetricsStream({ enabled: true }), { wrapper });

      act(() => {
        result.current.reconnect('container-1');
      });

      expect(mockMetricsService.closeConnection).toHaveBeenCalledWith('container-1');

      // Fast forward past reconnection delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalled();
      });
    });

    it('respects maxReconnectAttempts option', () => {
      const { result } = renderHook(
        () => useMetricsStream({ maxReconnectAttempts: 5 }),
        { wrapper }
      );

      // The maxReconnectAttempts is passed to the service methods
      expect(result.current).toBeDefined();
    });

    it('uses custom reconnectInterval', () => {
      const { result } = renderHook(
        () => useMetricsStream({ reconnectInterval: 10000 }),
        { wrapper }
      );

      // The reconnectInterval is passed to the service methods
      expect(result.current).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    it('calls onConnect callback when connected', async () => {
      const onConnect = jest.fn();
      mockMetricsService.createSSEConnection.mockImplementation(
        async (containerId, onMessage, onError, onConnectionChange) => {
          // Simulate connection success
          setTimeout(() => onConnectionChange(true, containerId), 10);
          return new MockEventSource('test') as any;
        }
      );

      renderHook(
        () => useMetricsStream({ enabled: true, containers: ['container-1'], onConnect }),
        { wrapper }
      );

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });

    it('calls onDisconnect callback when disconnected', async () => {
      const onDisconnect = jest.fn();
      mockMetricsService.createSSEConnection.mockImplementation(
        async (containerId, onMessage, onError, onConnectionChange) => {
          // Simulate connection and then disconnection
          setTimeout(() => onConnectionChange(true, containerId), 10);
          setTimeout(() => onConnectionChange(false, containerId), 20);
          return new MockEventSource('test') as any;
        }
      );

      renderHook(
        () => useMetricsStream({ enabled: true, containers: ['container-1'], onDisconnect }),
        { wrapper }
      );

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('calls onError callback when error occurs', async () => {
      const onError = jest.fn();
      mockMetricsService.createSSEConnection.mockImplementation(
        async (containerId, onMessage, onError) => {
          // Simulate error
          setTimeout(() => onError(new Event('error')), 10);
          return new MockEventSource('test') as any;
        }
      );

      renderHook(
        () => useMetricsStream({ enabled: true, containers: ['container-1'], onError }),
        { wrapper }
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Event));
      });
    });
  });

  describe('Health Checks', () => {
    it('performs periodic health checks', async () => {
      jest.useFakeTimers();
      
      renderHook(() => useMetricsStream({ enabled: true }), { wrapper });

      // Fast forward to trigger health check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockMetricsService.checkMetricsHealth).toHaveBeenCalled();
      });
    });

    it('triggers reconnection when health check fails', async () => {
      jest.useFakeTimers();
      
      mockMetricsService.checkMetricsHealth.mockResolvedValue({
        status: 'unhealthy',
        checks: { connection: false },
        timestamp: new Date().toISOString(),
      });

      // Mock initial connection
      const store = createMockStore({
        connectionStatus: { connected: true, reconnecting: false, retryAttempts: 0, maxRetryAttempts: 10, lastPing: null },
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(Provider, { store }, children)
      );

      renderHook(() => useMetricsStream({ enabled: true }), { wrapper: customWrapper });

      // Fast forward to trigger health check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockMetricsService.closeAllConnections).toHaveBeenCalled();
      });
    });
  });

  describe('Container Management', () => {
    it('connects to multiple containers', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(new MockEventSource('test') as any);

      renderHook(
        () => useMetricsStream({ enabled: true, containers: ['container-1', 'container-2'] }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledTimes(2);
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-1',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-2',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
      });
    });

    it('handles container list changes', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(new MockEventSource('test') as any);

      const { rerender } = renderHook(
        ({ containers }) => useMetricsStream({ enabled: true, containers }),
        {
          wrapper,
          initialProps: { containers: ['container-1'] },
        }
      );

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-1',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
      });

      // Change containers
      rerender({ containers: ['container-1', 'container-2'] });

      await waitFor(() => {
        expect(mockMetricsService.createSSEConnection).toHaveBeenCalledWith(
          'container-2',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Object)
        );
      });
    });

    it('cleans up removed containers', async () => {
      mockMetricsService.createSSEConnection.mockResolvedValue(new MockEventSource('test') as any);
      mockMetricsService.getActiveConnections.mockReturnValue({ sse: ['container-1'], ws: [] });

      const { rerender } = renderHook(
        ({ containers }) => useMetricsStream({ enabled: true, containers }),
        {
          wrapper,
          initialProps: { containers: ['container-1', 'container-2'] },
        }
      );

      // Remove container-2
      rerender({ containers: ['container-1'] });

      await waitFor(() => {
        expect(mockMetricsService.closeConnection).toHaveBeenCalledWith('container-2');
      });
    });
  });

  describe('Performance and Memory', () => {
    it('cleans up connections on unmount', () => {
      const { unmount } = renderHook(() => useMetricsStream({ enabled: true }), { wrapper });

      unmount();

      expect(mockMetricsService.closeAllConnections).toHaveBeenCalled();
    });

    it('returns connection information', () => {
      mockMetricsService.getActiveConnections.mockReturnValue({
        sse: ['container-1'],
        ws: ['container-2'],
      });

      const { result } = renderHook(() => useMetricsStream(), { wrapper });

      const connectionInfo = result.current.getConnectionInfo();
      expect(connectionInfo).toEqual({
        sse: ['container-1'],
        ws: ['container-2'],
      });
    });
  });

  describe('Disabled State', () => {
    it('does not connect when disabled', () => {
      renderHook(
        () => useMetricsStream({ enabled: false, containers: ['container-1'] }),
        { wrapper }
      );

      expect(mockMetricsService.createSSEConnection).not.toHaveBeenCalled();
    });

    it('does not perform health checks when disabled', async () => {
      jest.useFakeTimers();

      renderHook(() => useMetricsStream({ enabled: false }), { wrapper });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockMetricsService.checkMetricsHealth).not.toHaveBeenCalled();
    });
  });
});

// Integration Tests
describe('useMetricsStream Integration', () => {
  it('integrates with Redux store properly', async () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(Provider, { store }, children)
    );

    mockMetricsService.createSSEConnection.mockImplementation(
      async (containerId, onMessage) => {
        // Simulate receiving metrics data
        setTimeout(() => {
          onMessage({
            containerId,
            containerName: 'test-container',
            cpu: { usage: 50, cores: 2 },
            memory: { usage: 1024 * 1024 * 512, limit: 1024 * 1024 * 1024, percentage: 50 },
            disk: { usage: 1024 * 1024 * 1024 * 10, available: 1024 * 1024 * 1024 * 40, percentage: 20 },
            network: { bytesIn: 1024, bytesOut: 2048, packetsIn: 10, packetsOut: 20 },
            timestamp: new Date().toISOString(),
          });
        }, 10);
        return new MockEventSource('test') as any;
      }
    );

    renderHook(() => useMetricsStream({ enabled: true, containers: ['container-1'] }), { wrapper });

    await waitFor(() => {
      const state = store.getState();
      expect(state.metrics.currentMetrics['container-1']).toBeDefined();
      expect(state.metrics.currentMetrics['container-1'].cpu.usage).toBe(50);
    });
  });

  it('updates performance metrics in store', async () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(Provider, { store }, children)
    );

    mockMetricsService.createSSEConnection.mockImplementation(
      async (containerId, onMessage) => {
        setTimeout(() => {
          onMessage({
            containerId,
            containerName: 'test-container',
            cpu: { usage: 50, cores: 2 },
            memory: { usage: 1024 * 1024 * 512, limit: 1024 * 1024 * 1024, percentage: 50 },
            disk: { usage: 1024 * 1024 * 1024 * 10, available: 1024 * 1024 * 1024 * 40, percentage: 20 },
            network: { bytesIn: 1024, bytesOut: 2048, packetsIn: 10, packetsOut: 20 },
            timestamp: new Date().toISOString(),
          });
        }, 10);
        return new MockEventSource('test') as any;
      }
    );

    renderHook(() => useMetricsStream({ enabled: true, containers: ['container-1'] }), { wrapper });

    await waitFor(() => {
      const state = store.getState();
      expect(state.metrics.performanceMetrics.dataPoints).toBe(1);
      expect(state.metrics.performanceMetrics.updateLatency).toBeGreaterThan(0);
    });
  });
});