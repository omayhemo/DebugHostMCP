/**
 * Registry Performance Optimizer
 * 
 * Specialized performance optimization module for the Enhanced Port Registry
 * to ensure it meets strict requirements:
 * - Refresh Time: < 1 second for 100+ process entries
 * - CPU Usage: < 2% for continuous refresh cycles
 * - Memory Efficiency: Minimal memory footprint growth
 * - Concurrent Access: Thread-safe operations
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

/**
 * Performance Optimization Strategies
 */
const OptimizationStrategy = {
  BATCH_PROCESSING: 'batch_processing',
  INCREMENTAL_UPDATES: 'incremental_updates', 
  SMART_CACHING: 'smart_caching',
  ASYNC_QUEUEING: 'async_queueing',
  MEMORY_POOLING: 'memory_pooling'
};

/**
 * Performance Metrics Tracking
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      refreshTimes: [],
      cpuUsage: [],
      memoryUsage: [],
      concurrentOperations: 0,
      queuedOperations: 0,
      cacheHitRate: 0,
      batchProcessingEfficiency: 0
    };
    this.baseline = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: Date.now()
    };
  }
  
  recordRefreshTime(duration) {
    this.metrics.refreshTimes.push({
      duration,
      timestamp: Date.now()
    });
    
    // Keep only recent measurements (last 100)
    if (this.metrics.refreshTimes.length > 100) {
      this.metrics.refreshTimes = this.metrics.refreshTimes.slice(-100);
    }
  }
  
  recordCpuUsage() {
    const current = process.cpuUsage(this.baseline.cpu);
    const cpuPercent = (current.user + current.system) / 1000 / (Date.now() - this.baseline.timestamp) * 100;
    
    this.metrics.cpuUsage.push({
      percent: cpuPercent,
      timestamp: Date.now()
    });
    
    // Keep recent measurements
    if (this.metrics.cpuUsage.length > 50) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-50);
    }
    
    return cpuPercent;
  }
  
  getAverageRefreshTime() {
    if (this.metrics.refreshTimes.length === 0) return 0;
    const recent = this.metrics.refreshTimes.slice(-20);
    return recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
  }
  
  getAverageCpuUsage() {
    if (this.metrics.cpuUsage.length === 0) return 0;
    const recent = this.metrics.cpuUsage.slice(-10);
    return recent.reduce((sum, c) => sum + c.percent, 0) / recent.length;
  }
  
  meetsPerformanceRequirements() {
    return {
      refreshTime: this.getAverageRefreshTime() < 1000, // <1s
      cpuUsage: this.getAverageCpuUsage() < 2.0,        // <2%
      overall: this.getAverageRefreshTime() < 1000 && this.getAverageCpuUsage() < 2.0
    };
  }
}

/**
 * Smart Process Cache
 * Implements intelligent caching with change detection
 */
class SmartProcessCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.ttl = options.ttl || 5000; // 5 second TTL
    this.maxSize = options.maxSize || 1000;
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  set(key, value, customTTL = null) {
    const ttl = customTTL || this.ttl;
    const expiryTime = Date.now() + ttl;
    
    this.cache.set(key, value);
    this.timestamps.set(key, expiryTime);
    
    // Cleanup old entries if cache is too large
    if (this.cache.size > this.maxSize) {
      this._cleanup();
    }
  }
  
  get(key) {
    const now = Date.now();
    const expiryTime = this.timestamps.get(key);
    
    if (!expiryTime || now > expiryTime) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.missCount++;
      return null;
    }
    
    this.hitCount++;
    return this.cache.get(key);
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
  
  getHitRate() {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }
  
  _cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, timestamp] of this.timestamps) {
      if (now > timestamp) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });
    
    // If still too large, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const sortedEntries = Array.from(this.timestamps.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.cache.size - this.maxSize);
      
      sortedEntries.forEach(([key]) => {
        this.cache.delete(key);
        this.timestamps.delete(key);
      });
    }
  }
}

/**
 * Async Operation Queue
 * Manages concurrent operations with intelligent queueing
 */
class AsyncOperationQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.queue = [];
    this.running = new Set();
    this.maxQueueSize = options.maxQueueSize || 50;
  }
  
  async enqueue(operation, priority = 0) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Operation queue is full');
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push({
        operation,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);
      
      this._processQueue();
    });
  }
  
  async _processQueue() {
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift();
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    this.running.add(operationId);
    
    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running.delete(operationId);
      // Process next item in queue
      setImmediate(() => this._processQueue());
    }
  }
  
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      runningOperations: this.running.size,
      maxConcurrent: this.maxConcurrent,
      utilization: this.running.size / this.maxConcurrent
    };
  }
}

/**
 * Batch Process Optimizer
 * Optimizes batch processing of discovery results
 */
class BatchProcessOptimizer {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 50;
    this.batchTimeout = options.batchTimeout || 100; // 100ms
    this.pendingBatches = new Map();
  }
  
  async processBatch(items, processor, batchKey = 'default') {
    // Add items to pending batch
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, {
        items: [],
        promises: [],
        timer: null
      });
    }
    
    const batch = this.pendingBatches.get(batchKey);
    batch.items.push(...items);
    
    return new Promise((resolve, reject) => {
      batch.promises.push({ resolve, reject });
      
      // Clear existing timer
      if (batch.timer) {
        clearTimeout(batch.timer);
      }
      
      // Set new timer or process if batch is full
      if (batch.items.length >= this.batchSize) {
        this._processBatch(batchKey, processor);
      } else {
        batch.timer = setTimeout(() => {
          this._processBatch(batchKey, processor);
        }, this.batchTimeout);
      }
    });
  }
  
  async _processBatch(batchKey, processor) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.items.length === 0) {
      return;
    }
    
    // Clear timer
    if (batch.timer) {
      clearTimeout(batch.timer);
    }
    
    // Process items
    try {
      const results = await processor(batch.items);
      
      // Resolve all promises
      batch.promises.forEach(promise => promise.resolve(results));
      
    } catch (error) {
      // Reject all promises
      batch.promises.forEach(promise => promise.reject(error));
    }
    
    // Clear batch
    this.pendingBatches.delete(batchKey);
  }
}

/**
 * Registry Performance Optimizer
 * Main optimization coordinator
 */
class RegistryPerformanceOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableSmartCaching: options.enableSmartCaching !== false,
      enableBatchProcessing: options.enableBatchProcessing !== false,
      enableAsyncQueueing: options.enableAsyncQueueing !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
      ...options
    };
    
    // Performance components
    this.metrics = new PerformanceMetrics();
    this.cache = new SmartProcessCache(options.cache);
    this.queue = new AsyncOperationQueue(options.queue);
    this.batchProcessor = new BatchProcessOptimizer(options.batch);
    
    // Optimization state
    this.initialized = false;
    this.optimizationStrategies = new Set();
    
    // Performance monitoring
    this.monitoringInterval = null;
  }
  
  /**
   * Initialize the performance optimizer
   */
  async initialize() {
    console.log('Initializing Registry Performance Optimizer...');
    
    // Enable optimization strategies based on configuration
    if (this.options.enableSmartCaching) {
      this.optimizationStrategies.add(OptimizationStrategy.SMART_CACHING);
    }
    
    if (this.options.enableBatchProcessing) {
      this.optimizationStrategies.add(OptimizationStrategy.BATCH_PROCESSING);
    }
    
    if (this.options.enableAsyncQueueing) {
      this.optimizationStrategies.add(OptimizationStrategy.ASYNC_QUEUEING);
    }
    
    // Start performance monitoring
    if (this.options.enablePerformanceMonitoring) {
      this._startPerformanceMonitoring();
    }
    
    this.initialized = true;
    console.log(`✓ Performance optimizer initialized with strategies: ${Array.from(this.optimizationStrategies).join(', ')}`);
  }
  
  /**
   * Optimize registry refresh operation
   */
  async optimizeRefresh(refreshOperation) {
    const startTime = performance.now();
    
    if (!this.initialized) {
      throw new Error('Performance optimizer not initialized');
    }
    
    try {
      let result;
      
      if (this.optimizationStrategies.has(OptimizationStrategy.ASYNC_QUEUEING)) {
        // Use async queue for controlled concurrency
        result = await this.queue.enqueue(refreshOperation, 1);
      } else {
        // Execute directly
        result = await refreshOperation();
      }
      
      // Record performance metrics
      const duration = performance.now() - startTime;
      this.metrics.recordRefreshTime(duration);
      
      return result;
      
    } catch (error) {
      console.error('Error during optimized refresh:', error.message);
      throw error;
    }
  }
  
  /**
   * Optimize process categorization with caching and batching
   */
  async optimizeCategorization(processes, categorizeFunction) {
    if (!this.initialized) {
      return categorizeFunction(processes);
    }
    
    const cacheKey = this._generateProcessCacheKey(processes);
    
    // Check cache first
    if (this.optimizationStrategies.has(OptimizationStrategy.SMART_CACHING)) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    let result;
    
    if (this.optimizationStrategies.has(OptimizationStrategy.BATCH_PROCESSING)) {
      // Use batch processing for large process lists
      result = await this.batchProcessor.processBatch(
        processes, 
        categorizeFunction,
        'categorization'
      );
    } else {
      // Standard categorization
      result = await categorizeFunction(processes);
    }
    
    // Cache the result
    if (this.optimizationStrategies.has(OptimizationStrategy.SMART_CACHING)) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Optimize concurrent access with intelligent locking
   */
  async optimizeConcurrentAccess(operation, resourceId) {
    if (!this.optimizationStrategies.has(OptimizationStrategy.ASYNC_QUEUEING)) {
      return operation();
    }
    
    // Use priority based on operation type
    const priority = resourceId === 'refresh' ? 2 : 1;
    
    return this.queue.enqueue(operation, priority);
  }
  
  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const requirements = this.metrics.meetsPerformanceRequirements();
    
    return {
      timestamp: new Date().toISOString(),
      requirements: {
        refreshTime: {
          current: this.metrics.getAverageRefreshTime(),
          requirement: 1000,
          meets: requirements.refreshTime
        },
        cpuUsage: {
          current: this.metrics.getAverageCpuUsage(),
          requirement: 2.0,
          meets: requirements.cpuUsage
        },
        overall: requirements.overall
      },
      optimizations: {
        strategies: Array.from(this.optimizationStrategies),
        cache: {
          hitRate: this.cache.getHitRate(),
          size: this.cache.cache.size
        },
        queue: this.queue.getQueueStatus(),
        batch: {
          pendingBatches: this.batchProcessor.pendingBatches.size
        }
      },
      metrics: this.metrics.metrics
    };
  }
  
  /**
   * Shutdown the optimizer gracefully
   */
  async shutdown() {
    console.log('Shutting down Registry Performance Optimizer...');
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Clear caches
    this.cache.clear();
    
    // Clear pending batches
    this.batchProcessor.pendingBatches.clear();
    
    console.log('Performance optimizer shutdown complete');
  }
  
  // Private methods
  
  /**
   * Generate cache key for process list
   * @private
   */
  _generateProcessCacheKey(processes) {
    const processSignature = processes
      .map(p => `${p.port}-${p.pid || 'unknown'}`)
      .sort()
      .join('|');
    
    return `processes:${processSignature}`;
  }
  
  /**
   * Start performance monitoring
   * @private
   */
  _startPerformanceMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.metrics.recordCpuUsage();
      
      const report = this.getPerformanceReport();
      if (!report.requirements.overall) {
        this.emit('performanceWarning', report);
      }
    }, 5000); // Monitor every 5 seconds
  }
}

module.exports = {
  RegistryPerformanceOptimizer,
  PerformanceMetrics,
  SmartProcessCache,
  AsyncOperationQueue,
  BatchProcessOptimizer,
  OptimizationStrategy
};