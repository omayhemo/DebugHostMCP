/**
 * Unit tests for DockerManager with mocked Docker API
 */

const DockerManager = require('../../src/docker-manager');
const PathNormalizer = require('../../src/utils/path-normalizer');

// Mock dockerode
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn(),
    createNetwork: jest.fn(),
    listNetworks: jest.fn(),
    getNetwork: jest.fn(),
    createContainer: jest.fn(),
    getContainer: jest.fn(),
    listContainers: jest.fn()
  }));
});

describe('DockerManager', () => {
  let dockerManager;
  let mockDocker;
  let mockContainer;
  let mockNetwork;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instances
    dockerManager = new DockerManager();
    mockDocker = dockerManager.docker;
    
    // Set up common mock objects
    mockContainer = {
      id: 'mock-container-id',
      start: jest.fn().mockResolvedValue({}),
      stop: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue({}),
      inspect: jest.fn().mockResolvedValue({
        Id: 'mock-container-id',
        Name: '/test-container',
        State: {
          Status: 'running',
          Running: true,
          ExitCode: 0,
          StartedAt: '2025-01-01T00:00:00Z',
          FinishedAt: '0001-01-01T00:00:00Z'
        },
        Config: { Labels: {} },
        RestartCount: 0
      }),
      stats: jest.fn().mockResolvedValue({
        cpu_stats: {
          cpu_usage: { total_usage: 1000000 },
          system_cpu_usage: 10000000,
          online_cpus: 2
        },
        precpu_stats: {
          cpu_usage: { total_usage: 900000 },
          system_cpu_usage: 9500000
        },
        memory_stats: {
          usage: 1024 * 1024 * 100, // 100MB
          limit: 1024 * 1024 * 1024  // 1GB
        },
        networks: {
          'debug-host-network': {
            rx_bytes: 1024,
            tx_bytes: 2048
          }
        }
      }),
      logs: jest.fn().mockResolvedValue('Mock log output')
    };

    mockNetwork = {
      connect: jest.fn().mockResolvedValue({}),
      disconnect: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue({}),
      inspect: jest.fn().mockResolvedValue({
        Labels: { 'debug-host': 'true' }
      })
    };

    // Set up default mock implementations
    mockDocker.ping.mockResolvedValue({});
    mockDocker.createContainer.mockResolvedValue(mockContainer);
    mockDocker.getContainer.mockReturnValue(mockContainer);
    mockDocker.getNetwork.mockReturnValue(mockNetwork);
    mockDocker.listNetworks.mockResolvedValue([{
      Id: 'mock-network-id',
      Name: 'debug-host-network',
      IPAM: {
        Config: [{ Subnet: '172.28.0.0/16' }]
      }
    }]);
    mockDocker.listContainers.mockResolvedValue([]);
  });

  describe('initialization', () => {
    test('should initialize successfully with Docker available', async () => {
      await expect(dockerManager.initialize()).resolves.toBeUndefined();
      
      expect(mockDocker.ping).toHaveBeenCalled();
      expect(mockDocker.listNetworks).toHaveBeenCalled();
    });

    test('should handle Docker unavailable with retries', async () => {
      mockDocker.ping.mockRejectedValue(new Error('Docker not running'));
      
      await expect(dockerManager.initialize()).rejects.toThrow('Docker unavailable');
      
      expect(mockDocker.ping).toHaveBeenCalledTimes(3);
    });

    test('should clean up orphaned containers on initialization', async () => {
      mockDocker.listContainers.mockResolvedValue([
        {
          Id: 'orphan-1',
          State: 'exited',
          Names: ['/debug-host-orphan-1']
        }
      ]);

      await dockerManager.initialize();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });
  });

  describe('container creation', () => {
    beforeEach(async () => {
      await dockerManager.initialize();
    });

    test('should create container with valid configuration', async () => {
      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: '/home/user/project',
        port: 3000,
        env: { NODE_ENV: 'development' }
      };

      const result = await dockerManager.createContainer(config);

      expect(result).toHaveProperty('containerId', 'mock-container-id');
      expect(result).toHaveProperty('projectId', 'test-project');
      expect(result).toHaveProperty('type', 'node');
      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: 'debug-host/node:latest',
          Env: expect.arrayContaining([
            'PORT=3000',
            'PROJECT_ID=test-project',
            'DEBUG_HOST=true',
            'NODE_ENV=development'
          ]),
          Labels: expect.objectContaining({
            'debug-host': 'true',
            'project-id': 'test-project',
            'container-type': 'node'
          })
        })
      );
    });

    test('should normalize Windows paths for container creation', async () => {
      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: 'C:\\Users\\Developer\\project',
        port: 3000
      };

      await dockerManager.createContainer(config);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Binds: ['/mnt/c/Users/Developer/project:/app']
          })
        })
      );
    });

    test('should validate container configuration', async () => {
      const invalidConfigs = [
        { projectId: '', type: 'node', workspace: '/path', port: 3000 },
        { projectId: 'test', type: 'invalid', workspace: '/path', port: 3000 },
        { projectId: 'test', type: 'node', workspace: '', port: 3000 },
        { projectId: 'test', type: 'node', workspace: '/path', port: 0 },
        { projectId: 'test', type: 'node', workspace: '/path', port: 70000 }
      ];

      for (const config of invalidConfigs) {
        await expect(dockerManager.createContainer(config))
          .rejects.toThrow();
      }
    });

    test('should handle container creation failure', async () => {
      mockDocker.createContainer.mockRejectedValue(new Error('Image not found'));

      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: '/home/user/project',
        port: 3000
      };

      await expect(dockerManager.createContainer(config)).rejects.toThrow('Image not found');
    });
  });

  describe('container lifecycle', () => {
    let containerId;

    beforeEach(async () => {
      await dockerManager.initialize();
      
      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: '/home/user/project',
        port: 3000
      };
      
      const result = await dockerManager.createContainer(config);
      containerId = result.containerId;
    });

    test('should start container successfully', async () => {
      await dockerManager.startContainer(containerId);

      expect(mockContainer.start).toHaveBeenCalled();
      expect(mockContainer.inspect).toHaveBeenCalled();
    });

    test('should stop container gracefully', async () => {
      mockContainer.inspect.mockResolvedValue({
        ...mockContainer.inspect(),
        State: { ...mockContainer.inspect().State, Status: 'exited', Running: false }
      });

      await dockerManager.stopContainer(containerId, 5);

      expect(mockContainer.stop).toHaveBeenCalledWith({ t: 5 });
    });

    test('should handle already stopped container', async () => {
      mockContainer.stop.mockRejectedValue({ statusCode: 304 });

      await expect(dockerManager.stopContainer(containerId))
        .resolves.toBeUndefined();
    });

    test('should restart container', async () => {
      mockContainer.inspect.mockResolvedValueOnce({
        ...mockContainer.inspect(),
        State: { ...mockContainer.inspect().State, Status: 'exited', Running: false }
      });

      await dockerManager.restartContainer(containerId);

      expect(mockContainer.stop).toHaveBeenCalled();
      expect(mockContainer.start).toHaveBeenCalled();
    });

    test('should remove container', async () => {
      mockContainer.inspect.mockResolvedValue({
        ...mockContainer.inspect(),
        State: { ...mockContainer.inspect().State, Status: 'exited', Running: false }
      });

      await dockerManager.removeContainer(containerId);

      expect(mockContainer.remove).toHaveBeenCalled();
    });

    test('should force remove running container', async () => {
      await dockerManager.removeContainer(containerId, true);

      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });
  });

  describe('container monitoring', () => {
    let containerId;

    beforeEach(async () => {
      await dockerManager.initialize();
      
      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: '/home/user/project',
        port: 3000
      };
      
      const result = await dockerManager.createContainer(config);
      containerId = result.containerId;
    });

    test('should get container information', async () => {
      const info = await dockerManager.getContainerInfo(containerId);

      expect(info).toHaveProperty('id', containerId);
      expect(info).toHaveProperty('projectId', 'test-project');
      expect(info).toHaveProperty('status', 'running');
    });

    test('should get container stats for running container', async () => {
      const info = await dockerManager.getContainerInfo(containerId);

      expect(info.stats).toBeDefined();
      expect(info.stats.cpu).toBeDefined();
      expect(info.stats.memory).toBeDefined();
    });

    test('should list all containers', async () => {
      const containers = await dockerManager.listContainers();

      expect(containers).toHaveLength(1);
      expect(containers[0]).toHaveProperty('id', containerId);
    });

    test('should handle container not found', async () => {
      mockContainer.inspect.mockRejectedValue({ statusCode: 404 });

      await expect(dockerManager.getContainerInfo('nonexistent'))
        .rejects.toThrow('Container nonexistent not found');
    });
  });

  describe('network management', () => {
    beforeEach(async () => {
      await dockerManager.initialize();
    });

    test('should ensure network exists', async () => {
      expect(mockDocker.listNetworks).toHaveBeenCalledWith({
        filters: { name: ['debug-host-network'] }
      });
    });

    test('should create network if not exists', async () => {
      mockDocker.listNetworks.mockResolvedValue([]);
      
      await dockerManager.network.ensureNetwork();

      expect(mockDocker.createNetwork).toHaveBeenCalledWith({
        Name: 'debug-host-network',
        Driver: 'bridge',
        IPAM: {
          Driver: 'default',
          Config: [{
            Subnet: '172.28.0.0/16',
            Gateway: '172.28.0.1'
          }]
        },
        Labels: expect.objectContaining({
          'debug-host': 'true'
        })
      });
    });

    test('should validate existing network configuration', async () => {
      // Network exists with correct config - should not create new one
      await dockerManager.network.ensureNetwork();

      expect(mockDocker.createNetwork).not.toHaveBeenCalled();
    });
  });

  describe('path normalization', () => {
    test('should normalize Windows paths correctly', () => {
      const testPaths = [
        ['C:\\Users\\Developer\\project', '/mnt/c/Users/Developer/project'],
        ['D:\\Code\\myapp', '/mnt/d/Code/myapp'],
        ['c:\\temp\\test', '/mnt/c/temp/test']
      ];

      testPaths.forEach(([input, expected]) => {
        const result = PathNormalizer.normalizeWorkspacePath(input);
        expect(result).toBe(expected);
      });
    });

    test('should validate Docker paths', () => {
      const validPaths = ['/home/user/project', '/mnt/c/Code/app'];
      const invalidPaths = ['relative/path', 'C:\\Windows\\path', '/path/../other'];

      validPaths.forEach(path => {
        expect(PathNormalizer.isValidDockerPath(path)).toBe(true);
      });

      invalidPaths.forEach(path => {
        expect(PathNormalizer.isValidDockerPath(path)).toBe(false);
      });
    });

    test('should handle path normalization errors', () => {
      expect(() => PathNormalizer.normalizeWorkspacePath(''))
        .toThrow('Workspace path must be a non-empty string');
      
      expect(() => PathNormalizer.normalizeWorkspacePath('relative/path'))
        .toThrow('Workspace path must be absolute');
    });
  });

  describe('shutdown', () => {
    let containerId;

    beforeEach(async () => {
      await dockerManager.initialize();
      
      const config = {
        projectId: 'test-project',
        type: 'node',
        workspace: '/home/user/project',
        port: 3000
      };
      
      const result = await dockerManager.createContainer(config);
      containerId = result.containerId;
      await dockerManager.startContainer(containerId);
    });

    test('should shutdown gracefully', async () => {
      mockContainer.inspect.mockResolvedValue({
        ...mockContainer.inspect(),
        State: { ...mockContainer.inspect().State, Status: 'exited', Running: false }
      });

      await dockerManager.shutdown();

      expect(mockContainer.stop).toHaveBeenCalled();
    });

    test('should handle errors during shutdown', async () => {
      mockContainer.stop.mockRejectedValue(new Error('Stop failed'));

      // Should not throw - handles errors gracefully
      await expect(dockerManager.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await dockerManager.initialize();
    });

    test('should handle Docker connection timeout', async () => {
      const timeoutDocker = new DockerManager();
      timeoutDocker.docker.ping.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      );

      await expect(timeoutDocker.testDockerConnection()).rejects.toThrow('timeout');
    });

    test('should handle network creation conflicts', async () => {
      mockDocker.createNetwork.mockRejectedValue({ statusCode: 409 });
      mockDocker.listNetworks.mockResolvedValue([]);

      await expect(dockerManager.network.createNetwork())
        .rejects.toThrow('already exists with conflicting configuration');
    });

    test('should handle container operation on non-managed container', async () => {
      const unmanagedId = 'unmanaged-container';
      
      await expect(dockerManager.startContainer(unmanagedId))
        .rejects.toThrow('not managed by this instance');
    });
  });
});