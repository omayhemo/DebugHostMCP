/**
 * Multi-Tech Stack Process Discovery Engine
 * 
 * Core engine that orchestrates the discovery and correlation of development processes
 * across all supported technology stacks (Node.js, PHP, Python, Static Sites, Docker).
 * 
 * This is the foundation component for PlopDock v2.1's enhanced process management capabilities.
 */

const EventEmitter = require('events');
const NodeJSProcessDetector = require('./detectors/nodejs-process-detector');
const PHPProcessDetector = require('./detectors/php-process-detector');
const PythonProcessDetector = require('./detectors/python-process-detector');
const StaticSiteProcessDetector = require('./detectors/static-site-process-detector');
const DockerProcessDetector = require('./detectors/docker-process-detector');
const { ProcessCorrelationEngine } = require('./process-correlation-engine');
const { PerformanceMonitor } = require('./performance-monitor');

/**
 * Technology Stack Enumeration
 */
const TechStack = {
  NODEJS: 'nodejs',
  PHP: 'php',
  PYTHON: 'python',
  STATIC: 'static',
  DOCKER: 'docker'
};

/**
 * Process Correlation Status
 */
const CorrelationStatus = {
  REGISTERED: 'registered',     // Process is in the port registry
  DISCOVERED: 'discovered',     // Process found but not registered
  ROGUE: 'rogue',              // Process outside known workspaces
  ORPHANED: 'orphaned'         // Process from terminated workspace
};

/**
 * Main Multi-Tech Process Discovery Engine
 * Coordinates detection across all technology stacks and provides unified process discovery
 */
class MultiTechProcessDiscoveryEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      scanTimeout: options.scanTimeout || 3000, // Increased to 3 seconds to accommodate detector optimization
      parallelScanning: options.parallelScanning !== false,
      performanceMonitoring: options.performanceMonitoring !== false,
      correlationEnabled: options.correlationEnabled !== false,
      ...options
    };
    
    // Initialize technology stack detectors
    this.detectors = new Map([
      [TechStack.NODEJS, new NodeJSProcessDetector(this.options.nodejs)],
      [TechStack.PHP, new PHPProcessDetector(this.options.php)],
      [TechStack.PYTHON, new PythonProcessDetector(this.options.python)],
      [TechStack.STATIC, new StaticSiteProcessDetector(this.options.static)],
      [TechStack.DOCKER, new DockerProcessDetector(this.options.docker)]
    ]);
    
    // Initialize correlation engine
    this.correlationEngine = new ProcessCorrelationEngine({
      portRegistry: options.portRegistry,
      workspaceScanner: options.workspaceScanner
    });
    
    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor({
      enabled: this.options.performanceMonitoring,
      cpuThreshold: 5.0,      // 5% CPU threshold
      memoryThreshold: 50     // 50MB memory threshold
    });
    
    // Internal state
    this.isScanning = false;
    this.lastScanResults = null;
    this.lastScanTime = null;
    this.scanCount = 0;
    
    // Scan queue for handling concurrent requests
    this.scanQueue = [];
    this.maxConcurrentScans = options.maxConcurrentScans || 3;
    this.activeScans = 0;
    
    // Performance tracking
    this.scanStats = {
      totalScans: 0,
      averageScanTime: 0,
      fastestScan: Infinity,
      slowestScan: 0,
      failureCount: 0
    };
    
    // Event bindings
    this._bindDetectorEvents();
  }
  
  /**
   * Initialize the discovery engine
   * Prepares all detectors and validates system requirements
   */
  async initialize() {
    console.log('Initializing Multi-Tech Process Discovery Engine...');
    
    try {
      // Start performance monitoring if enabled
      if (this.options.performanceMonitoring) {
        await this.performanceMonitor.initialize();
      }
      
      // Initialize correlation engine
      await this.correlationEngine.initialize();
      
      // Initialize all detectors in parallel for speed
      const initPromises = Array.from(this.detectors.entries()).map(async ([techStack, detector]) => {
        try {
          await detector.initialize();
          console.log(`✓ ${techStack} detector initialized`);
          return { techStack, success: true };
        } catch (error) {
          console.error(`✗ ${techStack} detector failed to initialize:`, error.message);
          return { techStack, success: false, error };
        }
      });
      
      const results = await Promise.all(initPromises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        console.warn(`Warning: ${failed.length} detectors failed to initialize:`, failed.map(f => f.techStack));
        // Continue with available detectors rather than failing completely
      }
      
      console.log('Multi-Tech Process Discovery Engine initialized successfully');
      this.emit('initialized', { 
        availableDetectors: results.filter(r => r.success).map(r => r.techStack),
        failedDetectors: failed.map(f => f.techStack)
      });
      
    } catch (error) {
      console.error('Failed to initialize Multi-Tech Process Discovery Engine:', error);
      throw error;
    }
  }
  
  /**
   * Perform a complete system scan across all technology stacks
   * This is the primary method for discovering processes
   * 
   * @param {Object} options - Scan options
   * @param {boolean} options.includeCorrelation - Include workspace correlation (default: true)
   * @param {string[]} options.techStacks - Specific tech stacks to scan (default: all)
   * @param {boolean} options.forceRefresh - Force fresh scan ignoring cache
   * @returns {Promise<Object>} Comprehensive scan results
   */
  async scanSystemProcesses(options = {}) {
    // Handle concurrent scan requests with queue
    if (this.activeScans >= this.maxConcurrentScans) {
      console.warn(`Max concurrent scans reached (${this.activeScans}/${this.maxConcurrentScans}), queuing scan request...`);
      
      return new Promise((resolve, reject) => {
        this.scanQueue.push({ options, resolve, reject });
        
        // Process queue after a short delay
        setTimeout(() => this._processScansQueue(), 100);
      });
    }
    
    // Execute scan immediately if under concurrent limit
    return this._executeScan(options);
  }
  
  /**
   * Process queued scan requests
   * @private
   */
  async _processScansQueue() {
    while (this.scanQueue.length > 0 && this.activeScans < this.maxConcurrentScans) {
      const queuedScan = this.scanQueue.shift();
      
      // Execute scan asynchronously to allow concurrent processing
      this._executeScan(queuedScan.options)
        .then(result => queuedScan.resolve(result))
        .catch(error => queuedScan.reject(error));
    }
  }
  
  /**
   * Execute a single scan operation
   * @private
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Comprehensive scan results
   */
  async _executeScan(options = {}) {
    const scanOptions = {
      includeCorrelation: options.includeCorrelation !== false,
      techStacks: options.techStacks || Array.from(this.detectors.keys()),
      forceRefresh: options.forceRefresh || false,
      ...options
    };
    
    // Track active scan
    this.activeScans++;
    const scanStartTime = Date.now();
    
    try {
      // Start performance monitoring for this scan
      const scanMonitor = this.performanceMonitor.startScanMonitoring();
      
      console.log(`Starting system scan across ${scanOptions.techStacks.length} technology stacks...`);
      
      // Execute parallel detection across requested tech stacks
      const detectionPromises = scanOptions.techStacks.map(async (techStack) => {
        const detector = this.detectors.get(techStack);
        if (!detector) {
          return { techStack, processes: [], error: `Detector not available` };
        }
        
        try {
          const processes = await detector.scanProcesses(scanOptions);
          return { techStack, processes, success: true };
        } catch (error) {
          console.error(`Error scanning ${techStack} processes:`, error.message);
          return { techStack, processes: [], success: false, error: error.message };
        }
      });
      
      // Wait for all detections to complete with timeout
      const detectionResults = await this._executeWithTimeout(
        Promise.all(detectionPromises),
        this.options.scanTimeout
      );
      
      // Aggregate all discovered processes
      const allProcesses = [];
      const techStackResults = {};
      
      for (const result of detectionResults) {
        techStackResults[result.techStack] = result;
        if (result.success && result.processes) {
          allProcesses.push(...result.processes);
        }
      }
      
      // Perform correlation if requested
      let correlationResults = null;
      if (scanOptions.includeCorrelation && allProcesses.length > 0) {
        correlationResults = await this.correlationEngine.correlateProcesses(allProcesses);
      }
      
      // Complete scan timing
      const scanEndTime = Date.now();
      const scanDuration = scanEndTime - scanStartTime;
      
      // Update performance statistics
      this._updateScanStats(scanDuration);
      
      // Build comprehensive results
      const results = {
        scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        duration: scanDuration,
        techStackResults,
        totalProcesses: allProcesses.length,
        processesFound: allProcesses,
        correlation: correlationResults,
        performance: scanMonitor ? scanMonitor.getResults() : null,
        success: true
      };
      
      // Cache results
      this.lastScanResults = results;
      this.lastScanTime = scanEndTime;
      this.scanCount++;
      
      console.log(`✓ System scan completed in ${scanDuration}ms. Found ${allProcesses.length} processes.`);
      
      // Emit scan completion event
      this.emit('scanCompleted', results);
      
      return results;
      
    } catch (error) {
      const scanDuration = Date.now() - scanStartTime;
      this.scanStats.failureCount++;
      
      console.error(`System scan failed after ${scanDuration}ms:`, error.message);
      
      const errorResult = {
        scanId: `scan_error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: scanDuration,
        success: false,
        error: error.message,
        totalProcesses: 0
      };
      
      this.emit('scanError', errorResult);
      throw error;
      
    } finally {
      // Decrement active scan counter and process queue if available
      this.activeScans = Math.max(0, this.activeScans - 1);
      
      // Process any queued scans
      if (this.scanQueue.length > 0 && this.activeScans < this.maxConcurrentScans) {
        setTimeout(() => this._processScansQueue(), 10);
      }
    }
  }
  
  /**
   * Detect rogue processes running outside of managed workspaces
   * @returns {Promise<Object[]>} Array of rogue processes
   */
  async detectRogueProcesses() {
    console.log('Detecting rogue processes...');
    
    const results = await this.scanSystemProcesses({ 
      includeCorrelation: true,
      forceRefresh: true 
    });
    
    if (!results.correlation) {
      throw new Error('Correlation results required for rogue detection');
    }
    
    return results.correlation.rogueProcesses || [];
  }
  
  /**
   * Correlate discovered processes with registered workspaces and projects
   * @param {Object[]} processes - Array of discovered processes
   * @returns {Promise<Object>} Correlation results
   */
  async correlateWithProjects(processes) {
    return await this.correlationEngine.correlateProcesses(processes);
  }
  
  /**
   * Get real-time status of the discovery engine
   * @returns {Object} Current engine status
   */
  getStatus() {
    return {
      isScanning: this.activeScans > 0,
      activeScans: this.activeScans,
      maxConcurrentScans: this.maxConcurrentScans,
      queuedScans: this.scanQueue.length,
      lastScanTime: this.lastScanTime,
      scanCount: this.scanCount,
      availableDetectors: Array.from(this.detectors.keys()),
      scanStats: { ...this.scanStats },
      performance: this.performanceMonitor.getCurrentMetrics(),
      uptime: this.performanceMonitor.getUptime()
    };
  }
  
  /**
   * Get detector-specific information
   * @param {string} techStack - Technology stack identifier
   * @returns {Object} Detector status and capabilities
   */
  getDetectorInfo(techStack) {
    const detector = this.detectors.get(techStack);
    if (!detector) {
      throw new Error(`Unknown technology stack: ${techStack}`);
    }
    
    return detector.getInfo();
  }
  
  /**
   * Graceful shutdown of the discovery engine
   */
  async shutdown() {
    console.log('Shutting down Multi-Tech Process Discovery Engine...');
    
    try {
      // Stop any ongoing scans and clear queue
      this.activeScans = 0;
      this.scanQueue = [];
      
      // Shutdown all detectors
      const shutdownPromises = Array.from(this.detectors.values()).map(detector => 
        detector.shutdown().catch(error => 
          console.warn('Detector shutdown error:', error.message)
        )
      );
      
      await Promise.all(shutdownPromises);
      
      // Shutdown correlation engine
      await this.correlationEngine.shutdown();
      
      // Shutdown performance monitoring
      if (this.performanceMonitor) {
        await this.performanceMonitor.shutdown();
      }
      
      console.log('Multi-Tech Process Discovery Engine shutdown complete');
      this.emit('shutdown');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  /**
   * Execute a promise with timeout
   * @private
   */
  async _executeWithTimeout(promise, timeout) {
    return await Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }
  
  /**
   * Update scan performance statistics
   * @private
   */
  _updateScanStats(duration) {
    this.scanStats.totalScans++;
    
    // Update timing statistics
    if (duration < this.scanStats.fastestScan) {
      this.scanStats.fastestScan = duration;
    }
    if (duration > this.scanStats.slowestScan) {
      this.scanStats.slowestScan = duration;
    }
    
    // Calculate running average
    this.scanStats.averageScanTime = 
      ((this.scanStats.averageScanTime * (this.scanStats.totalScans - 1)) + duration) / 
      this.scanStats.totalScans;
  }
  
  /**
   * Bind detector events for monitoring
   * @private
   */
  _bindDetectorEvents() {
    for (const [techStack, detector] of this.detectors.entries()) {
      detector.on('processDetected', (process) => {
        this.emit('processDetected', { techStack, process });
      });
      
      detector.on('detectionError', (error) => {
        this.emit('detectionError', { techStack, error });
      });
    }
  }
}

// Export classes and constants
module.exports = {
  MultiTechProcessDiscoveryEngine,
  TechStack,
  CorrelationStatus
};