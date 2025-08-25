/**
 * Connection Status Monitor Component
 * 
 * Real-time connection health monitoring for the process activity feed:
 * - Connection status indicators (connected, connecting, disconnected, error)
 * - Auto-refresh status and interval display
 * - Last update timestamp
 * - Reconnection controls and status
 * - Network health indicators
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ConnectionStatus } from '../../types';
import { cn } from '../../utils/cn';

interface ConnectionStatusMonitorProps {
  connectionStatus: ConnectionStatus;
  lastUpdate?: Date;
  autoRefresh?: boolean;
  updateInterval?: number;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  onReconnect?: () => void;
  onToggleAutoRefresh?: () => void;
  showControls?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Connection status configuration
 */
const CONNECTION_STATUS_CONFIG = {
  connected: {
    label: 'Connected',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    description: 'Real-time connection is active',
    animationClass: 'animate-pulse'
  },
  connecting: {
    label: 'Connecting',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    description: 'Establishing real-time connection',
    animationClass: 'animate-bounce'
  },
  disconnected: {
    label: 'Disconnected',
    icon: '⚫',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-300 dark:border-gray-700',
    description: 'Real-time connection is not active',
    animationClass: ''
  },
  error: {
    label: 'Error',
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    description: 'Connection error - attempting to reconnect',
    animationClass: 'animate-pulse'
  }
} as const;

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  sm: {
    container: 'text-xs',
    badge: 'px-2 py-1 text-xs',
    icon: 'text-sm',
    button: 'px-2 py-1 text-xs',
    gap: 'gap-2'
  },
  md: {
    container: 'text-sm',
    badge: 'px-2.5 py-1 text-sm',
    icon: 'text-base',
    button: 'px-3 py-1.5 text-sm',
    gap: 'gap-3'
  },
  lg: {
    container: 'text-base',
    badge: 'px-3 py-1.5 text-base',
    icon: 'text-lg',
    button: 'px-4 py-2 text-base',
    gap: 'gap-4'
  }
} as const;

/**
 * Connection Status Badge Component
 */
interface StatusBadgeProps {
  status: ConnectionStatus;
  size: 'sm' | 'md' | 'lg';
  showAnimation: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size, showAnimation }) => {
  const config = CONNECTION_STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeConfig.badge,
        sizeConfig.gap
      )}
      title={config.description}
    >
      <span className={cn(
        sizeConfig.icon,
        showAnimation && config.animationClass
      )}>
        {config.icon}
      </span>
      <span className="font-semibold">
        {config.label}
      </span>
    </div>
  );
};

/**
 * Auto-refresh Indicator Component
 */
interface AutoRefreshIndicatorProps {
  isEnabled: boolean;
  interval: number;
  size: 'sm' | 'md' | 'lg';
  onToggle?: () => void;
}

const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({ 
  isEnabled, 
  interval, 
  size,
  onToggle 
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  const intervalSeconds = Math.floor(interval / 1000);
  
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        className={cn(
          'inline-flex items-center font-medium rounded-full border transition-colors',
          sizeConfig.badge,
          isEnabled 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
          onToggle && 'hover:opacity-75 cursor-pointer'
        )}
        title={`Auto-refresh is ${isEnabled ? 'enabled' : 'disabled'}. Click to toggle.`}
        disabled={!onToggle}
      >
        <span className={cn(
          sizeConfig.icon,
          isEnabled && 'animate-spin'
        )}>
          🔄
        </span>
        <span className="font-semibold ml-1">
          {isEnabled ? `${intervalSeconds}s` : 'Off'}
        </span>
      </button>
    </div>
  );
};

/**
 * Reconnection Status Component
 */
interface ReconnectionStatusProps {
  reconnectAttempts: number;
  maxAttempts: number;
  isReconnecting: boolean;
  size: 'sm' | 'md' | 'lg';
  onReconnect?: () => void;
}

const ReconnectionStatus: React.FC<ReconnectionStatusProps> = ({
  reconnectAttempts,
  maxAttempts,
  isReconnecting,
  size,
  onReconnect
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  
  if (reconnectAttempts === 0) return null;
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'inline-flex items-center font-medium rounded-full border',
        'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
        sizeConfig.badge
      )}>
        <span className={cn(
          sizeConfig.icon,
          isReconnecting && 'animate-spin'
        )}>
          🔄
        </span>
        <span className="font-semibold ml-1">
          {reconnectAttempts}/{maxAttempts}
        </span>
      </div>
      
      {onReconnect && !isReconnecting && (
        <button
          onClick={onReconnect}
          className={cn(
            'font-medium rounded-md border transition-colors',
            'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
            sizeConfig.button
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Last Update Timestamp Component
 */
interface LastUpdateProps {
  lastUpdate?: Date;
  size: 'sm' | 'md' | 'lg';
}

const LastUpdate: React.FC<LastUpdateProps> = ({ lastUpdate, size }) => {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const sizeConfig = SIZE_CONFIG[size];
  
  // Update relative time every second
  useEffect(() => {
    if (!lastUpdate) return;
    
    const updateRelativeTime = () => {
      const now = Date.now();
      const updateTime = lastUpdate.getTime();
      const diff = now - updateTime;
      
      if (diff < 1000) {
        setRelativeTime('just now');
      } else if (diff < 60000) {
        setRelativeTime(`${Math.floor(diff / 1000)}s ago`);
      } else if (diff < 3600000) {
        setRelativeTime(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setRelativeTime(`${Math.floor(diff / 3600000)}h ago`);
      }
    };
    
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdate]);
  
  if (!lastUpdate) return null;
  
  return (
    <div
      className={cn(
        'text-muted-foreground',
        sizeConfig.container
      )}
      title={`Last updated: ${lastUpdate.toLocaleString()}`}
    >
      Updated: {relativeTime}
    </div>
  );
};

/**
 * Network Health Indicator Component
 */
interface NetworkHealthProps {
  connectionStatus: ConnectionStatus;
  lastUpdate?: Date;
  size: 'sm' | 'md' | 'lg';
}

const NetworkHealth: React.FC<NetworkHealthProps> = ({ connectionStatus, lastUpdate, size }) => {
  const sizeConfig = SIZE_CONFIG[size];
  
  // Calculate network health based on connection status and update recency
  const networkHealth = useMemo(() => {
    if (connectionStatus === 'connected' && lastUpdate) {
      const timeSinceUpdate = Date.now() - lastUpdate.getTime();
      if (timeSinceUpdate < 10000) return 'excellent';
      if (timeSinceUpdate < 30000) return 'good';
      return 'fair';
    }
    
    if (connectionStatus === 'connecting') return 'connecting';
    if (connectionStatus === 'error') return 'poor';
    return 'offline';
  }, [connectionStatus, lastUpdate]);
  
  const healthConfig = {
    excellent: { icon: '📶', color: 'text-green-600', label: 'Excellent' },
    good: { icon: '📶', color: 'text-blue-600', label: 'Good' },
    fair: { icon: '📶', color: 'text-yellow-600', label: 'Fair' },
    connecting: { icon: '📶', color: 'text-yellow-600', label: 'Connecting' },
    poor: { icon: '📶', color: 'text-red-600', label: 'Poor' },
    offline: { icon: '📵', color: 'text-gray-600', label: 'Offline' }
  } as const;
  
  const config = healthConfig[networkHealth];
  
  return (
    <div 
      className={cn(
        'flex items-center gap-1',
        config.color,
        sizeConfig.container
      )}
      title={`Network health: ${config.label}`}
    >
      <span className={sizeConfig.icon}>
        {config.icon}
      </span>
      {size !== 'sm' && (
        <span className="text-xs">
          {config.label}
        </span>
      )}
    </div>
  );
};

/**
 * Main ConnectionStatusMonitor Component
 */
export const ConnectionStatusMonitor: React.FC<ConnectionStatusMonitorProps> = ({
  connectionStatus,
  lastUpdate,
  autoRefresh = false,
  updateInterval = 5000,
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  onReconnect,
  onToggleAutoRefresh,
  showControls = true,
  showDetails = true,
  size = 'md',
  className
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Auto-disable animations after a period to reduce distraction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [connectionStatus]);
  
  const isReconnecting = connectionStatus === 'connecting' && reconnectAttempts > 0;
  
  return (
    <div className={cn(
      'flex items-center',
      sizeConfig.gap,
      className
    )}>
      {/* Primary Status Badge */}
      <StatusBadge
        status={connectionStatus}
        size={size}
        showAnimation={showAnimation}
      />
      
      {/* Auto-refresh Indicator */}
      {showControls && (
        <AutoRefreshIndicator
          isEnabled={autoRefresh}
          interval={updateInterval}
          size={size}
          onToggle={onToggleAutoRefresh}
        />
      )}
      
      {/* Reconnection Status */}
      {reconnectAttempts > 0 && (
        <ReconnectionStatus
          reconnectAttempts={reconnectAttempts}
          maxAttempts={maxReconnectAttempts}
          isReconnecting={isReconnecting}
          size={size}
          onReconnect={onReconnect}
        />
      )}
      
      {/* Network Health */}
      {showDetails && (
        <NetworkHealth
          connectionStatus={connectionStatus}
          lastUpdate={lastUpdate}
          size={size}
        />
      )}
      
      {/* Last Update Timestamp */}
      {showDetails && (
        <LastUpdate
          lastUpdate={lastUpdate}
          size={size}
        />
      )}
    </div>
  );
};

/**
 * Compact version for status bars
 */
export const CompactConnectionStatusMonitor: React.FC<Omit<ConnectionStatusMonitorProps, 'size' | 'showControls' | 'showDetails'>> = (props) => (
  <ConnectionStatusMonitor {...props} size="sm" showControls={false} showDetails={false} />
);

/**
 * Detailed version for monitoring panels
 */
export const DetailedConnectionStatusMonitor: React.FC<Omit<ConnectionStatusMonitorProps, 'size'>> = (props) => (
  <ConnectionStatusMonitor {...props} size="lg" />
);

export default ConnectionStatusMonitor;