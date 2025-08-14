import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setConnectionStatus,
  incrementRetryAttempts,
  resetRetryAttempts,
  setError,
  updatePerformanceMetrics,
} from '../store/slices/metricsSlice';
import { updateCurrentMetrics } from '../store/slices/metricsSlice';
import { metricsService } from '../services/metricsService';
import type { ContainerMetrics } from '../store/slices/metricsSlice';

export interface UseMetricsStreamOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  containers?: string[];
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseMetricsStreamReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  retryAttempts: number;
  lastPing: string | null;
  connect: (containerId?: string) => void;
  disconnect: (containerId?: string) => void;
  reconnect: (containerId?: string) => void;
  getConnectionInfo: () => {
    sse: string[];
    ws: string[];
  };
}

export const useMetricsStream = (options: UseMetricsStreamOptions = {}): UseMetricsStreamReturn => {
  const {
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    containers = [],
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const dispatch = useAppDispatch();
  const connectionStatus = useAppSelector((state) => state.metrics.connectionStatus);
  const performanceMetricsRef = useRef(Date.now());
  const activeConnectionsRef = useRef<Set<string>>(new Set());

  // Handle incoming metrics data
  const handleMetricsData = useCallback((data: ContainerMetrics) => {
    const now = Date.now();
    const latency = now - performanceMetricsRef.current;

    // Update metrics in store
    dispatch(updateCurrentMetrics([data]));

    // Update performance metrics
    dispatch(updatePerformanceMetrics({
      updateLatency: latency,
      renderTime: performance.now() - now,
      dataPoints: 1,
    }));

    performanceMetricsRef.current = now;
  }, [dispatch]);

  // Handle connection errors
  const handleError = useCallback((error: Event) => {
    console.error('Metrics stream error:', error);
    dispatch(setError('Connection error occurred'));
    dispatch(incrementRetryAttempts());
    onError?.(error);
  }, [dispatch, onError]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean, containerId?: string) => {
    const now = new Date().toISOString();
    
    dispatch(setConnectionStatus({
      connected,
      reconnecting: !connected && connectionStatus.retryAttempts < maxReconnectAttempts,
      lastPing: connected ? now : connectionStatus.lastPing,
    }));

    if (connected) {
      dispatch(resetRetryAttempts());
      dispatch(setError(null));
      if (containerId) {
        activeConnectionsRef.current.add(containerId);
      }
      onConnect?.();
    } else {
      if (containerId) {
        activeConnectionsRef.current.delete(containerId);
      }
      onDisconnect?.();
    }
  }, [dispatch, connectionStatus, maxReconnectAttempts, onConnect, onDisconnect]);

  // Create connection for a specific container
  const createConnection = useCallback(async (containerId: string) => {
    try {
      // Try SSE first
      const sseConnection = await metricsService.createSSEConnection(
        containerId,
        handleMetricsData,
        (error) => {
          console.warn(`SSE failed for ${containerId}, falling back to WebSocket`);
          // Fallback to WebSocket
          metricsService.createWebSocketConnection(
            containerId,
            handleMetricsData,
            handleError,
            (connected) => handleConnectionChange(connected, containerId),
            {
              reconnectInterval,
              maxReconnectAttempts,
            }
          );
        },
        (connected) => handleConnectionChange(connected, containerId),
        {
          reconnectInterval,
          maxReconnectAttempts,
        }
      );

      if (!sseConnection) {
        console.log(`Creating WebSocket connection for ${containerId}`);
        metricsService.createWebSocketConnection(
          containerId,
          handleMetricsData,
          handleError,
          (connected) => handleConnectionChange(connected, containerId),
          {
            reconnectInterval,
            maxReconnectAttempts,
          }
        );
      }
    } catch (err) {
      console.error(`Failed to create connection for ${containerId}:`, err);
      handleError(err as Event);
    }
  }, [
    handleMetricsData,
    handleError,
    handleConnectionChange,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  // Connect to metrics stream
  const connect = useCallback((containerId?: string) => {
    if (!enabled) return;

    if (containerId) {
      createConnection(containerId);
    } else {
      // Connect to all specified containers
      containers.forEach(id => {
        createConnection(id);
      });
    }
  }, [enabled, containers, createConnection]);

  // Disconnect from metrics stream
  const disconnect = useCallback((containerId?: string) => {
    if (containerId) {
      metricsService.closeConnection(containerId);
      activeConnectionsRef.current.delete(containerId);
    } else {
      metricsService.closeAllConnections();
      activeConnectionsRef.current.clear();
    }

    dispatch(setConnectionStatus({
      connected: false,
      reconnecting: false,
    }));
  }, [dispatch]);

  // Reconnect to metrics stream
  const reconnect = useCallback((containerId?: string) => {
    disconnect(containerId);
    setTimeout(() => {
      connect(containerId);
    }, 1000);
  }, [connect, disconnect]);

  // Get connection information
  const getConnectionInfo = useCallback(() => {
    return metricsService.getActiveConnections();
  }, []);

  // Set up connections when containers change
  useEffect(() => {
    if (enabled && containers.length > 0) {
      containers.forEach(containerId => {
        if (!activeConnectionsRef.current.has(containerId)) {
          createConnection(containerId);
        }
      });
    }

    return () => {
      // Cleanup connections when component unmounts or containers change
      activeConnectionsRef.current.forEach(containerId => {
        if (!containers.includes(containerId)) {
          metricsService.closeConnection(containerId);
          activeConnectionsRef.current.delete(containerId);
        }
      });
    };
  }, [enabled, containers, createConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      metricsService.closeAllConnections();
      activeConnectionsRef.current.clear();
    };
  }, []);

  // Health check interval
  useEffect(() => {
    if (!enabled) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await metricsService.checkMetricsHealth();
        if (health.status === 'unhealthy' && connectionStatus.connected) {
          console.warn('Metrics service is unhealthy, attempting reconnection');
          reconnect();
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [enabled, connectionStatus.connected, reconnect]);

  return {
    isConnected: connectionStatus.connected,
    isReconnecting: connectionStatus.reconnecting,
    retryAttempts: connectionStatus.retryAttempts,
    lastPing: connectionStatus.lastPing,
    connect,
    disconnect,
    reconnect,
    getConnectionInfo,
  };
};

export default useMetricsStream;