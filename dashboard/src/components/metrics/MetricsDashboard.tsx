import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, BarChart3, Settings, Download, AlertTriangle } from 'lucide-react';

import MetricsControls, { MetricsControlsOptions, TimeRange } from './MetricsControls';
import OptimizedChart, { ChartSeries } from './OptimizedChart';
import VirtualizedChart from './VirtualizedChart';
import MetricsExport from './MetricsExport';
import AlertBadge, { AlertSummary } from './AlertBadge';

import { useAlerts } from '../../hooks/useAlerts';
import { useMetricsExport } from '../../hooks/useMetricsExport';
import { useTheme } from '../../hooks/useTheme';
import { metricsAggregator } from '../../services/metrics-aggregator';
import { DataPoint } from '../../utils/lttb';

export interface MetricsDashboardProps {
  containerIds?: string[];
  autoStart?: boolean;
  refreshInterval?: number;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

interface MetricsData {
  [containerId: string]: {
    cpu: DataPoint[];
    memory: DataPoint[];
    network: DataPoint[];
    disk: DataPoint[];
  };
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  containerIds = [],
  autoStart = true,
  refreshInterval = 5000,
  theme = 'auto',
  className = ''
}) => {
  const [metricsData, setMetricsData] = useState<MetricsData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default controls options
  const [controlsOptions, setControlsOptions] = useState<MetricsControlsOptions>({
    refreshInterval: refreshInterval,
    autoRefresh: autoStart,
    selectedContainers: containerIds,
    selectedMetrics: ['cpu', 'memory', 'network', 'disk'],
    timeRange: {
      start: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      end: new Date(),
      label: 'Last 30 minutes'
    },
    aggregation: '1m',
    theme: theme as any
  });

  const resolvedTheme = useTheme(theme);

  // Initialize alerts system
  const {
    activeAlerts,
    addThreshold,
    checkValue,
    getAlertStats
  } = useAlerts({
    persistThresholds: true,
    autoResolveTimeout: 300000, // 5 minutes
    onAlert: (alert) => {
      console.log('Alert triggered:', alert);
    }
  });

  // Initialize export functionality
  const { exportMetrics, isExporting } = useMetricsExport({
    onComplete: (filename) => {
      console.log('Export completed:', filename);
    }
  });

  // Set up default alert thresholds
  useEffect(() => {
    // CPU usage > 80%
    addThreshold({
      metricType: 'cpu',
      operator: 'gt',
      value: 80,
      severity: 'warning',
      message: 'High CPU usage detected',
      enabled: true
    });

    // Memory usage > 90%
    addThreshold({
      metricType: 'memory',
      operator: 'gt',
      value: 90,
      severity: 'error',
      message: 'High memory usage detected',
      enabled: true
    });

    // Critical CPU usage > 95%
    addThreshold({
      metricType: 'cpu',
      operator: 'gt',
      value: 95,
      severity: 'critical',
      message: 'Critical CPU usage - immediate attention required',
      enabled: true
    });
  }, [addThreshold]);

  // Generate mock metrics data
  const generateMockData = useCallback((containerId: string, timeRange: TimeRange) => {
    const startTime = timeRange.start.getTime();
    const endTime = timeRange.end.getTime();
    const interval = 60000; // 1 minute intervals
    const dataPoints: DataPoint[] = [];

    for (let time = startTime; time <= endTime; time += interval) {
      dataPoints.push({ x: time, y: Math.random() * 100 });
    }

    return dataPoints;
  }, []);

  // Fetch metrics data
  const fetchMetrics = useCallback(async () => {
    if (controlsOptions.selectedContainers.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData: MetricsData = {};
      
      for (const containerId of controlsOptions.selectedContainers) {
        newData[containerId] = {
          cpu: generateMockData(containerId, controlsOptions.timeRange),
          memory: generateMockData(containerId, controlsOptions.timeRange),
          network: generateMockData(containerId, controlsOptions.timeRange),
          disk: generateMockData(containerId, controlsOptions.timeRange)
        };

        // Add data to aggregator
        Object.entries(newData[containerId]).forEach(([metricType, data]) => {
          data.forEach(point => {
            metricsAggregator.addMetric(point.x, point.y, containerId, metricType);
            
            // Check for alerts
            if (controlsOptions.selectedMetrics.includes(metricType)) {
              checkValue(metricType, point.y, containerId);
            }
          });
        });
      }

      setMetricsData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setIsLoading(false);
    }
  }, [controlsOptions, generateMockData, checkValue]);

  // Auto refresh effect
  useEffect(() => {
    if (!controlsOptions.autoRefresh) return;

    const interval = setInterval(fetchMetrics, controlsOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [controlsOptions.autoRefresh, controlsOptions.refreshInterval, fetchMetrics]);

  // Initial data fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Convert metrics data to chart series
  const chartSeries: ChartSeries[] = useMemo(() => {
    const series: ChartSeries[] = [];
    const colors = {
      cpu: '#3b82f6',      // Blue
      memory: '#10b981',    // Green
      network: '#8b5cf6',   // Purple
      disk: '#f59e0b'       // Orange
    };

    Object.entries(metricsData).forEach(([containerId, metrics]) => {
      controlsOptions.selectedMetrics.forEach(metricType => {
        if (metricType in metrics) {
          series.push({
            id: `${containerId}-${metricType}`,
            name: `${containerId.slice(0, 12)} - ${metricType.toUpperCase()}`,
            data: metrics[metricType as keyof typeof metrics],
            color: colors[metricType as keyof typeof colors],
            unit: metricType === 'cpu' ? '%' : metricType === 'memory' ? 'MB' : 'KB/s',
            visible: true
          });
        }
      });
    });

    return series;
  }, [metricsData, controlsOptions.selectedMetrics]);

  const handleControlsChange = useCallback((updates: Partial<MetricsControlsOptions>) => {
    setControlsOptions(prev => ({ ...prev, ...updates }));
    
    // Refetch data if time range or containers changed
    if (updates.timeRange || updates.selectedContainers) {
      fetchMetrics();
    }
  }, [fetchMetrics]);

  const handleSeriesToggle = useCallback((seriesId: string, visible: boolean) => {
    // This would be handled by updating the series visibility
    console.log('Toggle series:', seriesId, visible);
  }, []);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const alertStats = getAlertStats();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with alerts */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      `}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Container Metrics
            </h1>
          </div>

          {/* View mode toggle */}
          <div className={`flex rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
            <button
              onClick={() => setViewMode('chart')}
              className={`
                px-3 py-1 text-sm rounded-l-lg transition-colors
                ${viewMode === 'chart'
                  ? resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-3 py-1 text-sm rounded-r-lg transition-colors
                ${viewMode === 'list'
                  ? resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts summary */}
        {activeAlerts.length > 0 && (
          <AlertSummary
            alerts={activeAlerts}
            maxVisible={3}
            className="max-w-md"
          />
        )}
      </div>

      {/* Controls */}
      <MetricsControls
        options={controlsOptions}
        containerIds={containerIds}
        onOptionsChange={handleControlsChange}
        onRefresh={fetchMetrics}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* Error display */}
      {error && (
        <div className={`
          mx-4 mt-4 p-3 rounded-lg border-l-4 border-red-500
          ${resolvedTheme === 'dark' ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-800'}
        `}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Error loading metrics</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chart' ? (
          <div className="h-full p-4">
            {chartSeries.length > 0 ? (
              <OptimizedChart
                series={chartSeries}
                width={800}
                height={500}
                showGrid={true}
                showTooltip={true}
                showLegend={true}
                enableZoom={true}
                enablePan={true}
                theme={theme}
                className="w-full h-full"
                onDataPointClick={(point, series) => {
                  console.log('Data point clicked:', point, series);
                }}
              />
            ) : (
              <div className={`
                flex items-center justify-center h-full
                ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
              `}>
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                  <p className="text-sm">
                    Select containers and metrics to view the chart
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            <VirtualizedChart
              series={chartSeries}
              width={800}
              height={600}
              showMiniChart={true}
              enableSelection={true}
              theme={theme}
              onSeriesToggle={handleSeriesToggle}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MetricsExport
              containerIds={controlsOptions.selectedContainers}
              availableMetrics={controlsOptions.selectedMetrics}
              onExportComplete={(filename) => {
                setShowExport(false);
                console.log('Export completed:', filename);
              }}
              onExportError={(error) => {
                console.error('Export error:', error);
              }}
            />
          </div>
        </div>
      )}

      {/* Performance stats (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`
          px-4 py-2 text-xs border-t
          ${resolvedTheme === 'dark' 
            ? 'bg-gray-900 border-gray-700 text-gray-400' 
            : 'bg-gray-50 border-gray-200 text-gray-600'
          }
        `}>
          <div className="flex items-center justify-between">
            <div>
              Series: {chartSeries.length} | 
              Data Points: {chartSeries.reduce((sum, s) => sum + s.data.length, 0)} |
              Active Alerts: {alertStats.active}
            </div>
            <div>
              Render Mode: {viewMode} | 
              Theme: {resolvedTheme} | 
              Loading: {isLoading ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;