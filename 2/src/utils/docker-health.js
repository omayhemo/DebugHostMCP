/**
 * Docker Health Monitoring Utility
 * 
 * Provides container health checks, resource monitoring, and status tracking
 */

class DockerHealth {
  constructor(docker) {
    this.docker = docker;
    this.monitoringIntervals = new Map();
  }

  /**
   * Get container status and basic info
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<object>} Container status information
   */
  async getContainerStatus(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      
      return {
        id: info.Id,
        name: info.Name ? info.Name.substring(1) : containerId, // Remove leading slash or use ID
        status: info.State.Status,
        running: info.State.Running,
        exitCode: info.State.ExitCode,
        startedAt: info.State.StartedAt,
        finishedAt: info.State.FinishedAt,
        restartCount: info.RestartCount,
        labels: info.Config.Labels || {}
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Container ${containerId} not found`);
      }
      throw new Error(`Failed to get container status: ${error.message}`);
    }
  }

  /**
   * Get container resource usage statistics
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<object>} Resource usage stats
   */
  async getContainerStats(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      
      // Calculate CPU usage percentage
      const cpuStats = this.calculateCPUUsage(stats);
      
      // Calculate memory usage
      const memoryStats = this.calculateMemoryUsage(stats);
      
      // Calculate network I/O
      const networkStats = this.calculateNetworkUsage(stats);
      
      return {
        timestamp: new Date().toISOString(),
        cpu: cpuStats,
        memory: memoryStats,
        network: networkStats,
        pids: stats.pids_stats ? stats.pids_stats.current : null
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Container ${containerId} not found`);
      }
      throw new Error(`Failed to get container stats: ${error.message}`);
    }
  }

  /**
   * Calculate CPU usage percentage from Docker stats
   * 
   * @param {object} stats - Docker stats object
   * @returns {object} CPU usage information
   */
  calculateCPUUsage(stats) {
    const cpuStats = stats.cpu_stats;
    const precpuStats = stats.precpu_stats;
    
    if (!cpuStats || !precpuStats) {
      return { percent: 0 };
    }

    const cpuDelta = cpuStats.cpu_usage.total_usage - precpuStats.cpu_usage.total_usage;
    const systemDelta = cpuStats.system_cpu_usage - precpuStats.system_cpu_usage;
    const cpuCount = cpuStats.online_cpus || cpuStats.cpu_usage.percpu_usage?.length || 1;

    let cpuPercent = 0;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
    }

    return {
      percent: Math.round(cpuPercent * 100) / 100,
      usage: cpuStats.cpu_usage.total_usage,
      system: cpuStats.system_cpu_usage,
      cores: cpuCount
    };
  }

  /**
   * Calculate memory usage from Docker stats
   * 
   * @param {object} stats - Docker stats object
   * @returns {object} Memory usage information
   */
  calculateMemoryUsage(stats) {
    const memoryStats = stats.memory_stats;
    
    if (!memoryStats) {
      return { usage: 0, limit: 0, percent: 0 };
    }

    const usage = memoryStats.usage || 0;
    const limit = memoryStats.limit || 0;
    const percent = limit > 0 ? (usage / limit) * 100 : 0;

    return {
      usage: usage,
      limit: limit,
      percent: Math.round(percent * 100) / 100,
      usageMB: Math.round(usage / (1024 * 1024)),
      limitMB: Math.round(limit / (1024 * 1024)),
      cache: memoryStats.stats?.cache || 0
    };
  }

  /**
   * Calculate network I/O from Docker stats
   * 
   * @param {object} stats - Docker stats object
   * @returns {object} Network usage information
   */
  calculateNetworkUsage(stats) {
    const networks = stats.networks;
    
    if (!networks) {
      return { rx: 0, tx: 0 };
    }

    let totalRx = 0;
    let totalTx = 0;

    Object.values(networks).forEach(network => {
      totalRx += network.rx_bytes || 0;
      totalTx += network.tx_bytes || 0;
    });

    return {
      rx: totalRx,
      tx: totalTx,
      rxMB: Math.round(totalRx / (1024 * 1024) * 100) / 100,
      txMB: Math.round(totalTx / (1024 * 1024) * 100) / 100
    };
  }

  /**
   * Check if a container is healthy and running
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<object>} Health check result
   */
  async checkContainerHealth(containerId) {
    try {
      const status = await this.getContainerStatus(containerId);
      const isHealthy = status.running && status.status === 'running';
      
      let healthDetails = {
        healthy: isHealthy,
        status: status.status,
        running: status.running,
        exitCode: status.exitCode
      };

      if (isHealthy) {
        try {
          const stats = await this.getContainerStats(containerId);
          healthDetails.stats = stats;
        } catch (statsError) {
          console.warn(`Could not get stats for container ${containerId}:`, statsError.message);
        }
      }

      return healthDetails;
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'unknown'
      };
    }
  }

  /**
   * Wait for container to reach a specific status
   * 
   * @param {string} containerId - Container ID
   * @param {string} targetStatus - Target status ('running', 'exited', etc.)
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<object>} Final container status
   */
  async waitForStatus(containerId, targetStatus, timeoutMs = 30000) {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const status = await this.getContainerStatus(containerId);
          
          if (status.status === targetStatus) {
            resolve(status);
            return;
          }

          if (Date.now() - startTime > timeoutMs) {
            reject(new Error(`Timeout waiting for container ${containerId} to reach status ${targetStatus}`));
            return;
          }

          setTimeout(checkStatus, checkInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Start monitoring a container with periodic health checks
   * 
   * @param {string} containerId - Container ID
   * @param {function} callback - Callback function for health updates
   * @param {number} intervalMs - Monitoring interval in milliseconds
   */
  startMonitoring(containerId, callback, intervalMs = 10000) {
    // Stop existing monitoring if any
    this.stopMonitoring(containerId);

    const monitoringId = setInterval(async () => {
      try {
        const health = await this.checkContainerHealth(containerId);
        callback(containerId, health);
      } catch (error) {
        callback(containerId, { healthy: false, error: error.message });
      }
    }, intervalMs);

    this.monitoringIntervals.set(containerId, monitoringId);
    console.log(`Started monitoring container ${containerId}`);
  }

  /**
   * Stop monitoring a container
   * 
   * @param {string} containerId - Container ID
   */
  stopMonitoring(containerId) {
    const monitoringId = this.monitoringIntervals.get(containerId);
    if (monitoringId) {
      clearInterval(monitoringId);
      this.monitoringIntervals.delete(containerId);
      console.log(`Stopped monitoring container ${containerId}`);
    }
  }

  /**
   * Stop all container monitoring
   */
  stopAllMonitoring() {
    for (const [containerId, intervalId] of this.monitoringIntervals) {
      clearInterval(intervalId);
      console.log(`Stopped monitoring container ${containerId}`);
    }
    this.monitoringIntervals.clear();
  }

  /**
   * Get container logs with optional filtering
   * 
   * @param {string} containerId - Container ID
   * @param {object} options - Log options (tail, since, until, etc.)
   * @returns {Promise<string>} Container logs
   */
  async getContainerLogs(containerId, options = {}) {
    try {
      const container = this.docker.getContainer(containerId);
      
      const logOptions = {
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        timestamps: options.timestamps !== false,
        ...options
      };

      const logStream = await container.logs(logOptions);
      return logStream.toString();
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Container ${containerId} not found`);
      }
      throw new Error(`Failed to get container logs: ${error.message}`);
    }
  }
}

module.exports = DockerHealth;