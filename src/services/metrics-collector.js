/**
 * Docker Metrics Collector
 * 
 * Service for collecting Docker container metrics at configurable intervals
 * Integrates with dockerode for Docker API access and provides CPU, memory, 
 * network I/O, and disk I/O metrics
 */

const EventEmitter = require('events');

class MetricsCollector extends EventEmitter {
  constructor(dockerManager, options = {}) {
    super();
    
    this.dockerManager = dockerManager;
    this.docker = dockerManager.docker;
    
    // Configuration options
    this.intervals = {
      fast: options.fastInterval || 1000,    // 1s for real-time
      medium: options.mediumInterval || 5000, // 5s for medium resolution
      slow: options.slowInterval || 10000     // 10s for slow resolution
    };
    
    // Active collection intervals
    this.collectors = {
      fast: null,
      medium: null,
      slow: null
    };
    
    // Container tracking
    this.monitoredContainers = new Set();
    this.lastMetrics = new Map(); // For calculating deltas
    
    // Collection state
    this.isRunning = false;
    this.totalCollections = 0;
    this.errorCount = 0;
    this.lastError = null;
    
    console.log(`MetricsCollector initialized with intervals: ${JSON.stringify(this.intervals)}`);
  }
  
  /**
   * Start metrics collection
   * 
   * @param {object} options - Collection options
   * @param {string[]} options.containerIds - Container IDs to monitor (optional, monitors all if not specified)
   * @param {string[]} options.intervals - Intervals to enable (['fast', 'medium', 'slow'])
   */
  start(options = {}) {
    if (this.isRunning) {
      console.log('MetricsCollector is already running');
      return;
    }
    
    const { containerIds, intervals = ['fast', 'medium'] } = options;
    
    if (containerIds) {
      this.monitoredContainers = new Set(containerIds);
      console.log(`Starting metrics collection for containers: ${Array.from(this.monitoredContainers).join(', ')}`);
    } else {
      console.log('Starting metrics collection for all containers');
    }
    
    // Start requested intervals
    intervals.forEach(interval => {
      if (this.intervals[interval] && !this.collectors[interval]) {
        this.collectors[interval] = setInterval(
          () => this.collectMetrics(interval),
          this.intervals[interval]
        );
        console.log(`Started ${interval} metrics collection at ${this.intervals[interval]}ms intervals`);
      }
    });
    
    this.isRunning = true;
    this.emit('started', { intervals, containerIds: Array.from(this.monitoredContainers) });
  }
  
  /**
   * Stop metrics collection
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    // Clear all intervals
    Object.keys(this.collectors).forEach(interval => {
      if (this.collectors[interval]) {
        clearInterval(this.collectors[interval]);
        this.collectors[interval] = null;
        console.log(`Stopped ${interval} metrics collection`);
      }
    });
    
    this.isRunning = false;
    this.emit('stopped');
    console.log('MetricsCollector stopped');
  }
  
  /**
   * Add container to monitoring
   * 
   * @param {string} containerId - Container ID to add
   */
  addContainer(containerId) {
    if (!this.monitoredContainers.has(containerId)) {
      this.monitoredContainers.add(containerId);
      console.log(`Added container ${containerId} to metrics monitoring`);
      this.emit('containerAdded', containerId);
    }
  }
  
  /**
   * Remove container from monitoring
   * 
   * @param {string} containerId - Container ID to remove
   */
  removeContainer(containerId) {
    if (this.monitoredContainers.has(containerId)) {
      this.monitoredContainers.delete(containerId);
      this.lastMetrics.delete(containerId);
      console.log(`Removed container ${containerId} from metrics monitoring`);
      this.emit('containerRemoved', containerId);
    }
  }
  
  /**
   * Collect metrics for all monitored containers
   * 
   * @param {string} interval - Collection interval type
   */
  async collectMetrics(interval) {
    try {
      const timestamp = Date.now();
      const containers = await this.getContainersToMonitor();
      
      if (containers.length === 0) {
        return;
      }
      
      const metricsPromises = containers.map(containerId => 
        this.collectContainerMetrics(containerId, timestamp)
      );
      
      const results = await Promise.allSettled(metricsPromises);
      
      const successfulMetrics = [];
      let errorCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulMetrics.push(result.value);
        } else {
          errorCount++;
          console.warn(`Failed to collect metrics for container ${containers[index]}:`, 
                      result.reason?.message || 'Unknown error');
        }
      });
      
      if (successfulMetrics.length > 0) {
        this.totalCollections++;
        this.emit('metrics', {
          timestamp,
          interval,
          metrics: successfulMetrics,
          totalContainers: containers.length,
          successfulCollections: successfulMetrics.length,
          failedCollections: errorCount
        });
      }
      
      this.errorCount += errorCount;
      
    } catch (error) {
      this.errorCount++;
      this.lastError = error;
      console.error(`Error in metrics collection (${interval}):`, error);
      this.emit('error', error);
    }
  }
  
  /**
   * Get list of containers to monitor
   * 
   * @returns {Promise<string[]>} Array of container IDs
   */
  async getContainersToMonitor() {
    try {
      // If specific containers are specified, use those
      if (this.monitoredContainers.size > 0) {
        return Array.from(this.monitoredContainers);
      }
      
      // Otherwise, get all running debug-host containers
      const containers = await this.docker.listContainers({
        filters: {
          label: ['debug-host=true'],
          status: ['running']
        }
      });
      
      return containers.map(container => container.Id);
    } catch (error) {
      console.error('Error getting containers to monitor:', error);
      return [];
    }
  }
  
  /**
   * Collect metrics for a specific container
   * 
   * @param {string} containerId - Container ID
   * @param {number} timestamp - Collection timestamp
   * @returns {Promise<object>} Container metrics
   */
  async collectContainerMetrics(containerId, timestamp) {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Get container info and stats in parallel
      const [containerInfo, stats] = await Promise.all([
        container.inspect(),
        container.stats({ stream: false })
      ]);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(containerId, containerInfo, stats, timestamp);
      
      // Store for delta calculations
      this.lastMetrics.set(containerId, {
        timestamp,
        stats,
        metrics
      });
      
      return metrics;
    } catch (error) {
      if (error.statusCode === 404) {
        // Container no longer exists, remove from monitoring
        this.removeContainer(containerId);
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Calculate container metrics from Docker stats
   * 
   * @param {string} containerId - Container ID
   * @param {object} containerInfo - Container info from inspect
   * @param {object} stats - Container stats from Docker
   * @param {number} timestamp - Collection timestamp
   * @returns {object} Calculated metrics
   */
  calculateMetrics(containerId, containerInfo, stats, timestamp) {
    const previousData = this.lastMetrics.get(containerId);
    const previousStats = previousData?.stats;
    const timeDelta = previousData ? (timestamp - previousData.timestamp) / 1000 : 0; // seconds
    
    // CPU Metrics
    const cpuMetrics = this.calculateCpuMetrics(stats, previousStats, timeDelta);
    
    // Memory Metrics
    const memoryMetrics = this.calculateMemoryMetrics(stats);
    
    // Network Metrics
    const networkMetrics = this.calculateNetworkMetrics(stats, previousStats, timeDelta);
    
    // Block I/O Metrics
    const diskMetrics = this.calculateDiskMetrics(stats, previousStats, timeDelta);
    
    return {
      containerId,
      name: containerInfo.Name.replace(/^\//, ''), // Remove leading slash
      timestamp,
      projectId: containerInfo.Config.Labels?.['project-id'],
      status: containerInfo.State.Status,
      cpu: cpuMetrics,
      memory: memoryMetrics,
      network: networkMetrics,
      disk: diskMetrics,
      uptime: containerInfo.State.StartedAt ? 
               Math.floor((timestamp - new Date(containerInfo.State.StartedAt).getTime()) / 1000) : 0
    };
  }
  
  /**
   * Calculate CPU metrics
   * 
   * @param {object} stats - Current stats
   * @param {object} previousStats - Previous stats
   * @param {number} timeDelta - Time delta in seconds
   * @returns {object} CPU metrics
   */
  calculateCpuMetrics(stats, previousStats, timeDelta) {
    const cpuStats = stats.cpu_stats;
    const preCpuStats = stats.precpu_stats;
    
    let cpuPercent = 0;
    let systemUsage = 0;
    let userUsage = 0;
    
    if (preCpuStats.cpu_usage && cpuStats.cpu_usage) {
      const cpuDelta = cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;
      const systemDelta = cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;
      const cpuCount = cpuStats.online_cpus || 1;
      
      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
      }
      
      if (cpuStats.cpu_usage.usage_in_kernelmode && cpuStats.cpu_usage.usage_in_usermode) {
        const totalUsage = cpuStats.cpu_usage.usage_in_kernelmode + cpuStats.cpu_usage.usage_in_usermode;
        if (totalUsage > 0) {
          systemUsage = (cpuStats.cpu_usage.usage_in_kernelmode / totalUsage) * 100;
          userUsage = (cpuStats.cpu_usage.usage_in_usermode / totalUsage) * 100;
        }
      }
    }
    
    return {
      usage_percent: Math.round(cpuPercent * 100) / 100, // Round to 2 decimal places
      system_percent: Math.round(systemUsage * 100) / 100,
      user_percent: Math.round(userUsage * 100) / 100,
      online_cpus: cpuStats.online_cpus || 1,
      throttling: {
        periods: cpuStats.throttling_data?.periods || 0,
        throttled_periods: cpuStats.throttling_data?.throttled_periods || 0,
        throttled_time: cpuStats.throttling_data?.throttled_time || 0
      }
    };
  }
  
  /**
   * Calculate memory metrics
   * 
   * @param {object} stats - Current stats
   * @returns {object} Memory metrics
   */
  calculateMemoryMetrics(stats) {
    const memoryStats = stats.memory_stats;
    
    const usage = memoryStats.usage || 0;
    const limit = memoryStats.limit || 0;
    const cache = memoryStats.stats?.cache || 0;
    
    const usagePercent = limit > 0 ? (usage / limit) * 100 : 0;
    const usableMemory = Math.max(0, usage - cache);
    const usablePercent = limit > 0 ? (usableMemory / limit) * 100 : 0;
    
    return {
      usage_bytes: usage,
      limit_bytes: limit,
      usage_percent: Math.round(usagePercent * 100) / 100,
      cache_bytes: cache,
      usable_bytes: usableMemory,
      usable_percent: Math.round(usablePercent * 100) / 100,
      stats: {
        rss: memoryStats.stats?.rss || 0,
        mapped_file: memoryStats.stats?.mapped_file || 0,
        swap: memoryStats.stats?.swap || 0
      }
    };
  }
  
  /**
   * Calculate network metrics
   * 
   * @param {object} stats - Current stats
   * @param {object} previousStats - Previous stats
   * @param {number} timeDelta - Time delta in seconds
   * @returns {object} Network metrics
   */
  calculateNetworkMetrics(stats, previousStats, timeDelta) {
    const networks = stats.networks || {};
    const previousNetworks = previousStats?.networks || {};
    
    let totalRxBytes = 0, totalTxBytes = 0;
    let totalRxPackets = 0, totalTxPackets = 0;
    let totalRxDropped = 0, totalTxDropped = 0;
    let totalRxErrors = 0, totalTxErrors = 0;
    
    const interfaces = {};
    
    Object.entries(networks).forEach(([interfaceName, net]) => {
      totalRxBytes += net.rx_bytes || 0;
      totalTxBytes += net.tx_bytes || 0;
      totalRxPackets += net.rx_packets || 0;
      totalTxPackets += net.tx_packets || 0;
      totalRxDropped += net.rx_dropped || 0;
      totalTxDropped += net.tx_dropped || 0;
      totalRxErrors += net.rx_errors || 0;
      totalTxErrors += net.tx_errors || 0;
      
      const previousNet = previousNetworks[interfaceName];
      let rxBytesPerSec = 0, txBytesPerSec = 0;
      
      if (previousNet && timeDelta > 0) {
        rxBytesPerSec = Math.max(0, (net.rx_bytes - previousNet.rx_bytes) / timeDelta);
        txBytesPerSec = Math.max(0, (net.tx_bytes - previousNet.tx_bytes) / timeDelta);
      }
      
      interfaces[interfaceName] = {
        rx_bytes: net.rx_bytes || 0,
        tx_bytes: net.tx_bytes || 0,
        rx_bytes_per_sec: Math.round(rxBytesPerSec),
        tx_bytes_per_sec: Math.round(txBytesPerSec),
        rx_packets: net.rx_packets || 0,
        tx_packets: net.tx_packets || 0,
        rx_dropped: net.rx_dropped || 0,
        tx_dropped: net.tx_dropped || 0,
        rx_errors: net.rx_errors || 0,
        tx_errors: net.tx_errors || 0
      };
    });
    
    // Calculate total rates
    const previousTotal = previousStats?.networks;
    let totalRxBytesPerSec = 0, totalTxBytesPerSec = 0;
    
    if (previousTotal && timeDelta > 0) {
      const prevRxTotal = Object.values(previousTotal).reduce((sum, net) => sum + (net.rx_bytes || 0), 0);
      const prevTxTotal = Object.values(previousTotal).reduce((sum, net) => sum + (net.tx_bytes || 0), 0);
      
      totalRxBytesPerSec = Math.max(0, (totalRxBytes - prevRxTotal) / timeDelta);
      totalTxBytesPerSec = Math.max(0, (totalTxBytes - prevTxTotal) / timeDelta);
    }
    
    return {
      rx_bytes: totalRxBytes,
      tx_bytes: totalTxBytes,
      rx_bytes_per_sec: Math.round(totalRxBytesPerSec),
      tx_bytes_per_sec: Math.round(totalTxBytesPerSec),
      rx_packets: totalRxPackets,
      tx_packets: totalTxPackets,
      rx_dropped: totalRxDropped,
      tx_dropped: totalTxDropped,
      rx_errors: totalRxErrors,
      tx_errors: totalTxErrors,
      interfaces
    };
  }
  
  /**
   * Calculate disk I/O metrics
   * 
   * @param {object} stats - Current stats
   * @param {object} previousStats - Previous stats
   * @param {number} timeDelta - Time delta in seconds
   * @returns {object} Disk metrics
   */
  calculateDiskMetrics(stats, previousStats, timeDelta) {
    const blkioStats = stats.blkio_stats;
    const previousBlkioStats = previousStats?.blkio_stats;
    
    // Parse block I/O stats
    const parseBlkioStats = (blkio) => {
      const parsed = { read_bytes: 0, write_bytes: 0, read_ops: 0, write_ops: 0 };
      
      if (blkio?.io_service_bytes_recursive) {
        blkio.io_service_bytes_recursive.forEach(entry => {
          if (entry.op === 'Read') parsed.read_bytes += entry.value;
          if (entry.op === 'Write') parsed.write_bytes += entry.value;
        });
      }
      
      if (blkio?.io_serviced_recursive) {
        blkio.io_serviced_recursive.forEach(entry => {
          if (entry.op === 'Read') parsed.read_ops += entry.value;
          if (entry.op === 'Write') parsed.write_ops += entry.value;
        });
      }
      
      return parsed;
    };
    
    const current = parseBlkioStats(blkioStats);
    const previous = parseBlkioStats(previousBlkioStats);
    
    let readBytesPerSec = 0, writeBytesPerSec = 0;
    let readOpsPerSec = 0, writeOpsPerSec = 0;
    
    if (previousStats && timeDelta > 0) {
      readBytesPerSec = Math.max(0, (current.read_bytes - previous.read_bytes) / timeDelta);
      writeBytesPerSec = Math.max(0, (current.write_bytes - previous.write_bytes) / timeDelta);
      readOpsPerSec = Math.max(0, (current.read_ops - previous.read_ops) / timeDelta);
      writeOpsPerSec = Math.max(0, (current.write_ops - previous.write_ops) / timeDelta);
    }
    
    return {
      read_bytes: current.read_bytes,
      write_bytes: current.write_bytes,
      read_bytes_per_sec: Math.round(readBytesPerSec),
      write_bytes_per_sec: Math.round(writeBytesPerSec),
      read_ops: current.read_ops,
      write_ops: current.write_ops,
      read_ops_per_sec: Math.round(readOpsPerSec * 100) / 100,
      write_ops_per_sec: Math.round(writeOpsPerSec * 100) / 100,
      total_bytes: current.read_bytes + current.write_bytes,
      total_ops: current.read_ops + current.write_ops
    };
  }
  
  /**
   * Get collector statistics
   * 
   * @returns {object} Collector statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      monitoredContainers: Array.from(this.monitoredContainers),
      totalCollections: this.totalCollections,
      errorCount: this.errorCount,
      lastError: this.lastError?.message || null,
      intervals: this.intervals,
      activeIntervals: Object.keys(this.collectors).filter(key => this.collectors[key] !== null)
    };
  }
}

module.exports = MetricsCollector;