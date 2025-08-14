/**
 * Docker Manager
 * 
 * Main Docker management class that orchestrates container lifecycle,
 * network management, and health monitoring for the MCP Debug Host platform.
 */

const Docker = require('dockerode');
const DockerNetwork = require('./utils/docker-network');
const DockerHealth = require('./utils/docker-health');
const PathNormalizer = require('./utils/path-normalizer');

class DockerManager {
  constructor(options = {}) {
    this.docker = new Docker(options.dockerOptions || {});
    this.network = new DockerNetwork(this.docker);
    this.health = new DockerHealth(this.docker);
    this.containers = new Map(); // Track managed containers
    this.baseImages = {
      node: 'debug-host/node:latest',
      python: 'debug-host/python:latest',
      php: 'debug-host/php:latest',
      static: 'debug-host/static:latest'
    };
    this.retryConfig = {
      attempts: 3,
      delays: [1000, 2000, 4000], // exponential backoff
      connectionTimeout: 5000,
      operationTimeout: 30000
    };
  }

  /**
   * Initialize the Docker Manager
   * Tests Docker connectivity, ensures network exists, and cleans up orphaned containers
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing Docker Manager...');
      
      // Test Docker connectivity with retry logic
      await this.testDockerConnection();
      
      // Ensure debug-host-network exists
      await this.network.ensureNetwork();
      
      // Clean up any orphaned containers
      await this.cleanupOrphans();
      
      console.log('Docker Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Docker Manager:', error.message);
      throw error;
    }
  }

  /**
   * Test Docker daemon connectivity with retry logic
   * 
   * @returns {Promise<void>}
   * @throws {Error} If Docker is not available after all retries
   */
  async testDockerConnection() {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryConfig.attempts; attempt++) {
      try {
        console.log(`Testing Docker connection (attempt ${attempt + 1}/${this.retryConfig.attempts})`);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), this.retryConfig.connectionTimeout);
        });
        
        await Promise.race([this.docker.ping(), timeoutPromise]);
        
        console.log('Docker connection successful');
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Docker connection attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < this.retryConfig.attempts - 1) {
          const delay = this.retryConfig.delays[attempt];
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Docker unavailable after ${this.retryConfig.attempts} attempts: ${lastError.message}`);
  }

  /**
   * Create and start a new container for a project
   * 
   * @param {object} config - Container configuration
   * @param {string} config.projectId - Unique project identifier
   * @param {string} config.type - Container type (node, python, php, static)
   * @param {string} config.workspace - Host workspace path
   * @param {number} config.port - Port to expose
   * @param {object} config.env - Additional environment variables
   * @returns {Promise<object>} Container information
   */
  async createContainer(config) {
    const { projectId, type, workspace, port, env = {} } = config;
    
    try {
      // Validate configuration
      this.validateContainerConfig(config);
      
      // Normalize workspace path for Docker
      const normalizedWorkspace = PathNormalizer.normalizeWorkspacePath(workspace);
      
      // Generate container name with timestamp
      const timestamp = Date.now();
      const containerName = `debug-host-${projectId}-${timestamp}`;
      
      // Prepare container configuration
      const containerConfig = {
        name: containerName,
        Image: this.baseImages[type],
        Env: [
          `PORT=${port}`,
          `PROJECT_ID=${projectId}`,
          `DEBUG_HOST=true`,
          ...Object.entries(env).map(([key, value]) => `${key}=${value}`)
        ],
        Labels: {
          'debug-host': 'true',
          'project-id': projectId,
          'container-type': type,
          'created': new Date().toISOString()
        },
        HostConfig: {
          Binds: [`${normalizedWorkspace}:/app`],
          NetworkMode: this.network.networkName,
          RestartPolicy: { Name: 'no' }, // We handle restarts manually
          Memory: 2 * 1024 * 1024 * 1024, // 2GB limit
          CpuQuota: 200000, // 2 CPU cores
          PortBindings: {
            [`${port}/tcp`]: [{ HostPort: port.toString() }]
          }
        },
        NetworkingConfig: {
          EndpointsConfig: this.network.getContainerNetworkConfig()
        },
        WorkingDir: '/app'
      };

      // Create the container
      console.log(`Creating container ${containerName} for project ${projectId}`);
      const container = await this.docker.createContainer(containerConfig);
      
      // Store container information
      const containerInfo = {
        id: container.id,
        name: containerName,
        projectId,
        type,
        workspace: normalizedWorkspace,
        port,
        created: new Date(),
        status: 'created'
      };
      
      this.containers.set(container.id, containerInfo);
      
      console.log(`Container ${containerName} created successfully`);
      return {
        containerId: container.id,
        name: containerName,
        ...containerInfo
      };
    } catch (error) {
      console.error(`Failed to create container for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Start a container
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<void>}
   */
  async startContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const containerInfo = this.containers.get(containerId);
      
      if (!containerInfo) {
        throw new Error(`Container ${containerId} not managed by this instance`);
      }

      console.log(`Starting container ${containerInfo.name}`);
      
      await container.start();
      
      // Wait for container to be running
      await this.health.waitForStatus(containerId, 'running', this.retryConfig.operationTimeout);
      
      // Update container info
      containerInfo.status = 'running';
      containerInfo.startedAt = new Date();
      
      // Start health monitoring
      this.health.startMonitoring(containerId, this.handleContainerHealthUpdate.bind(this));
      
      console.log(`Container ${containerInfo.name} started successfully`);
    } catch (error) {
      console.error(`Failed to start container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop a container gracefully
   * 
   * @param {string} containerId - Container ID
   * @param {number} gracePeriod - Grace period in seconds before force kill
   * @returns {Promise<void>}
   */
  async stopContainer(containerId, gracePeriod = 10) {
    try {
      const container = this.docker.getContainer(containerId);
      const containerInfo = this.containers.get(containerId);
      
      if (!containerInfo) {
        console.warn(`Container ${containerId} not managed by this instance`);
      }

      console.log(`Stopping container ${containerInfo?.name || containerId}`);
      
      // Stop health monitoring
      this.health.stopMonitoring(containerId);
      
      // Send SIGTERM and wait for graceful shutdown
      await container.stop({ t: gracePeriod });
      
      // Wait for container to stop
      await this.health.waitForStatus(containerId, 'exited', this.retryConfig.operationTimeout);
      
      // Update container info
      if (containerInfo) {
        containerInfo.status = 'stopped';
        containerInfo.stoppedAt = new Date();
      }
      
      console.log(`Container ${containerInfo?.name || containerId} stopped successfully`);
    } catch (error) {
      if (error.statusCode === 304) {
        console.log(`Container ${containerId} is already stopped`);
        return;
      }
      console.error(`Failed to stop container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Restart a container
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<void>}
   */
  async restartContainer(containerId) {
    try {
      const containerInfo = this.containers.get(containerId);
      console.log(`Restarting container ${containerInfo?.name || containerId}`);
      
      await this.stopContainer(containerId);
      await this.startContainer(containerId);
      
      console.log(`Container ${containerInfo?.name || containerId} restarted successfully`);
    } catch (error) {
      console.error(`Failed to restart container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove a container and clean up resources
   * 
   * @param {string} containerId - Container ID
   * @param {boolean} force - Force removal even if running
   * @returns {Promise<void>}
   */
  async removeContainer(containerId, force = false) {
    try {
      const container = this.docker.getContainer(containerId);
      const containerInfo = this.containers.get(containerId);
      
      console.log(`Removing container ${containerInfo?.name || containerId}`);
      
      // Stop monitoring
      this.health.stopMonitoring(containerId);
      
      // Stop container if running (unless forcing)
      if (!force) {
        try {
          await this.stopContainer(containerId);
        } catch (error) {
          // Continue with removal even if stop fails
          console.warn(`Could not stop container before removal: ${error.message}`);
        }
      }
      
      // Remove container
      await container.remove({ force });
      
      // Clean up our tracking
      this.containers.delete(containerId);
      
      console.log(`Container ${containerInfo?.name || containerId} removed successfully`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Container ${containerId} already removed`);
        this.containers.delete(containerId);
        return;
      }
      console.error(`Failed to remove container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get container status and statistics
   * 
   * @param {string} containerId - Container ID
   * @returns {Promise<object>} Container status and stats
   */
  async getContainerInfo(containerId) {
    try {
      const containerInfo = this.containers.get(containerId);
      const status = await this.health.getContainerStatus(containerId);
      let stats = null;
      
      if (status.running) {
        try {
          stats = await this.health.getContainerStats(containerId);
        } catch (statsError) {
          console.warn(`Could not get stats for container ${containerId}:`, statsError.message);
        }
      }
      
      return {
        ...containerInfo,
        ...status,
        stats
      };
    } catch (error) {
      console.error(`Failed to get container info for ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * List all managed containers
   * 
   * @returns {Array<object>} Array of container information
   */
  async listContainers() {
    const containerList = [];
    
    for (const [containerId, containerInfo] of this.containers) {
      try {
        const fullInfo = await this.getContainerInfo(containerId);
        containerList.push(fullInfo);
      } catch (error) {
        // Container might have been removed externally
        console.warn(`Could not get info for container ${containerId}: ${error.message}`);
        this.containers.delete(containerId);
      }
    }
    
    return containerList;
  }

  /**
   * Clean up orphaned containers from previous runs
   * 
   * @returns {Promise<void>}
   */
  async cleanupOrphans() {
    try {
      console.log('Cleaning up orphaned containers...');
      
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['debug-host=true']
        }
      });
      
      let removedCount = 0;
      
      for (const containerInfo of containers) {
        try {
          // Remove exited containers
          if (containerInfo.State === 'exited') {
            const container = this.docker.getContainer(containerInfo.Id);
            await container.remove();
            removedCount++;
            console.log(`Removed orphaned container: ${containerInfo.Names[0]}`);
          }
        } catch (error) {
          console.warn(`Failed to remove orphaned container ${containerInfo.Id}: ${error.message}`);
        }
      }
      
      console.log(`Cleanup complete. Removed ${removedCount} orphaned containers.`);
    } catch (error) {
      console.error('Error during orphan cleanup:', error.message);
      // Don't throw - this is best effort cleanup
    }
  }

  /**
   * Shutdown the Docker Manager gracefully
   * 
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      console.log('Shutting down Docker Manager...');
      
      // Stop all health monitoring
      this.health.stopAllMonitoring();
      
      // Stop all managed containers
      const stopPromises = Array.from(this.containers.keys()).map(containerId => 
        this.stopContainer(containerId).catch(error => 
          console.warn(`Error stopping container ${containerId} during shutdown: ${error.message}`)
        )
      );
      
      await Promise.all(stopPromises);
      
      console.log('Docker Manager shutdown complete');
    } catch (error) {
      console.error('Error during Docker Manager shutdown:', error.message);
      throw error;
    }
  }

  /**
   * Validate container configuration
   * 
   * @param {object} config - Container configuration to validate
   * @throws {Error} If configuration is invalid
   */
  validateContainerConfig(config) {
    const { projectId, type, workspace, port } = config;
    
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('projectId is required and must be a string');
    }
    
    if (!type || !this.baseImages[type]) {
      throw new Error(`type must be one of: ${Object.keys(this.baseImages).join(', ')}`);
    }
    
    if (!workspace || typeof workspace !== 'string') {
      throw new Error('workspace is required and must be a string');
    }
    
    if (!port || typeof port !== 'number' || port < 1 || port > 65535) {
      throw new Error('port is required and must be a number between 1 and 65535');
    }
    
    // Validate normalized path
    try {
      const normalized = PathNormalizer.normalizeWorkspacePath(workspace);
      if (!PathNormalizer.isValidDockerPath(normalized)) {
        throw new Error(`Invalid workspace path: ${workspace}`);
      }
    } catch (error) {
      throw new Error(`Invalid workspace path: ${error.message}`);
    }
  }

  /**
   * Handle container health update callbacks
   * 
   * @param {string} containerId - Container ID
   * @param {object} healthInfo - Health information
   */
  handleContainerHealthUpdate(containerId, healthInfo) {
    const containerInfo = this.containers.get(containerId);
    
    if (!containerInfo) {
      return;
    }
    
    // Update container status
    containerInfo.lastHealthCheck = new Date();
    containerInfo.healthy = healthInfo.healthy;
    
    if (!healthInfo.healthy && healthInfo.status === 'exited') {
      console.warn(`Container ${containerInfo.name} exited unexpectedly`);
      containerInfo.status = 'exited';
      containerInfo.exitCode = healthInfo.exitCode;
      
      // Stop monitoring the exited container
      this.health.stopMonitoring(containerId);
    }
  }
}

module.exports = DockerManager;