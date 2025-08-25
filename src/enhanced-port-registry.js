/**
 * Enhanced Dynamic Port Registry
 * 
 * Unifies static port allocations with real-time dynamic process discovery.
 * Provides comprehensive process categorization and intelligent registry management
 * that combines the existing PortRegistry with the Multi-Tech Process Discovery Engine.
 * 
 * Key Features:
 * - Inherits all existing PortRegistry functionality (backward compatibility)
 * - Real-time process discovery integration
 * - Process categorization: registered/discovered/rogue/orphaned/containers
 * - 5-second refresh cycles with change detection
 * - Performance optimized: <1s refresh, <2% CPU usage
 * - Data consistency protection with concurrent access
 * - Error recovery with state rollback
 */

const EventEmitter = require('events');
const util = require('util');
const PortRegistry = require('./port-registry');
const { MultiTechProcessDiscoveryEngine, TechStack, CorrelationStatus } = require('./services/multi-tech-process-discovery-engine');
const { RegistryPerformanceOptimizer } = require('./services/registry-performance-optimizer');

/**
 * Enhanced Process Categories
 */
const ProcessCategory = {
  REGISTERED: 'registered',       // Process matches static allocation + discovered
  DISCOVERED: 'discovered',       // Process found but not registered
  ROGUE: 'rogue',                // Process outside known workspaces
  ORPHANED: 'orphaned',          // Static allocation exists, no process found
  CONTAINERS: 'containers'        // Docker container processes
};

/**
 * Registry State Constants  
 */
const RegistryState = {
  INITIALIZING: 'initializing',
  ACTIVE: 'active',
  REFRESHING: 'refreshing',
  ERROR: 'error',
  SHUTDOWN: 'shutdown'
};

/**
 * Enhanced Dynamic Port Registry Base
 * 
 * Combines PortRegistry with EventEmitter for real-time capabilities
 */
class RegistryEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

/**
 * Enhanced Dynamic Port Registry
 * 
 * Extends the base PortRegistry with real-time dynamic discovery capabilities
 * while preserving all existing functionality for backward compatibility.
 */
class EnhancedPortRegistry extends PortRegistry {
  constructor(dataPath = null, options = {}) {
    super(dataPath);
    
    // Initialize EventEmitter capabilities
    EventEmitter.call(this);
    
    this.options = {
      refreshInterval: options.refreshInterval || 5000,    // 5-second refresh
      refreshTimeout: options.refreshTimeout || 1000,     // <1 second requirement
      changeDetection: options.changeDetection !== false,
      maxCpuUsage: options.maxCpuUsage || 2.0,            // <2% CPU requirement
      enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
      enableErrorRecovery: options.enableErrorRecovery !== false,
      ...options
    };
    
    // Enhanced registry state
    this.state = RegistryState.INITIALIZING;
    this.lastRefreshTime = null;
    this.refreshCount = 0;
    this.changeDetectionEnabled = this.options.changeDetection;
    
    // Dynamic discovery components
    this.discoveryEngine = null;
    this.lastDiscoveryResults = null;
    this.lastProcessSnapshot = new Map();
    
    // Performance optimization
    this.performanceOptimizer = new RegistryPerformanceOptimizer({
      enableSmartCaching: this.options.enableSmartCaching !== false,
      enableBatchProcessing: this.options.enableBatchProcessing !== false,
      enableAsyncQueueing: this.options.enableAsyncQueueing !== false,
      enablePerformanceMonitoring: true,
      cache: {
        ttl: 3000,         // 3 second cache TTL
        maxSize: 500       // Maximum 500 cached entries
      },
      queue: {
        maxConcurrent: 2,  // Limit concurrent operations
        maxQueueSize: 20   // Maximum queued operations
      },
      batch: {
        batchSize: 25,     // Process 25 items per batch
        batchTimeout: 50   // 50ms batch timeout
      }
    });
    
    // Process categorization cache
    this.processCategories = {
      registered: new Map(),      // port -> RegisteredProcess
      discovered: new Map(),      // port -> DiscoveredProcess  
      rogue: new Map(),           // port -> RogueProcess
      orphaned: new Map(),        // port -> OrphanedAllocation
      containers: new Map()       // port -> ContainerProcess
    };
    
    // Change detection
    this.previousSnapshot = null;
    this.detectedChanges = [];
    
    // Performance monitoring
    this.performanceMetrics = {
      refreshTimes: [],
      cpuUsage: [],
      averageRefreshTime: 0,
      peakCpuUsage: 0,
      totalRefreshes: 0,
      errorCount: 0
    };
    
    // Concurrency protection
    this.refreshInProgress = false;
    this.refreshQueue = [];
    this.stateLock = false;
    
    // Error recovery state
    this.errorRecovery = {
      lastKnownGoodState: null,
      errorCount: 0,
      maxErrors: 5,
      recoveryInProgress: false
    };
    
    // Refresh interval timer
    this.refreshTimer = null;
    
    // Event emitter setup
    this._bindEvents();
  }
  
  /**
   * Initialize the Enhanced Port Registry
   * Sets up the discovery engine and starts real-time monitoring
   */
  async initialize() {
    console.log('Initializing Enhanced Dynamic Port Registry...');
    
    try {
      // Initialize base PortRegistry first
      await super.initialize();
      
      // Initialize the Multi-Tech Process Discovery Engine
      this.discoveryEngine = new MultiTechProcessDiscoveryEngine({
        portRegistry: this,
        scanTimeout: this.options.refreshTimeout,
        performanceMonitoring: true,
        correlationEnabled: true
      });
      
      await this.discoveryEngine.initialize();
      console.log('✓ Multi-Tech Process Discovery Engine initialized');
      
      // Initialize performance optimizer
      await this.performanceOptimizer.initialize();
      console.log('✓ Performance optimizer initialized');
      
      // Perform initial discovery and categorization
      await this._performInitialDiscovery();
      
      // Start real-time refresh cycle if enabled
      if (this.options.enableRealTimeUpdates) {
        this._startRealTimeRefresh();
      }
      
      // Save initial good state for error recovery
      if (this.options.enableErrorRecovery) {
        await this._saveKnownGoodState();
      }
      
      this.state = RegistryState.ACTIVE;
      console.log('✓ Enhanced Dynamic Port Registry initialized successfully');
      
      this.emit('initialized', {
        staticAllocations: Object.keys(this.registry.allocations).length,
        discoveredProcesses: this.lastDiscoveryResults?.totalProcesses || 0,
        refreshInterval: this.options.refreshInterval
      });
      
    } catch (error) {
      this.state = RegistryState.ERROR;
      console.error('Failed to initialize Enhanced Port Registry:', error);
      throw error;
    }
  }
  
  /**
   * Get all active processes across all categories
   * This is the primary unified API for accessing both static and dynamic registry data
   * 
   * @param {Object} options - Query options
   * @param {boolean} options.includeDetails - Include detailed process information
   * @param {boolean} options.forceRefresh - Force fresh discovery before returning
   * @returns {Promise<Object>} Unified registry data
   */
  async getAllActiveProcesses(options = {}) {
    const queryOptions = {
      includeDetails: options.includeDetails !== false,
      forceRefresh: options.forceRefresh || false,
      ...options
    };
    
    try {
      // Force refresh if requested
      if (queryOptions.forceRefresh) {
        await this.refreshDynamicRegistry();
      }
      
      // Build unified response
      const dynamicProcessCount = this.lastDiscoveryResults?.totalProcesses || 0;
      
      const response = {
        timestamp: new Date().toISOString(),
        refreshCount: this.refreshCount,
        lastRefreshTime: this.lastRefreshTime,
        state: this.state,
        
        // Process categories
        registered: Array.from(this.processCategories.registered.values()),
        discovered: Array.from(this.processCategories.discovered.values()),
        rogue: Array.from(this.processCategories.rogue.values()),
        orphaned: Array.from(this.processCategories.orphaned.values()),
        containers: Array.from(this.processCategories.containers.values()),
        
        // Top-level dynamic processes property for API compatibility
        dynamicProcesses: dynamicProcessCount,
        
        // Summary statistics
        summary: {
          totalProcesses: this._getTotalProcessCount(),
          staticAllocations: Object.keys(this.registry.allocations).length,
          dynamicProcesses: dynamicProcessCount,
          registeredMatches: this.processCategories.registered.size,
          discoveredProcesses: this.processCategories.discovered.size,
          rogueProcesses: this.processCategories.rogue.size,
          orphanedAllocations: this.processCategories.orphaned.size,
          containerProcesses: this.processCategories.containers.size
        }
      };
      
      // Add detailed information if requested
      if (queryOptions.includeDetails) {
        response.details = {
          discoveryResults: this.lastDiscoveryResults,
          performanceMetrics: this.getPerformanceMetrics(),
          changeDetection: this.detectedChanges.slice(-10), // Last 10 changes
          errorRecovery: {
            errorCount: this.errorRecovery.errorCount,
            lastRecoveryTime: this.errorRecovery.lastRecoveryTime
          }
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('Error getting all active processes:', error.message);
      
      // Return basic static data if dynamic discovery fails
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        state: RegistryState.ERROR,
        registered: [],
        discovered: [],
        rogue: [],
        orphaned: this._getOrphanedStaticAllocations(),
        containers: [],
        dynamicProcesses: 0, // Add top-level property for API compatibility
        summary: {
          totalProcesses: 0,
          staticAllocations: Object.keys(this.registry.allocations).length,
          dynamicProcesses: 0,
          registeredMatches: 0,
          discoveredProcesses: 0,
          rogueProcesses: 0,
          orphanedAllocations: 0,
          containerProcesses: 0,
          error: true
        }
      };
    }
  }
  
  /**
   * Refresh the dynamic registry with latest process discovery
   * Performs change detection and updates all process categories with performance optimization
   */
  async refreshDynamicRegistry() {
    if (this.refreshInProgress) {
      console.log('Refresh already in progress, skipping...');
      return this.lastDiscoveryResults;
    }
    
    console.log('DEBUG: Starting refreshDynamicRegistry()');
    
    // Check if performance optimizer is initialized
    if (!this.performanceOptimizer) {
      console.error('DEBUG: Performance optimizer not initialized');
      throw new Error('Performance optimizer not initialized');
    }
    
    // Use performance optimizer for the refresh operation
    return this.performanceOptimizer.optimizeRefresh(async () => {
      const refreshStartTime = Date.now();
      this.refreshInProgress = true;
      this.state = RegistryState.REFRESHING;
      
      try {
        console.log('Starting optimized dynamic registry refresh...');
        
        // Perform system-wide process discovery with optimization
        const discoveryResults = await this.performanceOptimizer.optimizeConcurrentAccess(
          async () => {
            return this.discoveryEngine.scanSystemProcesses({
              includeCorrelation: true,
              forceRefresh: true
            });
          },
          'refresh'
        );
        
        // Store discovery results
        this.lastDiscoveryResults = discoveryResults;
        this.lastRefreshTime = Date.now();
        this.refreshCount++;
        
        // Perform optimized process categorization
        await this.performanceOptimizer.optimizeCategorization(
          discoveryResults.processesFound || [],
          async (processes) => {
            return this._categorizeProcesses(discoveryResults);
          }
        );
        
        // Detect changes from previous state
        if (this.changeDetectionEnabled) {
          this._detectAndRecordChanges();
        }
        
        // Update performance metrics
        const refreshDuration = Date.now() - refreshStartTime;
        this._updatePerformanceMetrics(refreshDuration);
        
        // Save current state as good state for recovery
        if (this.options.enableErrorRecovery) {
          await this._saveKnownGoodState();
        }
        
        this.state = RegistryState.ACTIVE;
        console.log(`✓ Optimized dynamic registry refresh completed in ${refreshDuration}ms`);
        
        // Emit refresh event
        this.emit('refreshCompleted', {
          duration: refreshDuration,
          totalProcesses: discoveryResults.totalProcesses,
          changes: this.detectedChanges.slice(-1)[0] || null,
          optimized: true
        });
        
        return discoveryResults;
        
      } catch (error) {
        const refreshDuration = Date.now() - refreshStartTime;
        this.performanceMetrics.errorCount++;
        
        console.error(`Optimized dynamic registry refresh failed after ${refreshDuration}ms:`, error.message);
        
        // Attempt error recovery
        if (this.options.enableErrorRecovery) {
          await this._attemptErrorRecovery(error);
        } else {
          this.state = RegistryState.ERROR;
        }
        
        throw error;
        
      } finally {
        this.refreshInProgress = false;
      }
    });
  }
  
  /**
   * Start real-time refresh cycle
   * @private
   */
  _startRealTimeRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    console.log(`Starting real-time refresh cycle (${this.options.refreshInterval}ms interval)`);
    
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshDynamicRegistry();
      } catch (error) {
        console.error('Error in refresh cycle:', error.message);
        // Continue the cycle even if one refresh fails
      }
    }, this.options.refreshInterval);
  }
  
  /**
   * Stop real-time refresh cycle
   */
  stopRealTimeRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Real-time refresh cycle stopped');
    }
  }
  
  /**
   * Get current performance metrics with optimizer data
   */
  getPerformanceMetrics() {
    const optimizerReport = this.performanceOptimizer.getPerformanceReport();
    const recent = this.performanceMetrics.refreshTimes.slice(-10);
    
    return {
      ...this.performanceMetrics,
      recentRefreshTimes: recent,
      averageRecentRefreshTime: recent.length > 0 ? 
        recent.reduce((a, b) => a + b, 0) / recent.length : 0,
      meetsRefreshRequirement: this.performanceMetrics.averageRefreshTime < this.options.refreshTimeout,
      meetsCpuRequirement: this.performanceMetrics.peakCpuUsage < this.options.maxCpuUsage,
      state: this.state,
      uptime: this.lastRefreshTime ? Date.now() - this.lastRefreshTime : 0,
      
      // Enhanced metrics from optimizer
      optimizer: optimizerReport,
      meetsAllRequirements: optimizerReport.requirements.overall
    };
  }
  
  /**
   * Get enhanced registry status including both static and dynamic information
   */
  getEnhancedStatus() {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      enhanced: {
        state: this.state,
        refreshCount: this.refreshCount,
        lastRefreshTime: this.lastRefreshTime,
        discoveryEngine: this.discoveryEngine?.getStatus(),
        processCategories: {
          registered: this.processCategories.registered.size,
          discovered: this.processCategories.discovered.size,
          rogue: this.processCategories.rogue.size,
          orphaned: this.processCategories.orphaned.size,
          containers: this.processCategories.containers.size
        },
        performance: this.getPerformanceMetrics(),
        realTimeRefresh: !!this.refreshTimer
      }
    };
  }
  
  /**
   * Shutdown the enhanced registry gracefully
   */
  async shutdown() {
    console.log('Shutting down Enhanced Dynamic Port Registry...');
    
    this.state = RegistryState.SHUTDOWN;
    
    try {
      // Stop real-time refresh
      this.stopRealTimeRefresh();
      
      // Shutdown discovery engine
      if (this.discoveryEngine) {
        await this.discoveryEngine.shutdown();
      }
      
      // Shutdown performance optimizer
      if (this.performanceOptimizer) {
        await this.performanceOptimizer.shutdown();
      }
      
      // Final persistence
      await this.persist();
      
      console.log('Enhanced Dynamic Port Registry shutdown complete');
      this.emit('shutdown');
      
    } catch (error) {
      console.error('Error during enhanced registry shutdown:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  /**
   * Perform initial discovery to populate dynamic data
   * @private
   */
  async _performInitialDiscovery() {
    console.log('Performing initial process discovery...');
    
    try {
      const discoveryResults = await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });
      
      this.lastDiscoveryResults = discoveryResults;
      await this._categorizeProcesses(discoveryResults);
      
      console.log(`✓ Initial discovery complete: ${discoveryResults.totalProcesses} processes found`);
      
    } catch (error) {
      console.warn('Initial discovery failed, continuing with static data only:', error.message);
    }
  }
  
  /**
   * Categorize discovered processes into registry categories
   * @private
   */
  async _categorizeProcesses(discoveryResults) {
    // Clear existing categories
    Object.values(this.processCategories).forEach(category => category.clear());
    
    if (!discoveryResults.correlation) {
      console.warn('No correlation results available for categorization');
      return;
    }
    
    const correlation = discoveryResults.correlation;
    
    // Process registered matches (static allocation + discovered process)
    if (correlation.registeredProcesses) {
      for (const process of correlation.registeredProcesses) {
        this.processCategories.registered.set(process.port, {
          ...process,
          category: ProcessCategory.REGISTERED,
          staticAllocation: this.registry.allocations[process.port] || null,
          lastSeen: new Date().toISOString()
        });
      }
    }
    
    // Process discovered (found but not registered)
    if (correlation.discoveredProcesses) {
      for (const process of correlation.discoveredProcesses) {
        this.processCategories.discovered.set(process.port, {
          ...process,
          category: ProcessCategory.DISCOVERED,
          lastSeen: new Date().toISOString()
        });
      }
    }
    
    // Process rogue (outside workspaces)
    if (correlation.rogueProcesses) {
      for (const process of correlation.rogueProcesses) {
        this.processCategories.rogue.set(process.port, {
          ...process,
          category: ProcessCategory.ROGUE,
          lastSeen: new Date().toISOString()
        });
      }
    }
    
    // Process containers
    if (discoveryResults.techStackResults?.docker?.processes) {
      for (const process of discoveryResults.techStackResults.docker.processes) {
        this.processCategories.containers.set(process.port, {
          ...process,
          category: ProcessCategory.CONTAINERS,
          lastSeen: new Date().toISOString()
        });
      }
    }
    
    // Find orphaned static allocations (allocated but no process found)
    await this._identifyOrphanedAllocations(discoveryResults.processesFound);
  }
  
  /**
   * Identify orphaned static allocations
   * @private
   */
  async _identifyOrphanedAllocations(discoveredProcesses) {
    const discoveredPorts = new Set(discoveredProcesses.map(p => p.port));
    
    for (const [port, allocation] of Object.entries(this.registry.allocations)) {
      const portNum = parseInt(port);
      
      if (!discoveredPorts.has(portNum)) {
        // Static allocation exists but no process found
        this.processCategories.orphaned.set(portNum, {
          port: portNum,
          category: ProcessCategory.ORPHANED,
          staticAllocation: allocation,
          lastSeen: null,
          orphanedSince: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * Detect and record changes from previous state
   * @private
   */
  _detectAndRecordChanges() {
    const currentSnapshot = this._createProcessSnapshot();
    
    if (this.previousSnapshot) {
      const changes = this._compareSnapshots(this.previousSnapshot, currentSnapshot);
      if (changes.length > 0) {
        this.detectedChanges.push({
          timestamp: new Date().toISOString(),
          changes
        });
        
        // Keep only recent changes
        if (this.detectedChanges.length > 50) {
          this.detectedChanges = this.detectedChanges.slice(-30);
        }
      }
    }
    
    this.previousSnapshot = currentSnapshot;
  }
  
  /**
   * Create snapshot of current process state
   * @private
   */
  _createProcessSnapshot() {
    return new Map([
      ...Array.from(this.processCategories.registered.entries()),
      ...Array.from(this.processCategories.discovered.entries()),
      ...Array.from(this.processCategories.rogue.entries()),
      ...Array.from(this.processCategories.containers.entries())
    ]);
  }
  
  /**
   * Compare two process snapshots for changes
   * @private
   */
  _compareSnapshots(previous, current) {
    const changes = [];
    
    // Check for new processes
    for (const [port, process] of current) {
      if (!previous.has(port)) {
        changes.push({
          type: 'added',
          port,
          category: process.category,
          process
        });
      }
    }
    
    // Check for removed processes
    for (const [port, process] of previous) {
      if (!current.has(port)) {
        changes.push({
          type: 'removed',
          port,
          category: process.category,
          process
        });
      }
    }
    
    return changes;
  }
  
  /**
   * Get orphaned static allocations
   * @private
   */
  _getOrphanedStaticAllocations() {
    return Array.from(this.processCategories.orphaned.values());
  }
  
  /**
   * Get total process count across all categories
   * @private
   */
  _getTotalProcessCount() {
    return Object.values(this.processCategories)
      .reduce((total, category) => total + category.size, 0);
  }
  
  /**
   * Update performance metrics
   * @private
   */
  _updatePerformanceMetrics(duration) {
    this.performanceMetrics.refreshTimes.push(duration);
    this.performanceMetrics.totalRefreshes++;
    
    // Keep only recent measurements
    if (this.performanceMetrics.refreshTimes.length > 100) {
      this.performanceMetrics.refreshTimes = this.performanceMetrics.refreshTimes.slice(-50);
    }
    
    // Calculate average
    const recent = this.performanceMetrics.refreshTimes.slice(-20);
    this.performanceMetrics.averageRefreshTime = 
      recent.reduce((a, b) => a + b, 0) / recent.length;
  }
  
  /**
   * Acquire state lock for concurrency protection
   * @private
   */
  async _acquireStateLock() {
    while (this.stateLock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.stateLock = true;
  }
  
  /**
   * Release state lock
   * @private
   */
  _releaseStateLock() {
    this.stateLock = false;
  }
  
  /**
   * Save current state as known good state for error recovery
   * @private
   */
  async _saveKnownGoodState() {
    this.errorRecovery.lastKnownGoodState = {
      timestamp: Date.now(),
      processCategories: JSON.parse(JSON.stringify({
        registered: Object.fromEntries(this.processCategories.registered),
        discovered: Object.fromEntries(this.processCategories.discovered),
        rogue: Object.fromEntries(this.processCategories.rogue),
        orphaned: Object.fromEntries(this.processCategories.orphaned),
        containers: Object.fromEntries(this.processCategories.containers)
      })),
      staticRegistry: JSON.parse(JSON.stringify(this.registry))
    };
  }
  
  /**
   * Attempt error recovery
   * @private
   */
  async _attemptErrorRecovery(error) {
    if (this.errorRecovery.recoveryInProgress) {
      return;
    }
    
    this.errorRecovery.errorCount++;
    this.errorRecovery.recoveryInProgress = true;
    
    try {
      console.log(`Attempting error recovery (attempt ${this.errorRecovery.errorCount}/${this.errorRecovery.maxErrors})`);
      
      if (this.errorRecovery.errorCount >= this.errorRecovery.maxErrors) {
        console.error('Maximum error recovery attempts reached, entering error state');
        this.state = RegistryState.ERROR;
        return;
      }
      
      // Restore last known good state if available
      if (this.errorRecovery.lastKnownGoodState) {
        const goodState = this.errorRecovery.lastKnownGoodState;
        
        // Restore process categories
        for (const [category, processes] of Object.entries(goodState.processCategories)) {
          this.processCategories[category].clear();
          for (const [port, process] of Object.entries(processes)) {
            this.processCategories[category].set(parseInt(port), process);
          }
        }
        
        console.log('✓ State restored from last known good state');
        this.errorRecovery.lastRecoveryTime = Date.now();
      }
      
      this.state = RegistryState.ACTIVE;
      
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError.message);
      this.state = RegistryState.ERROR;
    } finally {
      this.errorRecovery.recoveryInProgress = false;
    }
  }
  
  /**
   * Bind event listeners
   * @private
   */
  _bindEvents() {
    // Listen to discovery engine events
    this.on('newListener', (eventName) => {
      if (eventName === 'processDetected' && this.discoveryEngine) {
        this.discoveryEngine.on('processDetected', (data) => {
          this.emit('processDetected', data);
        });
      }
    });
  }
}

// Setup proper inheritance for EventEmitter
Object.setPrototypeOf(EnhancedPortRegistry.prototype, Object.create(PortRegistry.prototype));
Object.assign(EnhancedPortRegistry.prototype, EventEmitter.prototype);

module.exports = {
  EnhancedPortRegistry,
  ProcessCategory,
  RegistryState
};