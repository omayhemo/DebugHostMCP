/**
 * PHP Process Detector
 * 
 * Specialized detector for PHP development processes including:
 * - PHP built-in development server (php -S)
 * - Apache with PHP support
 * - Nginx with PHP-FPM
 * - Composer-based PHP applications
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');
const path = require('path');
const fs = require('fs').promises;

/**
 * PHP Server Types
 */
const PHPServerTypes = {
  BUILTIN: 'builtin',
  APACHE: 'apache',
  NGINX: 'nginx',
  PHP_FPM: 'php-fpm',
  GENERIC: 'generic'
};

/**
 * PHP Process Detector Implementation
 * Detects PHP development processes with server-specific intelligence
 */
class PHPProcessDetector extends BaseTechStackDetector {
  constructor(options = {}) {
    super('php', {
      portRange: { start: 8080, end: 8980 },
      processPatterns: [
        'php',
        'apache2',
        'httpd',
        'nginx',
        'php-fpm'
      ],
      serverDetection: options.serverDetection !== false,
      composerScan: options.composerScan !== false,
      ...options
    });
    
    // Server-specific port patterns
    this.serverPorts = {
      [PHPServerTypes.BUILTIN]: { default: 8080, common: [8081, 8082, 8083] },
      [PHPServerTypes.APACHE]: { default: 80, common: [8080, 8081, 8082, 8000] },
      [PHPServerTypes.NGINX]: { default: 80, common: [8080, 8081, 8082, 8000] },
      [PHPServerTypes.PHP_FPM]: { default: 9000, common: [9001, 9002, 9003] }
    };
    
    // Process detection patterns
    this.processPatterns = {
      builtin: /php\s.*-S\s/i,
      apache: /apache2|httpd/i,
      nginx: /nginx.*master/i,
      phpfpm: /php-fpm.*master/i
    };
  }
  
  /**
   * Initialize the PHP detector
   */
  async initialize() {
    console.log('Initializing PHP Process Detector...');
    
    try {
      // Verify PHP is available
      await this._executeCommand('php --version');
      
      // Test process detection commands
      await this._testDetectionMethods();
      
      this.initialized = true;
      console.log('✓ PHP detector initialized successfully');
      
    } catch (error) {
      console.warn('PHP not available or detection methods failed:', error.message);
      // Don't throw - PHP may not be installed but we should still try to detect servers
      this.initialized = true;
    }
  }
  
  /**
   * Scan for PHP processes - PERFORMANCE OPTIMIZED
   * Uses parallel scanning and timeout handling for Story 3.2 performance requirements
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Scanning for PHP processes (optimized)...');
      
      // **PERFORMANCE FIX 1: Run scanning methods in PARALLEL instead of sequential**
      const scanPromises = [
        this._scanByProcessName(),
        this._scanByPortRange()
      ];
      
      // Add workspace scanning if enabled
      if (this.options.composerScan && options.workspacePaths) {
        scanPromises.push(this._scanByWorkspaces(options.workspacePaths));
      }
      
      // **PERFORMANCE FIX 2: Use timeouts to prevent hanging**
      const timeoutPromises = scanPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PHP scan method timeout')), 800)
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
          console.warn(`PHP scan method ${i} failed/timeout:`, results[i].reason?.message);
        }
      }
      
      // Deduplicate processes (same PID)
      const uniqueProcesses = this._deduplicateProcesses(processes);
      
      // **PERFORMANCE FIX 3: Batch server detection with error handling**
      if (this.options.serverDetection && uniqueProcesses.length > 0) {
        const serverDetectionPromises = uniqueProcesses.map(process => 
          this._detectServerType(process).catch(() => {
            // Ignore individual server detection failures
            process.serverType = PHPServerTypes.GENERIC;
          })
        );
        await Promise.allSettled(serverDetectionPromises);
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${uniqueProcesses.length} PHP processes in ${duration}ms (optimized)`);
      
      // Emit detection events
      uniqueProcesses.forEach(process => this._emitProcessDetected(process));
      
      return uniqueProcesses;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error scanning PHP processes:', error.message);
      throw error;
    }
  }
  
  /**
   * Get supported detection methods
   */
  getSupportedDetectionMethods() {
    return [
      DetectionMethod.PROCESS_NAME,
      DetectionMethod.PORT_SCAN,
      DetectionMethod.COMMAND_LINE,
      DetectionMethod.CONFIG_FILE,
      DetectionMethod.HTTP_PROBE
    ];
  }
  
  /**
   * Enhanced health validation for PHP processes
   */
  async validateProcessHealth(process) {
    try {
      const health = {
        status: HealthStatus.HEALTHY,
        checks: {
          timestamp: new Date().toISOString()
        }
      };
      
      // Basic port check
      if (process.port) {
        const portHealthy = await this._checkPortListening(process.port);
        health.checks.portListening = portHealthy;
        
        if (!portHealthy) {
          health.status = HealthStatus.UNHEALTHY;
        }
        
        // HTTP health check for web servers
        if (process.serverType === PHPServerTypes.BUILTIN || 
            process.serverType === PHPServerTypes.APACHE || 
            process.serverType === PHPServerTypes.NGINX) {
          const httpHealth = await this._checkHttpHealth(process);
          health.checks.httpHealth = httpHealth;
          
          if (!httpHealth.healthy) {
            health.status = HealthStatus.UNHEALTHY;
          }
        }
      }
      
      // Process existence check
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
  
  /**
   * Scan for processes by name patterns
   * @private
   */
  async _scanByProcessName() {
    const processes = [];
    
    try {
      // Use pgrep with PHP patterns - timeout must be shorter than scan method timeout
      const patterns = this.options.processPatterns.join('|');
      const result = await this._executeCommand(`pgrep -f "${patterns}"`, { timeout: 600 });
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const pids = result.stdout.trim().split('\n').filter(Boolean);
      
      // Get detailed process information for each PID
      for (const pid of pids) {
        try {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo && this._isPHPProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn(`Could not get info for PID ${pid}:`, error.message);
        }
      }
      
    } catch (error) {
      console.warn('PHP process name scanning failed:', error.message);
    }
    
    return processes;
  }
  
  /**
   * Scan for processes by port range
   * @private
   */
  async _scanByPortRange() {
    const processes = [];
    
    try {
      const { start, end } = this.options.portRange;
      
      // Use netstat to find listening ports in PHP range
      const result = await this._executeCommand(
        `netstat -tulpn 2>/dev/null | grep -E ":(${start}|${start+1}|${start+2}|${start+3}|${start+4}|${start+5})" | head -20`
      );
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const lines = result.stdout.trim().split('\n');
      
      for (const line of lines) {
        try {
          const processInfo = await this._parseNetstatLine(line);
          if (processInfo && this._isPHPRelatedProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn('Could not parse netstat line:', line, error.message);
        }
      }
      
    } catch (error) {
      console.warn('PHP port range scanning failed:', error.message);
    }
    
    return processes;
  }
  
  /**
   * Scan workspaces for composer.json files
   * @private
   */
  async _scanByWorkspaces(workspacePaths = []) {
    const processes = [];
    
    if (!workspacePaths || workspacePaths.length === 0) {
      return processes;
    }
    
    for (const workspacePath of workspacePaths) {
      try {
        const composerJsonPath = path.join(workspacePath, 'composer.json');
        const composerJson = JSON.parse(await fs.readFile(composerJsonPath, 'utf8'));
        
        // Check if this looks like a PHP project
        if (this._isPHPProject(composerJson)) {
          // Look for running processes in this workspace
          const workspaceProcesses = await this._findWorkspaceProcesses(workspacePath, composerJson);
          processes.push(...workspaceProcesses);
        }
        
      } catch (error) {
        // Ignore workspace errors - not all paths may have composer.json
        continue;
      }
    }
    
    return processes;
  }
  
  /**
   * Get detailed process information by PID
   * @private
   */
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
      
      // Extract port from command line
      const port = this._extractPort({ cmdline: cmd });
      
      // Get working directory
      const workspacePath = await this._getProcessWorkingDir(pid);
      
      return {
        pid: parseInt(pidStr),
        ppid: parseInt(ppidStr),
        command: cmd,
        port,
        techStack: 'php',
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
  
  /**
   * Parse a netstat output line
   * @private
   */
  async _parseNetstatLine(line) {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length < 7) {
      return null;
    }
    
    const protocol = parts[0];
    const localAddress = parts[3];
    const state = parts[5];
    const processInfo = parts[6];
    
    // Extract port from local address
    const portMatch = localAddress.match(/:(\d+)$/);
    if (!portMatch) {
      return null;
    }
    
    const port = parseInt(portMatch[1]);
    
    // Extract PID from process info
    const pidMatch = processInfo.match(/^(\d+)\//);
    if (!pidMatch) {
      return null;
    }
    
    const pid = parseInt(pidMatch[1]);
    
    // Get additional process details
    const processDetails = await this._getProcessInfo(pid);
    
    return {
      ...processDetails,
      port,
      protocol,
      state,
      detectionMethod: DetectionMethod.PORT_SCAN
    };
  }
  
  /**
   * Check if a process is a PHP process
   * @private
   */
  _isPHPProcess(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    const cmd = processInfo.command.toLowerCase();
    
    // Check for PHP process patterns
    return cmd.includes('php') || cmd.includes('composer');
  }
  
  /**
   * Check if a process is PHP-related (servers that might serve PHP)
   * @private
   */
  _isPHPRelatedProcess(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    const cmd = processInfo.command.toLowerCase();
    
    // Check for PHP or web server patterns
    return this.options.processPatterns.some(pattern => 
      cmd.includes(pattern.toLowerCase())
    );
  }
  
  /**
   * Detect server type based on process information
   * @private
   */
  async _detectServerType(process) {
    if (!process.command) {
      process.serverType = PHPServerTypes.GENERIC;
      return;
    }
    
    const cmd = process.command.toLowerCase();
    
    // Check against server patterns
    for (const [serverType, pattern] of Object.entries(this.processPatterns)) {
      if (pattern.test(cmd)) {
        process.serverType = serverType;
        
        // Try to get server-specific details
        if (process.workspacePath) {
          const serverDetails = await this._getServerDetails(process.workspacePath, serverType);
          if (serverDetails) {
            process.metadata = { ...process.metadata, ...serverDetails };
          }
        }
        
        return;
      }
    }
    
    process.serverType = PHPServerTypes.GENERIC;
  }
  
  /**
   * Get server-specific details from workspace
   * @private
   */
  async _getServerDetails(workspacePath, serverType) {
    try {
      const details = {};
      
      if (serverType === 'builtin') {
        // PHP built-in server details
        details.serverType = 'PHP Built-in Server';
        // Check for index.php
        const indexExists = await this._fileExists(path.join(workspacePath, 'index.php'));
        details.hasIndex = indexExists;
      } else if (serverType === 'apache') {
        // Apache details
        details.serverType = 'Apache HTTP Server';
        // Could check for .htaccess, apache config, etc.
      } else if (serverType === 'nginx') {
        // Nginx details
        details.serverType = 'Nginx';
        // Could check for nginx.conf, etc.
      }
      
      return details;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if composer.json indicates a PHP project
   * @private
   */
  _isPHPProject(composerJson) {
    // Check for PHP indicators
    const hasPhpRequirement = composerJson.require && composerJson.require.php;
    const hasPhpDependencies = composerJson.require && Object.keys(composerJson.require).some(dep => 
      dep.startsWith('php-') || dep.includes('/php-') || dep.includes('laravel') || dep.includes('symfony')
    );
    
    return hasPhpRequirement || hasPhpDependencies;
  }
  
  /**
   * Find running processes in a specific workspace
   * @private
   */
  async _findWorkspaceProcesses(workspacePath, composerJson) {
    const processes = [];
    
    try {
      // Look for processes running in this directory
      const result = await this._executeCommand(`pgrep -f "${workspacePath}"`);
      
      if (result.success && result.stdout.trim()) {
        const pids = result.stdout.trim().split('\n').filter(Boolean);
        
        for (const pid of pids) {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo && this._isPHPRelatedProcess(processInfo)) {
            processInfo.workspacePath = workspacePath;
            processInfo.detectionMethod = DetectionMethod.CONFIG_FILE;
            processes.push(processInfo);
          }
        }
      }
      
    } catch (error) {
      console.warn(`Could not find processes for workspace ${workspacePath}:`, error.message);
    }
    
    return processes;
  }
  
  /**
   * Check HTTP health for web servers
   * @private
   */
  async _checkHttpHealth(process) {
    const health = { healthy: true, details: {} };
    
    try {
      if (process.port) {
        // Try to access the server
        const result = await this._executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:${process.port}"`
        );
        
        if (result.success) {
          const statusCode = result.stdout.trim();
          health.details.httpStatusCode = statusCode;
          health.healthy = statusCode !== '000'; // 000 means connection failed
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
  
  /**
   * Get process working directory
   * @private
   */
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
  
  /**
   * Check if process exists
   * @private
   */
  async _checkProcessExists(pid) {
    try {
      const result = await this._executeCommand(`kill -0 ${pid} 2>/dev/null`);
      return result.success;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Deduplicate processes by PID
   * @private
   */
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
  
  /**
   * Check if file exists
   * @private
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test detection methods during initialization
   * @private
   */
  async _testDetectionMethods() {
    // Test pgrep command
    await this._executeCommand('pgrep --version');
    
    // Test netstat command
    await this._executeCommand('netstat --version');
    
    // Test ps command
    await this._executeCommand('ps --version');
  }
}

module.exports = PHPProcessDetector;