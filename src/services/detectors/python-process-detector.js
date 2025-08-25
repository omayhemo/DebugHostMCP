/**
 * Python Process Detector
 * 
 * Specialized detector for Python development processes including:
 * - Flask development servers
 * - Django applications (manage.py runserver)
 * - FastAPI with Uvicorn
 * - Python built-in HTTP server
 * - Gunicorn WSGI servers
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');
const path = require('path');
const fs = require('fs').promises;

/**
 * Python Framework Types
 */
const PythonFrameworks = {
  FLASK: 'flask',
  DJANGO: 'django',
  FASTAPI: 'fastapi',
  TORNADO: 'tornado',
  BOTTLE: 'bottle',
  HTTP_SERVER: 'http.server',
  GUNICORN: 'gunicorn',
  UWSGI: 'uwsgi',
  GENERIC: 'python'
};

/**
 * Python Process Detector Implementation
 */
class PythonProcessDetector extends BaseTechStackDetector {
  constructor(options = {}) {
    super('python', {
      portRange: { start: 5000, end: 5999 },
      processPatterns: [
        'python',
        'python3',
        'flask',
        'django',
        'uvicorn',
        'gunicorn',
        'uwsgi'
      ],
      frameworkDetection: options.frameworkDetection !== false,
      requirementsScan: options.requirementsScan !== false,
      ...options
    });
    
    // Framework-specific port patterns
    this.frameworkPorts = {
      [PythonFrameworks.FLASK]: { default: 5000, common: [5001, 5002, 5003] },
      [PythonFrameworks.DJANGO]: { default: 8000, common: [8001, 8002, 8003] },
      [PythonFrameworks.FASTAPI]: { default: 8000, common: [8001, 8002, 8003] },
      [PythonFrameworks.HTTP_SERVER]: { default: 8000, common: [8001, 8080, 3000] },
      [PythonFrameworks.GUNICORN]: { default: 8000, common: [8001, 8002, 8003] }
    };
    
    // Process detection patterns
    this.processPatterns = {
      flask: /flask.*run|python.*app\.py|\.py.*flask/i,
      django: /manage\.py.*runserver|django.*runserver/i,
      fastapi: /uvicorn.*main|fastapi.*app|python.*-m.*uvicorn/i,
      gunicorn: /gunicorn.*wsgi|gunicorn.*app/i,
      uwsgi: /uwsgi.*wsgi/i,
      httpserver: /python.*-m.*http\.server|python.*SimpleHTTPServer/i,
      generic: /python[3]?\s/i
    };
  }
  
  /**
   * Initialize the Python detector
   */
  async initialize() {
    console.log('Initializing Python Process Detector...');
    
    try {
      // Check for Python availability
      try {
        await this._executeCommand('python3 --version');
      } catch (error) {
        await this._executeCommand('python --version');
      }
      
      await this._testDetectionMethods();
      
      this.initialized = true;
      console.log('✓ Python detector initialized successfully');
      
    } catch (error) {
      console.warn('Python not available:', error.message);
      this.initialized = true; // Continue anyway to detect other Python processes
    }
  }
  
  /**
   * Scan for Python processes - PERFORMANCE OPTIMIZED
   * Uses parallel scanning and timeout handling to meet 2-second requirement
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Scanning for Python processes (optimized)...');
      
      // **PERFORMANCE FIX 1: Run scanning methods in PARALLEL instead of sequential**
      const scanPromises = [
        this._scanByProcessName(),
        this._scanByPortRange()
      ];
      
      // Add workspace scanning if enabled
      if (this.options.requirementsScan && options.workspacePaths) {
        scanPromises.push(this._scanByWorkspaces(options.workspacePaths));
      }
      
      // **PERFORMANCE FIX 2: Use timeouts to prevent hanging**
      const timeoutPromises = scanPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scan method timeout')), 800)
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
          console.warn(`Python scan method ${i} failed/timeout:`, results[i].reason?.message);
        }
      }
      
      // Deduplicate processes
      const uniqueProcesses = this._deduplicateProcesses(processes);
      
      // **PERFORMANCE FIX 3: Batch framework detection with error handling**
      if (this.options.frameworkDetection && uniqueProcesses.length > 0) {
        const frameworkPromises = uniqueProcesses.map(process => 
          this._detectFramework(process).catch(() => {
            // Ignore individual framework detection failures
            process.framework = PythonFrameworks.GENERIC;
          })
        );
        await Promise.allSettled(frameworkPromises);
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${uniqueProcesses.length} Python processes in ${duration}ms (optimized)`);
      
      uniqueProcesses.forEach(process => this._emitProcessDetected(process));
      
      return uniqueProcesses;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error scanning Python processes:', error.message);
      throw error;
    }
  }
  
  getSupportedDetectionMethods() {
    return [
      DetectionMethod.PROCESS_NAME,
      DetectionMethod.PORT_SCAN,
      DetectionMethod.COMMAND_LINE,
      DetectionMethod.CONFIG_FILE,
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
        
        // Framework-specific health checks
        if (process.framework && (process.framework === 'flask' || process.framework === 'django' || process.framework === 'fastapi')) {
          const httpHealth = await this._checkHttpHealth(process);
          health.checks.httpHealth = httpHealth;
          
          if (!httpHealth.healthy) {
            health.status = HealthStatus.UNHEALTHY;
          }
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
          if (processInfo && this._isPythonProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn(`Could not get info for PID ${pid}:`, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Python process name scanning failed:', error.message);
    }
    
    return processes;
  }
  
  async _scanByPortRange() {
    const processes = [];
    
    try {
      const { start, end } = this.options.portRange;
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
          if (processInfo && this._isPythonProcess(processInfo)) {
            processes.push(processInfo);
          }
        } catch (error) {
          console.warn('Could not parse netstat line:', line, error.message);
        }
      }
      
    } catch (error) {
      console.warn('Python port range scanning failed:', error.message);
    }
    
    return processes;
  }
  
  async _scanByWorkspaces(workspacePaths = []) {
    const processes = [];
    
    if (!workspacePaths || workspacePaths.length === 0) {
      return processes;
    }
    
    for (const workspacePath of workspacePaths) {
      try {
        // Check for various Python project indicators
        const indicators = ['requirements.txt', 'setup.py', 'manage.py', 'app.py', 'main.py'];
        let isPythonProject = false;
        
        for (const indicator of indicators) {
          try {
            await fs.access(path.join(workspacePath, indicator));
            isPythonProject = true;
            break;
          } catch (error) {
            continue;
          }
        }
        
        if (isPythonProject) {
          const workspaceProcesses = await this._findWorkspaceProcesses(workspacePath);
          processes.push(...workspaceProcesses);
        }
        
      } catch (error) {
        continue;
      }
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
        techStack: 'python',
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
  
  _isPythonProcess(processInfo) {
    if (!processInfo || !processInfo.command) {
      return false;
    }
    
    const cmd = processInfo.command.toLowerCase();
    return this.options.processPatterns.some(pattern => 
      cmd.includes(pattern.toLowerCase())
    );
  }
  
  async _detectFramework(process) {
    if (!process.command) {
      process.framework = PythonFrameworks.GENERIC;
      return;
    }
    
    const cmd = process.command.toLowerCase();
    
    for (const [framework, pattern] of Object.entries(this.processPatterns)) {
      if (pattern.test(cmd)) {
        process.framework = framework;
        
        if (process.workspacePath) {
          const frameworkDetails = await this._getFrameworkDetails(process.workspacePath, framework);
          if (frameworkDetails) {
            process.metadata = { ...process.metadata, ...frameworkDetails };
          }
        }
        
        return;
      }
    }
    
    process.framework = PythonFrameworks.GENERIC;
  }
  
  async _getFrameworkDetails(workspacePath, framework) {
    try {
      const details = {};
      
      if (framework === 'flask') {
        // Check for Flask app structure
        const appExists = await this._fileExists(path.join(workspacePath, 'app.py'));
        details.hasAppFile = appExists;
        details.framework = 'Flask';
      } else if (framework === 'django') {
        // Check for Django project structure
        const manageExists = await this._fileExists(path.join(workspacePath, 'manage.py'));
        details.hasManageFile = manageExists;
        details.framework = 'Django';
      } else if (framework === 'fastapi') {
        // Check for FastAPI structure
        const mainExists = await this._fileExists(path.join(workspacePath, 'main.py'));
        details.hasMainFile = mainExists;
        details.framework = 'FastAPI';
      }
      
      return details;
      
    } catch (error) {
      return null;
    }
  }
  
  async _findWorkspaceProcesses(workspacePath) {
    const processes = [];
    
    try {
      const result = await this._executeCommand(`pgrep -f "${workspacePath}"`);
      
      if (result.success && result.stdout.trim()) {
        const pids = result.stdout.trim().split('\n').filter(Boolean);
        
        for (const pid of pids) {
          const processInfo = await this._getProcessInfo(parseInt(pid));
          if (processInfo && this._isPythonProcess(processInfo)) {
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
          health.healthy = statusCode !== '000';
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

module.exports = PythonProcessDetector;