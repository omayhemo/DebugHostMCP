/**
 * Node.js Process Detector
 * 
 * Specialized detector for Node.js development processes including:
 * - Vite development servers
 * - Next.js applications  
 * - Webpack dev servers
 * - npm/yarn dev scripts
 * - React/Vue development servers
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');
const path = require('path');
const fs = require('fs').promises;

/**
 * Node.js Framework Detection Patterns
 */
const NodeFrameworks = {
  VITE: 'vite',
  NEXTJS: 'nextjs',
  WEBPACK: 'webpack',
  REACT: 'react',
  VUE: 'vue',
  NUXT: 'nuxt',
  GATSBY: 'gatsby',
  ANGULAR: 'angular',
  EXPRESS: 'express',
  GENERIC_NODE: 'node'
};

/**
 * Node.js Process Detector Implementation
 * Detects Node.js development processes with framework-specific intelligence
 */
class NodeJSProcessDetector extends BaseTechStackDetector {
  constructor(options = {}) {
    super('nodejs', {
      portRange: { start: 3000, end: 3999 },
      processPatterns: [
        'node',
        'npm',
        'yarn',
        'tsx',
        'vite',
        'next',
        'webpack',
        'react-scripts',
        'vue-cli-service',
        'nuxt'
      ],
      frameworkDetection: options.frameworkDetection !== false,
      packageJsonScan: options.packageJsonScan !== false,
      ...options
    });
    
    // Framework-specific port patterns
    this.frameworkPorts = {
      [NodeFrameworks.VITE]: { default: 3000, common: [3001, 3002, 3003] },
      [NodeFrameworks.NEXTJS]: { default: 3000, common: [3001, 3002, 3003] },
      [NodeFrameworks.WEBPACK]: { default: 3000, common: [8080, 8081, 8082] },
      [NodeFrameworks.REACT]: { default: 3000, common: [3001, 3002, 3003] },
      [NodeFrameworks.VUE]: { default: 8080, common: [8081, 8082, 8083] },
      [NodeFrameworks.ANGULAR]: { default: 4200, common: [4201, 4202, 4203] },
      [NodeFrameworks.NUXT]: { default: 3000, common: [3001, 3002, 3003] },
      [NodeFrameworks.EXPRESS]: { default: 3000, common: [3001, 8000, 8080] }
    };
    
    // Process detection patterns
    this.processPatterns = {
      vite: /vite|@vitejs/i,
      nextjs: /next\s|next-dev|\.next/i,
      webpack: /webpack|webpack-dev-server/i,
      react: /react-scripts|create-react-app/i,
      vue: /vue-cli-service|@vue/i,
      nuxt: /nuxt|@nuxt/i,
      gatsby: /gatsby|@gatsby/i,
      angular: /@angular|ng\s|angular-cli/i,
      express: /express|app\.listen/i,
      generic: /node\s/i
    };
  }
  
  /**
   * Initialize the Node.js detector
   */
  async initialize() {
    console.log('Initializing Node.js Process Detector...');
    
    try {
      // Verify Node.js is available
      await this._executeCommand('node --version');
      
      // Test process detection commands
      await this._testDetectionMethods();
      
      this.initialized = true;
      console.log('✓ Node.js detector initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Node.js detector:', error.message);
      throw error;
    }
  }
  
  /**
   * Scan for Node.js processes
   * @param {Object} options - Scan options
   * @returns {Promise<Object[]>} Array of detected Node.js processes
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log(`Scanning for Node.js processes (optimized)...`);
      
      // **PERFORMANCE FIX 1: Run scanning methods in PARALLEL instead of sequential**
      const scanPromises = [
        this._scanByProcessName(),
        this._scanByPortRange()
      ];
      
      // Add workspace scanning if enabled
      if (this.options.packageJsonScan && options.workspacePaths) {
        scanPromises.push(this._scanByWorkspaces(options.workspacePaths));
      }
      
      // **PERFORMANCE FIX 2: Use timeouts to prevent hanging**
      const timeoutPromises = scanPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('NodeJS scan method timeout')), 300)
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
          console.warn(`NodeJS scan method ${i} failed/timeout:`, results[i].reason?.message);
        }
      }
      
      // Deduplicate processes (same PID)
      const uniqueProcesses = this._deduplicateProcesses(processes);
      
      // **PERFORMANCE FIX 3: Batch framework detection with error handling**
      if (this.options.frameworkDetection && uniqueProcesses.length > 0) {
        const frameworkPromises = uniqueProcesses.map(process => 
          this._detectFramework(process).catch(() => {
            // Ignore individual framework detection failures
            process.framework = NodeJSFrameworks.GENERIC;
          })
        );
        await Promise.allSettled(frameworkPromises);
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${uniqueProcesses.length} Node.js processes in ${duration}ms (optimized)`);
      
      // Emit detection events
      uniqueProcesses.forEach(process => this._emitProcessDetected(process));
      
      return uniqueProcesses;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error scanning Node.js processes:', error.message);
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
      DetectionMethod.CONFIG_FILE
    ];
  }
  
  /**
   * Predict rogue ports for Node.js processes
   * @param {number} basePort - Base port number
   * @returns {Promise<number[]>} Predicted port numbers
   */
  async predictRoguePorts(basePort) {
    const predictions = [];
    
    // Sequential port scanning (common Vite/Next.js behavior)
    for (let i = 1; i <= 10; i++) {
      const port = basePort + i;
      if (port >= this.options.portRange.start && port <= this.options.portRange.end) {
        predictions.push(port);
      }
    }
    
    // Framework-specific common ports
    for (const framework of Object.values(NodeFrameworks)) {
      if (this.frameworkPorts[framework]) {
        predictions.push(...this.frameworkPorts[framework].common);
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(predictions)].sort((a, b) => a - b);
  }
  
  /**
   * Enhanced health validation for Node.js processes
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
        
        // Framework-specific health checks
        if (process.framework) {
          const frameworkHealth = await this._checkFrameworkHealth(process);
          health.checks.framework = frameworkHealth;
          
          if (!frameworkHealth.healthy) {
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
      // Use pgrep with node patterns - timeout must be shorter than scan method timeout
      const patterns = this.options.processPatterns.join('|');
      const result = await this._executeCommand(`pgrep -f "${patterns}"`, { timeout: 200 });
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const pids = result.stdout.trim().split('\n').filter(Boolean);
      
      // Get detailed process information for each PID
      for (const pid of pids) {
        try {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn(`Could not get info for PID ${pid}:`, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Process name scanning failed:', error.message);
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
      
      // Try netstat first, fallback to ss if available
      let result;
      try {
        result = await this._executeCommand(
          `netstat -tulpn 2>/dev/null | grep -E ":(${start}|${start+1}|${start+2}|${start+3}|${start+4}|${start+5}|${start+6}|${start+7}|${start+8}|${start+9})" | head -20`
        );
      } catch (netstatError) {
        try {
          // Fallback to ss command (more modern alternative)
          result = await this._executeCommand(
            `ss -tulpn | grep -E ":(${start}|${start+1}|${start+2}|${start+3}|${start+4}|${start+5}|${start+6}|${start+7}|${start+8}|${start+9})" | head -20`
          );
        } catch (ssError) {
          console.warn('Neither netstat nor ss available for port scanning:', netstatError.message);
          return processes;
        }
      }
      
      if (!result.success || !result.stdout.trim()) {
        return processes;
      }
      
      const lines = result.stdout.trim().split('\n');
      
      for (const line of lines) {
        try {
          const processInfo = await this._parseNetstatLine(line);
          if (processInfo && this._isNodeProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn('Could not parse netstat line:', line, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Port range scanning failed:', error.message);
    }
    
    return processes;
  }
  
  /**
   * Scan workspaces for package.json files and detect running dev servers
   * @private
   */
  async _scanByWorkspaces(workspacePaths = []) {
    const processes = [];
    
    if (!workspacePaths || workspacePaths.length === 0) {
      return processes;
    }
    
    for (const workspacePath of workspacePaths) {
      try {
        const packageJsonPath = path.join(workspacePath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check if this looks like a Node.js project
        if (this._isNodejsProject(packageJson)) {
          // Look for running processes in this workspace
          const workspaceProcesses = await this._findWorkspaceProcesses(workspacePath, packageJson);
          processes.push(...workspaceProcesses);
        }
        
      } catch (error) {
        // Ignore workspace errors - not all paths may have package.json
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
      // Get process details using ps - timeout must be shorter than scan method timeout
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
        techStack: 'nodejs',
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
   * Check if a process is a Node.js process
   * @private
   */
  _isNodeProcess(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    const cmd = processInfo.command.toLowerCase();
    
    // Check for Node.js process patterns
    return this.options.processPatterns.some(pattern => 
      cmd.includes(pattern.toLowerCase())
    );
  }
  
  /**
   * Detect framework based on process information
   * @private
   */
  async _detectFramework(process) {
    if (!process.command) {
      process.framework = NodeFrameworks.GENERIC_NODE;
      return;
    }
    
    const cmd = process.command.toLowerCase();
    
    // Check against framework patterns
    for (const [framework, pattern] of Object.entries(this.processPatterns)) {
      if (pattern.test(cmd)) {
        process.framework = framework;
        
        // Try to get more framework-specific details
        if (process.workspacePath) {
          const frameworkDetails = await this._getFrameworkDetails(process.workspacePath, framework);
          if (frameworkDetails) {
            process.metadata = { ...process.metadata, ...frameworkDetails };
          }
        }
        
        return;
      }
    }
    
    process.framework = NodeFrameworks.GENERIC_NODE;
  }
  
  /**
   * Get framework-specific details from workspace
   * @private
   */
  async _getFrameworkDetails(workspacePath, framework) {
    try {
      const details = {};
      
      // Read package.json for framework version and config
      const packageJsonPath = path.join(workspacePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (framework === 'vite') {
        details.version = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
        // Check for vite.config.js
        const configExists = await this._fileExists(path.join(workspacePath, 'vite.config.js'));
        details.hasConfig = configExists;
      } else if (framework === 'nextjs') {
        details.version = packageJson.dependencies?.next;
        // Check for next.config.js
        const configExists = await this._fileExists(path.join(workspacePath, 'next.config.js'));
        details.hasConfig = configExists;
      }
      // Add more framework-specific details as needed
      
      return details;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if package.json indicates a Node.js project
   * @private
   */
  _isNodejsProject(packageJson) {
    // Check for Node.js indicators
    const hasNodeScripts = packageJson.scripts && (
      packageJson.scripts.start ||
      packageJson.scripts.dev ||
      packageJson.scripts.develop ||
      packageJson.scripts.serve
    );
    
    const hasNodeDependencies = packageJson.dependencies || packageJson.devDependencies;
    
    return hasNodeScripts || hasNodeDependencies;
  }
  
  /**
   * Find running processes in a specific workspace
   * @private
   */
  async _findWorkspaceProcesses(workspacePath, packageJson) {
    const processes = [];
    
    try {
      // Look for processes running in this directory
      const result = await this._executeCommand(`pgrep -f "${workspacePath}"`);
      
      if (result.success && result.stdout.trim()) {
        const pids = result.stdout.trim().split('\n').filter(Boolean);
        
        for (const pid of pids) {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo && this._isNodeProcess(processInfo)) {
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
   * Framework-specific health check
   * @private
   */
  async _checkFrameworkHealth(process) {
    const health = { healthy: true, details: {} };
    
    try {
      if (process.port && (process.framework === 'vite' || process.framework === 'nextjs')) {
        // Try to access common health endpoints
        const healthEndpoints = [
          `http://localhost:${process.port}`,
          `http://localhost:${process.port}/__vite_ping`,  // Vite health check
          `http://localhost:${process.port}/_next/static`  // Next.js static check
        ];
        
        for (const endpoint of healthEndpoints) {
          try {
            const result = await this._executeCommand(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "${endpoint}"`);
            if (result.success && result.stdout.trim() === '200') {
              health.details.httpHealthy = true;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      health.healthy = false;
      health.error = error.message;
    }
    
    return health;
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
    // Test basic commands, but don't fail if some are missing
    const testCommands = [
      { cmd: 'pgrep --version', required: false },
      { cmd: 'ps --version', required: true },
      { cmd: 'netstat --version', required: false }
    ];
    
    for (const test of testCommands) {
      try {
        await this._executeCommand(test.cmd);
      } catch (error) {
        if (test.required) {
          throw error;
        } else {
          console.warn(`Optional command not available: ${test.cmd} - ${error.message}`);
        }
      }
    }
  }
}

module.exports = NodeJSProcessDetector;