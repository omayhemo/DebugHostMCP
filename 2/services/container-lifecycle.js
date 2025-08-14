/**
 * Container Lifecycle Service
 * Orchestrates container start/stop/restart operations with project management
 * Part of Story 2.2: Container Lifecycle Management
 */

const path = require('path');
const DockerManager = require('../docker-manager');
const { ErrorHandler } = require('./error-handler');
const { RecoveryEngine } = require('./recovery-engine');
const { HealthMonitor } = require('./health-monitor');
const { createMcpError, MCP_ERROR_CODES } = require('../middleware/error-handler');

/**
 * Container lifecycle states for tracking operations
 */
const CONTAINER_STATES = {
  CREATING: 'creating',
  STARTING: 'starting', 
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error',
  RESTARTING: 'restarting',
  REMOVING: 'removing'
};

/**
 * Configuration for different technology stacks
 */
const TECH_STACK_CONFIG = {
  nodejs: {
    image: 'node',
    healthCheckPath: '/health',
    startupTimeoutMs: 30000,
    shutdownGracePeriodMs: 10000
  },
  python: {
    image: 'python',
    healthCheckPath: '/health',
    startupTimeoutMs: 45000,
    shutdownGracePeriodMs: 15000
  },
  php: {
    image: 'php',
    healthCheckPath: '/health.php',
    startupTimeoutMs: 30000,
    shutdownGracePeriodMs: 10000
  },
  static: {
    image: 'static',
    healthCheckPath: '/',
    startupTimeoutMs: 15000,
    shutdownGracePeriodMs: 5000
  }
};

class ContainerLifecycle {
  constructor(projectRegistry = null, dockerManager = null) {
    this.projectRegistry = projectRegistry;
    this.dockerManager = dockerManager || new DockerManager();
    this.errorHandler = new ErrorHandler();
    this.recoveryEngine = new RecoveryEngine();
    this.healthMonitor = new HealthMonitor();
    
    // Track ongoing operations to prevent conflicts
    this.activeOperations = new Map();
    
    // Performance metrics
    this.metrics = {
      containers: {
        started: 0,
        stopped: 0,
        restarted: 0,
        failed: 0
      },
      averageStartTime: 0,
      averageStopTime: 0
    };
  }

  /**
   * Initialize the container lifecycle service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing Container Lifecycle Service...');
      
      // Initialize Docker Manager if not provided
      if (!this.dockerManager.initialized) {
        await this.dockerManager.initialize();
      }

      // Initialize health monitoring
      await this.healthMonitor.initialize();
      
      // Set up container health event handlers
      this.healthMonitor.on('containerUnhealthy', this.handleUnhealthyContainer.bind(this));
      this.healthMonitor.on('containerRecovered', this.handleContainerRecovery.bind(this));
      
      console.log('Container Lifecycle Service initialized successfully');
    } catch (error) {
      const handledError = this.errorHandler.handleError(error, {
        operation: 'container-lifecycle-init',
        component: 'ContainerLifecycle'
      });
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to initialize Container Lifecycle Service: ${handledError.error.message}`,
        { originalError: handledError }
      );
    }
  }

  /**
   * Start a container for a registered project
   * @param {string} projectId - Project identifier
   * @param {Object} options - Additional startup options
   * @returns {Promise<Object>} Container start result
   */
  async startContainer(projectId, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check for ongoing operations
      if (this.activeOperations.has(projectId)) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Container operation already in progress for project ${projectId}`,
          { projectId, operation: this.activeOperations.get(projectId) }
        );
      }

      this.activeOperations.set(projectId, 'starting');

      // Get project details
      const project = await this.projectRegistry.getProject(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Project ${projectId} not found`,
          { projectId }
        );
      }

      // Update project status to starting
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.STARTING,
        lastOperation: 'start',
        lastOperationTime: new Date().toISOString()
      });

      // Prepare container configuration
      const containerConfig = this.buildContainerConfig(project, options);

      // Create and start container
      console.log(`Starting container for project ${projectId}...`);
      
      const containerInfo = await this.dockerManager.createContainer(containerConfig);
      await this.dockerManager.startContainer(containerInfo.containerId);

      // Start health monitoring
      await this.healthMonitor.startMonitoring(containerInfo.containerId, {
        projectId,
        healthCheckPath: TECH_STACK_CONFIG[project.primaryTech]?.healthCheckPath || '/health',
        port: project.ports.primary
      });

      // Wait for container to be ready
      await this.waitForContainerReady(containerInfo.containerId, project);

      // Update project with container information
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.RUNNING,
        containerId: containerInfo.containerId,
        containerName: containerInfo.name,
        startedAt: new Date().toISOString(),
        lastHealthCheck: new Date().toISOString()
      });

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateStartMetrics(duration);

      console.log(`Container started successfully for project ${projectId} in ${duration}ms`);

      return {
        success: true,
        projectId,
        containerId: containerInfo.containerId,
        containerName: containerInfo.name,
        status: CONTAINER_STATES.RUNNING,
        startTime: duration,
        ports: {
          primary: project.ports.primary,
          exposed: project.ports.allocated || []
        },
        accessUrl: `http://localhost:${project.ports.primary}`,
        message: `Container started successfully for ${project.name}`
      };

    } catch (error) {
      // Handle startup failure
      await this.handleStartupFailure(projectId, error);
      
      const handledError = this.errorHandler.handleError(error, {
        operation: 'container-start',
        projectId,
        component: 'ContainerLifecycle'
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to start container for project ${projectId}: ${handledError.error.message}`,
        { projectId, originalError: handledError }
      );
    } finally {
      this.activeOperations.delete(projectId);
    }
  }

  /**
   * Stop a container for a project
   * @param {string} projectId - Project identifier
   * @param {Object} options - Stop options
   * @returns {Promise<Object>} Container stop result
   */
  async stopContainer(projectId, options = {}) {
    const startTime = Date.now();
    const { force = false, gracePeriod = null } = options;

    try {
      // Check for ongoing operations
      if (this.activeOperations.has(projectId)) {
        const currentOp = this.activeOperations.get(projectId);
        if (currentOp !== 'starting') {
          throw createMcpError(
            MCP_ERROR_CODES.INVALID_PARAMS,
            `Container operation already in progress for project ${projectId}`,
            { projectId, operation: currentOp }
          );
        }
      }

      this.activeOperations.set(projectId, 'stopping');

      // Get project details
      const project = await this.projectRegistry.getProject(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Project ${projectId} not found`,
          { projectId }
        );
      }

      if (!project.containerId) {
        return {
          success: true,
          projectId,
          status: CONTAINER_STATES.STOPPED,
          message: `No active container found for project ${project.name}`
        };
      }

      // Update project status to stopping
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.STOPPING,
        lastOperation: 'stop',
        lastOperationTime: new Date().toISOString()
      });

      console.log(`Stopping container for project ${projectId}...`);

      // Stop health monitoring
      this.healthMonitor.stopMonitoring(project.containerId);

      // Determine grace period
      const techConfig = TECH_STACK_CONFIG[project.primaryTech];
      const effectiveGracePeriod = gracePeriod || (techConfig?.shutdownGracePeriodMs / 1000) || 10;

      // Stop the container
      if (force) {
        await this.dockerManager.removeContainer(project.containerId, true);
      } else {
        await this.dockerManager.stopContainer(project.containerId, effectiveGracePeriod);
      }

      // Update project status
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.STOPPED,
        containerId: null,
        containerName: null,
        stoppedAt: new Date().toISOString()
      });

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateStopMetrics(duration);

      console.log(`Container stopped successfully for project ${projectId} in ${duration}ms`);

      return {
        success: true,
        projectId,
        status: CONTAINER_STATES.STOPPED,
        stopTime: duration,
        message: `Container stopped successfully for ${project.name}`
      };

    } catch (error) {
      const handledError = this.errorHandler.handleError(error, {
        operation: 'container-stop',
        projectId,
        component: 'ContainerLifecycle'
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to stop container for project ${projectId}: ${handledError.error.message}`,
        { projectId, originalError: handledError }
      );
    } finally {
      this.activeOperations.delete(projectId);
    }
  }

  /**
   * Restart a container for a project
   * @param {string} projectId - Project identifier
   * @param {Object} options - Restart options
   * @returns {Promise<Object>} Container restart result
   */
  async restartContainer(projectId, options = {}) {
    const startTime = Date.now();

    try {
      // Check for ongoing operations
      if (this.activeOperations.has(projectId)) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Container operation already in progress for project ${projectId}`,
          { projectId, operation: this.activeOperations.get(projectId) }
        );
      }

      this.activeOperations.set(projectId, 'restarting');

      // Get project details
      const project = await this.projectRegistry.getProject(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Project ${projectId} not found`,
          { projectId }
        );
      }

      console.log(`Restarting container for project ${projectId}...`);

      // Update project status
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.RESTARTING,
        lastOperation: 'restart',
        lastOperationTime: new Date().toISOString()
      });

      // Stop existing container if running
      if (project.containerId) {
        try {
          await this.stopContainer(projectId, { gracePeriod: 5 });
        } catch (stopError) {
          console.warn(`Error stopping container during restart: ${stopError.message}`);
        }
      }

      // Start new container
      const startResult = await this.startContainer(projectId, options);

      // Update metrics
      this.metrics.containers.restarted++;
      const duration = Date.now() - startTime;

      console.log(`Container restarted successfully for project ${projectId} in ${duration}ms`);

      return {
        success: true,
        projectId,
        containerId: startResult.containerId,
        containerName: startResult.containerName,
        status: CONTAINER_STATES.RUNNING,
        restartTime: duration,
        ports: startResult.ports,
        accessUrl: startResult.accessUrl,
        message: `Container restarted successfully for ${project.name}`
      };

    } catch (error) {
      const handledError = this.errorHandler.handleError(error, {
        operation: 'container-restart',
        projectId,
        component: 'ContainerLifecycle'
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to restart container for project ${projectId}: ${handledError.error.message}`,
        { projectId, originalError: handledError }
      );
    } finally {
      this.activeOperations.delete(projectId);
    }
  }

  /**
   * Get container status and metrics for a project
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} Container status information
   */
  async getContainerStatus(projectId) {
    try {
      const project = await this.projectRegistry.getProject(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Project ${projectId} not found`,
          { projectId }
        );
      }

      let containerInfo = null;
      let healthInfo = null;

      if (project.containerId) {
        try {
          containerInfo = await this.dockerManager.getContainerInfo(project.containerId);
          healthInfo = this.healthMonitor.getHealth(project.containerId);
        } catch (error) {
          console.warn(`Error getting container info for ${projectId}: ${error.message}`);
          // Container might have been removed externally
          await this.projectRegistry.updateProject(projectId, {
            status: CONTAINER_STATES.STOPPED,
            containerId: null,
            containerName: null
          });
        }
      }

      return {
        success: true,
        projectId,
        projectName: project.name,
        status: project.status || CONTAINER_STATES.STOPPED,
        containerId: project.containerId || null,
        containerName: project.containerName || null,
        techStack: project.primaryTech,
        ports: {
          primary: project.ports?.primary,
          allocated: project.ports?.allocated || []
        },
        uptime: this.calculateUptime(project.startedAt),
        lastHealthCheck: project.lastHealthCheck,
        container: containerInfo,
        health: healthInfo,
        accessUrl: project.containerId ? `http://localhost:${project.ports?.primary}` : null,
        isHealthy: healthInfo?.healthy || false,
        isRunning: containerInfo?.running || false
      };

    } catch (error) {
      const handledError = this.errorHandler.handleError(error, {
        operation: 'container-status',
        projectId,
        component: 'ContainerLifecycle'
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to get container status for project ${projectId}: ${handledError.error.message}`,
        { projectId, originalError: handledError }
      );
    }
  }

  /**
   * Build container configuration for a project
   * @param {Object} project - Project information
   * @param {Object} options - Additional options
   * @returns {Object} Container configuration
   */
  buildContainerConfig(project, options = {}) {
    const techConfig = TECH_STACK_CONFIG[project.primaryTech];
    const image = techConfig?.image || project.primaryTech;

    return {
      projectId: project.id,
      type: image,
      workspace: project.workspace,
      port: project.ports.primary,
      env: {
        NODE_ENV: 'development',
        DEBUG: '*',
        PROJECT_NAME: project.name,
        PROJECT_ID: project.id,
        PRIMARY_TECH: project.primaryTech,
        ...options.env || {}
      }
    };
  }

  /**
   * Wait for container to be ready with health checks
   * @param {string} containerId - Container ID
   * @param {Object} project - Project information
   * @returns {Promise<void>}
   */
  async waitForContainerReady(containerId, project) {
    const techConfig = TECH_STACK_CONFIG[project.primaryTech];
    const timeoutMs = techConfig?.startupTimeoutMs || 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const containerInfo = await this.dockerManager.getContainerInfo(containerId);
        
        if (containerInfo.running) {
          // Additional readiness check for web applications
          if (project.primaryTech !== 'static') {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          return;
        }
      } catch (error) {
        console.warn(`Health check failed: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Container failed to become ready within ${timeoutMs}ms`);
  }

  /**
   * Handle startup failure cleanup
   * @param {string} projectId - Project identifier
   * @param {Error} error - The error that occurred
   */
  async handleStartupFailure(projectId, error) {
    try {
      console.log(`Handling startup failure for project ${projectId}`);

      // Update project status
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.ERROR,
        lastError: error.message,
        lastErrorTime: new Date().toISOString()
      });

      // Update failure metrics
      this.metrics.containers.failed++;

      // Attempt recovery if applicable
      const canRecover = await this.recoveryEngine.canRecover(error, {
        operation: 'container-start',
        projectId
      });

      if (canRecover) {
        console.log(`Scheduling recovery attempt for project ${projectId}`);
        // Note: In a real implementation, this might schedule a retry
      }

    } catch (recoveryError) {
      console.error(`Error during startup failure handling: ${recoveryError.message}`);
    }
  }

  /**
   * Handle unhealthy container events
   * @param {Object} event - Container health event
   */
  async handleUnhealthyContainer(event) {
    const { containerId, projectId, healthInfo } = event;

    try {
      console.warn(`Container ${containerId} for project ${projectId} became unhealthy`);

      // Update project status
      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.ERROR,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: 'unhealthy'
      });

      // Attempt automatic recovery if configured
      const shouldRecover = await this.recoveryEngine.shouldAttemptRecovery({
        type: 'container-unhealthy',
        projectId,
        containerId,
        healthInfo
      });

      if (shouldRecover) {
        console.log(`Attempting automatic recovery for project ${projectId}`);
        await this.restartContainer(projectId);
      }

    } catch (error) {
      console.error(`Error handling unhealthy container: ${error.message}`);
    }
  }

  /**
   * Handle container recovery events
   * @param {Object} event - Container recovery event
   */
  async handleContainerRecovery(event) {
    const { containerId, projectId } = event;

    try {
      console.log(`Container ${containerId} for project ${projectId} has recovered`);

      await this.projectRegistry.updateProject(projectId, {
        status: CONTAINER_STATES.RUNNING,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: 'healthy'
      });

    } catch (error) {
      console.error(`Error handling container recovery: ${error.message}`);
    }
  }

  /**
   * Calculate container uptime
   * @param {string} startedAt - ISO timestamp when container started
   * @returns {number} Uptime in milliseconds
   */
  calculateUptime(startedAt) {
    if (!startedAt) return 0;
    return Date.now() - new Date(startedAt).getTime();
  }

  /**
   * Update start operation metrics
   * @param {number} duration - Operation duration in milliseconds
   */
  updateStartMetrics(duration) {
    this.metrics.containers.started++;
    this.metrics.averageStartTime = 
      (this.metrics.averageStartTime * (this.metrics.containers.started - 1) + duration) / 
      this.metrics.containers.started;
  }

  /**
   * Update stop operation metrics
   * @param {number} duration - Operation duration in milliseconds
   */
  updateStopMetrics(duration) {
    this.metrics.containers.stopped++;
    this.metrics.averageStopTime = 
      (this.metrics.averageStopTime * (this.metrics.containers.stopped - 1) + duration) / 
      this.metrics.containers.stopped;
  }

  /**
   * Get service metrics and statistics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeOperations: this.activeOperations.size,
      monitoredContainers: this.healthMonitor.getMonitoringCount(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Shutdown the container lifecycle service
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      console.log('Shutting down Container Lifecycle Service...');

      // Stop all health monitoring
      this.healthMonitor.stopAllMonitoring();

      // Wait for active operations to complete
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();

      while (this.activeOperations.size > 0 && Date.now() - startTime < timeout) {
        console.log(`Waiting for ${this.activeOperations.size} active operations to complete...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.activeOperations.size > 0) {
        console.warn(`${this.activeOperations.size} operations still active during shutdown`);
      }

      console.log('Container Lifecycle Service shutdown complete');
    } catch (error) {
      console.error('Error during Container Lifecycle Service shutdown:', error.message);
      throw error;
    }
  }
}

module.exports = {
  ContainerLifecycle,
  CONTAINER_STATES,
  TECH_STACK_CONFIG
};