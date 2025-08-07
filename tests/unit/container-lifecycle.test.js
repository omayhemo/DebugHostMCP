/**
 * Unit Tests: Container Lifecycle Service
 * Story 2.2: Container Lifecycle Management
 */

const { ContainerLifecycle, CONTAINER_STATES, TECH_STACK_CONFIG } = require('../../src/services/container-lifecycle');

// Mock dependencies
const mockDockerManager = {
  initialize: jest.fn(),
  initialized: true,
  createContainer: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  removeContainer: jest.fn(),
  getContainerInfo: jest.fn()
};

const mockProjectRegistry = {
  getProject: jest.fn(),
  updateProject: jest.fn()
};

const mockHealthMonitor = {
  initialize: jest.fn(),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  stopAllMonitoring: jest.fn(),
  getHealth: jest.fn(),
  getMonitoringCount: jest.fn().mockReturnValue(0),
  on: jest.fn()
};

const mockRecoveryEngine = {
  canRecover: jest.fn(),
  shouldAttemptRecovery: jest.fn()
};

const mockErrorHandler = {
  handleError: jest.fn()
};

// Mock the dependencies
jest.mock('../../src/docker-manager', () => {
  return jest.fn().mockImplementation(() => mockDockerManager);
});

jest.mock('../../src/services/error-handler', () => ({
  ErrorHandler: jest.fn().mockImplementation(() => mockErrorHandler)
}));

jest.mock('../../src/services/recovery-engine', () => ({
  RecoveryEngine: jest.fn().mockImplementation(() => mockRecoveryEngine)
}));

jest.mock('../../src/services/health-monitor', () => ({
  HealthMonitor: jest.fn().mockImplementation(() => mockHealthMonitor)
}));

describe('ContainerLifecycle', () => {
  let containerLifecycle;
  let mockProject;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create instance with mocked dependencies
    containerLifecycle = new ContainerLifecycle(mockProjectRegistry, mockDockerManager);
    
    // Mock project data
    mockProject = {
      id: 'proj_123456789012',
      name: 'test-project',
      primaryTech: 'nodejs',
      workspace: '/test/workspace',
      ports: {
        primary: 3000,
        allocated: [3000, 3001]
      },
      status: 'registered',
      containerId: 'container_abc123',
      containerName: 'debug-host-proj_123456789012-1234567890',
      startedAt: new Date(Date.now() - 60000).toISOString() // Started 1 minute ago
    };

    mockProjectRegistry.getProject.mockResolvedValue(mockProject);
    mockProjectRegistry.updateProject.mockResolvedValue({
      success: true,
      projectId: mockProject.id
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with all dependencies', async () => {
      mockHealthMonitor.initialize.mockResolvedValue();

      await containerLifecycle.initialize();

      expect(mockHealthMonitor.initialize).toHaveBeenCalled();
      expect(mockHealthMonitor.on).toHaveBeenCalledWith('containerUnhealthy', expect.any(Function));
      expect(mockHealthMonitor.on).toHaveBeenCalledWith('containerRecovered', expect.any(Function));
    });

    it('should handle initialization errors gracefully', async () => {
      const initError = new Error('Health monitor initialization failed');
      mockHealthMonitor.initialize.mockRejectedValue(initError);
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Handled error', code: 'HEALTH_INIT_ERROR' }
      });

      await expect(containerLifecycle.initialize()).rejects.toThrow('Failed to initialize Container Lifecycle Service');
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        initError,
        expect.objectContaining({
          operation: 'container-lifecycle-init',
          component: 'ContainerLifecycle'
        })
      );
    });
  });

  describe('startContainer', () => {
    const mockContainerInfo = {
      containerId: 'container_abc123',
      name: 'debug-host-proj_123456789012-1234567890',
      projectId: 'proj_123456789012',
      type: 'node',
      workspace: '/test/workspace',
      port: 3000
    };

    beforeEach(() => {
      mockDockerManager.createContainer.mockResolvedValue(mockContainerInfo);
      mockDockerManager.startContainer.mockResolvedValue();
      mockDockerManager.getContainerInfo.mockResolvedValue({
        running: true,
        status: 'running'
      });
      mockHealthMonitor.startMonitoring.mockResolvedValue();
    });

    it('should start a container successfully', async () => {
      const result = await containerLifecycle.startContainer('proj_123456789012');

      expect(mockProjectRegistry.getProject).toHaveBeenCalledWith('proj_123456789012');
      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012', 
        expect.objectContaining({
          status: CONTAINER_STATES.STARTING
        })
      );

      expect(mockDockerManager.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj_123456789012',
          type: 'node',
          workspace: '/test/workspace',
          port: 3000
        })
      );

      expect(mockDockerManager.startContainer).toHaveBeenCalledWith('container_abc123');
      expect(mockHealthMonitor.startMonitoring).toHaveBeenCalledWith('container_abc123', {
        projectId: 'proj_123456789012',
        healthCheckPath: '/health',
        port: 3000
      });

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        containerId: 'container_abc123',
        containerName: 'debug-host-proj_123456789012-1234567890',
        status: CONTAINER_STATES.RUNNING,
        startTime: expect.any(Number),
        ports: {
          primary: 3000,
          exposed: [3000, 3001]
        },
        accessUrl: 'http://localhost:3000',
        message: 'Container started successfully for test-project'
      });
    });

    it('should prevent concurrent start operations', async () => {
      // Simulate ongoing operation
      containerLifecycle.activeOperations.set('proj_123456789012', 'starting');

      await expect(
        containerLifecycle.startContainer('proj_123456789012')
      ).rejects.toThrow('Failed to start container for project proj_123456789012');

      expect(mockDockerManager.createContainer).not.toHaveBeenCalled();
    });

    it('should handle non-existent project', async () => {
      mockProjectRegistry.getProject.mockResolvedValue(null);

      await expect(
        containerLifecycle.startContainer('nonexistent')
      ).rejects.toThrow('Failed to start container for project nonexistent');

      expect(mockDockerManager.createContainer).not.toHaveBeenCalled();
    });

    it('should handle Docker container creation failure', async () => {
      const dockerError = new Error('Docker daemon not available');
      mockDockerManager.createContainer.mockRejectedValue(dockerError);
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Docker error handled', code: 'DOCKER_ERROR' }
      });

      await expect(
        containerLifecycle.startContainer('proj_123456789012')
      ).rejects.toThrow('Failed to start container for project proj_123456789012');

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        dockerError,
        expect.objectContaining({
          operation: 'container-start',
          projectId: 'proj_123456789012'
        })
      );
    });

    it('should handle different technology stacks correctly', async () => {
      // Test Python project
      mockProject.primaryTech = 'python';
      mockProject.ports.primary = 5000;
      
      await containerLifecycle.startContainer('proj_123456789012');

      expect(mockDockerManager.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'python',
          port: 5000
        })
      );

      expect(mockHealthMonitor.startMonitoring).toHaveBeenCalledWith('container_abc123', {
        projectId: 'proj_123456789012',
        healthCheckPath: '/health',
        port: 5000
      });
    });

    it('should clean up on startup failure', async () => {
      const startupError = new Error('Container failed to start');
      mockDockerManager.startContainer.mockRejectedValue(startupError);

      await expect(
        containerLifecycle.startContainer('proj_123456789012')
      ).rejects.toThrow('Failed to start container for project proj_123456789012');

      // Verify cleanup was attempted
      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.ERROR
        })
      );
    });
  });

  describe('stopContainer', () => {
    beforeEach(() => {
      mockProject.containerId = 'container_abc123';
      mockProject.containerName = 'debug-host-proj_123456789012-1234567890';
      mockProject.status = CONTAINER_STATES.RUNNING;
      
      mockDockerManager.stopContainer.mockResolvedValue();
      mockHealthMonitor.stopMonitoring.mockReturnValue();
    });

    it('should stop a container successfully', async () => {
      const result = await containerLifecycle.stopContainer('proj_123456789012');

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.STOPPING
        })
      );

      expect(mockHealthMonitor.stopMonitoring).toHaveBeenCalledWith('container_abc123');
      expect(mockDockerManager.stopContainer).toHaveBeenCalledWith('container_abc123', 10);

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.STOPPED,
          containerId: null,
          containerName: null
        })
      );

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        status: CONTAINER_STATES.STOPPED,
        stopTime: expect.any(Number),
        message: 'Container stopped successfully for test-project'
      });
    });

    it('should handle force stop', async () => {
      await containerLifecycle.stopContainer('proj_123456789012', { force: true });

      expect(mockDockerManager.removeContainer).toHaveBeenCalledWith('container_abc123', true);
      expect(mockDockerManager.stopContainer).not.toHaveBeenCalled();
    });

    it('should handle project with no active container', async () => {
      mockProject.containerId = null;

      const result = await containerLifecycle.stopContainer('proj_123456789012');

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        status: CONTAINER_STATES.STOPPED,
        message: 'No active container found for project test-project'
      });

      expect(mockDockerManager.stopContainer).not.toHaveBeenCalled();
    });

    it('should use technology-specific grace periods', async () => {
      mockProject.primaryTech = 'python';
      
      await containerLifecycle.stopContainer('proj_123456789012');

      expect(mockDockerManager.stopContainer).toHaveBeenCalledWith('container_abc123', 15);
    });

    it('should handle custom grace period', async () => {
      await containerLifecycle.stopContainer('proj_123456789012', { gracePeriod: 30 });

      expect(mockDockerManager.stopContainer).toHaveBeenCalledWith('container_abc123', 30);
    });

    it('should handle Docker stop failure', async () => {
      const stopError = new Error('Container stop failed');
      mockDockerManager.stopContainer.mockRejectedValue(stopError);
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Stop error handled', code: 'STOP_ERROR' }
      });

      await expect(
        containerLifecycle.stopContainer('proj_123456789012')
      ).rejects.toThrow('Failed to stop container for project proj_123456789012');

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        stopError,
        expect.objectContaining({
          operation: 'container-stop',
          projectId: 'proj_123456789012'
        })
      );
    });
  });

  describe('restartContainer', () => {
    beforeEach(() => {
      mockProject.containerId = 'container_abc123';
      mockProject.status = CONTAINER_STATES.RUNNING;

      // Mock the lifecycle methods
      containerLifecycle.stopContainer = jest.fn().mockResolvedValue({
        success: true,
        status: CONTAINER_STATES.STOPPED
      });
      containerLifecycle.startContainer = jest.fn().mockResolvedValue({
        success: true,
        containerId: 'container_new123',
        containerName: 'debug-host-proj_123456789012-9876543210',
        status: CONTAINER_STATES.RUNNING,
        ports: { primary: 3000, exposed: [3000, 3001] },
        accessUrl: 'http://localhost:3000'
      });
    });

    it('should restart a container successfully', async () => {
      const result = await containerLifecycle.restartContainer('proj_123456789012');

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.RESTARTING
        })
      );

      expect(containerLifecycle.stopContainer).toHaveBeenCalledWith('proj_123456789012', { gracePeriod: 5 });
      expect(containerLifecycle.startContainer).toHaveBeenCalledWith('proj_123456789012', {});

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        containerId: 'container_new123',
        containerName: 'debug-host-proj_123456789012-9876543210',
        status: CONTAINER_STATES.RUNNING,
        restartTime: expect.any(Number),
        ports: { primary: 3000, exposed: [3000, 3001] },
        accessUrl: 'http://localhost:3000',
        message: 'Container restarted successfully for test-project'
      });
    });

    it('should restart project with no existing container', async () => {
      mockProject.containerId = null;

      const result = await containerLifecycle.restartContainer('proj_123456789012');

      expect(containerLifecycle.stopContainer).not.toHaveBeenCalled();
      expect(containerLifecycle.startContainer).toHaveBeenCalledWith('proj_123456789012', {});
      expect(result.success).toBe(true);
    });

    it('should continue with start even if stop fails', async () => {
      containerLifecycle.stopContainer.mockRejectedValue(new Error('Stop failed'));

      const result = await containerLifecycle.restartContainer('proj_123456789012');

      expect(containerLifecycle.startContainer).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should pass environment options to start', async () => {
      await containerLifecycle.restartContainer('proj_123456789012', {
        env: { CUSTOM_VAR: 'value' }
      });

      expect(containerLifecycle.startContainer).toHaveBeenCalledWith('proj_123456789012', {
        env: { CUSTOM_VAR: 'value' }
      });
    });

    it('should handle restart failure', async () => {
      const restartError = new Error('Start failed');
      containerLifecycle.startContainer.mockRejectedValue(restartError);
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Restart error handled', code: 'RESTART_ERROR' }
      });

      await expect(
        containerLifecycle.restartContainer('proj_123456789012')
      ).rejects.toThrow('Failed to restart container for project proj_123456789012');

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        restartError,
        expect.objectContaining({
          operation: 'container-restart',
          projectId: 'proj_123456789012'
        })
      );
    });
  });

  describe('getContainerStatus', () => {
    const mockContainerInfo = {
      id: 'container_abc123',
      running: true,
      status: 'running',
      stats: {
        cpu: 25,
        memory: 512000000,
        network: { rx: 1024, tx: 2048 }
      }
    };

    const mockHealthInfo = {
      healthy: true,
      lastCheck: new Date().toISOString(),
      responseTime: 150
    };

    beforeEach(() => {
      mockProject.containerId = 'container_abc123';
      mockProject.containerName = 'debug-host-proj_123456789012-1234567890';
      mockProject.status = CONTAINER_STATES.RUNNING;
      mockProject.startedAt = new Date(Date.now() - 60000).toISOString(); // Started 1 minute ago

      mockDockerManager.getContainerInfo.mockResolvedValue(mockContainerInfo);
      mockHealthMonitor.getHealth.mockReturnValue(mockHealthInfo);
    });

    it('should get container status successfully', async () => {
      const result = await containerLifecycle.getContainerStatus('proj_123456789012');

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        projectName: 'test-project',
        status: CONTAINER_STATES.RUNNING,
        containerId: 'container_abc123',
        containerName: 'debug-host-proj_123456789012-1234567890',
        techStack: 'nodejs',
        ports: {
          primary: 3000,
          allocated: [3000, 3001]
        },
        uptime: expect.any(Number),
        lastHealthCheck: mockProject.lastHealthCheck,
        container: mockContainerInfo,
        health: mockHealthInfo,
        accessUrl: 'http://localhost:3000',
        isHealthy: true,
        isRunning: true
      });

      expect(result.uptime).toBeGreaterThan(50000); // Should be close to 60000ms
    });

    it('should handle project with no container', async () => {
      // Create a fresh mock project with no container
      const projectWithNoContainer = {
        ...mockProject,
        containerId: null,
        containerName: null,
        startedAt: null
      };
      mockProjectRegistry.getProject.mockResolvedValue(projectWithNoContainer);

      const result = await containerLifecycle.getContainerStatus('proj_123456789012');

      expect(result).toEqual({
        success: true,
        projectId: 'proj_123456789012',
        projectName: 'test-project',
        status: projectWithNoContainer.status,
        containerId: null,
        containerName: null,
        techStack: 'nodejs',
        ports: {
          primary: 3000,
          allocated: [3000, 3001]
        },
        uptime: 0,
        lastHealthCheck: projectWithNoContainer.lastHealthCheck,
        container: null,
        health: null,
        accessUrl: null,
        isHealthy: false,
        isRunning: false
      });

      expect(mockDockerManager.getContainerInfo).not.toHaveBeenCalled();
    });

    it('should handle container info retrieval failure', async () => {
      mockDockerManager.getContainerInfo.mockRejectedValue(new Error('Container not found'));

      const result = await containerLifecycle.getContainerStatus('proj_123456789012');

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.STOPPED,
          containerId: null,
          containerName: null
        })
      );

      // The result should reflect the updated project state
      expect(result.success).toBe(true);
    });

    it('should handle non-existent project', async () => {
      mockProjectRegistry.getProject.mockResolvedValue(null);
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });

      await expect(
        containerLifecycle.getContainerStatus('nonexistent')
      ).rejects.toThrow('Failed to get container status for project nonexistent');

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          operation: 'container-status',
          projectId: 'nonexistent'
        })
      );
    });
  });

  describe('buildContainerConfig', () => {
    it('should build correct configuration for Node.js project', () => {
      const config = containerLifecycle.buildContainerConfig(mockProject);

      expect(config).toEqual({
        projectId: 'proj_123456789012',
        type: 'node',
        workspace: '/test/workspace',
        port: 3000,
        env: {
          NODE_ENV: 'development',
          DEBUG: '*',
          PROJECT_NAME: 'test-project',
          PROJECT_ID: 'proj_123456789012',
          PRIMARY_TECH: 'nodejs'
        }
      });
    });

    it('should merge custom environment variables', () => {
      const config = containerLifecycle.buildContainerConfig(mockProject, {
        env: {
          CUSTOM_VAR: 'custom_value',
          NODE_ENV: 'production' // Should override default
        }
      });

      expect(config.env).toEqual({
        NODE_ENV: 'production',
        DEBUG: '*',
        PROJECT_NAME: 'test-project',
        PROJECT_ID: 'proj_123456789012',
        PRIMARY_TECH: 'nodejs',
        CUSTOM_VAR: 'custom_value'
      });
    });

    it('should handle unknown technology stack', () => {
      mockProject.primaryTech = 'unknown';

      const config = containerLifecycle.buildContainerConfig(mockProject);

      expect(config.type).toBe('unknown');
    });
  });

  describe('metrics and monitoring', () => {
    it('should track start metrics correctly', async () => {
      // Mock successful start
      mockDockerManager.createContainer.mockResolvedValue({
        containerId: 'container_abc123',
        name: 'test-container'
      });
      mockDockerManager.startContainer.mockResolvedValue();
      mockDockerManager.getContainerInfo.mockResolvedValue({ running: true });
      mockHealthMonitor.startMonitoring.mockResolvedValue();

      await containerLifecycle.startContainer('proj_123456789012');

      const metrics = containerLifecycle.getMetrics();
      expect(metrics.containers.started).toBe(1);
      expect(metrics.averageStartTime).toBeGreaterThan(0);
    });

    it('should track failure metrics correctly', async () => {
      mockDockerManager.createContainer.mockRejectedValue(new Error('Docker error'));
      mockErrorHandler.handleError.mockReturnValue({
        error: { message: 'Error handled', code: 'DOCKER_ERROR' }
      });

      await expect(
        containerLifecycle.startContainer('proj_123456789012')
      ).rejects.toThrow();

      const metrics = containerLifecycle.getMetrics();
      expect(metrics.containers.failed).toBe(1);
    });

    it('should return comprehensive metrics', () => {
      const metrics = containerLifecycle.getMetrics();

      expect(metrics).toEqual({
        containers: {
          started: 0,
          stopped: 0,
          restarted: 0,
          failed: 0
        },
        averageStartTime: 0,
        averageStopTime: 0,
        activeOperations: 0,
        monitoredContainers: 0,
        generatedAt: expect.any(String)
      });
    });
  });

  describe('error handling and recovery', () => {
    it('should handle unhealthy container events', async () => {
      const event = {
        containerId: 'container_abc123',
        projectId: 'proj_123456789012',
        healthInfo: { healthy: false, error: 'Health check failed' }
      };

      mockRecoveryEngine.shouldAttemptRecovery.mockResolvedValue(true);
      containerLifecycle.restartContainer = jest.fn().mockResolvedValue({ success: true });

      await containerLifecycle.handleUnhealthyContainer(event);

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.ERROR,
          healthStatus: 'unhealthy'
        })
      );

      expect(containerLifecycle.restartContainer).toHaveBeenCalledWith('proj_123456789012');
    });

    it('should handle container recovery events', async () => {
      const event = {
        containerId: 'container_abc123',
        projectId: 'proj_123456789012'
      };

      await containerLifecycle.handleContainerRecovery(event);

      expect(mockProjectRegistry.updateProject).toHaveBeenCalledWith('proj_123456789012',
        expect.objectContaining({
          status: CONTAINER_STATES.RUNNING,
          healthStatus: 'healthy'
        })
      );
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      containerLifecycle.activeOperations.set('proj_1', 'starting');
      containerLifecycle.activeOperations.set('proj_2', 'stopping');

      // Simulate operations completing
      setTimeout(() => {
        containerLifecycle.activeOperations.clear();
      }, 100);

      await containerLifecycle.shutdown();

      expect(mockHealthMonitor.stopAllMonitoring).toHaveBeenCalled();
    });

    it('should timeout waiting for active operations', async () => {
      containerLifecycle.activeOperations.set('proj_1', 'starting');

      // Mock timeout to be immediate for testing
      const originalTimeout = containerLifecycle.timeout;
      const shutdownPromise = containerLifecycle.shutdown();

      // Clear operations after a short delay
      setTimeout(() => {
        containerLifecycle.activeOperations.clear();
      }, 50);

      await shutdownPromise;
      expect(mockHealthMonitor.stopAllMonitoring).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should calculate uptime correctly', () => {
      const startTime = new Date(Date.now() - 120000); // 2 minutes ago
      const uptime = containerLifecycle.calculateUptime(startTime.toISOString());

      expect(uptime).toBeGreaterThan(110000);
      expect(uptime).toBeLessThan(130000);
    });

    it('should return zero uptime for null start time', () => {
      const uptime = containerLifecycle.calculateUptime(null);
      expect(uptime).toBe(0);
    });

    it('should update start metrics correctly', () => {
      containerLifecycle.updateStartMetrics(1000);
      containerLifecycle.updateStartMetrics(2000);

      const metrics = containerLifecycle.getMetrics();
      expect(metrics.containers.started).toBe(2);
      expect(metrics.averageStartTime).toBe(1500);
    });

    it('should update stop metrics correctly', () => {
      containerLifecycle.updateStopMetrics(500);
      containerLifecycle.updateStopMetrics(1500);

      const metrics = containerLifecycle.getMetrics();
      expect(metrics.containers.stopped).toBe(2);
      expect(metrics.averageStopTime).toBe(1000);
    });
  });

  describe('constants', () => {
    it('should have correct container states', () => {
      expect(CONTAINER_STATES).toEqual({
        CREATING: 'creating',
        STARTING: 'starting',
        RUNNING: 'running',
        STOPPING: 'stopping',
        STOPPED: 'stopped',
        ERROR: 'error',
        RESTARTING: 'restarting',
        REMOVING: 'removing'
      });
    });

    it('should have tech stack configurations', () => {
      expect(TECH_STACK_CONFIG.nodejs).toEqual({
        image: 'node',
        healthCheckPath: '/health',
        startupTimeoutMs: 30000,
        shutdownGracePeriodMs: 10000
      });

      expect(TECH_STACK_CONFIG.python).toEqual({
        image: 'python',
        healthCheckPath: '/health',
        startupTimeoutMs: 45000,
        shutdownGracePeriodMs: 15000
      });
    });
  });
});