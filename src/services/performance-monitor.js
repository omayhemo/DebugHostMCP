/**
 * Performance Monitor
 * 
 * Monitors resource usage of the multi-tech process discovery engine to ensure
 * performance requirements are met:
 * - CPU usage < 5% during scanning
 * - Memory footprint < 50MB additional overhead
 * - Scan completion < 2 seconds
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const os = require('os');

/**
 * Performance Metrics Structure
 */
const MetricTypes = {
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  SCAN_TIME: 'scan_time',
  SCAN_COUNT: 'scan_count',
  ERROR_RATE: 'error_rate'
};

/**
 * Performance Thresholds
 */
const DefaultThresholds = {
  CPU_PERCENT: 5.0,      // 5% CPU threshold
  MEMORY_MB: 50,         // 50MB memory threshold  
  SCAN_TIME_MS: 2000,    // 2 second scan time threshold
  ERROR_RATE_PERCENT: 5  // 5% error rate threshold
};

/**
 * Performance Monitor
 * Tracks system resource usage and performance metrics for the discovery engine
 */
class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enabled: options.enabled !== false,
      samplingInterval: options.samplingInterval || 1000, // 1 second
      historySize: options.historySize || 100,
      alertOnThresholdExceed: options.alertOnThresholdExceed !== false,
      ...options
    };
    
    // Performance thresholds
    this.thresholds = {
      cpuThreshold: options.cpuThreshold || DefaultThresholds.CPU_PERCENT,
      memoryThreshold: options.memoryThreshold || DefaultThresholds.MEMORY_MB,
      scanTimeThreshold: options.scanTimeThreshold || DefaultThresholds.SCAN_TIME_MS,
      errorRateThreshold: options.errorRateThreshold || DefaultThresholds.ERROR_RATE_PERCENT
    };
    
    // Internal state
    this.initialized = false;
    this.monitoring = false;
    this.startTime = null;
    this.baselineMemory = null;
    
    // Performance history
    this.metrics = {
      cpu: [],
      memory: [],
      scanTimes: [],
      scanCount: 0,
      errorCount: 0,
      thresholdViolations: []
    };
    
    // Active scan monitoring
    this.activeScanMonitors = new Map();
    
    // Monitoring intervals
    this.monitoringInterval = null;
  }
  
  /**
   * Initialize the performance monitor
   */
  async initialize() {
    if (!this.options.enabled) {
      console.log('Performance monitoring disabled');
      return;
    }
    
    console.log('Initializing Performance Monitor...');
    
    try {
      // Record baseline metrics
      this.startTime = Date.now();
      this.baselineMemory = this._getCurrentMemoryUsage();
      
      // Start continuous monitoring
      this._startMonitoring();
      
      this.initialized = true;
      console.log('✓ Performance Monitor initialized');
      
    } catch (error) {
      console.error('Failed to initialize Performance Monitor:', error);
      throw error;
    }
  }
  
  /**
   * Start monitoring for a specific scan operation
   * @param {string} scanId - Optional scan identifier
   * @returns {Object} Scan monitor instance
   */
  startScanMonitoring(scanId = null) {
    if (!this.options.enabled) {
      return null;
    }
    
    const monitorId = scanId || `scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const scanMonitor = {
      id: monitorId,
      startTime: performance.now(),
      startCpuUsage: this._getCurrentCpuUsage(),
      startMemory: this._getCurrentMemoryUsage(),
      
      getResults: () => {
        const endTime = performance.now();
        const duration = endTime - scanMonitor.startTime;
        
        return {
          scanId: monitorId,
          duration,
          startMetrics: {
            cpu: scanMonitor.startCpuUsage,
            memory: scanMonitor.startMemory
          },
          endMetrics: {
            cpu: this._getCurrentCpuUsage(),
            memory: this._getCurrentMemoryUsage()
          },
          thresholdViolations: this._checkScanThresholds(duration)
        };
      }
    };
    
    this.activeScanMonitors.set(monitorId, scanMonitor);
    return scanMonitor;
  }
  
  /**
   * Record scan completion and update metrics
   * @param {Object} scanResults - Scan results with timing information
   */
  recordScanCompletion(scanResults) {
    if (!this.options.enabled) return;
    
    const duration = scanResults.duration || 0;
    this.metrics.scanTimes.push({
      timestamp: Date.now(),
      duration,
      processCount: scanResults.totalProcesses || 0,
      success: scanResults.success !== false
    });
    
    this.metrics.scanCount++;
    
    if (!scanResults.success) {
      this.metrics.errorCount++;
    }
    
    // Check thresholds
    const violations = this._checkScanThresholds(duration);
    if (violations.length > 0) {
      this._handleThresholdViolations(violations, scanResults);
    }
    
    // Trim history if needed
    this._trimHistory();
    
    // Remove from active monitors
    if (scanResults.scanId && this.activeScanMonitors.has(scanResults.scanId)) {
      this.activeScanMonitors.delete(scanResults.scanId);
    }
  }
  
  /**
   * Record an error occurrence
   * @param {Error} error - Error that occurred
   * @param {Object} context - Additional context
   */
  recordError(error, context = {}) {
    if (!this.options.enabled) return;
    
    this.metrics.errorCount++;
    
    const errorInfo = {
      timestamp: Date.now(),
      message: error.message,
      type: error.constructor.name,
      context
    };
    
    // Check if error rate threshold exceeded
    const errorRate = this.getErrorRate();
    if (errorRate > this.thresholds.errorRateThreshold) {
      this._handleThresholdViolations([{
        type: 'error_rate',
        threshold: this.thresholds.errorRateThreshold,
        actual: errorRate,
        severity: 'high'
      }], { error: errorInfo });
    }
  }
  
  /**
   * Get current performance metrics
   * @returns {Object} Current metrics snapshot
   */
  getCurrentMetrics() {
    if (!this.options.enabled) {
      return { enabled: false };
    }
    
    const currentMemory = this._getCurrentMemoryUsage();
    const memoryOverhead = currentMemory - this.baselineMemory;
    
    return {
      timestamp: Date.now(),
      uptime: this.getUptime(),
      cpu: {
        current: this._getCurrentCpuUsage(),
        threshold: this.thresholds.cpuThreshold,
        withinThreshold: this._getCurrentCpuUsage() <= this.thresholds.cpuThreshold
      },
      memory: {
        current: currentMemory,
        baseline: this.baselineMemory,
        overhead: memoryOverhead,
        threshold: this.thresholds.memoryThreshold,
        withinThreshold: memoryOverhead <= this.thresholds.memoryThreshold
      },
      scans: {
        total: this.metrics.scanCount,
        errors: this.metrics.errorCount,
        errorRate: this.getErrorRate(),
        averageScanTime: this.getAverageScanTime(),
        lastScanTime: this.getLastScanTime()
      },
      thresholdViolations: this.metrics.thresholdViolations.slice(-10) // Last 10 violations
    };
  }
  
  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStatistics() {
    if (!this.options.enabled) {
      return { enabled: false };
    }
    
    const scanTimes = this.metrics.scanTimes.map(s => s.duration);
    const successfulScans = this.metrics.scanTimes.filter(s => s.success);
    
    return {
      monitoring: {
        enabled: true,
        uptime: this.getUptime(),
        samplingInterval: this.options.samplingInterval
      },
      scans: {
        total: this.metrics.scanCount,
        successful: successfulScans.length,
        failed: this.metrics.errorCount,
        successRate: this.getSuccessRate(),
        errorRate: this.getErrorRate()
      },
      performance: {
        averageScanTime: this.getAverageScanTime(),
        fastestScan: scanTimes.length > 0 ? Math.min(...scanTimes) : 0,
        slowestScan: scanTimes.length > 0 ? Math.max(...scanTimes) : 0,
        scansWithinThreshold: scanTimes.filter(t => t <= this.thresholds.scanTimeThreshold).length
      },
      resources: {
        memoryOverhead: this._getCurrentMemoryUsage() - this.baselineMemory,
        thresholdViolations: this.metrics.thresholdViolations.length
      },
      thresholds: { ...this.thresholds }
    };
  }
  
  /**
   * Check if performance is within acceptable thresholds
   * @returns {Object} Health status
   */
  getHealthStatus() {
    if (!this.options.enabled) {
      return { healthy: true, reason: 'Monitoring disabled' };
    }
    
    const current = this.getCurrentMetrics();
    const issues = [];
    
    if (!current.cpu.withinThreshold) {
      issues.push(`CPU usage (${current.cpu.current.toFixed(1)}%) exceeds threshold (${this.thresholds.cpuThreshold}%)`);
    }
    
    if (!current.memory.withinThreshold) {
      issues.push(`Memory overhead (${current.memory.overhead.toFixed(1)}MB) exceeds threshold (${this.thresholds.memoryThreshold}MB)`);
    }
    
    if (current.scans.errorRate > this.thresholds.errorRateThreshold) {
      issues.push(`Error rate (${current.scans.errorRate.toFixed(1)}%) exceeds threshold (${this.thresholds.errorRateThreshold}%)`);
    }
    
    if (current.scans.averageScanTime > this.thresholds.scanTimeThreshold) {
      issues.push(`Average scan time (${current.scans.averageScanTime.toFixed(0)}ms) exceeds threshold (${this.thresholds.scanTimeThreshold}ms)`);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get system uptime since monitor initialization
   * @returns {number} Uptime in milliseconds
   */
  getUptime() {
    return this.startTime ? Date.now() - this.startTime : 0;
  }
  
  /**
   * Get error rate percentage
   * @returns {number} Error rate as percentage
   */
  getErrorRate() {
    if (this.metrics.scanCount === 0) return 0;
    return (this.metrics.errorCount / this.metrics.scanCount) * 100;
  }
  
  /**
   * Get success rate percentage
   * @returns {number} Success rate as percentage
   */
  getSuccessRate() {
    return 100 - this.getErrorRate();
  }
  
  /**
   * Get average scan time
   * @returns {number} Average scan time in milliseconds
   */
  getAverageScanTime() {
    if (this.metrics.scanTimes.length === 0) return 0;
    
    const totalTime = this.metrics.scanTimes.reduce((sum, scan) => sum + scan.duration, 0);
    return totalTime / this.metrics.scanTimes.length;
  }
  
  /**
   * Get last scan time
   * @returns {number|null} Last scan time in milliseconds or null
   */
  getLastScanTime() {
    if (this.metrics.scanTimes.length === 0) return null;
    return this.metrics.scanTimes[this.metrics.scanTimes.length - 1].duration;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      cpu: [],
      memory: [],
      scanTimes: [],
      scanCount: 0,
      errorCount: 0,
      thresholdViolations: []
    };
    
    this.startTime = Date.now();
    this.baselineMemory = this._getCurrentMemoryUsage();
    
    console.log('Performance metrics reset');
    this.emit('metricsReset');
  }
  
  /**
   * Shutdown the performance monitor
   */
  async shutdown() {
    console.log('Shutting down Performance Monitor...');
    
    this._stopMonitoring();
    this.activeScanMonitors.clear();
    this.initialized = false;
    
    console.log('Performance Monitor shutdown complete');
    this.emit('shutdown');
  }
  
  // Private implementation methods
  
  /**
   * Start continuous monitoring
   * @private
   */
  _startMonitoring() {
    if (this.monitoring || !this.options.enabled) return;
    
    this.monitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this._collectMetrics();
    }, this.options.samplingInterval);
    
    console.log(`Performance monitoring started (sampling every ${this.options.samplingInterval}ms)`);
  }
  
  /**
   * Stop continuous monitoring
   * @private
   */
  _stopMonitoring() {
    if (!this.monitoring) return;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.monitoring = false;
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Collect current metrics
   * @private
   */
  _collectMetrics() {
    const timestamp = Date.now();
    
    // Collect CPU usage
    const cpuUsage = this._getCurrentCpuUsage();
    this.metrics.cpu.push({
      timestamp,
      value: cpuUsage
    });
    
    // Collect memory usage
    const memoryUsage = this._getCurrentMemoryUsage();
    this.metrics.memory.push({
      timestamp,
      value: memoryUsage,
      overhead: memoryUsage - this.baselineMemory
    });
    
    // Check for threshold violations
    const violations = [];
    
    if (cpuUsage > this.thresholds.cpuThreshold) {
      violations.push({
        type: MetricTypes.CPU_USAGE,
        threshold: this.thresholds.cpuThreshold,
        actual: cpuUsage,
        severity: cpuUsage > this.thresholds.cpuThreshold * 2 ? 'high' : 'medium'
      });
    }
    
    const memoryOverhead = memoryUsage - this.baselineMemory;
    if (memoryOverhead > this.thresholds.memoryThreshold) {
      violations.push({
        type: MetricTypes.MEMORY_USAGE,
        threshold: this.thresholds.memoryThreshold,
        actual: memoryOverhead,
        severity: memoryOverhead > this.thresholds.memoryThreshold * 2 ? 'high' : 'medium'
      });
    }
    
    if (violations.length > 0) {
      this._handleThresholdViolations(violations);
    }
    
    // Trim history
    this._trimHistory();
  }
  
  /**
   * Get current CPU usage percentage
   * @private
   */
  _getCurrentCpuUsage() {
    // Get CPU usage from OS
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    
    return 100 - (100 * idle / total);
  }
  
  /**
   * Get current memory usage in MB
   * @private
   */
  _getCurrentMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    return memoryUsage.heapUsed / 1024 / 1024; // Convert to MB
  }
  
  /**
   * Check scan-specific thresholds
   * @private
   */
  _checkScanThresholds(scanDuration) {
    const violations = [];
    
    if (scanDuration > this.thresholds.scanTimeThreshold) {
      violations.push({
        type: MetricTypes.SCAN_TIME,
        threshold: this.thresholds.scanTimeThreshold,
        actual: scanDuration,
        severity: scanDuration > this.thresholds.scanTimeThreshold * 2 ? 'high' : 'medium'
      });
    }
    
    return violations;
  }
  
  /**
   * Handle threshold violations
   * @private
   */
  _handleThresholdViolations(violations, context = {}) {
    const violationEvent = {
      timestamp: Date.now(),
      violations,
      context
    };
    
    this.metrics.thresholdViolations.push(violationEvent);
    
    if (this.options.alertOnThresholdExceed) {
      console.warn('Performance threshold violations detected:', violations.map(v => 
        `${v.type}: ${v.actual} > ${v.threshold} (${v.severity} severity)`
      ).join(', '));
    }
    
    this.emit('thresholdViolation', violationEvent);
  }
  
  /**
   * Trim history to maintain memory efficiency
   * @private
   */
  _trimHistory() {
    const maxSize = this.options.historySize;
    
    if (this.metrics.cpu.length > maxSize) {
      this.metrics.cpu = this.metrics.cpu.slice(-maxSize);
    }
    
    if (this.metrics.memory.length > maxSize) {
      this.metrics.memory = this.metrics.memory.slice(-maxSize);
    }
    
    if (this.metrics.scanTimes.length > maxSize) {
      this.metrics.scanTimes = this.metrics.scanTimes.slice(-maxSize);
    }
    
    if (this.metrics.thresholdViolations.length > maxSize) {
      this.metrics.thresholdViolations = this.metrics.thresholdViolations.slice(-maxSize);
    }
  }
}

module.exports = {
  PerformanceMonitor,
  MetricTypes,
  DefaultThresholds
};