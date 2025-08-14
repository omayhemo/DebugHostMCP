import { apiService } from './api';
import { LogEntry } from '../store/slices/logsSlice';

export interface LogStreamOptions {
  projectId: string;
  containerName?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  search?: string;
  tail?: number;
  follow?: boolean;
  includeHistory?: boolean;
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'text';
  level?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
}

export interface LogSearchOptions {
  query: string;
  containers?: string[];
  level?: string;
  since?: string;
  until?: string;
  limit?: number;
}

export interface LogStreamStats {
  connected: boolean;
  connectionCount: number;
  lastMessage?: Date;
  reconnectAttempts: number;
  error?: string;
}

export interface LogStreamCallbacks {
  onMessage: (log: LogEntry) => void;
  onError: (error: Error) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: (attempt: number) => void;
}

class LogService {
  private eventSource: EventSource | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private callbacks: LogStreamCallbacks | null = null;
  private currentOptions: LogStreamOptions | null = null;
  private stats: LogStreamStats = {
    connected: false,
    connectionCount: 0,
    reconnectAttempts: 0
  };

  // Get historical logs from API
  async getLogs(containerName: string, options?: {
    limit?: number;
    level?: string;
    search?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<LogEntry[]> {
    try {
      const response = await apiService.get(`/servers/${containerName}/logs`, options);
      return response.logs || [];
    } catch (error) {
      console.error('Failed to fetch historical logs:', error);
      throw error;
    }
  }

  // Search logs across containers
  async searchLogs(options: LogSearchOptions): Promise<{
    results: Array<{
      containerName: string;
      matches: number;
      logs: LogEntry[];
    }>;
    totalMatches: number;
  }> {
    try {
      const response = await apiService.post('/logs/search', options);
      return response;
    } catch (error) {
      console.error('Log search failed:', error);
      throw error;
    }
  }

  // Export logs to file
  async exportLogs(containerName: string, options: LogExportOptions): Promise<{
    content: string;
    filename: string;
    contentType: string;
  }> {
    try {
      const response = await apiService.post(`/servers/${containerName}/logs/export`, options, {
        responseType: 'blob'
      });
      
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${containerName}_logs_${Date.now()}.${options.format}`;

      return {
        content: response.data,
        filename,
        contentType: response.headers['content-type'] || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Log export failed:', error);
      throw error;
    }
  }

  // Clear logs for a container
  async clearLogs(containerName: string): Promise<void> {
    try {
      await apiService.delete(`/servers/${containerName}/logs`);
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  // Start log streaming with Server-Sent Events
  startStreaming(options: LogStreamOptions, callbacks: LogStreamCallbacks): void {
    this.currentOptions = options;
    this.callbacks = callbacks;
    this.reconnectAttempts = 0;
    
    this.connectEventSource();
  }

  // Stop log streaming
  stopStreaming(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.stats.connected = false;
    this.currentOptions = null;
    this.callbacks = null;
    this.reconnectAttempts = 0;
  }

  // Get streaming statistics
  getStats(): LogStreamStats {
    return { ...this.stats };
  }

  // Check if streaming is active
  isStreaming(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // Force reconnection
  reconnect(): void {
    if (this.currentOptions && this.callbacks) {
      this.stopStreaming();
      setTimeout(() => {
        if (this.currentOptions && this.callbacks) {
          this.startStreaming(this.currentOptions, this.callbacks);
        }
      }, 100);
    }
  }

  private connectEventSource(): void {
    if (!this.currentOptions || !this.callbacks) {
      return;
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (this.currentOptions.containerName) {
        params.append('containerName', this.currentOptions.containerName);
      }
      if (this.currentOptions.level) {
        params.append('level', this.currentOptions.level);
      }
      if (this.currentOptions.search) {
        params.append('search', this.currentOptions.search);
      }
      if (this.currentOptions.tail) {
        params.append('tail', this.currentOptions.tail.toString());
      }
      if (this.currentOptions.follow !== undefined) {
        params.append('follow', this.currentOptions.follow.toString());
      }
      if (this.currentOptions.includeHistory !== undefined) {
        params.append('includeHistory', this.currentOptions.includeHistory.toString());
      }

      // Get base URL from API service
      const baseURL = apiService['client'].defaults.baseURL || 'http://127.0.0.1:2601';
      const token = localStorage.getItem('token');
      if (token) {
        params.append('token', token);
      }

      const url = `${baseURL}/mcp/logs/${this.currentOptions.projectId}/stream?${params.toString()}`;
      
      // Create new EventSource
      this.eventSource = new EventSource(url);

      // Set up event handlers
      this.eventSource.onopen = () => {
        console.log('Log stream connected');
        this.stats.connected = true;
        this.stats.connectionCount++;
        this.stats.lastMessage = new Date();
        this.reconnectAttempts = 0;
        this.stats.reconnectAttempts = 0;
        this.stats.error = undefined;
        
        if (this.callbacks) {
          this.callbacks.onConnect();
        }
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Handle specific event types
      this.eventSource.addEventListener('log', (event) => {
        this.handleLogMessage(event as MessageEvent);
      });

      this.eventSource.addEventListener('error', (event) => {
        this.handleErrorMessage(event as MessageEvent);
      });

      this.eventSource.addEventListener('status', (event) => {
        this.handleStatusMessage(event as MessageEvent);
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        this.stats.lastMessage = new Date();
      });

      this.eventSource.onerror = (event) => {
        console.error('Log stream error:', event);
        this.handleConnectionError();
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.handleConnectionError();
    }
  }

  private handleMessage(event: MessageEvent): void {
    this.stats.lastMessage = new Date();
    
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('SSE connection established:', data);
        return;
      }
      
      // Treat generic messages as log entries
      if (this.callbacks && this.isValidLogEntry(data)) {
        this.callbacks.onMessage(data);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }

  private handleLogMessage(event: MessageEvent): void {
    this.stats.lastMessage = new Date();
    
    try {
      const logEntry = JSON.parse(event.data);
      
      if (this.callbacks && this.isValidLogEntry(logEntry)) {
        this.callbacks.onMessage(logEntry);
      }
    } catch (error) {
      console.error('Error parsing log message:', error);
    }
  }

  private handleErrorMessage(event: MessageEvent): void {
    try {
      const errorData = JSON.parse(event.data);
      const error = new Error(errorData.message || 'Stream error');
      
      this.stats.error = errorData.message;
      
      if (this.callbacks) {
        this.callbacks.onError(error);
      }
    } catch (parseError) {
      console.error('Error parsing error message:', parseError);
    }
  }

  private handleStatusMessage(event: MessageEvent): void {
    try {
      const statusData = JSON.parse(event.data);
      console.log('Stream status:', statusData);
      
      if (statusData.type === 'historical_complete') {
        console.log(`Historical logs loaded: ${statusData.count} entries`);
      } else if (statusData.type === 'logs_cleared') {
        console.log(`Logs cleared for ${statusData.containerName}`);
      }
    } catch (error) {
      console.error('Error parsing status message:', error);
    }
  }

  private handleConnectionError(): void {
    this.stats.connected = false;
    
    if (this.callbacks) {
      const error = new Error(`Connection failed (attempt ${this.reconnectAttempts + 1})`);
      this.callbacks.onDisconnect();
      this.callbacks.onError(error);
    }

    // Attempt reconnection if we haven't exceeded the limit
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentOptions && this.callbacks) {
      this.reconnectAttempts++;
      this.stats.reconnectAttempts = this.reconnectAttempts;
      
      // Exponential backoff with jitter
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
        this.maxReconnectDelay
      );
      
      console.log(`Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        if (this.callbacks) {
          this.callbacks.onReconnect(this.reconnectAttempts);
        }
        this.connectEventSource();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.stats.error = 'Max reconnection attempts reached';
    }
  }

  private isValidLogEntry(data: any): data is LogEntry {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.level === 'string' &&
      typeof data.message === 'string'
    );
  }

  // WebSocket fallback implementation
  private createWebSocketConnection(options: LogStreamOptions): WebSocket {
    const baseURL = apiService['client'].defaults.baseURL?.replace(/^http/, 'ws') || 'ws://127.0.0.1:2601';
    const token = localStorage.getItem('token');
    
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (options.containerName) params.append('containerName', options.containerName);
    if (options.level) params.append('level', options.level);
    if (options.search) params.append('search', options.search);
    if (options.tail) params.append('tail', options.tail.toString());

    const wsUrl = `${baseURL}/ws/logs/${options.projectId}?${params.toString()}`;
    
    return new WebSocket(wsUrl);
  }
}

export const logService = new LogService();
export default logService;