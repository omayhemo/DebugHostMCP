/**
 * Metrics Aggregator Service
 * Client-side data aggregation and processing for container metrics
 */

import { MetricsCircularBuffer, MetricPoint } from '../utils/circularBuffer';
import { lttbDownsample, DataPoint, StreamingLTTB } from '../utils/lttb';

export interface AggregatedMetric {
  timestamp: number;
  containerId: string;
  metricType: string;
  value: number;
  min: number;
  max: number;
  avg: number;
  count: number;
  unit?: string;
}

export interface MetricsAggregatorOptions {
  bufferSize?: number;
  maxDataPoints?: number;
  aggregationInterval?: number; // minutes
  autoCleanup?: boolean;
  cleanupAge?: number; // minutes
}

export interface AggregationQuery {
  containerIds?: string[];
  metricTypes?: string[];
  startTime: number;
  endTime: number;
  groupBy: 'minute' | '5minute' | '15minute' | '30minute' | 'hour' | 'day';
  functions?: AggregationFunction[];
}

export type AggregationFunction = 'avg' | 'min' | 'max' | 'sum' | 'count' | 'median' | 'p95' | 'p99';

export interface AggregationResult {
  data: AggregatedMetric[];
  meta: {
    totalPoints: number;
    aggregatedPoints: number;
    timeRange: { start: number; end: number };
    groupBy: string;
    functions: AggregationFunction[];
  };
}

export class MetricsAggregator {
  private buffers: Map<string, MetricsCircularBuffer> = new Map();
  private streamingSamplers: Map<string, StreamingLTTB> = new Map();
  private aggregationCache: Map<string, { data: AggregatedMetric[]; timestamp: number }> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  
  private readonly options: Required<MetricsAggregatorOptions>;

  constructor(options: MetricsAggregatorOptions = {}) {
    this.options = {
      bufferSize: options.bufferSize || 10000,
      maxDataPoints: options.maxDataPoints || 5000,
      aggregationInterval: options.aggregationInterval || 1,
      autoCleanup: options.autoCleanup ?? true,
      cleanupAge: options.cleanupAge || 60
    };

    if (this.options.autoCleanup) {
      this.startCleanupInterval();
    }
  }

  /**
   * Add a metric point to the aggregator
   */
  addMetric(
    timestamp: number,
    value: number,
    containerId: string,
    metricType: string,
    unit?: string
  ): void {
    const bufferKey = `${containerId}:${metricType}`;
    
    if (!this.buffers.has(bufferKey)) {
      this.buffers.set(bufferKey, new MetricsCircularBuffer(this.options.bufferSize));
    }

    const buffer = this.buffers.get(bufferKey)!;
    buffer.addMetric(timestamp, value, containerId, metricType);

    // Initialize streaming sampler if needed
    if (!this.streamingSamplers.has(bufferKey)) {
      this.streamingSamplers.set(bufferKey, new StreamingLTTB(this.options.maxDataPoints));
    }

    const sampler = this.streamingSamplers.get(bufferKey)!;
    sampler.addPoint({ x: timestamp, y: value });

    // Invalidate related cache entries
    this.invalidateCache(containerId, metricType);
  }

  /**
   * Add multiple metric points
   */
  addMetrics(metrics: MetricPoint[]): void {
    for (const metric of metrics) {
      this.addMetric(
        metric.timestamp,
        metric.value,
        metric.containerId || 'unknown',
        metric.metricType || 'unknown'
      );
    }
  }

  /**
   * Aggregate data for a specific time range
   */
  aggregateData(
    containerIds: string[],
    metricTypes: string[],
    startTime: number,
    endTime: number,
    groupBy: 'minute' | 'hour' | 'day' = 'minute'
  ): AggregatedMetric[] {
    return this.performAggregation(
      this.getRawMetrics(containerIds, metricTypes, startTime, endTime),
      { containerIds, metricTypes, startTime, endTime, groupBy }
    );
  }

  /**
   * Get raw metrics for a time range
   */
  getRawMetrics(
    containerIds: string[],
    metricTypes: string[],
    startTime: number,
    endTime: number
  ): MetricPoint[] {
    const results: MetricPoint[] = [];

    for (const containerId of containerIds) {
      for (const metricType of metricTypes) {
        const bufferKey = `${containerId}:${metricType}`;
        const buffer = this.buffers.get(bufferKey);
        
        if (buffer) {
          const metrics = buffer.getMetricsInRange(startTime, endTime);
          results.push(...metrics);
        }
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get downsampled metrics using LTTB
   */
  getDownsampledMetrics(
    containerIds: string[],
    metricTypes: string[],
    startTime: number,
    endTime: number,
    maxPoints: number = this.options.maxDataPoints
  ): { [key: string]: DataPoint[] } {
    const results: { [key: string]: DataPoint[] } = {};

    for (const containerId of containerIds) {
      for (const metricType of metricTypes) {
        const bufferKey = `${containerId}:${metricType}`;
        const buffer = this.buffers.get(bufferKey);
        
        if (buffer) {
          const metrics = buffer.getMetricsInRange(startTime, endTime);
          const dataPoints = metrics.map(m => ({ x: m.timestamp, y: m.value }));
          const sampled = lttbDownsample(dataPoints, maxPoints);
          results[bufferKey] = sampled;
        }
      }
    }

    return results;
  }

  /**
   * Perform time-based aggregation
   */
  async aggregate(query: AggregationQuery): Promise<AggregationResult> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.aggregationCache.get(cacheKey);
    
    // Return cached result if recent (within 30 seconds)
    if (cached && Date.now() - cached.timestamp < 30000) {
      return {
        data: cached.data,
        meta: this.getAggregationMeta(cached.data, query)
      };
    }

    const rawMetrics = this.getRawMetrics(
      query.containerIds || this.getAllContainerIds(),
      query.metricTypes || this.getAllMetricTypes(),
      query.startTime,
      query.endTime
    );

    const aggregated = this.performAggregation(rawMetrics, query);
    
    // Cache the result
    this.aggregationCache.set(cacheKey, {
      data: aggregated,
      timestamp: Date.now()
    });

    return {
      data: aggregated,
      meta: this.getAggregationMeta(aggregated, query)
    };
  }

  /**
   * Get real-time streaming data
   */
  getStreamingData(
    containerIds: string[],
    metricTypes: string[],
    maxPoints: number = 1000
  ): { [key: string]: DataPoint[] } {
    const results: { [key: string]: DataPoint[] } = {};

    for (const containerId of containerIds) {
      for (const metricType of metricTypes) {
        const bufferKey = `${containerId}:${metricType}`;
        const sampler = this.streamingSamplers.get(bufferKey);
        
        if (sampler) {
          results[bufferKey] = sampler.getSampled();
        }
      }
    }

    return results;
  }

  /**
   * Get metrics statistics
   */
  getStatistics(): {
    buffersCount: number;
    totalDataPoints: number;
    memoryUsage: number;
    cacheSize: number;
    containers: string[];
    metricTypes: string[];
  } {
    let totalDataPoints = 0;
    let memoryUsage = 0;
    const containers = new Set<string>();
    const metricTypes = new Set<string>();

    for (const [key, buffer] of this.buffers) {
      const [containerId, metricType] = key.split(':');
      containers.add(containerId);
      metricTypes.add(metricType);
      totalDataPoints += buffer.getSize();
      memoryUsage += buffer.getMemoryUsage();
    }

    return {
      buffersCount: this.buffers.size,
      totalDataPoints,
      memoryUsage,
      cacheSize: this.aggregationCache.size,
      containers: Array.from(containers),
      metricTypes: Array.from(metricTypes)
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.buffers.clear();
    this.streamingSamplers.clear();
    this.aggregationCache.clear();
  }

  /**
   * Clear data for specific container
   */
  clearContainer(containerId: string): void {
    const keysToRemove: string[] = [];
    
    for (const key of this.buffers.keys()) {
      if (key.startsWith(`${containerId}:`)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.buffers.delete(key);
      this.streamingSamplers.delete(key);
    }

    this.invalidateCache(containerId);
  }

  /**
   * Cleanup old data
   */
  cleanup(maxAge: number = this.options.cleanupAge): void {
    const cutoff = Date.now() - maxAge * 60 * 1000;

    for (const [key, buffer] of this.buffers) {
      // This is a simplified cleanup - in a real implementation,
      // you'd remove old entries from the circular buffer
      if (buffer.isEmpty()) {
        this.buffers.delete(key);
        this.streamingSamplers.delete(key);
      }
    }

    // Clear old cache entries
    for (const [key, cached] of this.aggregationCache) {
      if (cached.timestamp < cutoff) {
        this.aggregationCache.delete(key);
      }
    }
  }

  /**
   * Destroy the aggregator and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
  }

  // Private methods

  private performAggregation(
    metrics: MetricPoint[],
    query: AggregationQuery
  ): AggregatedMetric[] {
    const intervalMs = this.getIntervalMs(query.groupBy);
    const groups = new Map<string, MetricPoint[]>();

    // Group metrics by time bucket, container, and metric type
    for (const metric of metrics) {
      const bucket = Math.floor(metric.timestamp / intervalMs) * intervalMs;
      const key = `${bucket}:${metric.containerId}:${metric.metricType}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }

    // Aggregate each group
    const results: AggregatedMetric[] = [];
    const functions = query.functions || ['avg', 'min', 'max'];

    for (const [key, groupMetrics] of groups) {
      const [timestamp, containerId, metricType] = key.split(':');
      const values = groupMetrics.map(m => m.value);
      
      if (values.length === 0) continue;

      const aggregated: AggregatedMetric = {
        timestamp: parseInt(timestamp),
        containerId,
        metricType,
        value: this.calculateFunction('avg', values),
        min: this.calculateFunction('min', values),
        max: this.calculateFunction('max', values),
        avg: this.calculateFunction('avg', values),
        count: values.length
      };

      results.push(aggregated);
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Calculate aggregation functions: avg, min, max, sum, count, median, p95, p99
  private calculateFunction(fn: AggregationFunction, values: number[]): number {
    switch (fn) {
      case 'avg':
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);
      case 'count':
        return values.length;
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
      case 'p95':
        return this.calculatePercentile(values, 0.95);
      case 'p99':
        return this.calculatePercentile(values, 0.99);
      default:
        return 0;
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  private getIntervalMs(groupBy: AggregationQuery['groupBy']): number {
    const intervals = {
      minute: 60 * 1000,
      '5minute': 5 * 60 * 1000,
      '15minute': 15 * 60 * 1000,
      '30minute': 30 * 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000
    };

    return intervals[groupBy] || intervals.minute;
  }

  private getCacheKey(query: AggregationQuery): string {
    return `${query.containerIds?.join(',')}:${query.metricTypes?.join(',')}:${query.startTime}:${query.endTime}:${query.groupBy}:${query.functions?.join(',')}`;
  }

  private getAggregationMeta(
    data: AggregatedMetric[],
    query: AggregationQuery
  ): AggregationResult['meta'] {
    return {
      totalPoints: data.reduce((sum, d) => sum + d.count, 0),
      aggregatedPoints: data.length,
      timeRange: { start: query.startTime, end: query.endTime },
      groupBy: query.groupBy,
      functions: query.functions || ['avg', 'min', 'max']
    };
  }

  private getAllContainerIds(): string[] {
    const containers = new Set<string>();
    for (const key of this.buffers.keys()) {
      containers.add(key.split(':')[0]);
    }
    return Array.from(containers);
  }

  private getAllMetricTypes(): string[] {
    const types = new Set<string>();
    for (const key of this.buffers.keys()) {
      types.add(key.split(':')[1]);
    }
    return Array.from(types);
  }

  private invalidateCache(containerId?: string, metricType?: string): void {
    if (!containerId && !metricType) {
      this.aggregationCache.clear();
      return;
    }

    const keysToRemove: string[] = [];
    for (const key of this.aggregationCache.keys()) {
      const [containers, metrics] = key.split(':');
      
      if (containerId && containers.includes(containerId)) {
        keysToRemove.push(key);
      } else if (metricType && metrics.includes(metricType)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.aggregationCache.delete(key);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }
}

// Singleton instance for global use
export const metricsAggregator = new MetricsAggregator();

export default MetricsAggregator;