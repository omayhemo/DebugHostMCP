import { useState, useCallback, useRef } from 'react';
import download from 'downloadjs';
import { ExportOptions, ExportFormat, MetricType } from '../components/metrics/MetricsExport';

export interface MetricDataPoint {
  timestamp: number;
  containerId: string;
  metricType: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

export interface ExportResult {
  filename: string;
  recordCount: number;
  fileSize: string;
  timestamp: Date;
}

export interface UseMetricsExportOptions {
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: (filename: string) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
}

export interface UseMetricsExportResult {
  exportMetrics: (options: ExportOptions) => Promise<string>;
  isExporting: boolean;
  progress: number;
  lastExport?: ExportResult;
  cancelExport: () => void;
}

// Mock data generator for demonstration
const generateMockMetrics = (
  options: ExportOptions,
  dataPointsCount: number
): MetricDataPoint[] => {
  const metrics: MetricDataPoint[] = [];
  const timeStep = (options.endTime.getTime() - options.startTime.getTime()) / dataPointsCount;
  
  const metricTypes = options.metrics.includes('all')
    ? ['cpu', 'memory', 'network', 'disk']
    : options.metrics.filter(m => m !== 'all');
  
  const containerIds = options.containerIds.length > 0 
    ? options.containerIds 
    : ['container_demo_001', 'container_demo_002'];

  for (let i = 0; i < dataPointsCount; i++) {
    const timestamp = options.startTime.getTime() + (i * timeStep);
    
    for (const containerId of containerIds) {
      for (const metricType of metricTypes) {
        let value: number;
        let unit: string;
        
        // Generate realistic metric values
        switch (metricType) {
          case 'cpu':
            value = Math.random() * 100; // 0-100%
            unit = '%';
            break;
          case 'memory':
            value = Math.random() * 2048 + 512; // 512MB - 2.5GB
            unit = 'MB';
            break;
          case 'network':
            value = Math.random() * 1024; // 0-1024 KB/s
            unit = 'KB/s';
            break;
          case 'disk':
            value = Math.random() * 512; // 0-512 KB/s
            unit = 'KB/s';
            break;
          default:
            value = Math.random() * 100;
            unit = '';
        }

        metrics.push({
          timestamp,
          containerId,
          metricType,
          value: Math.round(value * 100) / 100, // 2 decimal places
          unit,
          tags: {
            source: 'apm-debug-host',
            version: '1.0.0'
          }
        });
      }
    }
  }

  return metrics;
};

const aggregateMetrics = (
  metrics: MetricDataPoint[],
  aggregateBy: 'minute' | 'hour' | 'day'
): MetricDataPoint[] => {
  const intervalMs = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
  }[aggregateBy];

  const groups = new Map<string, MetricDataPoint[]>();

  metrics.forEach(metric => {
    const intervalStart = Math.floor(metric.timestamp / intervalMs) * intervalMs;
    const key = `${intervalStart}_${metric.containerId}_${metric.metricType}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(metric);
  });

  const aggregated: MetricDataPoint[] = [];

  groups.forEach((groupMetrics, key) => {
    const [timestamp, containerId, metricType] = key.split('_');
    
    const avgValue = groupMetrics.reduce((sum, m) => sum + m.value, 0) / groupMetrics.length;
    const firstMetric = groupMetrics[0];

    aggregated.push({
      timestamp: parseInt(timestamp),
      containerId,
      metricType,
      value: Math.round(avgValue * 100) / 100,
      unit: firstMetric.unit,
      tags: { ...firstMetric.tags, aggregated: aggregateBy }
    });
  });

  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
};

const exportToCsv = (metrics: MetricDataPoint[], options: ExportOptions): string => {
  const lines: string[] = [];
  
  if (options.includeHeaders) {
    const headers = ['timestamp', 'datetime', 'containerId', 'metricType', 'value'];
    if (options.includeMetadata) {
      headers.push('unit', 'source', 'version', 'exportedAt');
    }
    lines.push(headers.join(','));
  }

  const exportedAt = new Date().toISOString();

  metrics.forEach(metric => {
    const row = [
      metric.timestamp.toString(),
      new Date(metric.timestamp).toISOString(),
      metric.containerId,
      metric.metricType,
      metric.value.toString()
    ];

    if (options.includeMetadata) {
      row.push(
        metric.unit || '',
        metric.tags?.source || '',
        metric.tags?.version || '',
        exportedAt
      );
    }

    lines.push(row.join(','));
  });

  return lines.join('\n');
};

const exportToJson = (metrics: MetricDataPoint[], options: ExportOptions): string => {
  const data = {
    export: {
      timestamp: new Date().toISOString(),
      format: 'json',
      options: {
        timeRange: {
          start: options.startTime.toISOString(),
          end: options.endTime.toISOString()
        },
        metrics: options.metrics,
        containers: options.containerIds,
        aggregation: options.aggregateBy
      },
      recordCount: metrics.length
    },
    data: options.includeMetadata
      ? metrics
      : metrics.map(({ tags, unit, ...metric }) => metric)
  };

  return JSON.stringify(data, null, 2);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export function useMetricsExport(options: UseMetricsExportOptions = {}): UseMetricsExportResult {
  const {
    onStart,
    onProgress,
    onComplete,
    onError,
    chunkSize = 1000
  } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastExport, setLastExport] = useState<ExportResult>();
  
  const abortController = useRef<AbortController | null>(null);

  const cancelExport = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setIsExporting(false);
    setProgress(0);
  }, []);

  const exportMetrics = useCallback(async (exportOptions: ExportOptions): Promise<string> => {
    if (isExporting) {
      throw new Error('Export already in progress');
    }

    setIsExporting(true);
    setProgress(0);
    abortController.current = new AbortController();

    try {
      onStart?.();

      // Calculate data points to generate
      const timeRange = exportOptions.endTime.getTime() - exportOptions.startTime.getTime();
      let intervalMs = 60000; // 1 minute default
      
      if (exportOptions.aggregateBy === 'hour') intervalMs = 3600000;
      else if (exportOptions.aggregateBy === 'day') intervalMs = 86400000;
      
      const dataPointsCount = Math.ceil(timeRange / intervalMs);
      const maxDataPoints = 50000; // Limit for performance
      const actualDataPoints = Math.min(dataPointsCount, maxDataPoints);

      // Generate metrics data (in real implementation, this would fetch from API)
      setProgress(10);
      onProgress?.(10);

      if (abortController.current?.signal.aborted) {
        throw new Error('Export cancelled');
      }

      // Simulate data fetching with progress updates
      const metrics: MetricDataPoint[] = [];
      const batchSize = Math.ceil(actualDataPoints / 10);

      for (let i = 0; i < 10; i++) {
        if (abortController.current?.signal.aborted) {
          throw new Error('Export cancelled');
        }

        const batchMetrics = generateMockMetrics(exportOptions, batchSize);
        metrics.push(...batchMetrics);

        const progressValue = 10 + (i + 1) * 7; // 10-80% for data generation
        setProgress(progressValue);
        onProgress?.(progressValue);

        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Aggregate data if needed
      setProgress(80);
      onProgress?.(80);

      let finalMetrics = metrics;
      if (exportOptions.aggregateBy) {
        finalMetrics = aggregateMetrics(metrics, exportOptions.aggregateBy);
      }

      if (abortController.current?.signal.aborted) {
        throw new Error('Export cancelled');
      }

      // Generate export content
      setProgress(90);
      onProgress?.(90);

      let content: string;
      let mimeType: string;
      let fileExtension: string;

      if (exportOptions.format === 'csv') {
        content = exportToCsv(finalMetrics, exportOptions);
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
      } else {
        content = exportToJson(finalMetrics, exportOptions);
        mimeType = 'application/json;charset=utf-8;';
        fileExtension = 'json';
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const metricsStr = exportOptions.metrics.includes('all') ? 'all' : exportOptions.metrics.join('-');
      const filename = `metrics-${metricsStr}-${timestamp}.${fileExtension}`;

      setProgress(95);
      onProgress?.(95);

      // Download file
      const blob = new Blob([content], { type: mimeType });
      download(blob, filename, mimeType);

      // Update export result
      const result: ExportResult = {
        filename,
        recordCount: finalMetrics.length,
        fileSize: formatFileSize(blob.size),
        timestamp: new Date()
      };

      setLastExport(result);
      setProgress(100);
      onProgress?.(100);
      onComplete?.(filename);

      return filename;

    } catch (error) {
      const exportError = error instanceof Error ? error : new Error('Export failed');
      onError?.(exportError);
      throw exportError;
    } finally {
      setIsExporting(false);
      setProgress(0);
      abortController.current = null;
    }
  }, [isExporting, onStart, onProgress, onComplete, onError]);

  return {
    exportMetrics,
    isExporting,
    progress,
    lastExport,
    cancelExport
  };
}