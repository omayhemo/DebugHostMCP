import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, AlertThreshold, AlertSeverity, AlertStatus } from '../components/metrics/AlertBadge';

export interface UseAlertsOptions {
  persistThresholds?: boolean;
  autoResolveTimeout?: number; // milliseconds
  maxAlerts?: number;
  onAlert?: (alert: Alert) => void;
  onResolve?: (alert: Alert) => void;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  thresholds: AlertThreshold[];
  cooldownPeriod: number; // minutes
  autoResolve: boolean;
  autoResolveTimeout: number; // minutes
}

export interface UseAlertsResult {
  alerts: Alert[];
  thresholds: AlertThreshold[];
  activeAlerts: Alert[];
  resolvedAlerts: Alert[];
  suppressedAlerts: Alert[];
  
  // Threshold management
  addThreshold: (threshold: Omit<AlertThreshold, 'id'>) => string;
  updateThreshold: (id: string, updates: Partial<AlertThreshold>) => void;
  removeThreshold: (id: string) => void;
  toggleThreshold: (id: string, enabled: boolean) => void;
  
  // Alert management
  checkValue: (metricType: string, value: number, containerId?: string) => Alert[];
  suppressAlert: (alertId: string, minutes: number) => void;
  resolveAlert: (alertId: string) => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Bulk operations
  suppressAllAlerts: (minutes: number) => void;
  resolveAllAlerts: () => void;
  
  // Statistics
  getAlertStats: () => {
    total: number;
    active: number;
    resolved: number;
    suppressed: number;
    bySeverity: Record<AlertSeverity, number>;
  };
}

const STORAGE_KEY = 'apm-debug-host-alert-thresholds';

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsResult {
  const {
    persistThresholds = true,
    autoResolveTimeout = 300000, // 5 minutes
    maxAlerts = 1000,
    onAlert,
    onResolve
  } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const alertCounters = useRef<Map<string, number>>(new Map());
  const lastTriggerTimes = useRef<Map<string, number>>(new Map());

  // Load persisted thresholds on mount
  useEffect(() => {
    if (persistThresholds) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedThresholds = JSON.parse(stored);
          setThresholds(parsedThresholds);
        }
      } catch (error) {
        console.error('Failed to load alert thresholds:', error);
      }
    }
  }, [persistThresholds]);

  // Persist thresholds when they change
  useEffect(() => {
    if (persistThresholds && thresholds.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
      } catch (error) {
        console.error('Failed to persist alert thresholds:', error);
      }
    }
  }, [thresholds, persistThresholds]);

  // Auto-resolve alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(current => {
        const now = Date.now();
        return current.map(alert => {
          if (
            alert.status === 'active' &&
            now - alert.triggeredAt.getTime() > autoResolveTimeout
          ) {
            const resolved = { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() };
            onResolve?.(resolved);
            return resolved;
          }
          
          // Remove suppression if expired
          if (
            alert.status === 'suppressed' &&
            alert.suppressedUntil &&
            now > alert.suppressedUntil.getTime()
          ) {
            return { ...alert, status: 'resolved' as AlertStatus, suppressedUntil: undefined };
          }
          
          return alert;
        });
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [autoResolveTimeout, onResolve]);

  const generateId = (): string => {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addThreshold = useCallback((threshold: Omit<AlertThreshold, 'id'>): string => {
    const id = generateId();
    const newThreshold: AlertThreshold = { ...threshold, id };
    
    setThresholds(current => [...current, newThreshold]);
    return id;
  }, []);

  const updateThreshold = useCallback((id: string, updates: Partial<AlertThreshold>) => {
    setThresholds(current =>
      current.map(threshold =>
        threshold.id === id ? { ...threshold, ...updates } : threshold
      )
    );
  }, []);

  const removeThreshold = useCallback((id: string) => {
    setThresholds(current => current.filter(threshold => threshold.id !== id));
    
    // Remove related alerts
    setAlerts(current => current.filter(alert => alert.threshold.id !== id));
  }, []);

  const toggleThreshold = useCallback((id: string, enabled: boolean) => {
    updateThreshold(id, { enabled });
    
    // Resolve all alerts for disabled thresholds
    if (!enabled) {
      setAlerts(current =>
        current.map(alert =>
          alert.threshold.id === id && alert.status === 'active'
            ? { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() }
            : alert
        )
      );
    }
  }, [updateThreshold]);

  const checkValue = useCallback((
    metricType: string,
    value: number,
    containerId?: string
  ): Alert[] => {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();

    // Find matching thresholds
    const matchingThresholds = thresholds.filter(threshold =>
      threshold.enabled &&
      threshold.metricType === metricType &&
      (!threshold.containerId || threshold.containerId === containerId)
    );

    for (const threshold of matchingThresholds) {
      const thresholdKey = `${threshold.id}_${containerId || 'global'}`;
      
      // Check if threshold is triggered
      let isTriggered = false;
      
      switch (threshold.operator) {
        case 'gt':
          isTriggered = value > threshold.value;
          break;
        case 'gte':
          isTriggered = value >= threshold.value;
          break;
        case 'lt':
          isTriggered = value < threshold.value;
          break;
        case 'lte':
          isTriggered = value <= threshold.value;
          break;
        case 'eq':
          isTriggered = value === threshold.value;
          break;
        case 'neq':
          isTriggered = value !== threshold.value;
          break;
      }

      if (isTriggered) {
        // Check cooldown period
        const lastTrigger = lastTriggerTimes.current.get(thresholdKey) || 0;
        const cooldownMs = (threshold.suppressDuration || 5) * 60000; // Default 5 minutes
        
        if (now - lastTrigger < cooldownMs) {
          continue; // Skip due to cooldown
        }

        // Check if alert already exists and is active
        const existingAlert = alerts.find(alert =>
          alert.threshold.id === threshold.id &&
          alert.status === 'active' &&
          (!containerId || alert.threshold.containerId === containerId)
        );

        if (existingAlert) {
          // Update existing alert
          const updatedAlert = {
            ...existingAlert,
            currentValue: value,
            count: existingAlert.count + 1
          };
          
          setAlerts(current =>
            current.map(alert => alert.id === existingAlert.id ? updatedAlert : alert)
          );
          
          triggeredAlerts.push(updatedAlert);
        } else {
          // Create new alert
          const alertId = generateId();
          const newAlert: Alert = {
            id: alertId,
            threshold: { ...threshold },
            currentValue: value,
            triggeredAt: new Date(),
            status: 'active',
            count: 1
          };

          setAlerts(current => {
            const newAlerts = [...current, newAlert];
            
            // Limit total alerts
            if (newAlerts.length > maxAlerts) {
              return newAlerts.slice(-maxAlerts);
            }
            
            return newAlerts;
          });

          triggeredAlerts.push(newAlert);
          onAlert?.(newAlert);
        }

        // Update counters and timestamps
        alertCounters.current.set(thresholdKey, (alertCounters.current.get(thresholdKey) || 0) + 1);
        lastTriggerTimes.current.set(thresholdKey, now);
      } else {
        // Check for resolution of existing alerts
        const existingAlert = alerts.find(alert =>
          alert.threshold.id === threshold.id &&
          alert.status === 'active' &&
          (!containerId || alert.threshold.containerId === containerId)
        );

        if (existingAlert) {
          const resolvedAlert = {
            ...existingAlert,
            status: 'resolved' as AlertStatus,
            resolvedAt: new Date()
          };

          setAlerts(current =>
            current.map(alert => alert.id === existingAlert.id ? resolvedAlert : alert)
          );

          onResolve?.(resolvedAlert);
        }
      }
    }

    return triggeredAlerts;
  }, [thresholds, alerts, maxAlerts, onAlert, onResolve]);

  const suppressAlert = useCallback((alertId: string, minutes: number) => {
    setAlerts(current =>
      current.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              status: 'suppressed' as AlertStatus,
              suppressedUntil: new Date(Date.now() + minutes * 60000)
            }
          : alert
      )
    );
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(current =>
      current.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() }
          : alert
      )
    );
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(current => current.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    alertCounters.current.clear();
    lastTriggerTimes.current.clear();
  }, []);

  const suppressAllAlerts = useCallback((minutes: number) => {
    const suppressedUntil = new Date(Date.now() + minutes * 60000);
    
    setAlerts(current =>
      current.map(alert =>
        alert.status === 'active'
          ? { ...alert, status: 'suppressed' as AlertStatus, suppressedUntil }
          : alert
      )
    );
  }, []);

  const resolveAllAlerts = useCallback(() => {
    const now = new Date();
    
    setAlerts(current =>
      current.map(alert =>
        alert.status === 'active'
          ? { ...alert, status: 'resolved' as AlertStatus, resolvedAt: now }
          : alert
      )
    );
  }, []);

  const getAlertStats = useCallback(() => {
    const stats = {
      total: alerts.length,
      active: 0,
      resolved: 0,
      suppressed: 0,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
        success: 0
      } as Record<AlertSeverity, number>
    };

    alerts.forEach(alert => {
      switch (alert.status) {
        case 'active':
          stats.active++;
          break;
        case 'resolved':
          stats.resolved++;
          break;
        case 'suppressed':
          stats.suppressed++;
          break;
      }

      stats.bySeverity[alert.threshold.severity]++;
    });

    return stats;
  }, [alerts]);

  // Computed values
  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');
  const suppressedAlerts = alerts.filter(alert => alert.status === 'suppressed');

  return {
    alerts,
    thresholds,
    activeAlerts,
    resolvedAlerts,
    suppressedAlerts,
    
    addThreshold,
    updateThreshold,
    removeThreshold,
    toggleThreshold,
    
    checkValue,
    suppressAlert,
    resolveAlert,
    clearAlert,
    clearAllAlerts,
    suppressAllAlerts,
    resolveAllAlerts,
    
    getAlertStats
  };
}