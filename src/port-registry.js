const path = require('path');
const AtomicFile = require('./utils/atomic-file');
const PortChecker = require('./utils/port-checker');

/**
 * Port Registry System for MCP Debug Host
 * Manages port allocation, conflict detection, and persistence
 */
class PortRegistry {
  constructor(dataPath = null) {
    // Use data directory in project root
    this.dataPath = dataPath || path.join(__dirname, '../data/system/ports.json');
    
    // Port range definitions
    this.PORT_RANGES = {
      system:  { start: 2601, end: 2699 },
      node:    { start: 3000, end: 3999 },
      static:  { start: 4000, end: 4999 },
      python:  { start: 5000, end: 5999 },
      php:     { start: 8080, end: 8980 }
    };
    
    // In-memory registry cache
    this.registry = {
      allocations: {},
      history: []
    };
    
    // Maximum history entries
    this.MAX_HISTORY = 100;
  }

  /**
   * Initialize the port registry
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.registry = await AtomicFile.readJSON(this.dataPath);
      
      // Ensure registry has correct structure
      if (!this.registry.allocations) {
        this.registry.allocations = {};
      }
      if (!this.registry.history) {
        this.registry.history = [];
      }
      
      console.log(`Port registry initialized with ${Object.keys(this.registry.allocations).length} allocated ports`);
    } catch (error) {
      console.error('Error initializing port registry:', error);
      // Start with empty registry if initialization fails
      this.registry = {
        allocations: {},
        history: []
      };
    }
  }

  /**
   * Generate a unique project ID
   * @returns {string} Project ID in format: proj_{timestamp}{random}
   */
  generateProjectId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `proj_${timestamp}${random}`;
  }

  /**
   * Get port range for project type
   * @param {string} projectType - Project type (node, python, php, static)
   * @returns {Object} Port range object with start and end
   */
  getPortRange(projectType) {
    const range = this.PORT_RANGES[projectType.toLowerCase()];
    if (!range) {
      throw new Error(`Unknown project type: ${projectType}`);
    }
    return range;
  }

  /**
   * Check if a port is in system reserved range
   * @param {number} port - Port number to check
   * @returns {boolean} True if port is system reserved
   */
  isSystemPort(port) {
    return port >= this.PORT_RANGES.system.start && port <= this.PORT_RANGES.system.end;
  }

  /**
   * Allocate a specific port
   * @param {number} port - Requested port number
   * @param {string} projectType - Project type
   * @param {string} projectName - Project name
   * @param {string} projectId - Optional project ID (generates if not provided)
   * @returns {Promise<Object>} Allocation result
   */
  async allocatePort(port, projectType, projectName, projectId = null) {
    // Validate port number
    if (!PortChecker.isValidPort(port)) {
      return {
        success: false,
        error: 'INVALID_PORT',
        message: `Invalid port number: ${port}. Must be between 1 and 65535.`
      };
    }

    // Check if system port
    if (this.isSystemPort(port)) {
      return {
        success: false,
        error: 'SYSTEM_RESERVED',
        message: `Port ${port} is reserved for system use (2601-2699)`
      };
    }

    // Check if port is in valid range for project type
    try {
      const range = this.getPortRange(projectType);
      if (port < range.start || port > range.end) {
        return {
          success: false,
          error: 'PORT_OUT_OF_RANGE',
          message: `Port ${port} is outside valid range for ${projectType} projects (${range.start}-${range.end})`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_PROJECT_TYPE',
        message: error.message
      };
    }

    // Check if port is already allocated
    if (this.registry.allocations[port]) {
      const conflict = this.registry.allocations[port];
      const suggestions = await this.getSuggestions(projectType, 3);
      
      return {
        success: false,
        error: 'PORT_IN_USE',
        message: `Port ${port} is already used by project "${conflict.projectName}"`,
        details: {
          conflictingProject: conflict.projectId,
          conflictingService: conflict.projectName,
          startedAt: conflict.allocatedAt
        },
        suggestions
      };
    }

    // Check if port is available on system
    const available = await PortChecker.isPortAvailable(port);
    if (!available) {
      const suggestions = await this.getSuggestions(projectType, 3);
      
      return {
        success: false,
        error: 'PORT_IN_USE_EXTERNAL',
        message: `Port ${port} is in use by an external process`,
        suggestions
      };
    }

    // Allocate the port
    const finalProjectId = projectId || this.generateProjectId();
    const allocation = {
      projectId: finalProjectId,
      projectName,
      type: projectType,
      allocatedAt: new Date().toISOString()
    };

    this.registry.allocations[port] = allocation;
    this.addToHistory('allocate', port, finalProjectId);
    
    await this.persist();

    return {
      success: true,
      port,
      projectId: finalProjectId,
      allocation
    };
  }

  /**
   * Auto-allocate next available port for project type
   * @param {string} projectType - Project type
   * @param {string} projectName - Project name
   * @param {string} projectId - Optional project ID
   * @returns {Promise<Object>} Allocation result
   */
  async autoAllocatePort(projectType, projectName, projectId = null) {
    try {
      const range = this.getPortRange(projectType);
      
      // Find next available port in range
      for (let port = range.start; port <= range.end; port++) {
        // Skip if already allocated
        if (this.registry.allocations[port]) {
          continue;
        }
        
        // Check if port is available on system
        const available = await PortChecker.isPortAvailable(port);
        if (available) {
          // Allocate this port
          return await this.allocatePort(port, projectType, projectName, projectId);
        }
      }
      
      // No available ports found
      return {
        success: false,
        error: 'NO_AVAILABLE_PORTS',
        message: `No available ports in range ${range.start}-${range.end} for ${projectType} projects`
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_PROJECT_TYPE',
        message: error.message
      };
    }
  }

  /**
   * Release a port allocation
   * @param {number} port - Port number to release
   * @param {string} projectId - Project ID (optional, for verification)
   * @returns {Promise<Object>} Release result
   */
  async releasePort(port, projectId = null) {
    const allocation = this.registry.allocations[port];
    
    if (!allocation) {
      return {
        success: false,
        error: 'PORT_NOT_ALLOCATED',
        message: `Port ${port} is not currently allocated`
      };
    }

    // If project ID provided, verify it matches
    if (projectId && allocation.projectId !== projectId) {
      return {
        success: false,
        error: 'PROJECT_MISMATCH',
        message: `Port ${port} is allocated to a different project`
      };
    }

    // Release the port
    delete this.registry.allocations[port];
    this.addToHistory('release', port, allocation.projectId);
    
    await this.persist();

    return {
      success: true,
      port,
      releasedAllocation: allocation
    };
  }

  /**
   * Get port suggestions for a project type
   * @param {string} projectType - Project type
   * @param {number} count - Number of suggestions to return (default: 3)
   * @returns {Promise<number[]>} Array of suggested port numbers
   */
  async getSuggestions(projectType, count = 3) {
    try {
      const range = this.getPortRange(projectType);
      return await PortChecker.findAvailablePorts(range.start, range.end, count);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all allocated ports
   * @returns {Object} Current allocations
   */
  getAllocations() {
    return { ...this.registry.allocations };
  }

  /**
   * Get allocation for a specific port
   * @param {number} port - Port number
   * @returns {Object|null} Allocation details or null
   */
  getPortAllocation(port) {
    return this.registry.allocations[port] || null;
  }

  /**
   * Get allocations for a specific project
   * @param {string} projectId - Project ID
   * @returns {Object[]} Array of port allocations
   */
  getProjectAllocations(projectId) {
    const allocations = [];
    
    for (const [port, allocation] of Object.entries(this.registry.allocations)) {
      if (allocation.projectId === projectId) {
        allocations.push({
          port: parseInt(port),
          ...allocation
        });
      }
    }
    
    return allocations;
  }

  /**
   * Release all ports for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Release result
   */
  async releaseProjectPorts(projectId) {
    const allocations = this.getProjectAllocations(projectId);
    const releasedPorts = [];
    
    for (const allocation of allocations) {
      const result = await this.releasePort(allocation.port, projectId);
      if (result.success) {
        releasedPorts.push(allocation.port);
      }
    }
    
    return {
      success: true,
      releasedPorts,
      count: releasedPorts.length
    };
  }

  /**
   * Add entry to history
   * @param {string} action - Action type (allocate/release)
   * @param {number} port - Port number
   * @param {string} projectId - Project ID
   */
  addToHistory(action, port, projectId) {
    this.registry.history.push({
      timestamp: new Date().toISOString(),
      action,
      port,
      projectId
    });
    
    // Keep only last 100 entries
    if (this.registry.history.length > this.MAX_HISTORY) {
      this.registry.history = this.registry.history.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Get port allocation history
   * @param {number} limit - Maximum number of entries (default: 50)
   * @returns {Object[]} History entries
   */
  getHistory(limit = 50) {
    return this.registry.history.slice(-limit);
  }

  /**
   * Persist registry to file
   * @returns {Promise<void>}
   */
  async persist() {
    try {
      await AtomicFile.writeJSON(this.dataPath, this.registry);
    } catch (error) {
      console.error('Error persisting port registry:', error);
      throw error;
    }
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const allocations = this.registry.allocations;
    const stats = {
      totalAllocated: Object.keys(allocations).length,
      byType: {},
      historyEntries: this.registry.history.length
    };
    
    // Count by project type
    for (const allocation of Object.values(allocations)) {
      const type = allocation.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }
    
    // Calculate range utilization
    stats.rangeUtilization = {};
    for (const [type, range] of Object.entries(this.PORT_RANGES)) {
      if (type === 'system') continue; // Skip system range
      
      const rangeSize = range.end - range.start + 1;
      const allocated = stats.byType[type] || 0;
      stats.rangeUtilization[type] = {
        allocated,
        total: rangeSize,
        percentage: Math.round((allocated / rangeSize) * 100)
      };
    }
    
    return stats;
  }

  /**
   * Cleanup orphaned allocations (ports that are no longer in use)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedAllocations() {
    const orphanedPorts = [];
    const allocations = Object.keys(this.registry.allocations).map(Number);
    
    // Check each allocated port
    for (const port of allocations) {
      const available = await PortChecker.isPortAvailable(port);
      if (available) {
        // Port is available, meaning it's no longer in use
        orphanedPorts.push(port);
        const allocation = this.registry.allocations[port];
        delete this.registry.allocations[port];
        this.addToHistory('cleanup', port, allocation.projectId);
      }
    }
    
    if (orphanedPorts.length > 0) {
      await this.persist();
    }
    
    return {
      success: true,
      orphanedPorts,
      count: orphanedPorts.length
    };
  }
}

module.exports = PortRegistry;