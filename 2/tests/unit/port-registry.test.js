const fs = require('fs').promises;
const path = require('path');
const PortRegistry = require('../../src/port-registry');
const PortChecker = require('../../src/utils/port-checker');
const AtomicFile = require('../../src/utils/atomic-file');

// Mock dependencies
jest.mock('../../src/utils/port-checker');
jest.mock('../../src/utils/atomic-file');

describe('PortRegistry', () => {
  let portRegistry;
  let testDataPath;

  beforeEach(() => {
    // Create test data path
    testDataPath = path.join(__dirname, '../fixtures/test-ports.json');
    portRegistry = new PortRegistry(testDataPath);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AtomicFile.readJSON to return empty registry
    AtomicFile.readJSON.mockResolvedValue({
      allocations: {},
      history: []
    });
    
    // Mock AtomicFile.writeJSON to succeed
    AtomicFile.writeJSON.mockResolvedValue();
    
    // Mock PortChecker.isValidPort
    PortChecker.isValidPort.mockImplementation((port) => {
      return Number.isInteger(port) && port >= 1 && port <= 65535;
    });
    
    // Mock PortChecker.isPortAvailable to return true by default
    PortChecker.isPortAvailable.mockResolvedValue(true);
    
    // Mock PortChecker.findAvailablePorts
    PortChecker.findAvailablePorts.mockResolvedValue([3001, 3002, 3003]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default data path', () => {
      const registry = new PortRegistry();
      expect(registry.dataPath).toContain('data/system/ports.json');
    });

    it('should initialize with custom data path', () => {
      const customPath = '/custom/path/ports.json';
      const registry = new PortRegistry(customPath);
      expect(registry.dataPath).toBe(customPath);
    });

    it('should have correct port ranges', () => {
      expect(portRegistry.PORT_RANGES).toEqual({
        system: { start: 2601, end: 2699 },
        node: { start: 3000, end: 3999 },
        static: { start: 4000, end: 4999 },
        python: { start: 5000, end: 5999 },
        php: { start: 8080, end: 8980 }
      });
    });
  });

  describe('initialize', () => {
    it('should load existing registry data', async () => {
      const existingData = {
        allocations: { '3000': { projectId: 'test', projectName: 'test-app', type: 'node' } },
        history: []
      };
      AtomicFile.readJSON.mockResolvedValue(existingData);

      await portRegistry.initialize();

      expect(portRegistry.registry).toEqual(existingData);
      expect(AtomicFile.readJSON).toHaveBeenCalledWith(testDataPath);
    });

    it('should initialize with empty registry on error', async () => {
      AtomicFile.readJSON.mockRejectedValue(new Error('File not found'));

      await portRegistry.initialize();

      expect(portRegistry.registry).toEqual({
        allocations: {},
        history: []
      });
    });

    it('should ensure registry has correct structure', async () => {
      AtomicFile.readJSON.mockResolvedValue({ allocations: null });

      await portRegistry.initialize();

      expect(portRegistry.registry.allocations).toEqual({});
      expect(portRegistry.registry.history).toEqual([]);
    });
  });

  describe('generateProjectId', () => {
    it('should generate unique project IDs', () => {
      const id1 = portRegistry.generateProjectId();
      const id2 = portRegistry.generateProjectId();

      expect(id1).toMatch(/^proj_[a-z0-9]+$/);
      expect(id2).toMatch(/^proj_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getPortRange', () => {
    it('should return correct range for valid project types', () => {
      expect(portRegistry.getPortRange('node')).toEqual({ start: 3000, end: 3999 });
      expect(portRegistry.getPortRange('python')).toEqual({ start: 5000, end: 5999 });
      expect(portRegistry.getPortRange('php')).toEqual({ start: 8080, end: 8980 });
      expect(portRegistry.getPortRange('static')).toEqual({ start: 4000, end: 4999 });
    });

    it('should handle case insensitive project types', () => {
      expect(portRegistry.getPortRange('NODE')).toEqual({ start: 3000, end: 3999 });
      expect(portRegistry.getPortRange('Python')).toEqual({ start: 5000, end: 5999 });
    });

    it('should throw error for invalid project type', () => {
      expect(() => portRegistry.getPortRange('invalid')).toThrow('Unknown project type: invalid');
    });
  });

  describe('isSystemPort', () => {
    it('should identify system ports correctly', () => {
      expect(portRegistry.isSystemPort(2601)).toBe(true);
      expect(portRegistry.isSystemPort(2650)).toBe(true);
      expect(portRegistry.isSystemPort(2699)).toBe(true);
      expect(portRegistry.isSystemPort(2600)).toBe(false);
      expect(portRegistry.isSystemPort(2700)).toBe(false);
      expect(portRegistry.isSystemPort(3000)).toBe(false);
    });
  });

  describe('allocatePort', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
    });

    it('should successfully allocate available port', async () => {
      PortChecker.isValidPort.mockReturnValue(true);
      PortChecker.isPortAvailable.mockResolvedValue(true);

      const result = await portRegistry.allocatePort(3000, 'node', 'test-app');

      expect(result.success).toBe(true);
      expect(result.port).toBe(3000);
      expect(result.projectId).toMatch(/^proj_/);
      expect(result.allocation.projectName).toBe('test-app');
      expect(result.allocation.type).toBe('node');
      expect(AtomicFile.writeJSON).toHaveBeenCalled();
    });

    it('should reject invalid port numbers', async () => {
      PortChecker.isValidPort.mockReturnValue(false);

      const result = await portRegistry.allocatePort(0, 'node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_PORT');
      expect(result.message).toContain('Invalid port number');
    });

    it('should reject system reserved ports', async () => {
      PortChecker.isValidPort.mockReturnValue(true);

      const result = await portRegistry.allocatePort(2650, 'node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('SYSTEM_RESERVED');
      expect(result.message).toContain('reserved for system use');
    });

    it('should reject ports outside valid range', async () => {
      PortChecker.isValidPort.mockReturnValue(true);

      const result = await portRegistry.allocatePort(5000, 'node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PORT_OUT_OF_RANGE');
      expect(result.message).toContain('outside valid range for node projects');
    });

    it('should reject already allocated ports', async () => {
      PortChecker.isValidPort.mockReturnValue(true);
      
      // Pre-allocate port
      portRegistry.registry.allocations['3000'] = {
        projectId: 'existing-proj',
        projectName: 'existing-app',
        type: 'node',
        allocatedAt: '2025-01-05T10:00:00Z'
      };

      const result = await portRegistry.allocatePort(3000, 'node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PORT_IN_USE');
      expect(result.message).toContain('already used by project "existing-app"');
      expect(result.details.conflictingProject).toBe('existing-proj');
      expect(result.suggestions).toEqual([3001, 3002, 3003]);
    });

    it('should reject ports in use by external processes', async () => {
      PortChecker.isValidPort.mockReturnValue(true);
      PortChecker.isPortAvailable.mockResolvedValue(false);

      const result = await portRegistry.allocatePort(3000, 'node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PORT_IN_USE_EXTERNAL');
      expect(result.message).toContain('in use by an external process');
      expect(result.suggestions).toEqual([3001, 3002, 3003]);
    });

    it('should use provided project ID', async () => {
      PortChecker.isValidPort.mockReturnValue(true);
      PortChecker.isPortAvailable.mockResolvedValue(true);

      const customId = 'custom-project-id';
      const result = await portRegistry.allocatePort(3000, 'node', 'test-app', customId);

      expect(result.success).toBe(true);
      expect(result.projectId).toBe(customId);
    });

    it('should add allocation to history', async () => {
      PortChecker.isValidPort.mockReturnValue(true);
      PortChecker.isPortAvailable.mockResolvedValue(true);

      await portRegistry.allocatePort(3000, 'node', 'test-app');

      expect(portRegistry.registry.history).toHaveLength(1);
      expect(portRegistry.registry.history[0].action).toBe('allocate');
      expect(portRegistry.registry.history[0].port).toBe(3000);
    });
  });

  describe('autoAllocatePort', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
    });

    it('should auto-allocate first available port', async () => {
      PortChecker.isPortAvailable.mockImplementation((port) => {
        return Promise.resolve(port === 3000);
      });

      const result = await portRegistry.autoAllocatePort('node', 'test-app');

      expect(result.success).toBe(true);
      expect(result.port).toBe(3000);
      expect(PortChecker.isPortAvailable).toHaveBeenCalledWith(3000);
    });

    it('should skip already allocated ports', async () => {
      // Pre-allocate port 3000
      portRegistry.registry.allocations['3000'] = {
        projectId: 'existing',
        projectName: 'existing-app',
        type: 'node'
      };

      PortChecker.isPortAvailable.mockImplementation((port) => {
        return Promise.resolve(port === 3001);
      });

      const result = await portRegistry.autoAllocatePort('node', 'test-app');

      expect(result.success).toBe(true);
      expect(result.port).toBe(3001);
      expect(PortChecker.isPortAvailable).not.toHaveBeenCalledWith(3000);
      expect(PortChecker.isPortAvailable).toHaveBeenCalledWith(3001);
    });

    it('should handle no available ports', async () => {
      PortChecker.isPortAvailable.mockResolvedValue(false);

      const result = await portRegistry.autoAllocatePort('node', 'test-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_AVAILABLE_PORTS');
      expect(result.message).toContain('No available ports in range');
    });
  });

  describe('releasePort', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
      // Pre-allocate a port
      portRegistry.registry.allocations['3000'] = {
        projectId: 'test-proj',
        projectName: 'test-app',
        type: 'node',
        allocatedAt: '2025-01-05T10:00:00Z'
      };
    });

    it('should successfully release allocated port', async () => {
      const result = await portRegistry.releasePort(3000);

      expect(result.success).toBe(true);
      expect(result.port).toBe(3000);
      expect(result.releasedAllocation.projectId).toBe('test-proj');
      expect(portRegistry.registry.allocations['3000']).toBeUndefined();
      expect(AtomicFile.writeJSON).toHaveBeenCalled();
    });

    it('should verify project ID when provided', async () => {
      const result = await portRegistry.releasePort(3000, 'test-proj');

      expect(result.success).toBe(true);
    });

    it('should reject mismatched project ID', async () => {
      const result = await portRegistry.releasePort(3000, 'wrong-proj');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_MISMATCH');
      expect(portRegistry.registry.allocations['3000']).toBeDefined();
    });

    it('should reject releasing non-allocated port', async () => {
      const result = await portRegistry.releasePort(4000);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PORT_NOT_ALLOCATED');
    });

    it('should add release to history', async () => {
      await portRegistry.releasePort(3000);

      const historyEntry = portRegistry.registry.history[0];
      expect(historyEntry.action).toBe('release');
      expect(historyEntry.port).toBe(3000);
      expect(historyEntry.projectId).toBe('test-proj');
    });
  });

  describe('getSuggestions', () => {
    it('should return available port suggestions', async () => {
      PortChecker.findAvailablePorts.mockResolvedValue([3001, 3002, 3003]);

      const suggestions = await portRegistry.getSuggestions('node', 3);

      expect(suggestions).toEqual([3001, 3002, 3003]);
      expect(PortChecker.findAvailablePorts).toHaveBeenCalledWith(3000, 3999, 3);
    });

    it('should return empty array for invalid project type', async () => {
      const suggestions = await portRegistry.getSuggestions('invalid', 3);

      expect(suggestions).toEqual([]);
    });
  });

  describe('getProjectAllocations', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
      portRegistry.registry.allocations = {
        '3000': { projectId: 'proj-1', projectName: 'app-1', type: 'node' },
        '3001': { projectId: 'proj-1', projectName: 'app-1', type: 'node' },
        '4000': { projectId: 'proj-2', projectName: 'app-2', type: 'static' }
      };
    });

    it('should return all allocations for a project', () => {
      const allocations = portRegistry.getProjectAllocations('proj-1');

      expect(allocations).toHaveLength(2);
      expect(allocations.map(a => a.port)).toEqual([3000, 3001]);
    });

    it('should return empty array for non-existent project', () => {
      const allocations = portRegistry.getProjectAllocations('non-existent');

      expect(allocations).toEqual([]);
    });
  });

  describe('releaseProjectPorts', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
      portRegistry.registry.allocations = {
        '3000': { projectId: 'proj-1', projectName: 'app-1', type: 'node' },
        '3001': { projectId: 'proj-1', projectName: 'app-1', type: 'node' },
        '4000': { projectId: 'proj-2', projectName: 'app-2', type: 'static' }
      };
    });

    it('should release all ports for a project', async () => {
      const result = await portRegistry.releaseProjectPorts('proj-1');

      expect(result.success).toBe(true);
      expect(result.releasedPorts).toEqual([3000, 3001]);
      expect(result.count).toBe(2);
      expect(portRegistry.registry.allocations['3000']).toBeUndefined();
      expect(portRegistry.registry.allocations['3001']).toBeUndefined();
      expect(portRegistry.registry.allocations['4000']).toBeDefined();
    });
  });

  describe('addToHistory', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
    });

    it('should add entry to history', () => {
      portRegistry.addToHistory('allocate', 3000, 'proj-1');

      expect(portRegistry.registry.history).toHaveLength(1);
      const entry = portRegistry.registry.history[0];
      expect(entry.action).toBe('allocate');
      expect(entry.port).toBe(3000);
      expect(entry.projectId).toBe('proj-1');
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should limit history to 100 entries', () => {
      // Add 105 entries
      for (let i = 0; i < 105; i++) {
        portRegistry.addToHistory('allocate', 3000 + i, `proj-${i}`);
      }

      expect(portRegistry.registry.history).toHaveLength(100);
      // Should keep the last 100 entries
      expect(portRegistry.registry.history[0].projectId).toBe('proj-5');
      expect(portRegistry.registry.history[99].projectId).toBe('proj-104');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await portRegistry.initialize();
      portRegistry.registry.allocations = {
        '3000': { projectId: 'proj-1', type: 'node' },
        '3001': { projectId: 'proj-2', type: 'node' },
        '5000': { projectId: 'proj-3', type: 'python' },
        '4000': { projectId: 'proj-4', type: 'static' }
      };
      portRegistry.registry.history = [
        { timestamp: '2025-01-05T10:00:00Z', action: 'allocate', port: 3000, projectId: 'proj-1' },
        { timestamp: '2025-01-05T10:01:00Z', action: 'allocate', port: 3001, projectId: 'proj-2' }
      ];
    });

    it('should return correct statistics', () => {
      const stats = portRegistry.getStats();

      expect(stats.totalAllocated).toBe(4);
      expect(stats.byType).toEqual({
        node: 2,
        python: 1,
        static: 1
      });
      expect(stats.historyEntries).toBe(2);
      expect(stats.rangeUtilization.node.allocated).toBe(2);
      expect(stats.rangeUtilization.node.total).toBe(1000);
      expect(stats.rangeUtilization.node.percentage).toBe(0);
    });
  });
});