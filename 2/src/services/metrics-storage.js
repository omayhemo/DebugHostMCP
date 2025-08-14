/**
 * Metrics Storage Service
 * 
 * Time-series storage with multi-resolution aggregation for container metrics.
 * Stores high-resolution data for 7 days and aggregated data for 30 days.
 */

const path = require('path');
const fs = require('fs').promises;
const AtomicFile = require('../utils/atomic-file');

class MetricsStorage {
  constructor(dataPath = null) {
    // Use data directory in project root
    this.dataPath = dataPath || path.join(__dirname, '../../data/metrics');
    
    // Time-series configuration
    this.retention = {
      highRes: 7 * 24 * 60 * 60 * 1000,      // 7 days in milliseconds
      aggregated: 30 * 24 * 60 * 60 * 1000   // 30 days in milliseconds
    };
    
    // Aggregation intervals
    this.aggregation = {
      minute: 60 * 1000,          // 1 minute
      fiveMinute: 5 * 60 * 1000,  // 5 minutes
      fifteenMinute: 15 * 60 * 1000, // 15 minutes
      hour: 60 * 60 * 1000,       // 1 hour
      day: 24 * 60 * 60 * 1000    // 1 day
    };
    
    // In-memory data structures
    this.highResData = new Map(); // containerId -> sorted array of metrics
    this.aggregatedData = new Map(); // containerId -> { interval -> sorted array }
    
    // Cleanup and aggregation timers
    this.cleanupTimer = null;
    this.aggregationTimer = null;
    
    // Statistics
    this.stats = {
      totalMetrics: 0,
      totalAggregated: 0,
      totalCleanedUp: 0,
      lastCleanup: null,
      lastAggregation: null,
      storageErrors: 0
    };
    
    console.log(`MetricsStorage initialized with data path: ${this.dataPath}`);
  }
  
  /**
   * Initialize the storage service
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await this.ensureDirectoryExists(this.dataPath);
      
      // Load existing data
      await this.loadPersistedData();
      
      // Start cleanup and aggregation timers
      this.startPeriodicTasks();
      
      console.log(`MetricsStorage initialized successfully. Total metrics: ${this.stats.totalMetrics}`);
    } catch (error) {
      console.error('Failed to initialize MetricsStorage:', error);
      throw error;
    }
  }
  
  /**
   * Store high-resolution metrics
   * 
   * @param {object[]} metrics - Array of metrics objects
   */
  async storeMetrics(metrics) {
    try {
      const timestamp = Date.now();
      
      for (const metric of metrics) {
        const { containerId } = metric;
        
        if (!containerId) {
          console.warn('Metric missing containerId, skipping');
          continue;
        }
        
        // Initialize container data if not exists
        if (!this.highResData.has(containerId)) {
          this.highResData.set(containerId, []);
        }
        
        // Add to high-resolution data
        const containerMetrics = this.highResData.get(containerId);
        containerMetrics.push({
          ...metric,
          storedAt: timestamp
        });
        
        // Keep data sorted by timestamp
        containerMetrics.sort((a, b) => a.timestamp - b.timestamp);
        
        this.stats.totalMetrics++;
      }
      
      // Trigger background persistence
      this.persistDataAsync();
      
    } catch (error) {
      this.stats.storageErrors++;
      console.error('Error storing metrics:', error);
      throw error;
    }
  }
  
  /**
   * Query metrics for a container
   * 
   * @param {string} containerId - Container ID
   * @param {object} options - Query options
   * @param {number} options.startTime - Start timestamp
   * @param {number} options.endTime - End timestamp
   * @param {string} options.resolution - Resolution (raw, minute, hour, day)
   * @param {number} options.limit - Maximum number of data points
   * @returns {object[]} Array of metrics
   */
  async queryMetrics(containerId, options = {}) {
    try {
      const {
        startTime = Date.now() - 24 * 60 * 60 * 1000, // Default: last 24 hours
        endTime = Date.now(),
        resolution = 'raw',
        limit = 1000
      } = options;
      
      let data = [];
      
      if (resolution === 'raw') {
        // Get high-resolution data
        const containerData = this.highResData.get(containerId) || [];
        data = containerData.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
      } else {
        // Get aggregated data
        const aggregatedContainer = this.aggregatedData.get(containerId) || {};
        const aggregatedForInterval = aggregatedContainer[resolution] || [];
        data = aggregatedForInterval.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
      }
      
      // Apply limit
      if (data.length > limit) {
        // Take evenly distributed samples
        const step = Math.ceil(data.length / limit);
        data = data.filter((_, index) => index % step === 0);
      }
      
      return data;
    } catch (error) {
      console.error(`Error querying metrics for container ${containerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get latest metrics for a container
   * 
   * @param {string} containerId - Container ID
   * @returns {object|null} Latest metrics or null
   */
  getLatestMetrics(containerId) {
    const containerData = this.highResData.get(containerId) || [];
    return containerData.length > 0 ? containerData[containerData.length - 1] : null;
  }
  
  /**
   * Get list of containers with metrics
   * 
   * @returns {string[]} Array of container IDs
   */
  getContainerList() {
    return Array.from(this.highResData.keys());
  }
  
  /**
   * Get storage statistics
   * 
   * @returns {object} Storage statistics
   */
  getStorageStats() {
    const containerStats = {};
    let totalHighRes = 0;
    let totalAggregated = 0;
    
    // Count high-resolution data points
    for (const [containerId, data] of this.highResData) {
      const count = data.length;
      totalHighRes += count;
      containerStats[containerId] = { highRes: count, aggregated: {} };
    }
    
    // Count aggregated data points
    for (const [containerId, aggregated] of this.aggregatedData) {
      if (!containerStats[containerId]) {
        containerStats[containerId] = { highRes: 0, aggregated: {} };
      }
      
      for (const [interval, data] of Object.entries(aggregated)) {
        const count = data.length;
        totalAggregated += count;
        containerStats[containerId].aggregated[interval] = count;
      }
    }
    
    return {
      ...this.stats,
      totalHighResDataPoints: totalHighRes,
      totalAggregatedDataPoints: totalAggregated,
      containerCount: this.highResData.size,
      containerStats,
      memoryUsage: process.memoryUsage(),
      lastQuery: Date.now()
    };
  }
  
  /**
   * Start periodic cleanup and aggregation tasks
   */
  startPeriodicTasks() {
    // Cleanup every 10 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredData().catch(error => 
        console.error('Error in periodic cleanup:', error)
      );
    }, 10 * 60 * 1000);
    
    // Aggregation every 5 minutes
    this.aggregationTimer = setInterval(() => {
      this.aggregateData().catch(error => 
        console.error('Error in periodic aggregation:', error)
      );
    }, 5 * 60 * 1000);
    
    console.log('Started periodic cleanup and aggregation tasks');
  }
  
  /**
   * Stop periodic tasks
   */
  stopPeriodicTasks() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    
    console.log('Stopped periodic tasks');
  }
  
  /**
   * Clean up expired data
   */
  async cleanupExpiredData() {
    try {
      const now = Date.now();
      let cleanedHighRes = 0;
      let cleanedAggregated = 0;
      
      // Cleanup high-resolution data (older than 7 days)
      const highResExpiry = now - this.retention.highRes;
      
      for (const [containerId, data] of this.highResData) {
        const originalLength = data.length;
        const filtered = data.filter(metric => metric.timestamp > highResExpiry);
        
        if (filtered.length !== originalLength) {
          this.highResData.set(containerId, filtered);
          cleanedHighRes += originalLength - filtered.length;
        }
        
        // Remove container if no data left
        if (filtered.length === 0) {
          this.highResData.delete(containerId);
        }
      }
      
      // Cleanup aggregated data (older than 30 days)
      const aggregatedExpiry = now - this.retention.aggregated;
      
      for (const [containerId, aggregated] of this.aggregatedData) {
        let containerHasData = false;
        
        for (const [interval, data] of Object.entries(aggregated)) {
          const originalLength = data.length;
          const filtered = data.filter(metric => metric.timestamp > aggregatedExpiry);
          
          if (filtered.length !== originalLength) {
            aggregated[interval] = filtered;
            cleanedAggregated += originalLength - filtered.length;
          }
          
          if (filtered.length > 0) {
            containerHasData = true;
          }
        }
        
        // Remove container from aggregated data if no data left
        if (!containerHasData) {
          this.aggregatedData.delete(containerId);
        }
      }
      
      this.stats.totalCleanedUp += cleanedHighRes + cleanedAggregated;
      this.stats.lastCleanup = now;
      
      if (cleanedHighRes > 0 || cleanedAggregated > 0) {
        console.log(`Cleanup complete: ${cleanedHighRes} high-res, ${cleanedAggregated} aggregated data points removed`);
        
        // Persist after cleanup
        await this.persistDataAsync();
      }
      
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }
  
  /**
   * Aggregate high-resolution data into time buckets
   */
  async aggregateData() {
    try {
      const now = Date.now();
      let aggregatedCount = 0;
      
      for (const [containerId, highResData] of this.highResData) {
        // Initialize aggregated data structure
        if (!this.aggregatedData.has(containerId)) {
          this.aggregatedData.set(containerId, {});
        }
        
        const containerAggregated = this.aggregatedData.get(containerId);
        
        // Aggregate at different intervals
        for (const [intervalName, intervalMs] of Object.entries(this.aggregation)) {
          if (!containerAggregated[intervalName]) {
            containerAggregated[intervalName] = [];
          }
          
          const aggregated = this.aggregateDataForInterval(
            highResData, 
            intervalMs, 
            containerAggregated[intervalName]
          );
          
          aggregatedCount += aggregated;
        }
      }
      
      this.stats.totalAggregated += aggregatedCount;
      this.stats.lastAggregation = now;
      
      if (aggregatedCount > 0) {
        console.log(`Aggregated ${aggregatedCount} data points`);
        
        // Persist after aggregation
        await this.persistDataAsync();
      }
      
    } catch (error) {
      console.error('Error during data aggregation:', error);
    }
  }
  
  /**
   * Aggregate data for a specific interval
   * 
   * @param {object[]} highResData - High-resolution data
   * @param {number} intervalMs - Interval in milliseconds
   * @param {object[]} existingAggregated - Existing aggregated data
   * @returns {number} Number of new aggregated data points
   */
  aggregateDataForInterval(highResData, intervalMs, existingAggregated) {
    const lastAggregatedTime = existingAggregated.length > 0 ? 
      existingAggregated[existingAggregated.length - 1].timestamp : 0;
    
    const buckets = new Map();
    let newDataPoints = 0;
    
    // Group data into time buckets
    for (const metric of highResData) {
      if (metric.timestamp <= lastAggregatedTime) {
        continue; // Skip already aggregated data
      }
      
      const bucketTime = Math.floor(metric.timestamp / intervalMs) * intervalMs;
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      
      buckets.get(bucketTime).push(metric);
    }
    
    // Create aggregated metrics for each bucket
    for (const [bucketTime, metrics] of buckets) {
      if (metrics.length === 0) continue;
      
      const aggregated = this.createAggregatedMetric(metrics, bucketTime);
      existingAggregated.push(aggregated);
      newDataPoints++;
    }
    
    // Keep aggregated data sorted
    existingAggregated.sort((a, b) => a.timestamp - b.timestamp);
    
    return newDataPoints;
  }
  
  /**
   * Create aggregated metric from multiple metrics
   * 
   * @param {object[]} metrics - Array of metrics to aggregate
   * @param {number} timestamp - Bucket timestamp
   * @returns {object} Aggregated metric
   */
  createAggregatedMetric(metrics, timestamp) {
    const count = metrics.length;
    const first = metrics[0];
    
    // Helper function to aggregate numeric values
    const aggregateValues = (path) => {
      const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== null);
      if (values.length === 0) return { avg: 0, min: 0, max: 0 };
      
      return {
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    };
    
    return {
      containerId: first.containerId,
      name: first.name,
      timestamp,
      projectId: first.projectId,
      count,
      interval: timestamp,
      cpu: {
        usage_percent: aggregateValues('cpu.usage_percent'),
        system_percent: aggregateValues('cpu.system_percent'),
        user_percent: aggregateValues('cpu.user_percent'),
        online_cpus: first.cpu.online_cpus,
        throttling: {
          periods: aggregateValues('cpu.throttling.periods'),
          throttled_periods: aggregateValues('cpu.throttling.throttled_periods'),
          throttled_time: aggregateValues('cpu.throttling.throttled_time')
        }
      },
      memory: {
        usage_bytes: aggregateValues('memory.usage_bytes'),
        usage_percent: aggregateValues('memory.usage_percent'),
        cache_bytes: aggregateValues('memory.cache_bytes'),
        usable_bytes: aggregateValues('memory.usable_bytes'),
        usable_percent: aggregateValues('memory.usable_percent'),
        limit_bytes: first.memory.limit_bytes
      },
      network: {
        rx_bytes_per_sec: aggregateValues('network.rx_bytes_per_sec'),
        tx_bytes_per_sec: aggregateValues('network.tx_bytes_per_sec'),
        rx_packets: aggregateValues('network.rx_packets'),
        tx_packets: aggregateValues('network.tx_packets'),
        rx_errors: aggregateValues('network.rx_errors'),
        tx_errors: aggregateValues('network.tx_errors')
      },
      disk: {
        read_bytes_per_sec: aggregateValues('disk.read_bytes_per_sec'),
        write_bytes_per_sec: aggregateValues('disk.write_bytes_per_sec'),
        read_ops_per_sec: aggregateValues('disk.read_ops_per_sec'),
        write_ops_per_sec: aggregateValues('disk.write_ops_per_sec')
      }
    };
  }
  
  /**
   * Get nested value from object using dot notation
   * 
   * @param {object} obj - Object to get value from
   * @param {string} path - Dot notation path
   * @returns {*} Value or null
   */
  getNestedValue(obj, path) {
    try {
      return path.split('.').reduce((o, p) => o && o[p], obj);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Load persisted data from disk
   */
  async loadPersistedData() {
    try {
      // Load high-resolution data
      const highResPath = path.join(this.dataPath, 'high-res.json');
      try {
        const highResData = await AtomicFile.readJSON(highResPath);
        this.highResData = new Map(Object.entries(highResData));
        console.log(`Loaded ${this.highResData.size} containers of high-res data`);
      } catch (error) {
        console.log('No existing high-res data found, starting fresh');
      }
      
      // Load aggregated data
      const aggregatedPath = path.join(this.dataPath, 'aggregated.json');
      try {
        const aggregatedData = await AtomicFile.readJSON(aggregatedPath);
        this.aggregatedData = new Map(Object.entries(aggregatedData));
        console.log(`Loaded ${this.aggregatedData.size} containers of aggregated data`);
      } catch (error) {
        console.log('No existing aggregated data found, starting fresh');
      }
      
      // Load stats
      const statsPath = path.join(this.dataPath, 'stats.json');
      try {
        this.stats = await AtomicFile.readJSON(statsPath);
        console.log('Loaded storage statistics');
      } catch (error) {
        console.log('No existing stats found, starting fresh');
      }
      
    } catch (error) {
      console.error('Error loading persisted data:', error);
      // Continue with empty data structures
    }
  }
  
  /**
   * Persist data to disk (async, non-blocking)
   */
  async persistDataAsync() {
    // Use setTimeout to avoid blocking
    setTimeout(async () => {
      try {
        await this.persistData();
      } catch (error) {
        console.error('Error in background data persistence:', error);
        this.stats.storageErrors++;
      }
    }, 100);
  }
  
  /**
   * Persist data to disk
   */
  async persistData() {
    try {
      // Convert Maps to objects for JSON serialization
      const highResObject = Object.fromEntries(this.highResData);
      const aggregatedObject = Object.fromEntries(this.aggregatedData);
      
      // Write data files in parallel
      await Promise.all([
        AtomicFile.writeJSON(path.join(this.dataPath, 'high-res.json'), highResObject),
        AtomicFile.writeJSON(path.join(this.dataPath, 'aggregated.json'), aggregatedObject),
        AtomicFile.writeJSON(path.join(this.dataPath, 'stats.json'), this.stats)
      ]);
      
    } catch (error) {
      console.error('Error persisting data:', error);
      throw error;
    }
  }
  
  /**
   * Ensure directory exists
   * 
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  /**
   * Shutdown the storage service
   */
  async shutdown() {
    console.log('Shutting down MetricsStorage...');
    
    // Stop periodic tasks
    this.stopPeriodicTasks();
    
    // Final persistence
    try {
      await this.persistData();
      console.log('Final data persistence complete');
    } catch (error) {
      console.error('Error during final persistence:', error);
    }
    
    console.log('MetricsStorage shutdown complete');
  }
}

module.exports = MetricsStorage;