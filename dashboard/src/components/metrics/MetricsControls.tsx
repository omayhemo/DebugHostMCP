import React, { useState, useCallback } from 'react';
import { 
  Clock, 
  RefreshCw, 
  Pause, 
  Play, 
  Calendar, 
  ChevronDown,
  Settings,
  Filter,
  TrendingUp
} from 'lucide-react';

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface MetricsControlsOptions {
  refreshInterval: number; // milliseconds
  autoRefresh: boolean;
  selectedContainers: string[];
  selectedMetrics: string[];
  timeRange: TimeRange;
  aggregation: 'raw' | '1m' | '5m' | '15m' | '1h';
  theme: 'light' | 'dark';
}

interface MetricsControlsProps {
  options: MetricsControlsOptions;
  containerIds?: string[];
  onOptionsChange: (options: Partial<MetricsControlsOptions>) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  className?: string;
}

const timeRangePresets: TimeRange[] = [
  {
    start: new Date(Date.now() - 5 * 60 * 1000),
    end: new Date(),
    label: 'Last 5 minutes'
  },
  {
    start: new Date(Date.now() - 15 * 60 * 1000),
    end: new Date(),
    label: 'Last 15 minutes'
  },
  {
    start: new Date(Date.now() - 30 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 minutes'
  },
  {
    start: new Date(Date.now() - 60 * 60 * 1000),
    end: new Date(),
    label: 'Last hour'
  },
  {
    start: new Date(Date.now() - 6 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 6 hours'
  },
  {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 24 hours'
  },
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 7 days'
  }
];

const refreshIntervalOptions = [
  { value: 1000, label: '1 second' },
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' }
];

const aggregationOptions = [
  { value: 'raw' as const, label: 'Raw data', description: 'Show all data points' },
  { value: '1m' as const, label: '1 minute', description: 'Average per minute' },
  { value: '5m' as const, label: '5 minutes', description: 'Average per 5 minutes' },
  { value: '15m' as const, label: '15 minutes', description: 'Average per 15 minutes' },
  { value: '1h' as const, label: '1 hour', description: 'Average per hour' }
];

const metricOptions = [
  { value: 'cpu', label: 'CPU Usage', icon: '⚡', color: 'text-blue-600' },
  { value: 'memory', label: 'Memory Usage', icon: '💾', color: 'text-green-600' },
  { value: 'network', label: 'Network I/O', icon: '🌐', color: 'text-purple-600' },
  { value: 'disk', label: 'Disk I/O', icon: '💿', color: 'text-orange-600' }
];

export const MetricsControls: React.FC<MetricsControlsProps> = ({
  options,
  containerIds = [],
  onOptionsChange,
  onRefresh,
  onExport,
  isLoading = false,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);

  const handleTimeRangeChange = useCallback((timeRange: TimeRange) => {
    onOptionsChange({ timeRange });
    setShowTimeRangePicker(false);
  }, [onOptionsChange]);

  const handleCustomTimeRange = useCallback((start: Date, end: Date) => {
    onOptionsChange({
      timeRange: {
        start,
        end,
        label: 'Custom range'
      }
    });
    setShowTimeRangePicker(false);
  }, [onOptionsChange]);

  const toggleAutoRefresh = useCallback(() => {
    onOptionsChange({ autoRefresh: !options.autoRefresh });
  }, [options.autoRefresh, onOptionsChange]);

  const handleMetricToggle = useCallback((metric: string) => {
    const newMetrics = options.selectedMetrics.includes(metric)
      ? options.selectedMetrics.filter(m => m !== metric)
      : [...options.selectedMetrics, metric];
    
    onOptionsChange({ selectedMetrics: newMetrics });
  }, [options.selectedMetrics, onOptionsChange]);

  const handleContainerToggle = useCallback((containerId: string) => {
    const newContainers = options.selectedContainers.includes(containerId)
      ? options.selectedContainers.filter(c => c !== containerId)
      : [...options.selectedContainers, containerId];
    
    onOptionsChange({ selectedContainers: newContainers });
  }, [options.selectedContainers, onOptionsChange]);

  const formatDateTime = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-6 py-4">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTimeRangePicker(!showTimeRangePicker)}
                className="
                  flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 
                  hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium
                  text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600
                "
              >
                <Clock className="w-4 h-4" />
                {options.timeRange.label}
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Time Range Dropdown */}
              {showTimeRangePicker && (
                <div className="
                  absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10
                ">
                  <div className="p-4 space-y-4">
                    {/* Preset Ranges */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Quick Select
                      </h4>
                      <div className="space-y-1">
                        {timeRangePresets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimeRangeChange(preset)}
                            className="
                              w-full text-left px-3 py-2 text-sm rounded-md
                              hover:bg-gray-100 dark:hover:bg-gray-700
                              text-gray-700 dark:text-gray-300
                            "
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Range */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Custom Range
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Start Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formatDateTime(options.timeRange.start)}
                            onChange={(e) => {
                              const start = new Date(e.target.value);
                              handleCustomTimeRange(start, options.timeRange.end);
                            }}
                            className="
                              w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                              rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            "
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            End Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formatDateTime(options.timeRange.end)}
                            onChange={(e) => {
                              const end = new Date(e.target.value);
                              handleCustomTimeRange(options.timeRange.start, end);
                            }}
                            className="
                              w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                              rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            "
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auto Refresh Toggle */}
            <button
              onClick={toggleAutoRefresh}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border
                ${options.autoRefresh
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }
              `}
            >
              {options.autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {options.autoRefresh ? 'Auto' : 'Paused'}
            </button>

            {/* Refresh Interval */}
            {options.autoRefresh && (
              <select
                value={options.refreshInterval}
                onChange={(e) => onOptionsChange({ refreshInterval: parseInt(e.target.value) })}
                className="
                  px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                  rounded-lg text-sm text-gray-900 dark:text-gray-100
                "
              >
                {refreshIntervalOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Manual Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="
                flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 
                disabled:bg-blue-400 text-white rounded-lg text-sm font-medium
              "
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Advanced Controls Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="
                flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 
                hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium
              "
            >
              <Settings className="w-4 h-4" />
              Advanced
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {/* Export Button */}
            {onExport && (
              <button
                onClick={onExport}
                className="
                  flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 
                  hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium
                  text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600
                "
              >
                <TrendingUp className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Metrics Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Metrics ({options.selectedMetrics.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {metricOptions.map(metric => (
                  <label
                    key={metric.value}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border text-sm
                      ${options.selectedMetrics.includes(metric.value)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={options.selectedMetrics.includes(metric.value)}
                      onChange={() => handleMetricToggle(metric.value)}
                      className="sr-only"
                    />
                    <span className="text-base">{metric.icon}</span>
                    <span>{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Container Selection */}
            {containerIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Containers ({options.selectedContainers.length} selected)
                </label>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {containerIds.map(containerId => (
                      <label
                        key={containerId}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={options.selectedContainers.includes(containerId)}
                          onChange={() => handleContainerToggle(containerId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {containerId.slice(0, 12)}...
                        </code>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data Aggregation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Aggregation
              </label>
              <select
                value={options.aggregation}
                onChange={(e) => onOptionsChange({ aggregation: e.target.value as any })}
                className="
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
              >
                {aggregationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsControls;