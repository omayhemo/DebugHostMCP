const fs = require('fs').promises;
const path = require('path');
const net = require('net');
const PortRegistry = require('../../src/port-registry');

describe('PortRegistry Integration Tests', () => {
  let portRegistry;
  let testDataPath;
  let testServers = [];

  beforeEach(async () => {
    // Create unique test data file
    const testId = Date.now().toString(36);
    testDataPath = path.join(__dirname, '../fixtures', `test-ports-${testId}.json`);
    
    // Ensure fixtures directory exists
    await fs.mkdir(path.dirname(testDataPath), { recursive: true });
    
    portRegistry = new PortRegistry(testDataPath);
    await portRegistry.initialize();
    
    // Clear test servers
    testServers = [];
  });

  afterEach(async () => {
    // Close all test servers
    for (const server of testServers) {
      if (server && server.listening) {
        await new Promise((resolve) => {
          server.close(resolve);
        });
      }
    }
    testServers = [];

    // Clean up test data file
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  /**
   * Helper function to create a test server on a port
   */
  const createTestServer = (port) => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.once('error', reject);
      server.once('listening', () => {
        testServers.push(server);
        resolve(server);
      });
      
      server.listen(port, '127.0.0.1');
    });
  };

  describe('Port Allocation Workflow', () => {
    it('should allocate and release ports correctly', async () => {
      // Allocate a port
      const allocateResult = await portRegistry.allocatePort(3000, 'node', 'test-app');
      expect(allocateResult.success).toBe(true);
      expect(allocateResult.port).toBe(3000);

      // Verify allocation exists
      const allocation = portRegistry.getPortAllocation(3000);
      expect(allocation).toBeDefined();
      expect(allocation.projectName).toBe('test-app');

      // Release the port
      const releaseResult = await portRegistry.releasePort(3000, allocateResult.projectId);
      expect(releaseResult.success).toBe(true);

      // Verify allocation is removed
      const releasedAllocation = portRegistry.getPortAllocation(3000);
      expect(releasedAllocation).toBeNull();
    });

    it('should handle auto-allocation for different project types', async () => {
      // Test Node.js allocation
      const nodeResult = await portRegistry.autoAllocatePort('node', 'node-app');
      expect(nodeResult.success).toBe(true);
      expect(nodeResult.port).toBeGreaterThanOrEqual(3000);
      expect(nodeResult.port).toBeLessThanOrEqual(3999);

      // Test Python allocation
      const pythonResult = await portRegistry.autoAllocatePort('python', 'python-app');
      expect(pythonResult.success).toBe(true);
      expect(pythonResult.port).toBeGreaterThanOrEqual(5000);
      expect(pythonResult.port).toBeLessThanOrEqual(5999);

      // Test Static allocation
      const staticResult = await portRegistry.autoAllocatePort('static', 'static-app');
      expect(staticResult.success).toBe(true);
      expect(staticResult.port).toBeGreaterThanOrEqual(4000);
      expect(staticResult.port).toBeLessThanOrEqual(4999);

      // Test PHP allocation
      const phpResult = await portRegistry.autoAllocatePort('php', 'php-app');
      expect(phpResult.success).toBe(true);
      expect(phpResult.port).toBeGreaterThanOrEqual(8080);
      expect(phpResult.port).toBeLessThanOrEqual(8980);

      // Verify all ports are different
      const ports = [nodeResult.port, pythonResult.port, staticResult.port, phpResult.port];
      const uniquePorts = [...new Set(ports)];
      expect(uniquePorts).toHaveLength(4);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts with allocated ports', async () => {
      // Allocate port 3000
      const firstResult = await portRegistry.allocatePort(3000, 'node', 'first-app');
      expect(firstResult.success).toBe(true);

      // Try to allocate same port
      const secondResult = await portRegistry.allocatePort(3000, 'node', 'second-app');
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe('PORT_IN_USE');
      expect(secondResult.details.conflictingProject).toBe(firstResult.projectId);
      expect(secondResult.suggestions).toBeInstanceOf(Array);
      expect(secondResult.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect conflicts with external processes', async () => {
      // Create a test server on port 3050
      const server = await createTestServer(3050);

      // Try to allocate the same port
      const result = await portRegistry.allocatePort(3050, 'node', 'test-app');
      expect(result.success).toBe(false);
      expect(result.error).toBe('PORT_IN_USE_EXTERNAL');
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Persistence and Recovery', () => {
    it('should persist allocations to file', async () => {
      // Allocate a port
      await portRegistry.allocatePort(3000, 'node', 'test-app', 'test-project-123');

      // Verify file exists and contains data
      const fileExists = await fs.access(testDataPath).then(() => true, () => false);
      expect(fileExists).toBe(true);

      const fileContent = await fs.readFile(testDataPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      expect(data.allocations).toBeDefined();
      expect(data.allocations['3000']).toBeDefined();
      expect(data.allocations['3000'].projectId).toBe('test-project-123');
      expect(data.allocations['3000'].projectName).toBe('test-app');
      expect(data.history).toBeInstanceOf(Array);
      expect(data.history.length).toBe(1);
    });

    it('should recover allocations after restart', async () => {
      // Allocate ports with first registry instance
      const projectId1 = await portRegistry.allocatePort(3000, 'node', 'app-1');
      const projectId2 = await portRegistry.autoAllocatePort('python', 'app-2');
      
      // Create new registry instance (simulating restart)
      const newRegistry = new PortRegistry(testDataPath);
      await newRegistry.initialize();

      // Verify allocations are restored
      const allocation1 = newRegistry.getPortAllocation(3000);
      expect(allocation1).toBeDefined();
      expect(allocation1.projectName).toBe('app-1');

      const allocation2 = newRegistry.getPortAllocation(projectId2.port);
      expect(allocation2).toBeDefined();
      expect(allocation2.projectName).toBe('app-2');

      // Verify history is restored
      const history = newRegistry.getHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('Project Management', () => {
    it('should manage multiple ports per project', async () => {
      const projectId = 'multi-port-project';

      // Allocate multiple ports for same project
      const port1 = await portRegistry.allocatePort(3000, 'node', 'multi-app', projectId);
      const port2 = await portRegistry.allocatePort(3001, 'node', 'multi-app', projectId);
      const port3 = await portRegistry.allocatePort(3002, 'node', 'multi-app', projectId);

      expect(port1.success).toBe(true);
      expect(port2.success).toBe(true);
      expect(port3.success).toBe(true);

      // Get all allocations for project
      const projectAllocations = portRegistry.getProjectAllocations(projectId);
      expect(projectAllocations).toHaveLength(3);
      expect(projectAllocations.map(a => a.port).sort()).toEqual([3000, 3001, 3002]);

      // Release all ports for project
      const releaseResult = await portRegistry.releaseProjectPorts(projectId);
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.count).toBe(3);
      expect(releaseResult.releasedPorts.sort()).toEqual([3000, 3001, 3002]);

      // Verify all ports are released
      expect(portRegistry.getPortAllocation(3000)).toBeNull();
      expect(portRegistry.getPortAllocation(3001)).toBeNull();
      expect(portRegistry.getPortAllocation(3002)).toBeNull();
    });
  });

  describe('System Port Protection', () => {
    it('should reject system port allocation attempts', async () => {
      const systemPorts = [2601, 2650, 2699];

      for (const port of systemPorts) {
        const result = await portRegistry.allocatePort(port, 'node', 'test-app');
        expect(result.success).toBe(false);
        expect(result.error).toBe('SYSTEM_RESERVED');
        expect(result.message).toContain('reserved for system use');
      }
    });
  });

  describe('Range Validation', () => {
    it('should enforce port ranges by project type', async () => {
      // Try to allocate Python port for Node.js project
      const nodeInPythonRange = await portRegistry.allocatePort(5000, 'node', 'test-app');
      expect(nodeInPythonRange.success).toBe(false);
      expect(nodeInPythonRange.error).toBe('PORT_OUT_OF_RANGE');

      // Try to allocate Node port for Python project
      const pythonInNodeRange = await portRegistry.allocatePort(3000, 'python', 'test-app');
      expect(pythonInNodeRange.success).toBe(false);
      expect(pythonInNodeRange.error).toBe('PORT_OUT_OF_RANGE');

      // Try to allocate Static port for PHP project
      const phpInStaticRange = await portRegistry.allocatePort(4000, 'php', 'test-app');
      expect(phpInStaticRange.success).toBe(false);
      expect(phpInStaticRange.error).toBe('PORT_OUT_OF_RANGE');
    });
  });

  describe('Suggestion Engine', () => {
    it('should provide meaningful suggestions on conflicts', async () => {
      // Allocate several ports to create conflicts
      await portRegistry.allocatePort(3000, 'node', 'app-1');
      await portRegistry.allocatePort(3001, 'node', 'app-2');
      await portRegistry.allocatePort(3002, 'node', 'app-3');

      // Try to allocate already used port
      const result = await portRegistry.allocatePort(3000, 'node', 'app-4');
      
      expect(result.success).toBe(false);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // All suggestions should be in valid range and available
      for (const suggestedPort of result.suggestions) {
        expect(suggestedPort).toBeGreaterThanOrEqual(3000);
        expect(suggestedPort).toBeLessThanOrEqual(3999);
        expect(portRegistry.getPortAllocation(suggestedPort)).toBeNull();
      }
    });
  });

  describe('History Management', () => {
    it('should track port allocation history', async () => {
      // Perform several operations
      const alloc1 = await portRegistry.allocatePort(3000, 'node', 'app-1');
      const alloc2 = await portRegistry.autoAllocatePort('python', 'app-2');
      await portRegistry.releasePort(3000, alloc1.projectId);
      
      const history = portRegistry.getHistory();
      
      expect(history.length).toBe(3);
      expect(history[0].action).toBe('allocate');
      expect(history[0].port).toBe(3000);
      expect(history[1].action).toBe('allocate');
      expect(history[1].port).toBe(alloc2.port);
      expect(history[2].action).toBe('release');
      expect(history[2].port).toBe(3000);
      
      // All entries should have timestamps
      history.forEach(entry => {
        expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    it('should limit history to 100 entries', async () => {
      // This test would be slow in practice, so we'll test the logic by manipulating internal state
      const originalMaxHistory = portRegistry.MAX_HISTORY;
      portRegistry.MAX_HISTORY = 5; // Temporarily reduce for testing

      // Add 7 history entries
      for (let i = 0; i < 7; i++) {
        portRegistry.addToHistory('allocate', 3000 + i, `proj-${i}`);
      }

      expect(portRegistry.registry.history.length).toBe(5);
      expect(portRegistry.registry.history[0].projectId).toBe('proj-2');
      expect(portRegistry.registry.history[4].projectId).toBe('proj-6');

      // Restore original limit
      portRegistry.MAX_HISTORY = originalMaxHistory;
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate registry statistics', async () => {
      // Allocate ports across different types
      await portRegistry.autoAllocatePort('node', 'node-app-1');
      await portRegistry.autoAllocatePort('node', 'node-app-2');
      await portRegistry.autoAllocatePort('python', 'python-app-1');
      await portRegistry.autoAllocatePort('static', 'static-app-1');

      const stats = portRegistry.getStats();

      expect(stats.totalAllocated).toBe(4);
      expect(stats.byType.node).toBe(2);
      expect(stats.byType.python).toBe(1);
      expect(stats.byType.static).toBe(1);
      expect(stats.byType.php).toBeUndefined();
      
      // Check range utilization
      expect(stats.rangeUtilization.node.allocated).toBe(2);
      expect(stats.rangeUtilization.node.total).toBe(1000);
      expect(stats.rangeUtilization.python.allocated).toBe(1);
      expect(stats.rangeUtilization.python.total).toBe(1000);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up orphaned allocations', async () => {
      // Allocate a port and then start/stop server to simulate cleanup scenario
      const allocResult = await portRegistry.allocatePort(3100, 'node', 'temp-app');
      expect(allocResult.success).toBe(true);

      // Verify allocation exists
      expect(portRegistry.getPortAllocation(3100)).toBeDefined();

      // Since port is not actually in use (no server running), cleanup should remove it
      const cleanupResult = await portRegistry.cleanupOrphanedAllocations();
      
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.orphanedPorts).toContain(3100);
      expect(portRegistry.getPortAllocation(3100)).toBeNull();

      // History should contain cleanup entry
      const history = portRegistry.getHistory();
      const cleanupEntry = history.find(entry => entry.action === 'cleanup' && entry.port === 3100);
      expect(cleanupEntry).toBeDefined();
    });

    it('should not cleanup ports that are actually in use', async () => {
      // Start a server on port 3101
      const server = await createTestServer(3101);
      
      // Allocate the same port (this should fail due to external process)
      const allocResult = await portRegistry.allocatePort(3101, 'node', 'external-app');
      expect(allocResult.success).toBe(false);
      
      // Manually add allocation to simulate edge case
      portRegistry.registry.allocations['3101'] = {
        projectId: 'manual-proj',
        projectName: 'manual-app',
        type: 'node',
        allocatedAt: new Date().toISOString()
      };
      
      // Cleanup should not remove the allocation since port is in use
      const cleanupResult = await portRegistry.cleanupOrphanedAllocations();
      
      expect(cleanupResult.orphanedPorts).not.toContain(3101);
      expect(portRegistry.getPortAllocation(3101)).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Create registry with invalid path to test error handling
      const invalidPath = '/invalid/path/that/does/not/exist/ports.json';
      const invalidRegistry = new PortRegistry(invalidPath);
      
      // Should initialize with empty registry despite file errors
      await invalidRegistry.initialize();
      expect(invalidRegistry.registry.allocations).toEqual({});
      expect(invalidRegistry.registry.history).toEqual([]);
      
      // Operations should still work in memory
      const allocResult = await invalidRegistry.allocatePort(3200, 'node', 'test-app');
      expect(allocResult.success).toBe(true);
      expect(invalidRegistry.getPortAllocation(3200)).toBeDefined();
    });

    it('should validate input parameters', async () => {
      // Test invalid project types
      const invalidTypeResult = await portRegistry.allocatePort(3000, 'invalid-type', 'test-app');
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error).toBe('INVALID_PROJECT_TYPE');

      // Test invalid port numbers
      const invalidPortResult = await portRegistry.allocatePort(-1, 'node', 'test-app');
      expect(invalidPortResult.success).toBe(false);
      expect(invalidPortResult.error).toBe('INVALID_PORT');
    });
  });
});