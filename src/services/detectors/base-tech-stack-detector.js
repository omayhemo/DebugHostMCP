/**
 * Base Technology Stack Detector
 * 
 * Abstract base class for all technology-specific process detectors.
 * Provides common functionality and enforces the TechStackDetector interface.
 */

const EventEmitter = require('events');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Process Detection Method Types
 */
const DetectionMethod = {
  PROCESS_NAME: 'process_name',      // grep process names
  PORT_SCAN: 'port_scan',            // scan port ranges
  COMMAND_LINE: 'command_line',      // analyze command line args
  CONFIG_FILE: 'config_file',        // check configuration files
  HTTP_PROBE: 'http_probe',          // HTTP health checks
  API_CALL: 'api_call'              // API integration (e.g., Docker)
};

/**
 * Health Status Constants
 */
const HealthStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * Base class that all technology stack detectors must extend
 * Provides common functionality and enforces interface compliance
 */
class BaseTechStackDetector extends EventEmitter {
  constructor(techStack, options = {}) {
    super();
    
    if (new.target === BaseTechStackDetector) {
      throw new Error('BaseTechStackDetector is abstract and cannot be instantiated directly');
    }
    
    this.techStack = techStack;
    this.options = {
      enabled: options.enabled !== false,
      timeout: options.timeout || 500, // **PERFORMANCE FIX**: Reduced from 5000ms to 500ms for system commands
      retries: options.retries !== undefined ? options.retries : 1, // **PERFORMANCE FIX**: Reduced from 2 to 1 retry
      portRange: options.portRange || { start: 3000, end: 3999 },
      cacheTimeout: options.cacheTimeout || 5000,
      ...options
    };
    
    // Internal state
    this.initialized = false;
    this.cache = new Map();
    this.detectionStats = {
      totalDetections: 0,
      successfulDetections: 0,
      failedDetections: 0,
      averageDetectionTime: 0,
      lastDetectionTime: null
    };
  }
  
  /**
   * Initialize the detector - must be implemented by subclasses
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }
  
  /**
   * Scan for processes of this technology stack - must be implemented by subclasses
   * @abstract
   * @param {Object} options - Scan options
   * @returns {Promise<Object[]>} Array of discovered processes
   */
  async scanProcesses(options = {}) {
    throw new Error('scanProcesses() must be implemented by subclass');
  }
  
  /**
   * Correlate discovered processes with workspaces - default implementation
   * @param {Object[]} processes - Array of discovered processes
   * @returns {Promise<Object[]>} Array of correlated processes
   */
  async correlateWithWorkspaces(processes) {
    // Default implementation - can be overridden by subclasses
    return processes.map(process => ({
      ...process,
      correlationStatus: 'discovered',
      workspacePath: null,
      confidence: 0.5
    }));
  }
  
  /**
   * Predict potential rogue ports based on base port - can be overridden
   * @param {number} basePort - Base port number
   * @returns {Promise<number[]>} Array of predicted ports
   */
  async predictRoguePorts(basePort) {
    // Default implementation - check sequential ports
    const predictions = [];
    const range = this.options.portRange;
    
    for (let i = 1; i <= 5; i++) {
      const port = basePort + i;
      if (port >= range.start && port <= range.end) {
        predictions.push(port);
      }
    }
    
    return predictions;
  }
  
  /**
   * Validate process health - can be overridden by subclasses
   * @param {Object} process - Process to validate
   * @returns {Promise<Object>} Health status information
   */
  async validateProcessHealth(process) {
    try {
      // Basic port connectivity check
      if (process.port) {
        const isListening = await this._checkPortListening(process.port);
        return {
          status: isListening ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          checks: {
            portListening: isListening,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return {
        status: HealthStatus.UNKNOWN,
        checks: {
          reason: 'No port information available',
          timestamp: new Date().toISOString()
        }
      };
      
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
  
  /**
   * Get detector information and capabilities
   * @returns {Object} Detector information
   */
  getInfo() {
    return {
      techStack: this.techStack,
      enabled: this.options.enabled,
      initialized: this.initialized,
      portRange: this.options.portRange,
      supportedMethods: this.getSupportedDetectionMethods(),
      stats: { ...this.detectionStats },
      options: { ...this.options }
    };
  }
  
  /**
   * Get supported detection methods - must be implemented by subclasses
   * @abstract
   * @returns {string[]} Array of supported detection methods
   */
  getSupportedDetectionMethods() {
    throw new Error('getSupportedDetectionMethods() must be implemented by subclass');
  }
  
  /**
   * Shutdown the detector and clean up resources
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log(`Shutting down ${this.techStack} detector`);
    
    // Clear cache
    this.cache.clear();
    
    // Mark as not initialized
    this.initialized = false;
    
    this.emit('shutdown');
  }
  
  // Protected helper methods for subclasses
  
  /**
   * Execute system command with timeout and retry
   * @protected
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Command result
   */
  async _executeCommand(command, options = {}) {
    const execOptions = {
      timeout: options.timeout || this.options.timeout,
      ...options
    };
    
    let lastError;
    const retries = options.retries || this.options.retries;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await execAsync(command, execOptions);
        return {
          success: true,
          stdout: result.stdout,
          stderr: result.stderr,
          command
        };
      } catch (error) {
        lastError = error;
        
        // If command not found, don't retry
        if (error.code === 127 || error.message.includes('not found')) {
          throw error;
        }
        
        if (attempt < retries) {
          // **PERFORMANCE FIX**: Reduced retry delay from 1000ms to 100ms
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Check if a port is listening
   * @protected
   * @param {number} port - Port number to check
   * @returns {Promise<boolean>} True if port is listening
   */
  async _checkPortListening(port) {
    try {
      const result = await this._executeCommand(`netstat -tuln | grep :${port}`);
      return result.success && result.stdout.includes(`:${port}`);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get cached result or execute function and cache result
   * @protected
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if not cached
   * @returns {Promise<any>} Cached or fresh result
   */
  async _getCached(key, fn) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.options.cacheTimeout) {
      return cached.result;
    }
    
    const result = await fn();
    this.cache.set(key, {
      result,
      timestamp: now
    });
    
    return result;
  }
  
  /**
   * Parse process command line arguments
   * @protected
   * @param {string} cmdline - Command line string
   * @returns {Object} Parsed command information
   */
  _parseCommandLine(cmdline) {
    const parts = cmdline.trim().split(/\s+/);
    const executable = parts[0];
    const args = parts.slice(1);
    
    return {
      executable,
      args,
      fullCommand: cmdline,
      argString: args.join(' ')
    };
  }
  
  /**
   * Extract port number from various sources
   * @protected
   * @param {Object} sources - Various sources to check for port
   * @returns {number|null} Extracted port or null
   */
  _extractPort(sources) {
    // Check direct port specification
    if (sources.port && typeof sources.port === 'number') {
      return sources.port;
    }
    
    // Check command line arguments
    if (sources.cmdline) {
      const portMatches = sources.cmdline.match(/--?port[=\s](\d+)|:(\d+)/gi);
      if (portMatches) {
        for (const match of portMatches) {
          const port = parseInt(match.replace(/[^\d]/g, ''));
          if (port && port > 0 && port < 65536) {
            return port;
          }
        }
      }
    }
    
    // Check network connections
    if (sources.network) {
      const portMatch = sources.network.match(/:(\d+)\s/);
      if (portMatch) {
        return parseInt(portMatch[1]);
      }
    }
    
    return null;
  }
  
  /**
   * Update detection statistics
   * @protected
   * @param {boolean} success - Whether detection was successful
   * @param {number} duration - Detection duration in ms
   */
  _updateStats(success, duration) {
    this.detectionStats.totalDetections++;
    this.detectionStats.lastDetectionTime = new Date().toISOString();
    
    if (success) {
      this.detectionStats.successfulDetections++;
    } else {
      this.detectionStats.failedDetections++;
    }
    
    // Update average detection time
    const totalTime = this.detectionStats.averageDetectionTime * (this.detectionStats.totalDetections - 1) + duration;
    this.detectionStats.averageDetectionTime = totalTime / this.detectionStats.totalDetections;
  }
  
  /**
   * Emit process detected event with standard format
   * @protected
   * @param {Object} process - Detected process
   */
  _emitProcessDetected(process) {
    const standardProcess = {
      pid: process.pid,
      port: process.port,
      techStack: this.techStack,
      framework: process.framework,
      workspacePath: process.workspacePath,
      correlationStatus: process.correlationStatus || 'discovered',
      detectionTime: new Date(),
      detectionMethod: process.detectionMethod,
      confidence: process.confidence || 0.8,
      metadata: process.metadata || {}
    };
    
    this.emit('processDetected', standardProcess);
    return standardProcess;
  }
}

// Export classes and constants
module.exports = {
  BaseTechStackDetector,
  DetectionMethod,
  HealthStatus
};