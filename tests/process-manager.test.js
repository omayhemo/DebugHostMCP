/**
 * Tests for Process Manager
 * Tests process spawning, lifecycle management, and error handling
 */

const ProcessManager = require('../src/process-manager');
const fs = require('fs').promises;
const path = require('path');

// Mock child_process module
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn } = require('child_process');

describe('ProcessManager', () => {
  let processManager;
  let mockLogger;
  let testProjectDir;

  beforeEach(async () => {
    mockLogger = global.mockLogger;
    processManager = new ProcessManager(mockLogger);
    
    // Create test project directory
    testProjectDir = await global.createTestProject('react');
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any running processes
    processManager.stopAll();
  });

  describe('Constructor', () => {
    test('should initialize with empty processes map', () => {
      expect(processManager.processes).toBeInstanceOf(Map);
      expect(processManager.processes.size).toBe(0);
    });

    test('should set up graceful shutdown handlers', () => {
      const originalListeners = process.listeners('SIGINT').length;
      const manager = new ProcessManager(mockLogger);
      
      expect(process.listeners('SIGINT').length).toBeGreaterThan(originalListeners);
    });
  });

  describe('startServer', () => {
    let mockProcess;

    beforeEach(() => {
      mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);
    });

    test('should start server with valid parameters', async () => {
      const params = {
        command: 'npm start',
        cwd: testProjectDir,
        env: { NODE_ENV: 'development' },
        port: 3000,
        sessionName: 'Test Server'
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith('bash', ['-c', 'npm start'], {
        cwd: testProjectDir,
        env: expect.objectContaining({
          NODE_ENV: 'development',
          PORT: '3000'
        }),
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      expect(result).toMatchObject({
        sessionId: expect.any(String),
        pid: mockProcess.pid,
        port: 3000,
        status: 'starting',
        url: 'http://localhost:3000'
      });

      expect(processManager.processes.size).toBe(1);
    });

    test('should auto-detect project type when command not provided', async () => {
      const params = {
        cwd: testProjectDir,
        port: 3000
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith('bash', ['-c', 'npm run start'], expect.any(Object));
      expect(result.status).toBe('starting');
    });

    test('should reject invalid directory', async () => {
      const params = {
        cwd: '/non/existent/directory',
        command: 'npm start'
      };

      await expect(processManager.startServer(params)).rejects.toThrow(
        'Working directory does not exist: /non/existent/directory'
      );
    });

    test('should detect already running server on same port', async () => {
      // Start first server
      const params1 = {
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      };

      const result1 = await processManager.startServer(params1);
      
      // Mark as running
      const session = processManager.processes.get(result1.sessionId);
      session.status = 'running';

      // Try to start second server on same port
      const params2 = {
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      };

      const result2 = await processManager.startServer(params2);

      expect(result2.status).toBe('already_running');
      expect(result2.sessionId).toBe(result1.sessionId);
      expect(spawn).toHaveBeenCalledTimes(1); // Only called once
    });

    test('should handle process spawn errors', async () => {
      mockProcess.emit('error', new Error('Failed to spawn process'));

      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);

      // Wait for error event to be processed
      await global.waitFor(10);

      const session = processManager.processes.get(result.sessionId);
      expect(session.status).toBe('error');
      expect(session.error).toBe('Failed to spawn process');
    });

    test('should handle process exit events', async () => {
      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);

      // Simulate process exit
      mockProcess.emit('exit', 0, null);

      const session = processManager.processes.get(result.sessionId);
      expect(session.status).toBe('stopped');
      expect(session.exitCode).toBe(0);
      expect(session.endTime).toBeDefined();
    });

    test('should set up process logging', async () => {
      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);

      // Simulate stdout output
      mockProcess.stdout.emit('data', Buffer.from('Server starting...\n'));

      const session = processManager.processes.get(result.sessionId);
      expect(session.logs).toHaveLength(1);
      expect(session.logs[0].type).toBe('stdout');
      expect(session.logs[0].data).toBe('Server starting...\n');
    });

    test('should detect server ready from output', async () => {
      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);

      // Simulate server ready output
      mockProcess.stdout.emit('data', Buffer.from('ready on http://localhost:3000\n'));

      const session = processManager.processes.get(result.sessionId);
      expect(session.status).toBe('running');
    });

    test('should limit log storage to 1000 entries', async () => {
      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);
      const session = processManager.processes.get(result.sessionId);

      // Add 1001 log entries
      for (let i = 0; i < 1001; i++) {
        mockProcess.stdout.emit('data', Buffer.from(`Log entry ${i}\n`));
      }

      expect(session.logs).toHaveLength(1000);
      expect(session.logs[0].data).toBe('Log entry 1\n'); // First entry should be trimmed
    });
  });

  describe('stopServer', () => {
    let mockProcess;
    let sessionId;

    beforeEach(async () => {
      mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);
      sessionId = result.sessionId;

      // Mark as running
      const session = processManager.processes.get(sessionId);
      session.status = 'running';
    });

    test('should stop running server gracefully', () => {
      const result = processManager.stopServer(sessionId);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(result.success).toBe(true);
      expect(result.message).toContain('stopping gracefully');

      const session = processManager.processes.get(sessionId);
      expect(session.status).toBe('stopping');
    });

    test('should force kill after timeout', async () => {
      jest.useFakeTimers();

      processManager.stopServer(sessionId);

      // Fast-forward past the 5 second timeout
      jest.advanceTimersByTime(5000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

      jest.useRealTimers();
    });

    test('should handle already stopped server', () => {
      const session = processManager.processes.get(sessionId);
      session.status = 'stopped';

      const result = processManager.stopServer(sessionId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('already stopped');
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });

    test('should handle non-existent session', () => {
      expect(() => {
        processManager.stopServer('non-existent-session');
      }).toThrow('Session non-existent-session not found');
    });
  });

  describe('getLogs', () => {
    let sessionId;

    beforeEach(async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const params = {
        command: 'npm start',
        cwd: testProjectDir
      };

      const result = await processManager.startServer(params);
      sessionId = result.sessionId;

      // Add some test logs
      const session = processManager.processes.get(sessionId);
      session.logs = [
        { timestamp: Date.now() - 3000, type: 'stdout', data: 'Starting server...' },
        { timestamp: Date.now() - 2000, type: 'stdout', data: 'Loading configuration...' },
        { timestamp: Date.now() - 1000, type: 'stderr', data: 'Warning: deprecated API' },
        { timestamp: Date.now(), type: 'stdout', data: 'Server ready on port 3000' }
      ];
    });

    test('should return recent logs with default tail', () => {
      const logs = processManager.getLogs(sessionId);

      expect(logs).toHaveLength(4);
      expect(logs[0].data).toBe('Starting server...');
      expect(logs[3].data).toBe('Server ready on port 3000');
    });

    test('should limit logs with tail parameter', () => {
      const logs = processManager.getLogs(sessionId, { tail: 2 });

      expect(logs).toHaveLength(2);
      expect(logs[0].data).toBe('Warning: deprecated API');
      expect(logs[1].data).toBe('Server ready on port 3000');
    });

    test('should filter logs with regex pattern', () => {
      const logs = processManager.getLogs(sessionId, { filter: 'server' });

      expect(logs).toHaveLength(2);
      expect(logs[0].data).toBe('Starting server...');
      expect(logs[1].data).toBe('Server ready on port 3000');
    });

    test('should handle invalid filter regex gracefully', () => {
      const logs = processManager.getLogs(sessionId, { filter: '[invalid' });

      // Should return all logs when filter is invalid
      expect(logs).toHaveLength(4);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid filter regex:',
        expect.objectContaining({ filter: '[invalid' })
      );
    });

    test('should return empty array for non-existent session', () => {
      const logs = processManager.getLogs('non-existent-session');
      expect(logs).toEqual([]);
    });
  });

  describe('getAllSessions', () => {
    test('should return empty array when no sessions', () => {
      const sessions = processManager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    test('should return all sessions with metadata', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const params = {
        command: 'npm start',
        cwd: testProjectDir,
        sessionName: 'Test Server'
      };

      await processManager.startServer(params);

      const sessions = processManager.getAllSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        id: expect.any(String),
        name: 'Test Server',
        command: 'npm start',
        cwd: testProjectDir,
        status: 'starting',
        pid: mockProcess.pid,
        startTime: expect.any(Number),
        uptime: expect.any(Number),
        logCount: 0
      });
    });

    test('should sort sessions by start time (newest first)', async () => {
      const mockProcess1 = global.mockChildProcess();
      const mockProcess2 = global.mockChildProcess();
      
      spawn.mockReturnValueOnce(mockProcess1).mockReturnValueOnce(mockProcess2);

      // Start first server
      await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });

      // Wait and start second server
      await global.waitFor(10);
      await processManager.startServer({
        command: 'npm run dev',
        cwd: testProjectDir,
        port: 3001
      });

      const sessions = processManager.getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].port).toBe(3001); // Newer session first
      expect(sessions[1].port).toBe(3000); // Older session second
    });
  });

  describe('findByPort', () => {
    test('should find session by port', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });

      const session = processManager.findByPort(3000);

      expect(session).toBeDefined();
      expect(session.port).toBe(3000);
    });

    test('should return null for non-existent port', () => {
      const session = processManager.findByPort(9999);
      expect(session).toBeNull();
    });
  });

  describe('stopAll', () => {
    test('should stop all running processes', async () => {
      const mockProcess1 = global.mockChildProcess();
      const mockProcess2 = global.mockChildProcess();
      
      spawn.mockReturnValueOnce(mockProcess1).mockReturnValueOnce(mockProcess2);

      // Start two servers
      const result1 = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });
      
      const result2 = await processManager.startServer({
        command: 'npm run dev',
        cwd: testProjectDir,
        port: 3001
      });

      // Mark both as running
      processManager.processes.get(result1.sessionId).status = 'running';
      processManager.processes.get(result2.sessionId).status = 'running';

      await processManager.stopAll();

      expect(mockProcess1.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess2.kill).toHaveBeenCalledWith('SIGTERM');
    });

    test('should skip already stopped processes', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });

      // Mark as already stopped
      processManager.processes.get(result.sessionId).status = 'stopped';

      await processManager.stopAll();

      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe('Project Type Detection', () => {
    test('should detect React project', async () => {
      const reactDir = await global.createTestProject('react');

      const params = {
        cwd: reactDir
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith(
        'bash',
        ['-c', 'npm run start'],
        expect.any(Object)
      );
    });

    test('should detect Express project', async () => {
      const expressDir = await global.createTestProject('express');

      const params = {
        cwd: expressDir
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith(
        'bash',
        ['-c', 'npm run dev'],
        expect.any(Object)
      );
    });

    test('should detect Django project', async () => {
      const djangoDir = await global.createTestProject('django');

      const params = {
        cwd: djangoDir
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith(
        'bash',
        ['-c', 'python manage.py runserver'],
        expect.any(Object)
      );
    });

    test('should detect Laravel project', async () => {
      const laravelDir = await global.createTestProject('laravel');

      const params = {
        cwd: laravelDir
      };

      const result = await processManager.startServer(params);

      expect(spawn).toHaveBeenCalledWith(
        'bash',
        ['-c', 'php artisan serve'],
        expect.any(Object)
      );
    });

    test('should return error for unrecognized project', async () => {
      const unknownDir = path.join(global.TEST_CONFIG.testDir, 'unknown-project');
      await fs.mkdir(unknownDir, { recursive: true });
      await fs.writeFile(path.join(unknownDir, 'README.md'), '# Unknown Project');

      const params = {
        cwd: unknownDir
      };

      await expect(processManager.startServer(params)).rejects.toThrow(
        'Could not detect project type. Please provide a command.'
      );
    });
  });

  describe('Server Ready Detection', () => {
    test('should detect various server ready patterns', () => {
      const readyPatterns = [
        'listening on port 3000',
        'Server started successfully',
        'ready on http://localhost:3000',
        'compiled successfully in 1234ms',
        'webpack compiled with 0 errors',
        'vite ready in 2345ms',
        'local: http://localhost:3000',
        'development server is running',
        'serving at http://localhost:8080',
        'started server on port 3000'
      ];

      readyPatterns.forEach(pattern => {
        expect(processManager.isServerReady(pattern)).toBe(true);
      });
    });

    test('should not match non-ready patterns', () => {
      const nonReadyPatterns = [
        'installing dependencies',
        'compiling...',
        'error occurred',
        'warning: deprecated',
        'loading configuration'
      ];

      nonReadyPatterns.forEach(pattern => {
        expect(processManager.isServerReady(pattern)).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      // Mock fs.access to throw permission error
      const originalAccess = fs.access;
      fs.access = jest.fn().mockRejectedValue(new Error('EACCES: permission denied'));

      const params = {
        cwd: '/restricted/directory',
        command: 'npm start'
      };

      await expect(processManager.startServer(params)).rejects.toThrow('permission denied');

      // Restore original function
      fs.access = originalAccess;
    });

    test('should handle malformed package.json gracefully', async () => {
      const badJsonDir = path.join(global.TEST_CONFIG.testDir, 'bad-json-project');
      await fs.mkdir(badJsonDir, { recursive: true });
      await fs.writeFile(path.join(badJsonDir, 'package.json'), '{ invalid json');

      const params = {
        cwd: badJsonDir
      };

      await expect(processManager.startServer(params)).rejects.toThrow(
        'Could not detect project type. Please provide a command.'
      );
    });
  });
});