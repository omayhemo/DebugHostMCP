/**
 * Performance-Optimized System Scanner
 * 
 * Provides batch system process scanning to eliminate the performance bottleneck
 * of individual process queries that was causing 2-second timeout failures.
 * 
 * Key optimizations:
 * - Single batch query for all processes instead of individual PID queries
 * - Cached process info to eliminate duplicate system calls
 * - Parallel scanning across methods instead of sequential
 * - Timeout handling for individual operations
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class PerformanceOptimizedScanner {
  constructor(options = {}) {
    this.options = {
      cacheTimeout: options.cacheTimeout || 1000, // 1 second cache
      batchTimeout: options.batchTimeout || 500,   // 500ms per batch operation
      ...options
    };
    
    this.processCache = new Map();
    this.lastCacheTime = null;
  }

  /**
   * Get all system processes in a single optimized query
   * This eliminates the need for individual PID queries
   */
  async getAllProcesses(forceRefresh = false) {
    const now = Date.now();
    
    // Use cache if still valid
    if (!forceRefresh && this.lastCacheTime && 
        (now - this.lastCacheTime) < this.options.cacheTimeout && 
        this.processCache.size > 0) {
      return this.processCache;
    }

    try {
      // Single comprehensive ps command to get all process info
      const { stdout } = await execAsync(
        'ps -eo pid,ppid,cmd,etime,rss,pcpu,cwd,uid --no-headers',
        { timeout: this.options.batchTimeout }
      );

      const processMap = new Map();
      const lines = stdout.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 7) {
          const pid = parseInt(parts[0]);
          const ppid = parseInt(parts[1]);
          const cmd = parts.slice(2, -4).join(' ');
          const etime = parts[parts.length - 4];
          const rss = parseInt(parts[parts.length - 3]) || 0;
          const pcpu = parseFloat(parts[parts.length - 2]) || 0;
          const uid = parseInt(parts[parts.length - 1]);

          if (!isNaN(pid)) {
            processMap.set(pid, {
              pid,
              ppid: isNaN(ppid) ? null : ppid,
              command: cmd,
              startTime: this._parseElapsedTime(etime),
              memoryMB: Math.round(rss / 1024),
              cpuPercent: pcpu,
              uid,
              raw: line
            });
          }
        }
      }

      this.processCache = processMap;
      this.lastCacheTime = now;
      
      console.log(`✓ Cached ${processMap.size} processes in batch query`);
      return processMap;

    } catch (error) {
      console.warn('Batch process query failed, using cache:', error.message);
      return this.processCache;
    }
  }

  /**
   * Get specific processes by PID array - uses cached data
   */
  async getProcessesByPids(pids) {
    const allProcesses = await this.getAllProcesses();
    const results = [];
    
    for (const pid of pids) {
      const process = allProcesses.get(parseInt(pid));
      if (process) {
        results.push(process);
      }
    }
    
    return results;
  }

  /**
   * Search processes by command pattern - uses cached data
   */
  async searchProcessesByPattern(patterns) {
    const allProcesses = await this.getAllProcesses();
    const results = [];
    
    for (const [pid, process] of allProcesses) {
      for (const pattern of patterns) {
        if (process.command.toLowerCase().includes(pattern.toLowerCase())) {
          results.push({ ...process, matchedPattern: pattern });
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Get processes using specific ports - optimized port detection
   */
  async getProcessesByPorts(startPort, endPort) {
    try {
      // Use netstat to get port usage, then correlate with cached processes
      const { stdout } = await execAsync(
        `netstat -tlnp 2>/dev/null | grep -E ":([${startPort}-${endPort}])\\s"`,
        { timeout: this.options.batchTimeout }
      );

      const allProcesses = await this.getAllProcesses();
      const results = [];
      const lines = stdout.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/:(\d+)\s+.*?(\d+)\//);
        if (match) {
          const port = parseInt(match[1]);
          const pid = parseInt(match[2]);
          
          if (port >= startPort && port <= endPort) {
            const process = allProcesses.get(pid);
            if (process) {
              results.push({ ...process, port });
            }
          }
        }
      }

      return results;

    } catch (error) {
      console.warn('Port-based process detection failed:', error.message);
      return [];
    }
  }

  /**
   * Clear cache to force fresh data
   */
  clearCache() {
    this.processCache.clear();
    this.lastCacheTime = null;
  }

  /**
   * Parse ps etime format to approximate start time
   * @private
   */
  _parseElapsedTime(etime) {
    if (!etime || etime === '-') return null;
    
    try {
      // Simple approximation - calculate start time from elapsed time
      const now = new Date();
      
      // Parse formats like "01:23:45", "23:45", "45"
      const parts = etime.split('-');
      let totalSeconds = 0;
      
      if (parts.length === 2) {
        // Days-Hours:Minutes:Seconds
        totalSeconds += parseInt(parts[0]) * 24 * 3600;
        const timeParts = parts[1].split(':');
        totalSeconds += this._parseTimeParts(timeParts);
      } else {
        // Hours:Minutes:Seconds or Minutes:Seconds or Seconds
        const timeParts = etime.split(':');
        totalSeconds = this._parseTimeParts(timeParts);
      }
      
      return new Date(now.getTime() - totalSeconds * 1000).toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse time parts to total seconds
   * @private
   */
  _parseTimeParts(parts) {
    let seconds = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const value = parseInt(parts[i]) || 0;
      seconds += value * Math.pow(60, parts.length - 1 - i);
    }
    return seconds;
  }
}

module.exports = {
  PerformanceOptimizedScanner
};