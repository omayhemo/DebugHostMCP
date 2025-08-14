import React, { useState } from 'react';
import { Download, FileText, Database, Calendar, Filter, Loader } from 'lucide-react';
import { useMetricsExport } from '../../hooks/useMetricsExport';
import downloadjs from 'downloadjs';

export type ExportFormat = 'csv' | 'json';
export type MetricType = 'cpu' | 'memory' | 'network' | 'disk' | 'all';

export interface ExportOptions {
  format: ExportFormat;
  metrics: MetricType[];
  containerIds: string[];
  startTime: Date;
  endTime: Date;
  includeHeaders: boolean;
  includeMetadata: boolean;
  aggregateBy?: 'minute' | 'hour' | 'day';
}

interface MetricsExportProps {
  containerIds?: string[];
  availableMetrics?: string[];
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: Error) => void;
  className?: string;
}

const metricTypeOptions = [
  { value: 'cpu' as MetricType, label: 'CPU Usage', icon: '⚡' },
  { value: 'memory' as MetricType, label: 'Memory Usage', icon: '💾' },
  { value: 'network' as MetricType, label: 'Network I/O', icon: '🌐' },
  { value: 'disk' as MetricType, label: 'Disk I/O', icon: '💿' },
  { value: 'all' as MetricType, label: 'All Metrics', icon: '📊' }
];

const formatOptions = [
  { value: 'csv' as ExportFormat, label: 'CSV', description: 'Comma-separated values for Excel/Sheets' },
  { value: 'json' as ExportFormat, label: 'JSON', description: 'JavaScript Object Notation for APIs' }
];

const aggregationOptions = [
  { value: 'minute', label: '1 minute', description: 'Aggregate data by minute' },
  { value: 'hour', label: '1 hour', description: 'Aggregate data by hour' },
  { value: 'day', label: '1 day', description: 'Aggregate data by day' }
];

export const MetricsExport: React.FC<MetricsExportProps> = ({
  containerIds = [],
  availableMetrics = [],
  onExportStart,
  onExportComplete,
  onExportError,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    metrics: ['all'],
    containerIds: [],
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    endTime: new Date(),
    includeHeaders: true,
    includeMetadata: true,
    aggregateBy: 'minute'
  });

  const { exportMetrics, isExporting, lastExport } = useMetricsExport({
    onStart: onExportStart,
    onComplete: onExportComplete,
    onError: onExportError
  });

  const handleExport = async () => {
    try {
      const filename = await exportMetrics(exportOptions);
      setIsExpanded(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const updateExportOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const toggleMetric = (metric: MetricType) => {
    if (metric === 'all') {
      setExportOptions(prev => ({ 
        ...prev, 
        metrics: prev.metrics.includes('all') ? [] : ['all'] 
      }));
    } else {
      setExportOptions(prev => {
        const newMetrics = prev.metrics.includes(metric)
          ? prev.metrics.filter(m => m !== metric && m !== 'all')
          : [...prev.metrics.filter(m => m !== 'all'), metric];
        
        return { ...prev, metrics: newMetrics };
      });
    }
  };

  const toggleContainer = (containerId: string) => {
    setExportOptions(prev => ({
      ...prev,
      containerIds: prev.containerIds.includes(containerId)
        ? prev.containerIds.filter(id => id !== containerId)
        : [...prev.containerIds, containerId]
    }));
  };

  const getEstimatedDataPoints = (): number => {
    const timeRange = exportOptions.endTime.getTime() - exportOptions.startTime.getTime();
    const minutes = timeRange / (1000 * 60);
    
    let intervalMinutes = 1;
    if (exportOptions.aggregateBy === 'hour') intervalMinutes = 60;
    else if (exportOptions.aggregateBy === 'day') intervalMinutes = 1440;
    
    const dataPoints = Math.ceil(minutes / intervalMinutes);
    // Count selectedMetrics for estimation
    const selectedMetrics = exportOptions.metrics;
    const metricsCount = selectedMetrics.includes('all') ? 4 : selectedMetrics.length;
    const containersCount = exportOptions.containerIds.length || 1;
    
    return dataPoints * metricsCount * containersCount;
  };

  const getEstimatedFileSize = (): string => {
    const dataPoints = getEstimatedDataPoints();
    let bytesPerPoint = 50; // Rough estimate
    
    if (exportOptions.format === 'json') {
      bytesPerPoint = exportOptions.includeMetadata ? 150 : 100;
    } else {
      bytesPerPoint = exportOptions.includeMetadata ? 80 : 50;
    }
    
    const totalBytes = dataPoints * bytesPerPoint;
    
    if (totalBytes < 1024) return `${totalBytes}B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)}KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  if (!isExpanded) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(true)}
          disabled={isExporting}
          className="
            inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
            disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors
          "
        >
          {isExporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Metrics
        </button>
        
        {lastExport && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last export: {lastExport.timestamp.toLocaleString()} 
            ({lastExport.recordCount} records, {lastExport.fileSize})
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Export Metrics Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download metrics in CSV or JSON format
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {formatOptions.map(format => (
              <label
                key={format.value}
                className={`
                  relative flex items-start p-3 border rounded-lg cursor-pointer
                  ${exportOptions.format === format.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={exportOptions.format === format.value}
                  onChange={(e) => updateExportOption('format', e.target.value as ExportFormat)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  {format.value === 'csv' ? (
                    <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <Database className="w-5 h-5 text-purple-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {format.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Metrics Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Metrics to Export
          </label>
          <div className="grid grid-cols-2 gap-2">
            {metricTypeOptions.map(metric => (
              <label
                key={metric.value}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer
                  ${exportOptions.metrics.includes(metric.value)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={exportOptions.metrics.includes(metric.value)}
                  onChange={() => toggleMetric(metric.value)}
                  className="sr-only"
                />
                <span className="text-lg">{metric.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {metric.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Container Selection */}
        {containerIds.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Containers ({exportOptions.containerIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-2 space-y-1">
                {containerIds.map(containerId => (
                  <label
                    key={containerId}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportOptions.containerIds.includes(containerId)}
                      onChange={() => toggleContainer(containerId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <code className="text-sm text-gray-700 dark:text-gray-300">
                      {containerId.slice(0, 12)}...
                    </code>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Time Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formatDateTime(exportOptions.startTime)}
                onChange={(e) => updateExportOption('startTime', new Date(e.target.value))}
                className="
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formatDateTime(exportOptions.endTime)}
                onChange={(e) => updateExportOption('endTime', new Date(e.target.value))}
                className="
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
              />
            </div>
          </div>
        </div>

        {/* Aggregation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Aggregation
          </label>
          <select
            value={exportOptions.aggregateBy || 'minute'}
            onChange={(e) => updateExportOption('aggregateBy', e.target.value as any)}
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

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => updateExportOption('includeHeaders', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include column headers
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => updateExportOption('includeMetadata', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include metadata (container info, export timestamp)
              </span>
            </label>
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Export Summary
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>Estimated data points: {getEstimatedDataPoints().toLocaleString()}</div>
            <div>Estimated file size: {getEstimatedFileSize()}</div>
            <div>Format: {exportOptions.format.toUpperCase()}</div>
            <div>Time range: {exportOptions.startTime.toLocaleDateString()} to {exportOptions.endTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsExpanded(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting || exportOptions.metrics.length === 0}
            className="
              flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 
              disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors
            "
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricsExport;