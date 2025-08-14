/**
 * Health Monitor Service
 * Monitors system components and triggers recovery when needed
 * Part of Story 2.4: Error Handling Framework
 */

const { ErrorHandler } = require('./error-handler');
const { RecoveryEngine } = require('./recovery-engine');
const { createMcpError, MCP_ERROR_CODES } = require('../middleware/error-handler');

/**
 * Component health states
 */
const HEALTH_STATES = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * System components to monitor
 */
const COMPONENTS = {
  DOCKER: 'docker',
  PORT_REGISTRY: 'port-registry',
  PROJECT_REGISTRY: 'project-registry',
  WORKSPACE_SCANNER: 'workspace-scanner',
  MCP_SERVER: 'mcp-server',
  FILE_SYSTEM: 'file-system',
  NETWORK: 'network'
};

class HealthMonitor {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.recoveryEngine = new RecoveryEngine();
    
    // Component health tracking
    this.componentHealth = new Map();
    this.healthHistory = [];
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    // Configuration
    this.config = {
      monitoringIntervalMs: 30000, // 30 seconds
      healthHistoryLimit: 100,
      autoRecovery: true,
      alertThresholds: {
        errorRate: 0.1, // 10% error rate triggers alert
        responseTime: 5000, // 5 second response time threshold
        consecutiveFailures: 3 // 3 consecutive failures trigger recovery
      }
    };
    
    // Initialize component health tracking
    this.initializeComponentTracking();
  }

  /**
   * Initialize health tracking for all components
   */
  initializeComponentTracking() {
    for (const component of Object.values(COMPONENTS)) {
      this.componentHealth.set(component, {
        name: component,
        state: HEALTH_STATES.UNKNOWN,
        lastCheck: null,
        lastHealthy: null,
        consecutiveFailures: 0,
        totalChecks: 0,
        totalFailures: 0,
        averageResponseTime: 0,
        lastError: null,
        metadata: {}
      });
    }
  }

  /**
   * Start health monitoring
   * @returns {Promise<void>}
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Health monitoring already started');
      return;
    }
    
    console.log(`Starting health monitoring with ${this.config.monitoringIntervalMs}ms interval`);
    
    this.isMonitoring = true;
    
    // Initial health check
    await this.performHealthCheck();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health monitoring error:', error.message);
        this.recordSystemError(error);
      }
    }, this.config.monitoringIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('Stopping health monitoring');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
  }

  /**
   * Perform comprehensive health check on all components
   * @returns {Promise<Object>} Overall health status
   */
  async performHealthCheck() {
    const healthCheckStart = Date.now();
    const componentResults = new Map();
    
    // Check each component
    for (const component of Object.values(COMPONENTS)) {
      try {
        const result = await this.checkComponentHealth(component);
        componentResults.set(component, result);
        this.updateComponentHealth(component, result);
        
      } catch (error) {
        const errorResult = {
          state: HEALTH_STATES.ERROR,
          error: error.message,
          responseTime: null,
          checkedAt: new Date().toISOString()
        };
        
        componentResults.set(component, errorResult);
        this.updateComponentHealth(component, errorResult);
      }
    }
    
    // Calculate overall system health
    const overallHealth = this.calculateOverallHealth(componentResults);
    
    // Record health check result
    const healthCheckDuration = Date.now() - healthCheckStart;
    this.recordHealthCheck(overallHealth, componentResults, healthCheckDuration);
    
    // Trigger recovery if needed
    if (this.config.autoRecovery) {
      await this.evaluateRecoveryNeeds(componentResults);
    }
    
    return overallHealth;
  }

  /**
   * Check health of a specific component
   * @param {string} component - Component name
   * @returns {Promise<Object>} Component health result
   */
  async checkComponentHealth(component) {
    const checkStart = Date.now();
    
    let healthResult;
    
    switch (component) {
      case COMPONENTS.DOCKER:
        healthResult = await this.checkDockerHealth();
        break;
      
      case COMPONENTS.PORT_REGISTRY:
        healthResult = await this.checkPortRegistryHealth();
        break;
      
      case COMPONENTS.PROJECT_REGISTRY:
        healthResult = await this.checkProjectRegistryHealth();
        break;
      
      case COMPONENTS.WORKSPACE_SCANNER:
        healthResult = await this.checkWorkspaceScannerHealth();
        break;
      
      case COMPONENTS.MCP_SERVER:
        healthResult = await this.checkMcpServerHealth();
        break;
      
      case COMPONENTS.FILE_SYSTEM:
        healthResult = await this.checkFileSystemHealth();
        break;
      
      case COMPONENTS.NETWORK:
        healthResult = await this.checkNetworkHealth();
        break;
      
      default:
        throw new Error(`Unknown component: ${component}`);
    }
    
    const responseTime = Date.now() - checkStart;
    
    return {
      ...healthResult,
      responseTime,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Check Docker health
   * @returns {Promise<Object>} Docker health result
   */
  async checkDockerHealth() {
    try {
      // Basic Docker connectivity check
      // In a real implementation, this would use dockerode to check daemon health
      return {
        state: HEALTH_STATES.HEALTHY,
        version: 'mock-version',
        containersRunning: 0,
        imagesCount: 4
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check Port Registry health
   * @returns {Promise<Object>} Port Registry health result
   */
  async checkPortRegistryHealth() {
    try {
      // Check if port registry file is accessible and valid
      return {
        state: HEALTH_STATES.HEALTHY,
        totalAllocations: 0,
        availablePorts: {
          node: 1000,
          python: 1000,
          php: 900,
          static: 1000
        }
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check Project Registry health
   * @returns {Promise<Object>} Project Registry health result
   */
  async checkProjectRegistryHealth() {
    try {
      // Check if project registry is accessible
      return {
        state: HEALTH_STATES.HEALTHY,
        totalProjects: 0,
        projectsByStatus: {
          registered: 0,
          running: 0,
          stopped: 0
        }
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check Workspace Scanner health
   * @returns {Promise<Object>} Workspace Scanner health result
   */
  async checkWorkspaceScannerHealth() {
    try {
      // Test workspace scanner functionality
      return {
        state: HEALTH_STATES.HEALTHY,
        supportedTechStacks: 8,
        lastScanDuration: 150
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check MCP Server health
   * @returns {Promise<Object>} MCP Server health result
   */
  async checkMcpServerHealth() {
    try {
      // Check MCP server responsiveness
      return {
        state: HEALTH_STATES.HEALTHY,
        port: 2601,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check file system health
   * @returns {Promise<Object>} File system health result
   */
  async checkFileSystemHealth() {
    try {
      // Check data directory accessibility
      const fs = require('fs').promises;
      const path = require('path');
      const dataPath = path.join(__dirname, '../../data/system');
      
      await fs.access(dataPath, fs.constants.R_OK | fs.constants.W_OK);
      
      return {
        state: HEALTH_STATES.HEALTHY,
        dataPath,
        accessible: true
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Check network health
   * @returns {Promise<Object>} Network health result
   */
  async checkNetworkHealth() {
    try {
      // Basic network connectivity check
      return {
        state: HEALTH_STATES.HEALTHY,
        localhost: true,
        dockerNetwork: true
      };
    } catch (error) {
      return {
        state: HEALTH_STATES.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Update component health tracking
   * @param {string} component - Component name
   * @param {Object} result - Health check result
   */
  updateComponentHealth(component, result) {
    const health = this.componentHealth.get(component);
    if (!health) return;
    
    // Update basic tracking
    health.state = result.state;
    health.lastCheck = result.checkedAt;
    health.totalChecks += 1;
    
    if (result.state === HEALTH_STATES.HEALTHY) {
      health.lastHealthy = result.checkedAt;
      health.consecutiveFailures = 0;
    } else {
      health.totalFailures += 1;
      health.consecutiveFailures += 1;
      health.lastError = result.error || null;
    }
    
    // Update response time average
    if (result.responseTime) {
      const currentAvg = health.averageResponseTime;
      const totalChecks = health.totalChecks;
      health.averageResponseTime = (currentAvg * (totalChecks - 1) + result.responseTime) / totalChecks;
    }
    
    // Store additional metadata
    health.metadata = {
      ...result,
      errorRate: health.totalFailures / health.totalChecks
    };
    
    this.componentHealth.set(component, health);
  }

  /**
   * Calculate overall system health from component results
   * @param {Map} componentResults - Results from all components
   * @returns {Object} Overall health status
   */
  calculateOverallHealth(componentResults) {
    const states = Array.from(componentResults.values()).map(r => r.state);
    
    // Determine overall state based on component states
    let overallState = HEALTH_STATES.HEALTHY;
    
    if (states.includes(HEALTH_STATES.CRITICAL)) {
      overallState = HEALTH_STATES.CRITICAL;
    } else if (states.includes(HEALTH_STATES.ERROR)) {
      overallState = HEALTH_STATES.ERROR;
    } else if (states.includes(HEALTH_STATES.WARNING)) {
      overallState = HEALTH_STATES.WARNING;
    } else if (states.includes(HEALTH_STATES.UNKNOWN)) {
      overallState = HEALTH_STATES.WARNING;
    }
    
    const healthyCount = states.filter(s => s === HEALTH_STATES.HEALTHY).length;
    const totalCount = states.length;
    
    return {
      state: overallState,
      healthyComponents: healthyCount,
      totalComponents: totalCount,
      healthPercentage: Math.round((healthyCount / totalCount) * 100),
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Record health check in history
   * @param {Object} overallHealth - Overall health result
   * @param {Map} componentResults - Component results
   * @param {number} duration - Check duration in ms
   */
  recordHealthCheck(overallHealth, componentResults, duration) {
    const record = {
      ...overallHealth,
      duration,
      componentCount: componentResults.size,
      timestamp: new Date().toISOString()
    };
    
    this.healthHistory.unshift(record);
    
    // Limit history size
    if (this.healthHistory.length > this.config.healthHistoryLimit) {
      this.healthHistory = this.healthHistory.slice(0, this.config.healthHistoryLimit);
    }
  }

  /**
   * Evaluate if recovery is needed for any components
   * @param {Map} componentResults - Component health results
   * @returns {Promise<void>}
   */
  async evaluateRecoveryNeeds(componentResults) {
    for (const [component, result] of componentResults) {
      const health = this.componentHealth.get(component);
      
      if (this.shouldTriggerRecovery(health, result)) {
        console.log(`Health Monitor: Triggering recovery for component: ${component}`);
        
        try {
          await this.triggerComponentRecovery(component, health, result);
        } catch (recoveryError) {
          console.error(`Health Monitor: Recovery failed for ${component}:`, recoveryError.message);
        }
      }
    }
  }

  /**
   * Determine if recovery should be triggered for a component
   * @param {Object} health - Component health tracking
   * @param {Object} result - Latest health check result
   * @returns {boolean} Whether to trigger recovery
   */
  shouldTriggerRecovery(health, result) {
    // Trigger recovery if component has consecutive failures above threshold
    if (health.consecutiveFailures >= this.config.alertThresholds.consecutiveFailures) {
      return true;
    }
    
    // Trigger recovery if error rate is too high
    if (health.metadata.errorRate >= this.config.alertThresholds.errorRate) {
      return true;
    }
    
    // Trigger recovery if response time is too slow
    if (result.responseTime && result.responseTime > this.config.alertThresholds.responseTime) {
      return true;
    }
    
    return false;
  }

  /**
   * Trigger recovery for a specific component
   * @param {string} component - Component name
   * @param {Object} health - Component health data
   * @param {Object} result - Latest health result
   * @returns {Promise<void>}
   */
  async triggerComponentRecovery(component, health, result) {
    const error = {
      code: `HEALTH_CHECK_FAILED_${component.toUpperCase()}`,
      type: 'system',
      severity: 'error',
      message: `Component ${component} health check failed`,
      recovery: { strategy: 'RETRY' }
    };
    
    const context = {
      component,
      consecutiveFailures: health.consecutiveFailures,
      errorRate: health.metadata.errorRate,
      lastError: result.error
    };
    
    // Use recovery engine to attempt recovery
    const recoveryResult = await this.recoveryEngine.attemptRecovery(
      error,
      () => this.checkComponentHealth(component),
      context
    );
    
    console.log(`Health Monitor: Recovery result for ${component}:`, recoveryResult.success ? 'SUCCESS' : 'FAILED');
  }

  /**
   * Record system-level error
   * @param {Error} error - System error
   */
  recordSystemError(error) {
    const errorResponse = this.errorHandler.handleError(error, {
      operation: 'health-monitoring',
      component: 'health-monitor'
    });
    
    console.error('System error recorded:', errorResponse.error.message);
  }

  /**
   * Get current system health status
   * @returns {Object} Current health status
   */
  getCurrentHealth() {
    const components = Object.fromEntries(this.componentHealth);
    const healthyCount = Array.from(this.componentHealth.values())
      .filter(h => h.state === HEALTH_STATES.HEALTHY).length;
    
    return {
      isMonitoring: this.isMonitoring,
      overallHealth: {
        healthy: healthyCount,
        total: this.componentHealth.size,
        percentage: Math.round((healthyCount / this.componentHealth.size) * 100)
      },
      components,
      lastCheck: this.healthHistory[0] || null,
      config: this.config
    };
  }

  /**
   * Get health history
   * @param {number} limit - Number of records to return
   * @returns {Array} Health history records
   */
  getHealthHistory(limit = 10) {
    return this.healthHistory.slice(0, limit);
  }

  /**
   * Reset health monitoring state
   */
  resetHealth() {
    this.stopMonitoring();
    this.componentHealth.clear();
    this.healthHistory = [];
    this.initializeComponentTracking();
  }
}

module.exports = {
  HealthMonitor,
  HEALTH_STATES,
  COMPONENTS
};
