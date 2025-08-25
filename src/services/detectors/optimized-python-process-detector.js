/**
 * Optimized Python Process Detector
 * 
 * Performance-optimized version that addresses the timeout issues by using:
 * - Batch process queries instead of individual PID lookups
 * - Parallel scanning methods instead of sequential
 * - Cached process data to eliminate duplicate system calls
 * - Timeout handling for individual operations
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');
const { PerformanceOptimizedScanner } = require('../performance-optimized-scanner');
const path = require('path');

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

class OptimizedPythonProcessDetector extends BaseTechStackDetector {
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
      maxScanTime: options.maxScanTime || 800, // 800ms max per detector
      ...options
    });
    
    this.scanner = new PerformanceOptimizedScanner({
      cacheTimeout: 1000,
      batchTimeout: 300
    });
  }

  /**
   * Optimized process scanning with parallel execution and batch queries
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Starting optimized Python process scan...');
      
      // **OPTIMIZATION 1: Run scanning methods in PARALLEL instead of sequential**
      const scanPromises = [
        this._scanByProcessNameOptimized(),
        this._scanByPortRangeOptimized(),
      ];
      
      // Add workspace scanning if enabled
      if (this.options.requirementsScan && options.workspacePaths) {
        scanPromises.push(this._scanByWorkspacesOptimized(options.workspacePaths));
      }
      
      // Execute all scanning methods in parallel with timeout
      const results = await Promise.allSettled(
        scanPromises.map(promise => 
          this._withTimeout(promise, this.options.maxScanTime)
        )
      );
      
      // Collect successful results
      const allProcesses = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          allProcesses.push(...results[i].value);
        } else {
          console.warn(`Scan method ${i} failed:`, results[i].reason?.message);
        }
      }
      
      // **OPTIMIZATION 2: Deduplicate using efficient Set operations**
      const uniqueProcesses = this._deduplicateProcessesOptimized(allProcesses);
      
      // **OPTIMIZATION 3: Batch framework detection instead of individual calls**
      if (this.options.frameworkDetection && uniqueProcesses.length > 0) {
        await this._detectFrameworksBatch(uniqueProcesses);
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${uniqueProcesses.length} Python processes in ${duration}ms (optimized)`);
      
      uniqueProcesses.forEach(process => this._emitProcessDetected(process));
      
      return uniqueProcesses;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error in optimized Python process scan:', error.message);
      throw error;
    }
  }

  /**
   * Optimized process name scanning using batch queries
   */
  async _scanByProcessNameOptimized() {
    const processes = [];
    
    try {
      // **BATCH QUERY**: Get all processes matching Python patterns at once
      const matchingProcesses = await this.scanner.searchProcessesByPattern(
        this.options.processPatterns
      );
      
      for (const process of matchingProcesses) {
        // Filter for actual Python processes
        if (this._isPythonProcess(process)) {
          const pythonProcess = await this._createPythonProcess(process);
          if (pythonProcess) {
            processes.push(pythonProcess);
          }
        }
      }
      
      return processes;
      
    } catch (error) {
      console.warn('Optimized process name scan failed:', error.message);
      return [];
    }
  }

  /**
   * Optimized port range scanning using batch queries
   */
  async _scanByPortRangeOptimized() {
    try {
      // **BATCH QUERY**: Get all processes in Python port range at once
      const portProcesses = await this.scanner.getProcessesByPorts(
        this.options.portRange.start,
        this.options.portRange.end
      );
      
      const processes = [];
      for (const process of portProcesses) {
        if (this._isPythonProcess(process)) {
          const pythonProcess = await this._createPythonProcess(process, process.port);
          if (pythonProcess) {
            processes.push(pythonProcess);
          }
        }
      }
      
      return processes;
      
    } catch (error) {
      console.warn('Optimized port range scan failed:', error.message);
      return [];
    }
  }

  /**
   * Optimized workspace scanning
   */
  async _scanByWorkspacesOptimized(workspacePaths = []) {
    if (!workspacePaths || workspacePaths.length === 0) {
      return [];
    }
    
    const processes = [];
    
    try {
      // Get all processes first, then filter by workspace paths
      const allProcesses = await this.scanner.getAllProcesses();
      
      for (const [pid, process] of allProcesses) {
        if (this._isPythonProcess(process)) {
          // Check if process is running in any of the specified workspaces
          for (const workspacePath of workspacePaths) {
            if (process.command.includes(workspacePath) || 
                (process.cwd && process.cwd.startsWith(workspacePath))) {
              
              const pythonProcess = await this._createPythonProcess(process);
              if (pythonProcess) {
                pythonProcess.workspace = workspacePath;
                processes.push(pythonProcess);
              }
              break;
            }
          }
        }
      }
      
      return processes;
      
    } catch (error) {
      console.warn('Optimized workspace scan failed:', error.message);
      return [];
    }
  }

  /**
   * Batch framework detection instead of individual calls
   */
  async _detectFrameworksBatch(processes) {
    const detectionPromises = processes.map(process => 
      this._detectFrameworkOptimized(process).catch(error => {
        console.warn(`Framework detection failed for PID ${process.pid}:`, error.message);
        return null; // Don't fail the entire batch for one error
      })
    );
    
    await Promise.allSettled(detectionPromises);
  }

  /**
   * Optimized framework detection
   */
  async _detectFrameworkOptimized(process) {
    const cmd = process.command.toLowerCase();
    
    // Fast pattern matching without additional system calls
    if (cmd.includes('flask')) {
      process.framework = PythonFrameworks.FLASK;
    } else if (cmd.includes('django') || cmd.includes('manage.py runserver')) {
      process.framework = PythonFrameworks.DJANGO;
    } else if (cmd.includes('uvicorn') || cmd.includes('fastapi')) {
      process.framework = PythonFrameworks.FASTAPI;
    } else if (cmd.includes('gunicorn')) {
      process.framework = PythonFrameworks.GUNICORN;
    } else if (cmd.includes('tornado')) {
      process.framework = PythonFrameworks.TORNADO;
    } else if (cmd.includes('bottle')) {
      process.framework = PythonFrameworks.BOTTLE;
    } else if (cmd.includes('http.server') || cmd.includes('-m http.server')) {
      process.framework = PythonFrameworks.HTTP_SERVER;
    } else if (cmd.includes('uwsgi')) {
      process.framework = PythonFrameworks.UWSGI;
    } else {
      process.framework = PythonFrameworks.GENERIC;
    }
  }

  /**
   * Check if process is a Python process
   */
  _isPythonProcess(process) {
    const cmd = process.command.toLowerCase();
    return this.options.processPatterns.some(pattern => 
      cmd.includes(pattern.toLowerCase())
    );
  }

  /**
   * Create Python process object from system process
   */
  async _createPythonProcess(systemProcess, detectedPort = null) {
    try {
      const port = detectedPort || this._extractPort(systemProcess);
      
      return {
        pid: systemProcess.pid,
        port: port,
        command: systemProcess.command,
        techStack: 'python',
        framework: null, // Will be set by framework detection
        startTime: systemProcess.startTime,
        uid: systemProcess.uid,
        memoryMB: systemProcess.memoryMB,
        cpuPercent: systemProcess.cpuPercent,
        detectionMethod: DetectionMethod.PROCESS_SCAN
      };
      
    } catch (error) {
      console.warn(`Failed to create Python process for PID ${systemProcess.pid}:`, error.message);
      return null;
    }
  }

  /**
   * Optimized deduplication using Map for O(n) performance
   */
  _deduplicateProcessesOptimized(processes) {
    const processMap = new Map();
    
    for (const process of processes) {
      const key = `${process.pid}-${process.port || 'no-port'}`;
      if (!processMap.has(key)) {
        processMap.set(key, process);
      } else {
        // Merge information from duplicate entries
        const existing = processMap.get(key);
        if (!existing.framework && process.framework) {
          existing.framework = process.framework;
        }
        if (!existing.workspace && process.workspace) {
          existing.workspace = process.workspace;
        }
      }
    }
    
    return Array.from(processMap.values());
  }

  /**
   * Extract port from process command line
   */
  _extractPort(process) {
    const cmd = process.command;
    
    // Common Python server port patterns
    const patterns = [
      /:(\d+)/, // General :port pattern
      /--port[=\s](\d+)/, // --port=5000 or --port 5000
      /-p\s+(\d+)/, // -p 5000
      /runserver\s+.*?:(\d+)/, // Django runserver 0.0.0.0:8000
      /0\.0\.0\.0:(\d+)/, // Bind to all interfaces
      /127\.0\.0\.1:(\d+)/, // Localhost binding
      /localhost:(\d+)/, // localhost:port
    ];
    
    for (const pattern of patterns) {
      const match = cmd.match(pattern);
      if (match) {
        const port = parseInt(match[1]);
        if (port > 0 && port < 65536) {
          return port;
        }
      }
    }
    
    return null;
  }

  /**
   * Timeout wrapper for operations
   */
  async _withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Cleanup resources
   */
  async shutdown() {
    if (this.scanner) {
      this.scanner.clearCache();
    }
    await super.shutdown();
  }
}

module.exports = OptimizedPythonProcessDetector;