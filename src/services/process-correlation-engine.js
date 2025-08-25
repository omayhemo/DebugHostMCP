/**
 * Process Correlation Engine
 * 
 * Correlates discovered processes with workspaces, registered projects, and identifies
 * rogue or orphaned processes. This is a critical component for agent safety and
 * intelligent process management.
 */

const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

/**
 * Correlation Status Constants
 */
const CorrelationStatus = {
  REGISTERED: 'registered',     // Process matches a registered project in port registry
  DISCOVERED: 'discovered',     // Process found and correlated with workspace
  ROGUE: 'rogue',              // Process running outside known workspaces
  ORPHANED: 'orphaned',        // Process from workspace that no longer exists
  UNKNOWN: 'unknown'           // Process could not be correlated
};

/**
 * Correlation Confidence Levels
 */
const ConfidenceLevel = {
  HIGH: 0.9,        // Strong correlation (exact match)
  MEDIUM: 0.7,      // Good correlation (likely match)
  LOW: 0.4,         // Weak correlation (possible match)
  VERY_LOW: 0.2     // Minimal correlation (uncertain)
};

/**
 * Process Correlation Engine
 * Analyzes discovered processes to determine their relationship with workspaces and projects
 */
class ProcessCorrelationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      workspaceTimeout: options.workspaceTimeout || 5000,
      correlationTimeout: options.correlationTimeout || 3000,
      enableCaching: options.enableCaching !== false,
      cacheTimeout: options.cacheTimeout || 30000,
      ...options
    };
    
    // External dependencies
    this.portRegistry = options.portRegistry;
    this.workspaceScanner = options.workspaceScanner;
    
    // Internal state
    this.initialized = false;
    this.correlationCache = new Map();
    this.workspaceCache = new Map();
    
    // Statistics
    this.stats = {
      totalCorrelations: 0,
      registeredMatches: 0,
      discoveredMatches: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      averageCorrelationTime: 0
    };
  }
  
  /**
   * Initialize the correlation engine
   */
  async initialize() {
    console.log('Initializing Process Correlation Engine...');
    
    try {
      // Validate required dependencies
      if (!this.portRegistry) {
        console.warn('No port registry provided - registered process correlation will be limited');
      }
      
      if (!this.workspaceScanner) {
        console.warn('No workspace scanner provided - workspace correlation will be limited');
      }
      
      // Initialize workspace detection capabilities
      await this._initializeWorkspaceDetection();
      
      this.initialized = true;
      console.log('✓ Process Correlation Engine initialized');
      
    } catch (error) {
      console.error('Failed to initialize Process Correlation Engine:', error);
      throw error;
    }
  }
  
  /**
   * Correlate a list of processes with workspaces and registrations
   * @param {Object[]} processes - Array of discovered processes
   * @returns {Promise<Object>} Correlation results
   */
  async correlateProcesses(processes) {
    if (!processes || processes.length === 0) {
      return {
        totalProcesses: 0,
        registeredProcesses: [],
        discoveredProcesses: [],
        rogueProcesses: [],
        orphanedProcesses: [],
        correlationTime: 0,
        statistics: { ...this.stats }
      };
    }
    
    const startTime = Date.now();
    console.log(`Correlating ${processes.length} processes...`);
    
    try {
      // Process correlation in parallel for performance
      const correlationPromises = processes.map(process => 
        this._correlateProcess(process).catch(error => {
          console.warn(`Failed to correlate process ${process.pid}:`, error.message);
          return {
            ...process,
            correlationStatus: CorrelationStatus.UNKNOWN,
            confidence: 0,
            correlationError: error.message
          };
        })
      );
      
      const correlatedProcesses = await Promise.all(correlationPromises);
      
      // Categorize processes by correlation status
      const results = this._categorizeProcesses(correlatedProcesses);
      
      const duration = Date.now() - startTime;
      this._updateStats(correlatedProcesses, duration);
      
      console.log(`✓ Process correlation completed in ${duration}ms`);
      
      // Emit correlation completion event
      this.emit('correlationCompleted', results);
      
      return {
        ...results,
        correlationTime: duration,
        statistics: { ...this.stats }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Process correlation failed after ${duration}ms:`, error.message);
      throw error;
    }
  }
  
  /**
   * Find registered processes that match discoveries
   * @param {Object[]} processes - Discovered processes
   * @returns {Promise<Object[]>} Matching registered processes
   */
  async findRegisteredMatches(processes) {
    if (!this.portRegistry) {
      return [];
    }
    
    const matches = [];
    const allocations = this.portRegistry.getAllocations();
    
    for (const process of processes) {
      if (process.port && allocations[process.port]) {
        const allocation = allocations[process.port];
        matches.push({
          ...process,
          correlationStatus: CorrelationStatus.REGISTERED,
          confidence: ConfidenceLevel.HIGH,
          registration: allocation,
          projectId: allocation.projectId,
          projectName: allocation.projectName
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Identify rogue processes (running outside known workspaces)
   * @param {Object[]} processes - Discovered processes
   * @returns {Promise<Object[]>} Rogue processes
   */
  async identifyRogueProcesses(processes) {
    const rogueProcesses = [];
    
    // Get known workspaces
    const knownWorkspaces = await this._getKnownWorkspaces();
    
    for (const process of processes) {
      if (process.correlationStatus === CorrelationStatus.DISCOVERED) {
        continue; // Already correlated with workspace
      }
      
      if (process.correlationStatus === CorrelationStatus.REGISTERED) {
        continue; // Already registered
      }
      
      // Check if process is in any known workspace
      const inKnownWorkspace = await this._isProcessInKnownWorkspaces(process, knownWorkspaces);
      
      if (!inKnownWorkspace) {
        rogueProcesses.push({
          ...process,
          correlationStatus: CorrelationStatus.ROGUE,
          confidence: ConfidenceLevel.HIGH,
          rogueReason: 'Process running outside known workspaces'
        });
      }
    }
    
    return rogueProcesses;
  }
  
  /**
   * Correlate process with workspace information
   * @param {Object} process - Process to correlate
   * @param {string[]} workspacePaths - Known workspace paths
   * @returns {Promise<Object>} Enhanced process with correlation info
   */
  async correlateWithWorkspace(process, workspacePaths = []) {
    // Check cache first
    const cacheKey = `workspace_${process.pid}_${process.port}`;
    if (this.options.enableCaching && this.correlationCache.has(cacheKey)) {
      const cached = this.correlationCache.get(cacheKey);
      if ((Date.now() - cached.timestamp) < this.options.cacheTimeout) {
        return cached.result;
      }
    }
    
    const result = await this._performWorkspaceCorrelation(process, workspacePaths);
    
    // Cache result
    if (this.options.enableCaching) {
      this.correlationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Get correlation statistics
   * @returns {Object} Current correlation statistics
   */
  getStatistics() {
    return { ...this.stats };
  }
  
  /**
   * Clear correlation cache
   */
  clearCache() {
    this.correlationCache.clear();
    this.workspaceCache.clear();
    console.log('Correlation cache cleared');
  }
  
  /**
   * Shutdown the correlation engine
   */
  async shutdown() {
    console.log('Shutting down Process Correlation Engine...');
    
    this.clearCache();
    this.initialized = false;
    
    this.emit('shutdown');
    console.log('Process Correlation Engine shutdown complete');
  }
  
  // Private implementation methods
  
  /**
   * Correlate a single process
   * @private
   */
  async _correlateProcess(process) {
    // Step 1: Check for registered process match
    if (this.portRegistry && process.port) {
      const allocation = this.portRegistry.getPortAllocation(process.port);
      if (allocation) {
        return {
          ...process,
          correlationStatus: CorrelationStatus.REGISTERED,
          confidence: ConfidenceLevel.HIGH,
          projectId: allocation.projectId,
          projectName: allocation.projectName,
          registration: allocation
        };
      }
    }
    
    // Step 2: Attempt workspace correlation
    const workspaceCorrelation = await this._performWorkspaceCorrelation(process);
    
    if (workspaceCorrelation.correlationStatus !== CorrelationStatus.UNKNOWN) {
      return workspaceCorrelation;
    }
    
    // Step 3: Check if process is rogue
    const knownWorkspaces = await this._getKnownWorkspaces();
    const inKnownWorkspace = await this._isProcessInKnownWorkspaces(process, knownWorkspaces);
    
    if (!inKnownWorkspace && process.workspacePath) {
      // Process has workspace path but it's not in known workspaces
      const workspaceExists = await this._workspaceExists(process.workspacePath);
      if (!workspaceExists) {
        return {
          ...process,
          correlationStatus: CorrelationStatus.ORPHANED,
          confidence: ConfidenceLevel.HIGH,
          orphanReason: 'Workspace directory no longer exists'
        };
      } else {
        return {
          ...process,
          correlationStatus: CorrelationStatus.ROGUE,
          confidence: ConfidenceLevel.MEDIUM,
          rogueReason: 'Process in unknown workspace'
        };
      }
    }
    
    return {
      ...process,
      correlationStatus: CorrelationStatus.UNKNOWN,
      confidence: ConfidenceLevel.VERY_LOW
    };
  }
  
  /**
   * Perform workspace correlation for a process
   * @private
   */
  async _performWorkspaceCorrelation(process, workspacePaths = []) {
    try {
      // If process already has workspace path, validate it
      if (process.workspacePath) {
        const workspaceInfo = await this._analyzeWorkspace(process.workspacePath);
        
        if (workspaceInfo.exists) {
          return {
            ...process,
            correlationStatus: CorrelationStatus.DISCOVERED,
            confidence: ConfidenceLevel.HIGH,
            workspaceInfo,
            correlationMethod: 'process_working_directory'
          };
        } else {
          return {
            ...process,
            correlationStatus: CorrelationStatus.ORPHANED,
            confidence: ConfidenceLevel.HIGH,
            orphanReason: 'Process workspace directory not found'
          };
        }
      }
      
      // Try to correlate with provided workspace paths
      if (workspacePaths.length > 0) {
        for (const workspacePath of workspacePaths) {
          const correlation = await this._correlateProcessWithWorkspace(process, workspacePath);
          if (correlation.confidence >= ConfidenceLevel.MEDIUM) {
            return correlation;
          }
        }
      }
      
      // Try to correlate with known workspaces from workspace scanner
      if (this.workspaceScanner) {
        const knownWorkspaces = await this._getKnownWorkspaces();
        for (const workspace of knownWorkspaces) {
          const correlation = await this._correlateProcessWithWorkspace(process, workspace.path);
          if (correlation.confidence >= ConfidenceLevel.MEDIUM) {
            return correlation;
          }
        }
      }
      
      return {
        ...process,
        correlationStatus: CorrelationStatus.UNKNOWN,
        confidence: ConfidenceLevel.VERY_LOW
      };
      
    } catch (error) {
      console.warn(`Workspace correlation failed for process ${process.pid}:`, error.message);
      return {
        ...process,
        correlationStatus: CorrelationStatus.UNKNOWN,
        confidence: ConfidenceLevel.VERY_LOW,
        correlationError: error.message
      };
    }
  }
  
  /**
   * Correlate process with specific workspace
   * @private
   */
  async _correlateProcessWithWorkspace(process, workspacePath) {
    const workspaceInfo = await this._analyzeWorkspace(workspacePath);
    
    if (!workspaceInfo.exists) {
      return {
        ...process,
        correlationStatus: CorrelationStatus.UNKNOWN,
        confidence: ConfidenceLevel.VERY_LOW
      };
    }
    
    let confidence = ConfidenceLevel.VERY_LOW;
    const correlationFactors = [];
    
    // Factor 1: Technology stack match
    if (workspaceInfo.techStack === process.techStack) {
      confidence += 0.3;
      correlationFactors.push('tech_stack_match');
    }
    
    // Factor 2: Port in expected range for workspace type
    if (process.port && this._isPortInExpectedRange(process.port, workspaceInfo.techStack)) {
      confidence += 0.2;
      correlationFactors.push('port_range_match');
    }
    
    // Factor 3: Framework match
    if (process.framework && workspaceInfo.framework === process.framework) {
      confidence += 0.3;
      correlationFactors.push('framework_match');
    }
    
    // Factor 4: Recently modified workspace (active development)
    if (workspaceInfo.recentlyModified) {
      confidence += 0.1;
      correlationFactors.push('recent_activity');
    }
    
    // Factor 5: Package.json script match
    if (workspaceInfo.hasDevScript) {
      confidence += 0.1;
      correlationFactors.push('dev_script_present');
    }
    
    // Normalize confidence
    confidence = Math.min(confidence, 1.0);
    
    return {
      ...process,
      correlationStatus: confidence >= ConfidenceLevel.MEDIUM ? CorrelationStatus.DISCOVERED : CorrelationStatus.UNKNOWN,
      confidence,
      workspacePath,
      workspaceInfo,
      correlationFactors,
      correlationMethod: 'workspace_analysis'
    };
  }
  
  /**
   * Analyze workspace for correlation factors
   * @private
   */
  async _analyzeWorkspace(workspacePath) {
    // Check cache
    if (this.options.enableCaching && this.workspaceCache.has(workspacePath)) {
      const cached = this.workspaceCache.get(workspacePath);
      if ((Date.now() - cached.timestamp) < this.options.cacheTimeout) {
        return cached.result;
      }
    }
    
    const analysis = {
      path: workspacePath,
      exists: false,
      techStack: null,
      framework: null,
      hasDevScript: false,
      recentlyModified: false,
      packageJson: null
    };
    
    try {
      // Check if workspace exists
      const stats = await fs.stat(workspacePath);
      analysis.exists = stats.isDirectory();
      
      if (!analysis.exists) {
        return analysis;
      }
      
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(workspacePath, 'package.json');
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
        analysis.packageJson = JSON.parse(packageJsonContent);
        analysis.techStack = 'nodejs';
        
        // Detect framework from dependencies
        const deps = { ...analysis.packageJson.dependencies, ...analysis.packageJson.devDependencies };
        if (deps.vite) analysis.framework = 'vite';
        else if (deps.next) analysis.framework = 'nextjs';
        else if (deps['react-scripts']) analysis.framework = 'react';
        else if (deps['@vue/cli-service']) analysis.framework = 'vue';
        
        // Check for dev scripts
        analysis.hasDevScript = Boolean(
          analysis.packageJson.scripts?.dev ||
          analysis.packageJson.scripts?.start ||
          analysis.packageJson.scripts?.develop
        );
        
        // Check recent modification
        const packageStats = await fs.stat(packageJsonPath);
        analysis.recentlyModified = (Date.now() - packageStats.mtime.getTime()) < (24 * 60 * 60 * 1000); // 24 hours
        
      } catch (error) {
        // No package.json or invalid JSON
      }
      
      // Check for other tech stacks
      if (!analysis.techStack) {
        // Check for PHP
        const phpFiles = ['index.php', 'composer.json'];
        for (const file of phpFiles) {
          try {
            await fs.access(path.join(workspacePath, file));
            analysis.techStack = 'php';
            break;
          } catch (error) {
            // File doesn't exist
          }
        }
      }
      
      if (!analysis.techStack) {
        // Check for Python
        const pythonFiles = ['requirements.txt', 'setup.py', 'manage.py', 'app.py'];
        for (const file of pythonFiles) {
          try {
            await fs.access(path.join(workspacePath, file));
            analysis.techStack = 'python';
            break;
          } catch (error) {
            // File doesn't exist
          }
        }
      }
      
      if (!analysis.techStack) {
        // Check for static site
        const staticFiles = ['index.html', 'main.html'];
        for (const file of staticFiles) {
          try {
            await fs.access(path.join(workspacePath, file));
            analysis.techStack = 'static';
            break;
          } catch (error) {
            // File doesn't exist
          }
        }
      }
      
    } catch (error) {
      console.warn(`Error analyzing workspace ${workspacePath}:`, error.message);
    }
    
    // Cache result
    if (this.options.enableCaching) {
      this.workspaceCache.set(workspacePath, {
        result: analysis,
        timestamp: Date.now()
      });
    }
    
    return analysis;
  }
  
  /**
   * Categorize processes by correlation status
   * @private
   */
  _categorizeProcesses(processes) {
    const categories = {
      totalProcesses: processes.length,
      registeredProcesses: [],
      discoveredProcesses: [],
      rogueProcesses: [],
      orphanedProcesses: [],
      unknownProcesses: []
    };
    
    for (const process of processes) {
      switch (process.correlationStatus) {
        case CorrelationStatus.REGISTERED:
          categories.registeredProcesses.push(process);
          break;
        case CorrelationStatus.DISCOVERED:
          categories.discoveredProcesses.push(process);
          break;
        case CorrelationStatus.ROGUE:
          categories.rogueProcesses.push(process);
          break;
        case CorrelationStatus.ORPHANED:
          categories.orphanedProcesses.push(process);
          break;
        default:
          categories.unknownProcesses.push(process);
      }
    }
    
    return categories;
  }
  
  /**
   * Get known workspaces from workspace scanner
   * @private
   */
  async _getKnownWorkspaces() {
    if (!this.workspaceScanner) {
      return [];
    }
    
    try {
      // This would integrate with the workspace scanner service
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.warn('Error getting known workspaces:', error.message);
      return [];
    }
  }
  
  /**
   * Check if process is in known workspaces
   * @private
   */
  async _isProcessInKnownWorkspaces(process, knownWorkspaces) {
    if (!process.workspacePath) {
      return false;
    }
    
    return knownWorkspaces.some(workspace => 
      process.workspacePath.startsWith(workspace.path)
    );
  }
  
  /**
   * Check if workspace directory exists
   * @private
   */
  async _workspaceExists(workspacePath) {
    try {
      const stats = await fs.stat(workspacePath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if port is in expected range for tech stack
   * @private
   */
  _isPortInExpectedRange(port, techStack) {
    const ranges = {
      nodejs: { start: 3000, end: 3999 },
      php: { start: 8080, end: 8980 },
      python: { start: 5000, end: 5999 },
      static: { start: 4000, end: 4999 }
    };
    
    const range = ranges[techStack];
    if (!range) return false;
    
    return port >= range.start && port <= range.end;
  }
  
  /**
   * Initialize workspace detection capabilities
   * @private
   */
  async _initializeWorkspaceDetection() {
    // Initialize any workspace detection utilities
    console.log('Workspace detection capabilities initialized');
  }
  
  /**
   * Update correlation statistics
   * @private
   */
  _updateStats(processes, duration) {
    this.stats.totalCorrelations += processes.length;
    
    processes.forEach(process => {
      switch (process.correlationStatus) {
        case CorrelationStatus.REGISTERED:
          this.stats.registeredMatches++;
          break;
        case CorrelationStatus.DISCOVERED:
          this.stats.discoveredMatches++;
          break;
        case CorrelationStatus.ROGUE:
          this.stats.rogueProcesses++;
          break;
        case CorrelationStatus.ORPHANED:
          this.stats.orphanedProcesses++;
          break;
      }
    });
    
    // Update average correlation time
    const totalCorrelations = this.stats.totalCorrelations;
    if (totalCorrelations > 0) {
      this.stats.averageCorrelationTime = 
        ((this.stats.averageCorrelationTime * (totalCorrelations - processes.length)) + duration) / 
        totalCorrelations;
    }
  }
}

module.exports = {
  ProcessCorrelationEngine,
  CorrelationStatus,
  ConfidenceLevel
};