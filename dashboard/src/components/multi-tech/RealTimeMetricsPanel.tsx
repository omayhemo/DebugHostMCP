/**
 * Real-Time Metrics Panel Component
 * 
 * Performance monitoring display for the process monitoring UI:
 * - CPU and memory usage in real-time
 * - Process count trends
 * - Port utilization monitoring
 * - Health status indicators
 * - Alert thresholds and notifications
 * - Mini-charts for trend visualization
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from '../../store';
import { SystemHealthMetrics, TechStackSummary, TechStack } from '../../types';
import { cn } from '../../utils/cn';

interface RealTimeMetricsPanelProps {
  techStack?: TechStack | 'all';
  showTrends?: boolean;
  showAlerts?: boolean;
  updateInterval?: number;
  alertThresholds?: {
    cpu?: number;
    memory?: number;
    rogueProcesses?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed' | 'dashboard';
  className?: string;
}

/**
 * Default alert thresholds
 */
const DEFAULT_THRESHOLDS = {
  cpu: 80,
  memory: 85,
  rogueProcesses: 3
};

/**
 * Metric configuration
 */
const METRICS_CONFIG = {
  cpu: {
    label: 'CPU Usage',
    icon: '🖥️',
    unit: '%',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    alertColor: 'text-red-600',
    alertBgColor: 'bg-red-50 dark:bg-red-950/30'
  },
  memory: {
    label: 'Memory',
    icon: '💾',
    unit: '%',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    alertColor: 'text-red-600',
    alertBgColor: 'bg-red-50 dark:bg-red-950/30'
  },
  processes: {
    label: 'Processes',
    icon: '⚙️',
    unit: '',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    alertColor: 'text-orange-600',
    alertBgColor: 'bg-orange-50 dark:bg-orange-950/30'
  },
  ports: {
    label: 'Port Usage',
    icon: '🔌',
    unit: '%',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    alertColor: 'text-red-600',
    alertBgColor: 'bg-red-50 dark:bg-red-950/30'
  }
} as const;

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  sm: {
    panel: 'p-3',
    metric: 'p-2',
    text: 'text-xs',
    value: 'text-lg',
    chart: 'h-8'
  },
  md: {
    panel: 'p-4',
    metric: 'p-3',
    text: 'text-sm',
    value: 'text-xl',
    chart: 'h-12'
  },
  lg: {
    panel: 'p-6',
    metric: 'p-4',
    text: 'text-base',
    value: 'text-2xl',
    chart: 'h-16'
  }
} as const;

/**
 * Mini Chart Component for trend visualization
 */
interface MiniChartProps {
  data: number[];
  max?: number;
  color?: string;
  height?: string;
  showAlert?: boolean;
  alertThreshold?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({ 
  data, 
  max = 100, 
  color = 'bg-blue-500',
  height = 'h-12',
  showAlert = false,
  alertThreshold
}) => {
  const maxValue = Math.max(...data, max);
  
  return (
    <div className={cn('flex items-end justify-between', height)}>
      {data.map((value, index) => {
        const heightPercent = (value / maxValue) * 100;
        const isAlert = showAlert && alertThreshold && value > alertThreshold;
        
        return (
          <div
            key={index}
            className={cn(
              'w-1 rounded-t transition-all duration-300',
              isAlert ? 'bg-red-500' : color,
              'opacity-70 hover:opacity-100'
            )}
            style={{ height: `${heightPercent}%` }}
            title={`${value}${index === data.length - 1 ? ' (current)' : ''}`}
          />
        );
      })}
    </div>
  );
};

/**
 * Metric Card Component
 */
interface MetricCardProps {
  type: 'cpu' | 'memory' | 'processes' | 'ports';
  value: number;
  previousValue?: number;
  trend?: number[];
  threshold?: number;
  showTrend: boolean;
  showAlert: boolean;
  size: 'sm' | 'md' | 'lg';
  variant: 'compact' | 'detailed' | 'dashboard';
}

const MetricCard: React.FC<MetricCardProps> = ({
  type,
  value,
  previousValue,
  trend = [],
  threshold,
  showTrend,
  showAlert,
  size,
  variant
}) => {
  const config = METRICS_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const isAlert = threshold ? value > threshold : false;
  const isIncreasing = previousValue ? value > previousValue : false;
  const isDecreasing = previousValue ? value < previousValue : false;
  
  const formatValue = useCallback((val: number) => {
    if (type === 'processes') {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  }, [type]);
  
  const trendIcon = useMemo(() => {
    if (!previousValue) return null;
    if (isIncreasing) return '↗️';
    if (isDecreasing) return '↘️';
    return '➡️';
  }, [isIncreasing, isDecreasing, previousValue]);
  
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-lg border',
        isAlert ? config.alertBgColor : config.bgColor,
        sizeConfig.metric
      )}>
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <div className={cn(
            'font-bold',
            isAlert ? config.alertColor : config.color,
            sizeConfig.value
          )}>
            {formatValue(value)}{config.unit}
          </div>
          {size !== 'sm' && (
            <div className={cn('opacity-75', sizeConfig.text)}>
              {config.label}
            </div>
          )}
        </div>
        {trendIcon && (
          <span className={cn(
            sizeConfig.text,
            isAlert ? config.alertColor : 'text-muted-foreground'
          )}>
            {trendIcon}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'rounded-lg border bg-card',
      isAlert && showAlert && 'ring-2 ring-red-500/20',
      sizeConfig.panel
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className={cn(
            'font-medium',
            isAlert ? config.alertColor : 'text-foreground',
            sizeConfig.text
          )}>
            {config.label}
          </span>
        </div>
        
        {showAlert && isAlert && (
          <div className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          )}>
            Alert
          </div>
        )}
      </div>
      
      {/* Value and Trend */}
      <div className="flex items-end justify-between">
        <div>
          <div className={cn(
            'font-bold leading-none',
            isAlert ? config.alertColor : config.color,
            sizeConfig.value
          )}>
            {formatValue(value)}{config.unit}
          </div>
          
          {previousValue && (
            <div className={cn(
              'flex items-center gap-1 mt-1',
              sizeConfig.text,
              isAlert ? config.alertColor : 'text-muted-foreground'
            )}>
              <span>{trendIcon}</span>
              <span>
                {isIncreasing ? '+' : ''}
                {formatValue(value - previousValue)}
              </span>
            </div>
          )}
          
          {threshold && (
            <div className={cn(
              'mt-1',
              sizeConfig.text,
              'text-muted-foreground'
            )}>
              Threshold: {threshold}{config.unit}
            </div>
          )}
        </div>
        
        {/* Mini Chart */}
        {showTrend && trend.length > 0 && (
          <div className="w-16">
            <MiniChart
              data={trend}
              color={isAlert ? 'bg-red-500' : 'bg-blue-500'}
              height={sizeConfig.chart}
              showAlert={showAlert}
              alertThreshold={threshold}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Health Status Summary Component
 */
interface HealthStatusProps {
  systemHealth: SystemHealthMetrics;
  techStackSummaries: Record<TechStack, TechStackSummary>;
  size: 'sm' | 'md' | 'lg';
}

const HealthStatus: React.FC<HealthStatusProps> = ({ 
  systemHealth, 
  techStackSummaries,
  size 
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  
  const overallHealth = useMemo(() => {
    const issues = [];
    
    if (systemHealth.status === 'error') {
      issues.push('System errors detected');
    } else if (systemHealth.status === 'warning') {
      issues.push('System warnings active');
    }
    
    if (systemHealth.rogueProcesses > 0) {
      issues.push(`${systemHealth.rogueProcesses} rogue processes`);
    }
    
    const unhealthyStacks = Object.values(techStackSummaries).filter(s => !s.health.healthy);
    if (unhealthyStacks.length > 0) {
      issues.push(`${unhealthyStacks.length} stacks have issues`);
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length === 1 ? 'warning' : 'error',
      issues
    };
  }, [systemHealth, techStackSummaries]);
  
  const statusConfig = {
    healthy: { icon: '✅', color: 'text-green-600', label: 'System Healthy' },
    warning: { icon: '⚠️', color: 'text-yellow-600', label: 'Warnings Active' },
    error: { icon: '🚨', color: 'text-red-600', label: 'Issues Detected' }
  };
  
  const config = statusConfig[overallHealth.status];
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      overallHealth.status === 'healthy' 
        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
        : overallHealth.status === 'warning'
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    )}>
      <span className="text-xl">{config.icon}</span>
      
      <div className="flex-1">
        <div className={cn(
          'font-medium',
          config.color,
          sizeConfig.text
        )}>
          {config.label}
        </div>
        
        {overallHealth.issues.length > 0 && size !== 'sm' && (
          <div className={cn(
            'text-muted-foreground mt-1',
            sizeConfig.text
          )}>
            {overallHealth.issues.join(', ')}
          </div>
        )}
      </div>
      
      {overallHealth.issues.length > 0 && (
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          'bg-background border'
        )}>
          {overallHealth.issues.length}
        </div>
      )}
    </div>
  );
};

/**
 * Main RealTimeMetricsPanel Component
 */
export const RealTimeMetricsPanel: React.FC<RealTimeMetricsPanelProps> = ({
  techStack = 'all',
  showTrends = true,
  showAlerts = true,
  alertThresholds = DEFAULT_THRESHOLDS,
  size = 'md',
  variant = 'detailed',
  className
}) => {
  const { systemHealth, techStackSummaries } = useAppSelector(state => state.multiTechDashboard);
  
  // Historical data for trends
  const [historicalData, setHistoricalData] = useState<{
    cpu: number[];
    memory: number[];
    processes: number[];
    ports: number[];
  }>({
    cpu: [],
    memory: [],
    processes: [],
    ports: []
  });
  
  // Previous values for trend calculation
  const [previousValues, setPreviousValues] = useState<{
    cpu?: number;
    memory?: number;
    processes?: number;
    ports?: number;
  }>({});
  
  // Update historical data when metrics change
  useEffect(() => {
    if (!systemHealth) return;
    
    setHistoricalData(prev => {
      const maxHistory = 20;
      
      return {
        cpu: [...prev.cpu.slice(-maxHistory + 1), systemHealth.cpu],
        memory: [...prev.memory.slice(-maxHistory + 1), systemHealth.memory],
        processes: [...prev.processes.slice(-maxHistory + 1), systemHealth.totalProcesses],
        ports: [...prev.ports.slice(-maxHistory + 1), systemHealth.portUtilization]
      };
    });
    
    // Update previous values
    setPreviousValues({
      cpu: systemHealth.cpu,
      memory: systemHealth.memory,
      processes: systemHealth.totalProcesses,
      ports: systemHealth.portUtilization
    });
  }, [systemHealth]);
  
  // Calculate tech stack specific metrics
  const techStackMetrics = useMemo(() => {
    if (!systemHealth || techStack === 'all') {
      return {
        cpu: systemHealth?.cpu || 0,
        memory: systemHealth?.memory || 0,
        processes: systemHealth?.totalProcesses || 0,
        ports: systemHealth?.portUtilization || 0
      };
    }
    
    const summary = techStackSummaries[techStack];
    if (!summary) {
      return { cpu: 0, memory: 0, processes: 0, ports: 0 };
    }
    
    // Estimate tech stack specific metrics
    const totalProcesses = Object.values(techStackSummaries).reduce((sum, s) => sum + s.totalProcesses, 0);
    const stackRatio = totalProcesses > 0 ? summary.totalProcesses / totalProcesses : 0;
    
    return {
      cpu: (systemHealth?.cpu || 0) * stackRatio,
      memory: (systemHealth?.memory || 0) * stackRatio,
      processes: summary.totalProcesses,
      ports: (systemHealth?.portUtilization || 0) * stackRatio
    };
  }, [systemHealth, techStackSummaries, techStack]);
  
  if (!systemHealth) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        'bg-card border border-border rounded-lg',
        className
      )}>
        <div className="text-4xl mb-2">📊</div>
        <h3 className="font-medium text-foreground mb-1">
          No Metrics Available
        </h3>
        <p className="text-sm text-muted-foreground">
          System health metrics are not available
        </p>
      </div>
    );
  }
  
  const sizeConfig = SIZE_CONFIG[size];
  
  if (variant === 'compact') {
    return (
      <div className={cn(
        'space-y-2',
        className
      )}>
        <MetricCard
          type="cpu"
          value={techStackMetrics.cpu}
          previousValue={previousValues.cpu}
          trend={historicalData.cpu}
          threshold={alertThresholds.cpu}
          showTrend={false}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
        
        <MetricCard
          type="memory"
          value={techStackMetrics.memory}
          previousValue={previousValues.memory}
          trend={historicalData.memory}
          threshold={alertThresholds.memory}
          showTrend={false}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Health Status Summary */}
      <HealthStatus
        systemHealth={systemHealth}
        techStackSummaries={techStackSummaries}
        size={size}
      />
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          type="cpu"
          value={techStackMetrics.cpu}
          previousValue={previousValues.cpu}
          trend={historicalData.cpu}
          threshold={alertThresholds.cpu}
          showTrend={showTrends}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
        
        <MetricCard
          type="memory"
          value={techStackMetrics.memory}
          previousValue={previousValues.memory}
          trend={historicalData.memory}
          threshold={alertThresholds.memory}
          showTrend={showTrends}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
        
        <MetricCard
          type="processes"
          value={techStackMetrics.processes}
          previousValue={previousValues.processes}
          trend={historicalData.processes}
          threshold={alertThresholds.rogueProcesses}
          showTrend={showTrends}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
        
        <MetricCard
          type="ports"
          value={techStackMetrics.ports}
          previousValue={previousValues.ports}
          trend={historicalData.ports}
          showTrend={showTrends}
          showAlert={showAlerts}
          size={size}
          variant={variant}
        />
      </div>
    </div>
  );
};

/**
 * Compact version for sidebars
 */
export const CompactRealTimeMetricsPanel: React.FC<Omit<RealTimeMetricsPanelProps, 'size' | 'variant'>> = (props) => (
  <RealTimeMetricsPanel {...props} size="sm" variant="compact" />
);

/**
 * Dashboard version for main displays
 */
export const DashboardRealTimeMetricsPanel: React.FC<Omit<RealTimeMetricsPanelProps, 'variant'>> = (props) => (
  <RealTimeMetricsPanel {...props} variant="dashboard" />
);

export default RealTimeMetricsPanel;