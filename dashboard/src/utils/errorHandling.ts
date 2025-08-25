/**
 * Comprehensive Error Handling Utilities
 * 
 * Error handling and recovery mechanisms for real-time process monitoring:
 * - Network error handling
 * - SSE connection recovery
 * - Event processing error recovery
 * - User-friendly error reporting
 * - Automatic retry mechanisms
 */

import { ConnectionStatus, ProcessUpdateEvent } from '../types';

/**
 * Error types for classification
 */
export enum ErrorType {
  NETWORK = 'network',
  SSE = 'sse',
  PARSING = 'parsing',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enhanced error interface
 */
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
  userMessage?: string;
}

/**
 * Error classification utility
 */
export class ErrorClassifier {
  static classify(error: any): AppError {
    const timestamp = new Date();
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let retryable = true;
    let userMessage = 'An unexpected error occurred';
    let code: string | undefined;
    let context: Record<string, any> = {};

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Network connection failed. Please check your internet connection.';
      code = 'NETWORK_FETCH_FAILED';
      retryable = true;
    }
    
    // SSE errors
    else if (error.name === 'EventSourceError' || error.type === 'error') {
      type = ErrorType.SSE;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Real-time connection lost. Attempting to reconnect...';
      code = 'SSE_CONNECTION_FAILED';
      retryable = true;
    }
    
    // JSON parsing errors
    else if (error instanceof SyntaxError || error.name === 'SyntaxError') {
      type = ErrorType.PARSING;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Failed to process server response';
      code = 'JSON_PARSE_ERROR';
      retryable = false;
    }
    
    // Timeout errors
    else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      type = ErrorType.TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Request timed out. Please try again.';
      code = 'REQUEST_TIMEOUT';
      retryable = true;
    }
    
    // Permission/Authorization errors
    else if (error.status === 401 || error.status === 403) {
      type = ErrorType.PERMISSION;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Access denied. Please check your permissions.';
      code = 'ACCESS_DENIED';
      retryable = false;
    }
    
    // Validation errors
    else if (error.name === 'ValidationError') {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = error.message || 'Invalid data received';
      code = 'VALIDATION_FAILED';
      retryable = false;
    }

    // Extract context from error
    context = {
      originalError: error.message,
      stack: error.stack,
      ...('context' in error ? error.context : {})
    };

    return {
      name: error.name || 'AppError',
      message: error.message || 'Unknown error',
      type,
      severity,
      code,
      context,
      timestamp,
      retryable,
      userMessage
    } as AppError;
  }
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Default retry configurations for different error types
 */
export const RETRY_CONFIGS: Record<ErrorType, RetryConfig> = {
  [ErrorType.NETWORK]: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ErrorType.SSE]: {
    maxAttempts: 10,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 1.5,
    jitter: true
  },
  [ErrorType.TIMEOUT]: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: false
  },
  [ErrorType.PARSING]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [ErrorType.VALIDATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [ErrorType.PERMISSION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [ErrorType.UNKNOWN]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  }
};

/**
 * Retry mechanism with exponential backoff
 */
export class RetryManager {
  private attemptCounts = new Map<string, number>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorType: ErrorType,
    operationId?: string
  ): Promise<T> {
    const id = operationId || Math.random().toString(36);
    const config = RETRY_CONFIGS[errorType];
    const currentAttempt = this.attemptCounts.get(id) || 0;

    try {
      const result = await operation();
      
      // Success - reset attempt count
      this.attemptCounts.delete(id);
      this.clearTimeout(id);
      
      return result;
    } catch (error) {
      const appError = ErrorClassifier.classify(error);
      
      if (!appError.retryable || currentAttempt >= config.maxAttempts) {
        this.attemptCounts.delete(id);
        this.clearTimeout(id);
        throw appError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = this.calculateDelay(currentAttempt, config);
      this.attemptCounts.set(id, currentAttempt + 1);
      
      console.warn(`Retrying operation ${id} in ${delay}ms (attempt ${currentAttempt + 1}/${config.maxAttempts})`);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            const result = await this.executeWithRetry(operation, errorType, id);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);
        
        this.timeouts.set(id, timeout);
      });
    }
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
      delay += jitter;
    }
    
    return Math.floor(delay);
  }

  private clearTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  cancel(operationId: string): void {
    this.attemptCounts.delete(operationId);
    this.clearTimeout(operationId);
  }

  cancelAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.attemptCounts.clear();
    this.timeouts.clear();
  }

  getAttemptCount(operationId: string): number {
    return this.attemptCounts.get(operationId) || 0;
  }
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private onStateChange?: (state: string) => void
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
        this.onStateChange?.('half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold && this.state === 'closed') {
      this.state = 'open';
      this.onStateChange?.('open');
    } else if (this.state === 'half-open') {
      this.state = 'open';
      this.onStateChange?.('open');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
    this.onStateChange?.('closed');
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Event processing error handler
 */
export class EventProcessingHandler {
  private invalidEvents = new Map<string, number>();
  private maxInvalidEvents = 10;

  processEvent(event: any): ProcessUpdateEvent | null {
    try {
      // Basic validation
      if (!this.validateEvent(event)) {
        this.recordInvalidEvent(event);
        return null;
      }

      // Process the event
      const processedEvent: ProcessUpdateEvent = {
        type: event.type,
        timestamp: event.timestamp || new Date().toISOString(),
        process: event.process,
        techStack: event.techStack,
        changes: event.changes,
        metadata: event.metadata
      };

      return processedEvent;
    } catch (error) {
      console.error('Event processing failed:', error, event);
      this.recordInvalidEvent(event);
      return null;
    }
  }

  private validateEvent(event: any): boolean {
    // Check required fields
    if (!event.type || typeof event.type !== 'string') {
      return false;
    }

    // Validate event type
    const validTypes = ['process-discovered', 'process-terminated', 'process-updated', 'process-categorized'];
    if (!validTypes.includes(event.type)) {
      return false;
    }

    // Validate timestamp if present
    if (event.timestamp && isNaN(new Date(event.timestamp).getTime())) {
      return false;
    }

    // Validate process if present
    if (event.process && typeof event.process !== 'object') {
      return false;
    }

    return true;
  }

  private recordInvalidEvent(event: any): void {
    const eventKey = JSON.stringify(event).slice(0, 100);
    const count = this.invalidEvents.get(eventKey) || 0;
    
    this.invalidEvents.set(eventKey, count + 1);
    
    // Clean up old invalid events to prevent memory leak
    if (this.invalidEvents.size > this.maxInvalidEvents) {
      const firstKey = this.invalidEvents.keys().next().value;
      this.invalidEvents.delete(firstKey);
    }
  }

  getInvalidEventCount(): number {
    return Array.from(this.invalidEvents.values()).reduce((sum, count) => sum + count, 0);
  }

  clearInvalidEvents(): void {
    this.invalidEvents.clear();
  }
}

/**
 * Connection health monitor
 */
export class ConnectionHealthMonitor {
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private pingResponseTimes: number[] = [];
  private maxPingHistory = 10;
  
  constructor(
    private onHealthChange: (health: ConnectionHealth) => void,
    private pingIntervalMs = 30000
  ) {}

  start(): void {
    this.stop();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, this.pingIntervalMs);
    
    // Initial ping
    this.ping();
  }

  stop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async ping(): Promise<void> {
    const startTime = performance.now();
    this.lastPingTime = Date.now();

    try {
      // Simple ping to check connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.recordPingTime(responseTime);
      
      const health = this.calculateHealth(response.ok, responseTime);
      this.onHealthChange(health);
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.recordPingTime(responseTime);
      
      const health = this.calculateHealth(false, responseTime);
      this.onHealthChange(health);
    }
  }

  private recordPingTime(responseTime: number): void {
    this.pingResponseTimes.push(responseTime);
    
    if (this.pingResponseTimes.length > this.maxPingHistory) {
      this.pingResponseTimes = this.pingResponseTimes.slice(-this.maxPingHistory);
    }
  }

  private calculateHealth(success: boolean, responseTime: number): ConnectionHealth {
    const avgResponseTime = this.pingResponseTimes.reduce((sum, time) => sum + time, 0) / this.pingResponseTimes.length;
    const successRate = this.pingResponseTimes.length > 0 ? 1 : 0; // Simplified for example
    
    let status: ConnectionStatus;
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (!success) {
      status = 'error';
      quality = 'poor';
    } else if (avgResponseTime < 100) {
      status = 'connected';
      quality = 'excellent';
    } else if (avgResponseTime < 300) {
      status = 'connected';
      quality = 'good';
    } else if (avgResponseTime < 1000) {
      status = 'connected';
      quality = 'fair';
    } else {
      status = 'connected';
      quality = 'poor';
    }
    
    return {
      status,
      quality,
      avgResponseTime: Math.round(avgResponseTime),
      successRate,
      lastCheck: new Date()
    };
  }
}

/**
 * Connection health interface
 */
export interface ConnectionHealth {
  status: ConnectionStatus;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  avgResponseTime: number;
  successRate: number;
  lastCheck: Date;
}

/**
 * Error notification manager
 */
export class ErrorNotificationManager {
  private notifiedErrors = new Set<string>();
  private errorCounts = new Map<string, number>();
  
  constructor(
    private onNotification: (notification: ErrorNotification) => void
  ) {}

  handleError(error: AppError): void {
    const errorKey = `${error.type}:${error.code}`;
    const count = this.errorCounts.get(errorKey) || 0;
    
    this.errorCounts.set(errorKey, count + 1);
    
    // Only notify for new errors or every 5th occurrence of the same error
    if (!this.notifiedErrors.has(errorKey) || count % 5 === 0) {
      this.notifiedErrors.add(errorKey);
      
      const notification: ErrorNotification = {
        title: this.getErrorTitle(error),
        message: error.userMessage || error.message,
        type: this.getNotificationType(error.severity),
        persistent: error.severity === ErrorSeverity.CRITICAL,
        actions: this.getErrorActions(error)
      };
      
      this.onNotification(notification);
    }
  }

  private getErrorTitle(error: AppError): string {
    const titles = {
      [ErrorType.NETWORK]: 'Connection Error',
      [ErrorType.SSE]: 'Real-time Connection Issue',
      [ErrorType.PARSING]: 'Data Processing Error',
      [ErrorType.VALIDATION]: 'Validation Error',
      [ErrorType.TIMEOUT]: 'Request Timeout',
      [ErrorType.PERMISSION]: 'Access Denied',
      [ErrorType.UNKNOWN]: 'System Error'
    };
    
    return titles[error.type] || 'Error';
  }

  private getNotificationType(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  private getErrorActions(error: AppError): ErrorAction[] {
    const actions: ErrorAction[] = [];
    
    if (error.retryable) {
      actions.push({
        label: 'Retry',
        action: 'retry'
      });
    }
    
    if (error.type === ErrorType.SSE) {
      actions.push({
        label: 'Reconnect',
        action: 'reconnect'
      });
    }
    
    return actions;
  }

  clearNotifications(): void {
    this.notifiedErrors.clear();
    this.errorCounts.clear();
  }
}

/**
 * Error notification interfaces
 */
export interface ErrorNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  persistent?: boolean;
  actions?: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  action: string;
}

// Export singleton instances
export const retryManager = new RetryManager();
export const eventProcessingHandler = new EventProcessingHandler();