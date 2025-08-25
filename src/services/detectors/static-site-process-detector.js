/**
 * Static Site Process Detector
 * 
 * Specialized detector for static site development servers including:
 * - live-server (npm package)
 * - http-server (npm package)  
 * - serve (npm package)
 * - Python SimpleHTTPServer/http.server
 * - Static file servers
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');

/**
 * Static Site Server Types
 */
const StaticServerTypes = {
  LIVE_SERVER: 'live-server',
  HTTP_SERVER: 'http-server',
  SERVE: 'serve',
  PYTHON_HTTP: 'python-http',
  GENERIC: 'static'
};

/**
 * Static Site Process Detector Implementation
 */
class StaticSiteProcessDetector extends BaseTechStackDetector {
  constructor(options = {}) {
    super('static', {
      portRange: { start: 4000, end: 4999 },
      processPatterns: [
        'live-server',
        'http-server', 
        'serve',
        'python.*http.server',
        'python.*SimpleHTTPServer'
      ],
      serverDetection: options.serverDetection !== false,
      ...options
    });
    
    // Server-specific port patterns
    this.serverPorts = {
      [StaticServerTypes.LIVE_SERVER]: { default: 8080, common: [3000, 8081, 8082] },
      [StaticServerTypes.HTTP_SERVER]: { default: 8080, common: [8081, 8082, 3000] },
      [StaticServerTypes.SERVE]: { default: 3000, common: [5000, 8080, 8081] },
      [StaticServerTypes.PYTHON_HTTP]: { default: 8000, common: [8080, 8081, 3000] }
    };
    
    // Process detection patterns
    this.processPatterns = {
      'live-server': /live-server/i,
      'http-server': /http-server|hs\s/i,
      'serve': /serve.*-s|npx.*serve/i,
      'python-http': /python.*-m.*http\.server|python.*SimpleHTTPServer/i
    };
  }
  
  /**
   * Initialize the Static Site detector
   */
  async initialize() {
    console.log('Initializing Static Site Process Detector...');
    
    try {
      await this._testDetectionMethods();
      
      this.initialized = true;
      console.log('✓ Static Site detector initialized successfully');
      
    } catch (error) {
      console.warn('Static site detection methods may be limited:', error.message);
      this.initialized = true;
    }
  }
  
  /**
   * Scan for static site processes - PERFORMANCE OPTIMIZED
   * Uses parallel scanning and timeout handling for Story 3.2 performance requirements
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Scanning for static site processes (optimized)...');
      
      // **PERFORMANCE FIX 1: Run scanning methods in PARALLEL instead of sequential**
      const scanPromises = [
        this._scanByProcessName(),
        this._scanByPortRange()
      ];
      
      // **PERFORMANCE FIX 2: Use timeouts to prevent hanging**
      const timeoutPromises = scanPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Static scan method timeout')), 800)
          )
        ])
      );
      
      const results = await Promise.allSettled(timeoutPromises);
      
      // Collect successful results, ignore timeouts
      const processes = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          processes.push(...results[i].value);
        } else {
          console.warn(`Static scan method ${i} failed/timeout:`, results[i].reason?.message);
        }
      }
      
      // Deduplicate processes
      const uniqueProcesses = this._deduplicateProcesses(processes);
      
      // **PERFORMANCE FIX 3: Batch server type detection with error handling**
      if (this.options.serverDetection && uniqueProcesses.length > 0) {
        const serverDetectionPromises = uniqueProcesses.map(process => 
          this._detectServerType(process).catch(() => {
            // Ignore individual server type detection failures
            process.serverType = StaticServerTypes.GENERIC;
          })
        );
        await Promise.allSettled(serverDetectionPromises);
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${uniqueProcesses.length} static site processes in ${duration}ms (optimized)`);
      
      uniqueProcesses.forEach(process => this._emitProcessDetected(process));
      
      return uniqueProcesses;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error scanning static site processes:', error.message);
      throw error;
    }
  }
  
  getSupportedDetectionMethods() {
    return [
      DetectionMethod.PROCESS_NAME,
      DetectionMethod.PORT_SCAN,
      DetectionMethod.COMMAND_LINE,
      DetectionMethod.HTTP_PROBE
    ];
  }
  
  async validateProcessHealth(process) {
    try {
      const health = {
        status: HealthStatus.HEALTHY,
        checks: { timestamp: new Date().toISOString() }
      };
      
      if (process.port) {
        const portHealthy = await this._checkPortListening(process.port);
        health.checks.portListening = portHealthy;
        
        if (!portHealthy) {
          health.status = HealthStatus.UNHEALTHY;
        }
        
        // HTTP health check for web servers
        const httpHealth = await this._checkHttpHealth(process);
        health.checks.httpHealth = httpHealth;
        
        if (!httpHealth.healthy) {
          health.status = HealthStatus.UNHEALTHY;
        }
      }
      
      if (process.pid) {
        const processExists = await this._checkProcessExists(process.pid);
        health.checks.processExists = processExists;
        
        if (!processExists) {
          health.status = HealthStatus.UNHEALTHY;
        }
      }
      
      return health;
      
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        checks: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  // Private implementation methods
  
  async _scanByProcessName() {
    const processes = [];
    
    try {
      const patterns = this.options.processPatterns.join('|');
      const result = await this._executeCommand(`pgrep -f "${patterns}"`, { timeout: 600 });
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const pids = result.stdout.trim().split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo && this._isStaticServerProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn(`Could not get info for PID ${pid}:`, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Static site process name scanning failed:', error.message);
    }
    
    return processes;
  }
  
  async _scanByPortRange() {
    const processes = [];
    
    try {
      const { start, end } = this.options.portRange;
      const result = await this._executeCommand(
        `netstat -tulpn 2>/dev/null | grep -E ":(${start}|${start+1}|${start+2}|${start+3}|${start+4})" | head -20`
      );
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const lines = result.stdout.trim().split('\n');
      
      for (const line of lines) {
        try {
          const processInfo = await this._parseNetstatLine(line);
          if (processInfo && this._mightBeStaticServer(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn('Could not parse netstat line:', line, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Static site port range scanning failed:', error.message);
    }
    
    return processes;
  }
  
  async _getProcessInfo(pid) {
    try {
      const result = await this._executeCommand(
        `ps -p ${pid} -o pid,ppid,cmd,etime --no-headers 2>/dev/null`,
        { timeout: 600 }
      );
      
      if (!result.success || !result.stdout.trim()) {
        return null;
      }
      
      const [pidStr, ppidStr, ...cmdParts] = result.stdout.trim().split(/\s+/);
      const cmd = cmdParts.join(' ');
      
      const port = this._extractPort({ cmdline: cmd });
      const workspacePath = await this._getProcessWorkingDir(pid);
      
      return {
        pid: parseInt(pidStr),
        ppid: parseInt(ppidStr),
        command: cmd,
        port,
        techStack: 'static',
        workspacePath,
        detectionMethod: DetectionMethod.PROCESS_NAME,
        metadata: {
          commandLine: cmd,
          parentPid: parseInt(ppidStr)
        }
      };
      
    } catch (error) {
      console.warn(`Could not get process info for PID ${pid}:`, error.message);
      return null;
    }
  }
  
  async _parseNetstatLine(line) {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length < 7) {
      return null;
    }
    
    const portMatch = parts[3].match(/:(\d+)$/);
    if (!portMatch) {
      return null;
    }
    
    const port = parseInt(portMatch[1]);
    
    const pidMatch = parts[6].match(/^(\d+)\//);
    if (!pidMatch) {
      return null;
    }
    
    const pid = parseInt(pidMatch[1]);
    const processDetails = await this._getProcessInfo(pid);
    
    return {
      ...processDetails,
      port,
      protocol: parts[0],
      state: parts[5],
      detectionMethod: DetectionMethod.PORT_SCAN
    };
  }
  
  _isStaticServerProcess(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    const cmd = processInfo.command.toLowerCase();
    return this.options.processPatterns.some(pattern => 
      cmd.includes(pattern.toLowerCase().replace(/\.\*/, ''))
    );
  }
  
  _mightBeStaticServer(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    // More permissive check for port-based detection
    const cmd = processInfo.command.toLowerCase();
    
    // Include common static server indicators
    const indicators = [
      'http', 'server', 'serve', 'static', 'node',
      'python', 'live-server', 'http-server'
    ];
    
    return indicators.some(indicator => cmd.includes(indicator));
  }
  
  async _detectServerType(process) {
    if (!process.command) {
      process.serverType = StaticServerTypes.GENERIC;
      return;
    }
    
    const cmd = process.command.toLowerCase();
    
    for (const [serverType, pattern] of Object.entries(this.processPatterns)) {
      if (pattern.test(cmd)) {
        process.serverType = serverType;
        
        if (process.workspacePath) {
          const serverDetails = await this._getServerDetails(process.workspacePath, serverType);
          if (serverDetails) {
            process.metadata = { ...process.metadata, ...serverDetails };
          }
        }
        
        return;
      }
    }
    
    process.serverType = StaticServerTypes.GENERIC;
  }
  
  async _getServerDetails(workspacePath, serverType) {
    try {
      const details = {};
      
      // Check for common static site files
      const staticFiles = ['index.html', 'index.htm', 'main.html'];
      for (const file of staticFiles) {
        try {
          await this._fileExists(`${workspacePath}/${file}`);
          details.hasIndexFile = true;
          details.indexFile = file;
          break;
        } catch (error) {
          continue;
        }
      }
      
      // Server-specific details
      if (serverType === 'live-server') {
        details.hasLiveReload = true;
        details.serverName = 'Live Server';
      } else if (serverType === 'http-server') {
        details.serverName = 'HTTP Server';
      } else if (serverType === 'serve') {
        details.serverName = 'Serve';
      } else if (serverType === 'python-http') {
        details.serverName = 'Python HTTP Server';
      }
      
      return details;
      
    } catch (error) {
      return null;
    }
  }
  
  async _checkHttpHealth(process) {
    const health = { healthy: true, details: {} };
    
    try {
      if (process.port) {
        const result = await this._executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:${process.port}"`
        );
        
        if (result.success) {
          const statusCode = result.stdout.trim();
          health.details.httpStatusCode = statusCode;
          health.healthy = statusCode !== '000' && statusCode !== '404';
        } else {
          health.healthy = false;
          health.details.error = 'HTTP connection failed';
        }
      }
    } catch (error) {
      health.healthy = false;
      health.details.error = error.message;
    }
    
    return health;
  }
  
  async _getProcessWorkingDir(pid) {
    try {
      const result = await this._executeCommand(`pwdx ${pid} 2>/dev/null`);
      if (result.success && result.stdout.trim()) {
        const match = result.stdout.match(/^\d+:\s*(.+)$/);
        if (match) {
          return match[1].trim();
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  async _checkProcessExists(pid) {
    try {
      const result = await this._executeCommand(`kill -0 ${pid} 2>/dev/null`);
      return result.success;
    } catch (error) {
      return false;
    }
  }
  
  _deduplicateProcesses(processes) {
    const seen = new Set();
    return processes.filter(process => {
      if (seen.has(process.pid)) {
        return false;
      }
      seen.add(process.pid);
      return true;
    });
  }
  
  async _fileExists(filePath) {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async _testDetectionMethods() {
    await this._executeCommand('pgrep --version');
    await this._executeCommand('netstat --version');
    await this._executeCommand('ps --version');
  }
}

module.exports = StaticSiteProcessDetector;