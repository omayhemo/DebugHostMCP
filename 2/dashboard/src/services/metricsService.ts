import { apiService } from './api';
import type { ContainerMetrics, MetricsTimeRange } from '../store/slices/metricsSlice';

export interface MetricsStreamOptions {
  containerId?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MetricsQueryParams {
  start?: string;
  end?: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '6h' | '24h';
  containers?: string[];
  metrics?: string[];
}

export class MetricsService {
  private eventSources: Map<string, EventSource> = new Map();
  private webSockets: Map<string, WebSocket> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  // SSE Connection Management
  async createSSEConnection(
    containerId: string, 
    onMessage: (data: ContainerMetrics) => void,
    onError: (error: Event) => void,
    onConnectionChange: (connected: boolean) => void,
    options: MetricsStreamOptions = {}
  ): Promise<EventSource | null> {
    try {
      const eventSource = await apiService.getMetricsStream(containerId);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ContainerMetrics;
          onMessage(data);
          this.resetReconnectAttempts(containerId);
          onConnectionChange(true);
        } catch (err) {
          console.error('Failed to parse metrics data:', err);
          onError(event);
        }
      };

      eventSource.onerror = (event) => {
        console.warn('SSE connection error:', event);
        onConnectionChange(false);
        onError(event);
        
        // Attempt reconnection
        this.handleReconnection(
          containerId,
          () => this.createSSEConnection(containerId, onMessage, onError, onConnectionChange, options),
          options
        );
      };

      eventSource.onopen = () => {
        console.log(`SSE connection established for container ${containerId}`);
        onConnectionChange(true);
      };

      this.eventSources.set(containerId, eventSource);
      return eventSource;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      onError(error as Event);
      return null;
    }
  }

  // WebSocket Fallback
  createWebSocketConnection(
    containerId: string,
    onMessage: (data: ContainerMetrics) => void,
    onError: (error: Event) => void,
    onConnectionChange: (connected: boolean) => void,
    options: MetricsStreamOptions = {}
  ): WebSocket | null {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const token = localStorage.getItem('token');
      const wsUrl = `${protocol}//${host}/api/containers/${containerId}/metrics/ws${token ? `?token=${token}` : ''}`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`WebSocket connection established for container ${containerId}`);
        onConnectionChange(true);
        this.resetReconnectAttempts(containerId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ContainerMetrics;
          onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket metrics data:', err);
        }
      };

      ws.onerror = (event) => {
        console.warn('WebSocket connection error:', event);
        onConnectionChange(false);
        onError(event);
      };

      ws.onclose = () => {
        console.log(`WebSocket connection closed for container ${containerId}`);
        onConnectionChange(false);
        
        // Attempt reconnection
        this.handleReconnection(
          containerId,
          () => this.createWebSocketConnection(containerId, onMessage, onError, onConnectionChange, options),
          options
        );
      };

      this.webSockets.set(containerId, ws);
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError(error as Event);
      return null;
    }
  }

  // Reconnection Logic
  private handleReconnection(
    containerId: string,
    reconnectFn: () => Promise<any> | any,
    options: MetricsStreamOptions
  ) {
    const maxAttempts = options.maxReconnectAttempts || 10;
    const currentAttempts = this.reconnectAttempts.get(containerId) || 0;

    if (currentAttempts >= maxAttempts) {
      console.error(`Max reconnection attempts reached for container ${containerId}`);
      return;
    }

    const interval = options.reconnectInterval || 5000;
    const backoffDelay = Math.min(interval * Math.pow(2, currentAttempts), 30000); // Max 30s delay
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = backoffDelay + jitter;

    console.log(`Attempting reconnection for container ${containerId} in ${delay}ms (attempt ${currentAttempts + 1}/${maxAttempts})`);

    const timer = setTimeout(() => {
      this.incrementReconnectAttempts(containerId);
      reconnectFn();
    }, delay);

    this.reconnectTimers.set(containerId, timer);
  }

  private resetReconnectAttempts(containerId: string) {
    this.reconnectAttempts.delete(containerId);
  }

  private incrementReconnectAttempts(containerId: string) {
    const current = this.reconnectAttempts.get(containerId) || 0;
    this.reconnectAttempts.set(containerId, current + 1);
  }

  // Historical Metrics Queries
  async getHistoricalMetrics(
    containerId: string,
    params: MetricsQueryParams
  ): Promise<ContainerMetrics[]> {
    try {
      const response = await apiService.getContainerMetrics(containerId, params);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch historical metrics:', error);
      throw error;
    }
  }

  async getAllContainersMetrics(params: MetricsQueryParams): Promise<Record<string, ContainerMetrics[]>> {
    try {
      const response = await apiService.getAllContainersMetrics(params);
      return response.data || {};
    } catch (error) {
      console.error('Failed to fetch all containers metrics:', error);
      throw error;
    }
  }

  async getMetricsByType(
    metricType: 'cpu' | 'memory' | 'disk' | 'network',
    params: MetricsQueryParams
  ): Promise<Record<string, any[]>> {
    try {
      const response = await apiService.getMetricsByType(metricType, params);
      return response.data || {};
    } catch (error) {
      console.error(`Failed to fetch ${metricType} metrics:`, error);
      throw error;
    }
  }

  // Export Functionality
  async exportMetrics(
    format: 'json' | 'csv' | 'prometheus',
    timeRange: MetricsTimeRange,
    containers?: string[],
    metrics?: string[]
  ): Promise<void> {
    try {
      const blob = await apiService.exportMetrics({
        format,
        start: timeRange.start,
        end: timeRange.end,
        containers,
        metrics,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `metrics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export metrics:', error);
      throw error;
    }
  }

  // Health Check
  async checkMetricsHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    try {
      return await apiService.getMetricsHealth();
    } catch (error) {
      console.error('Failed to check metrics health:', error);
      return {
        status: 'unhealthy',
        checks: { connection: false },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Utility Functions
  calculateAverageMetric(metrics: ContainerMetrics[], field: keyof ContainerMetrics['cpu' | 'memory' | 'disk']): number {
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => {
      if (field === 'usage' && 'cpu' in metric) {
        return acc + metric.cpu.usage;
      } else if (field === 'usage' && 'memory' in metric) {
        return acc + metric.memory.usage;
      }
      return acc;
    }, 0);

    return sum / metrics.length;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatPercentage(value: number): string {
    return `${Math.round(value * 100) / 100}%`;
  }

  // Resource Management
  closeConnection(containerId: string) {
    // Close SSE connection
    const eventSource = this.eventSources.get(containerId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(containerId);
    }

    // Close WebSocket connection
    const webSocket = this.webSockets.get(containerId);
    if (webSocket) {
      webSocket.close();
      this.webSockets.delete(containerId);
    }

    // Clear reconnection timer
    const timer = this.reconnectTimers.get(containerId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(containerId);
    }

    // Reset reconnection attempts
    this.resetReconnectAttempts(containerId);
  }

  closeAllConnections() {
    const containerIds = [
      ...this.eventSources.keys(),
      ...this.webSockets.keys(),
    ];

    containerIds.forEach(containerId => {
      this.closeConnection(containerId);
    });
  }

  getActiveConnections(): { sse: string[]; ws: string[] } {
    return {
      sse: Array.from(this.eventSources.keys()),
      ws: Array.from(this.webSockets.keys()),
    };
  }
}

// Create and export singleton instance
export const metricsService = new MetricsService();
export default metricsService;