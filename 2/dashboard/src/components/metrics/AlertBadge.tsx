import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Bell, BellOff } from 'lucide-react';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical' | 'success';
export type AlertStatus = 'active' | 'resolved' | 'suppressed';

export interface AlertThreshold {
  id: string;
  metricType: string;
  containerId?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number;
  severity: AlertSeverity;
  message: string;
  enabled: boolean;
  suppressDuration?: number; // minutes
}

export interface Alert {
  id: string;
  threshold: AlertThreshold;
  currentValue: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: AlertStatus;
  suppressedUntil?: Date;
  count: number; // Number of consecutive triggers
}

interface AlertBadgeProps {
  alert: Alert;
  onClick?: (alert: Alert) => void;
  onSuppress?: (alert: Alert, minutes: number) => void;
  onResolve?: (alert: Alert) => void;
  showDetails?: boolean;
  className?: string;
}

const severityConfig = {
  info: {
    icon: AlertCircle,
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-800',
    pulseColor: 'bg-blue-400'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    pulseColor: 'bg-yellow-400'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-800 dark:text-red-200',
    borderColor: 'border-red-200 dark:border-red-800',
    pulseColor: 'bg-red-400'
  },
  critical: {
    icon: XCircle,
    bgColor: 'bg-red-200 dark:bg-red-900/40',
    textColor: 'text-red-900 dark:text-red-100',
    borderColor: 'border-red-400 dark:border-red-600',
    pulseColor: 'bg-red-500'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-800 dark:text-green-200',
    borderColor: 'border-green-200 dark:border-green-800',
    pulseColor: 'bg-green-400'
  }
};

const statusConfig = {
  active: {
    label: 'Active',
    pulseAnimation: 'animate-pulse'
  },
  resolved: {
    label: 'Resolved',
    pulseAnimation: ''
  },
  suppressed: {
    label: 'Suppressed',
    pulseAnimation: ''
  }
};

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  alert,
  onClick,
  onSuppress,
  onResolve,
  showDetails = false,
  className = ''
}) => {
  const config = severityConfig[alert.threshold.severity];
  const statusInfo = statusConfig[alert.status];
  const Icon = config.icon;

  const formatValue = (value: number): string => {
    if (value >= 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    } else if (value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    } else if (value >= 1024) {
      return `${(value / 1024).toFixed(1)}KB`;
    } else if (value >= 1) {
      return `${value.toFixed(1)}`;
    } else {
      return `${(value * 100).toFixed(1)}%`;
    }
  };

  const formatDuration = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isActive = alert.status === 'active';
  const isSuppressed = alert.status === 'suppressed';

  return (
    <div
      className={`
        relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      onClick={() => onClick?.(alert)}
    >
      {/* Pulse indicator for active alerts */}
      {isActive && (
        <div
          className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full
            ${config.pulseColor} ${statusInfo.pulseAnimation}
          `}
        />
      )}

      {/* Main icon */}
      <Icon className="w-4 h-4 flex-shrink-0" />

      {/* Alert content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Severity and status */}
          <span className="text-sm font-medium capitalize">
            {alert.threshold.severity}
          </span>
          
          {isSuppressed && <BellOff className="w-3 h-3 opacity-60" />}
          
          {/* Count badge for recurring alerts */}
          {alert.count > 1 && (
            <span className="px-1.5 py-0.5 text-xs bg-black/10 dark:bg-white/10 rounded">
              {alert.count}x
            </span>
          )}
        </div>

        {/* Alert message */}
        <div className="text-sm truncate" title={alert.threshold.message}>
          {alert.threshold.message}
        </div>

        {/* Details when expanded */}
        {showDetails && (
          <div className="mt-2 text-xs opacity-80 space-y-1">
            <div>
              Current: {formatValue(alert.currentValue)} 
              {' '}{alert.threshold.operator}{' '}
              {formatValue(alert.threshold.value)}
            </div>
            <div>
              Triggered: {formatDuration(alert.triggeredAt)}
            </div>
            {alert.threshold.containerId && (
              <div>Container: {alert.threshold.containerId.slice(0, 12)}</div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(onSuppress || onResolve) && (
        <div className="flex items-center gap-1 ml-2">
          {onSuppress && isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSuppress(alert, 15); // Default 15 minutes
              }}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
              title="Suppress for 15 minutes"
            >
              <BellOff className="w-3 h-3" />
            </button>
          )}
          
          {onResolve && isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(alert);
              }}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
              title="Mark as resolved"
            >
              <CheckCircle className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Alert summary component for showing multiple alerts
interface AlertSummaryProps {
  alerts: Alert[];
  maxVisible?: number;
  onClick?: () => void;
  className?: string;
}

export const AlertSummary: React.FC<AlertSummaryProps> = ({
  alerts,
  maxVisible = 3,
  onClick,
  className = ''
}) => {
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.threshold.severity === 'critical').length;
  const errorCount = activeAlerts.filter(a => a.threshold.severity === 'error').length;
  const warningCount = activeAlerts.filter(a => a.threshold.severity === 'warning').length;

  if (activeAlerts.length === 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">All systems normal</span>
      </div>
    );
  }

  const visibleAlerts = activeAlerts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeAlerts.length - maxVisible);

  return (
    <div
      className={`space-y-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Summary stats */}
      <div className="flex items-center gap-3 text-sm">
        <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
        </span>
        {criticalCount > 0 && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-xs">
            {criticalCount} critical
          </span>
        )}
        {errorCount > 0 && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs">
            {errorCount} error
          </span>
        )}
        {warningCount > 0 && (
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded text-xs">
            {warningCount} warning
          </span>
        )}
      </div>

      {/* Visible alerts */}
      <div className="space-y-1">
        {visibleAlerts.map(alert => (
          <AlertBadge key={alert.id} alert={alert} />
        ))}
        
        {hiddenCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 px-3 py-1">
            +{hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertBadge;