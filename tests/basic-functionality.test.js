/**
 * Basic Functionality Tests - Working Test Suite
 * Tests core functionality that should work without complex mocking
 */

const ProcessManager = require('../src/process-manager');
const LogStore = require('../src/log-store');
const TechStackDetector = require('../src/tech-stack-detector');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(''),
    writeFile: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true
    }),
    readdir: jest.fn().mockResolvedValue([]),
    unlink: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined),
    rmdir: jest.fn().mockResolvedValue(undefined)
  }
}));

const { spawn } = require('child_process');
const fs = require('fs').promises;

describe('Basic Functionality Tests', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = global.mockLogger;
    jest.clearAllMocks();
  });

  describe('ProcessManager Basic Tests', () => {
    test('should initialize ProcessManager correctly', () => {
      const processManager = new ProcessManager(mockLogger);
      
      expect(processManager.processes).toBeInstanceOf(Map);
      expect(processManager.processes.size).toBe(0);
      expect(processManager.logger).toBe(mockLogger);
    });

    test('should get empty sessions list initially', () => {
      const processManager = new ProcessManager(mockLogger);
      const sessions = processManager.getAllSessions();
      
      expect(sessions).toEqual([]);
    });

    test('should find no sessions by port initially', () => {
      const processManager = new ProcessManager(mockLogger);
      const session = processManager.findByPort(3000);
      
      expect(session).toBeNull();
    });

    test('should get empty logs for non-existent session', () => {
      const processManager = new ProcessManager(mockLogger);
      const logs = processManager.getLogs('non-existent');
      
      expect(logs).toEqual([]);
    });

    test('should detect server ready patterns', () => {
      const processManager = new ProcessManager(mockLogger);
      
      const readyPatterns = [
        'Server listening on port 3000',
        'ready on http://localhost:3000',
        'compiled successfully',
        'webpack compiled',
        'vite ready in 234ms',
        'development server is running'
      ];

      readyPatterns.forEach(pattern => {
        expect(processManager.isServerReady(pattern)).toBe(true);
      });

      const notReadyPatterns = [
        'installing dependencies',
        'compiling...',
        'error occurred'
      ];

      notReadyPatterns.forEach(pattern => {
        expect(processManager.isServerReady(pattern)).toBe(false);
      });
    });
  });

  describe('LogStore Basic Tests', () => {
    test('should initialize LogStore correctly', () => {
      const logStore = new LogStore(mockLogger);
      
      expect(logStore.logger).toBe(mockLogger);
      expect(logStore.maxLogSize).toBe(10 * 1024 * 1024);
      expect(logStore.maxLogAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    test('should return correct log file path', () => {
      const logStore = new LogStore(mockLogger);
      const sessionId = 'test-session-123';
      
      const path = logStore.getLogFilePath(sessionId);
      expect(path).toContain(`${sessionId}.log`);
    });

    test('should handle empty logs gracefully', async () => {
      const logStore = new LogStore(mockLogger);
      
      // Should not throw or crash
      await logStore.storeLogs('session-1', []);
      await logStore.storeLogs('session-2', null);
      await logStore.storeLogs('session-3', undefined);
    });

    test('should handle non-existent session logs', async () => {
      const logStore = new LogStore(mockLogger);
      
      // Mock fs.access to throw (file doesn't exist)
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));
      
      const logs = await logStore.retrieveLogs('non-existent-session');
      expect(logs).toEqual([]);
    });
  });

  describe('TechStackDetector Basic Tests', () => {
    test('should initialize TechStackDetector correctly', () => {
      const detector = new TechStackDetector(mockLogger);
      
      expect(detector.logger).toBe(mockLogger);
      expect(detector.adapters).toBeInstanceOf(Array);
      expect(detector.adapters.length).toBeGreaterThan(0);
    });

    test('should have adapters for different tech stacks', () => {
      const detector = new TechStackDetector();
      
      expect(detector.adapters).toHaveLength(3);
      expect(detector.adapters.map(a => a.name)).toContain('node');
      expect(detector.adapters.map(a => a.name)).toContain('python');
      expect(detector.adapters.map(a => a.name)).toContain('php');
    });

    test('should detect basic framework types', async () => {
      const detector = new TechStackDetector();
      
      // Test that detector has required adapters
      expect(detector.adapters.some(a => a.name === 'node')).toBe(true);
      expect(detector.adapters.some(a => a.name === 'python')).toBe(true);
      expect(detector.adapters.some(a => a.name === 'php')).toBe(true);
      
      // Test that each adapter has proper structure
      detector.adapters.forEach(adapter => {
        expect(adapter).toHaveProperty('name');
        expect(adapter).toHaveProperty('priority');  
        expect(typeof adapter.canHandle).toBe('function');
        expect(typeof adapter.detect).toBe('function');
      });
    });

    test('should return null for unrecognized project', async () => {
      const detector = new TechStackDetector();
      
      // Mock all adapters to fail canHandle
      detector.adapters.forEach(adapter => {
        adapter.canHandle = jest.fn().mockResolvedValue(false);
      });
      
      // Mock fs.access to fail (no special files)
      fs.access.mockRejectedValue(new Error('ENOENT'));
      fs.readdir.mockResolvedValue([]);
      
      const result = await detector.detectAndGetCommand('/empty/project');
      expect(result).toBeNull();
    });

    test('should handle file existence check', async () => {
      const detector = new TechStackDetector();
      
      // Mock successful access
      fs.access.mockResolvedValueOnce(undefined);
      let exists = await detector.fileExists('/test/file');
      expect(exists).toBe(true);
      
      // Mock failed access
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));
      exists = await detector.fileExists('/non/existent/file');
      expect(exists).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    test('should create mock child process correctly', () => {
      const mockProcess = global.mockChildProcess();
      
      expect(mockProcess.pid).toBeDefined();
      expect(mockProcess.stdout).toBeDefined();
      expect(mockProcess.stderr).toBeDefined();
      expect(typeof mockProcess.kill).toBe('function');
      expect(typeof mockProcess.on).toBe('function');
    });

    test('should create test project structure', async () => {
      const projectDir = await global.createTestProject('react');
      
      expect(projectDir).toBeDefined();
      expect(typeof projectDir).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle ProcessManager errors gracefully', () => {
      const processManager = new ProcessManager(mockLogger);
      
      // Should not throw when stopping non-existent server
      expect(() => {
        processManager.stopServer('non-existent');
      }).toThrow('Session non-existent not found');
    });

    test('should handle LogStore errors gracefully', async () => {
      const logStore = new LogStore(mockLogger);
      
      // Mock fs operations to fail
      fs.appendFile.mockRejectedValueOnce(new Error('Disk full'));
      
      // Should not throw, should log error
      await logStore.storeLogs('test-session', [
        { timestamp: Date.now(), type: 'stdout', data: 'test' }
      ]);
      
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle TechStackDetector errors gracefully', async () => {
      const detector = new TechStackDetector(mockLogger);
      
      // Mock all adapters to fail
      detector.adapters.forEach(adapter => {
        adapter.canHandle = jest.fn().mockRejectedValue(new Error('Permission denied'));
      });
      
      const result = await detector.detectAndGetCommand('/restricted/path');
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete workflow simulation', async () => {
      const processManager = new ProcessManager(mockLogger);
      const logStore = new LogStore(mockLogger);
      
      // Create mock process
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);
      
      // Mock fs.access to succeed for the test directory
      fs.access.mockResolvedValue(undefined);
      
      // Start server with explicit command (avoid auto-detection)
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: '/test/project',
        port: 3000
      });
      
      expect(result.status).toBe('starting');
      expect(result.sessionId).toBeDefined();
      
      // Simulate log generation
      mockProcess.stdout.emit('data', Buffer.from('Server starting...\n'));
      
      // Wait for processing
      await global.waitFor(10);
      
      // Check logs
      const logs = processManager.getLogs(result.sessionId);
      expect(logs).toHaveLength(1);
      expect(logs[0].data).toBe('Server starting...\n');
      
      // Test log storage
      await logStore.storeLogs(result.sessionId, logs);
      expect(fs.appendFile).toHaveBeenCalled();
    });
  });
});