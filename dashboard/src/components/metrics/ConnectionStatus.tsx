import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  retryAttempts: number;
  maxRetryAttempts?: number;
  lastPing?: string | null;
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  retryAttempts,
  maxRetryAttempts = 10,
  lastPing,
  onReconnect,
}) => {
  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (isReconnecting) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    const iconClass = `h-5 w-5 ${getStatusColor()}`;
    
    if (isConnected) {
      return <CheckCircle className={iconClass} />;
    }
    
    if (isReconnecting) {
      return <RefreshCw className={`${iconClass} animate-spin`} />;
    }
    
    return <AlertTriangle className={iconClass} />;
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Connected';
    }
    
    if (isReconnecting) {
      return `Reconnecting... (${retryAttempts}/${maxRetryAttempts})`;
    }
    
    return 'Disconnected';
  };

  const getStatusDescription = () => {
    if (isConnected && lastPing) {
      const pingTime = new Date(lastPing);
      return `Last update: ${format(pingTime, 'HH:mm:ss')}`;
    }
    
    if (isReconnecting) {
      return `Attempting to reconnect to metrics stream`;
    }
    
    if (retryAttempts >= maxRetryAttempts) {
      return 'Maximum retry attempts reached. Click to retry.';
    }
    
    return 'Real-time metrics are not available';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Connection Status</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-3">
          {/* Status Description */}
          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {getStatusDescription()}
            </p>
          </div>

          {/* Connection Quality Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection Quality</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {isConnected ? 'Excellent' : isReconnecting ? 'Degraded' : 'Poor'}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isConnected
                    ? 'bg-green-500 w-full'
                    : isReconnecting
                    ? 'bg-yellow-500 w-2/3 animate-pulse'
                    : 'bg-red-500 w-1/3'
                }`}
              />
            </div>
          </div>

          {/* Retry Information */}
          {(isReconnecting || retryAttempts > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Retry Attempts</span>
                <span className="text-foreground">
                  {retryAttempts}/{maxRetryAttempts}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div
                  className="h-1 bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${(retryAttempts / maxRetryAttempts) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Connection Actions */}
          <div className="flex flex-col space-y-2">
            {!isConnected && !isReconnecting && (
              <button
                onClick={onReconnect}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reconnect</span>
              </button>
            )}
            
            {isReconnecting && (
              <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-muted text-muted-foreground rounded-md">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Reconnecting...</span>
              </div>
            )}
            
            {isConnected && (
              <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md">
                <Wifi className="h-4 w-4" />
                <span>Real-time updates active</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details (collapsible) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Technical Details
          </summary>
          <div className="mt-2 pt-2 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Transport:</span>
              <span>Server-Sent Events / WebSocket</span>
            </div>
            <div className="flex justify-between">
              <span>Retry Strategy:</span>
              <span>Exponential backoff with jitter</span>
            </div>
            <div className="flex justify-between">
              <span>Max Attempts:</span>
              <span>{maxRetryAttempts}</span>
            </div>
            {lastPing && (
              <div className="flex justify-between">
                <span>Last Message:</span>
                <span>{format(new Date(lastPing), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ConnectionStatus;