/**
 * Integration Tests for MCP Debug Host Server
 * Tests cross-component communication and end-to-end workflows
 */

const ProcessManager = require('../src/process-manager');
const LogStore = require('../src/log-store');
const DashboardServer = require('../src/dashboard/server');
const { setupTools } = require('../src/mcp-tools');
const fs = require('fs').promises;
const path = require('path');
const request = require('supertest');

// Mock child_process for integration tests
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn } = require('child_process');

describe('Integration Tests', () => {
  let processManager;
  let logStore;
  let dashboardServer;
  let mockLogger;
  let testProjectDir;

  beforeEach(async () => {
    mockLogger = global.mockLogger;
    
    // Create test project
    testProjectDir = await global.createTestProject('react');
    
    // Initialize components
    processManager = new ProcessManager(mockLogger);
    logStore = new LogStore(mockLogger);
    dashboardServer = new DashboardServer(processManager, logStore, mockLogger);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fs operations for LogStore
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue([]);
    jest.spyOn(fs, 'stat').mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true
    });
    jest.spyOn(fs, 'appendFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue('');
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Clean up any running processes
    await processManager.stopAll();
    
    if (dashboardServer.server && dashboardServer.server.listening) {
      await dashboardServer.stop();
    }
    
    // Clean up async operations
    for (const cleanup of global.asyncCleanup) {
      try {
        await cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    global.asyncCleanup = [];
  });

  describe('Process Lifecycle Integration', () => {
    test('should handle complete server lifecycle with logging', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server
      const startResult = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000,
        sessionName: 'Integration Test Server'
      });

      expect(startResult.status).toBe('starting');
      const sessionId = startResult.sessionId;

      // Simulate server output and ready state
      mockProcess.stdout.emit('data', Buffer.from('Server starting...\n'));
      mockProcess.stdout.emit('data', Buffer.from('ready on http://localhost:3000\n'));

      // Verify server is marked as ready
      const sessions = processManager.getAllSessions();
      const session = sessions.find(s => s.id === sessionId);
      expect(session.status).toBe('running');

      // Get logs
      const logs = processManager.getLogs(sessionId);
      expect(logs).toHaveLength(2);
      expect(logs[0].data).toBe('Server starting...\n');
      expect(logs[1].data).toBe('ready on http://localhost:3000\n');

      // Stop server
      const stopResult = processManager.stopServer(sessionId);
      expect(stopResult.success).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    test('should persist logs through LogStore integration', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });

      const sessionId = result.sessionId;

      // Generate some logs
      const testLogs = [
        'Starting development server...',
        'Compiled successfully!',
        'Server is running on http://localhost:3000'
      ];

      testLogs.forEach(logText => {
        mockProcess.stdout.emit('data', Buffer.from(logText + '\n'));
      });

      // Wait for logs to be processed
      await global.waitFor(10);

      // Verify logs are in process manager
      const logs = processManager.getLogs(sessionId);
      expect(logs).toHaveLength(3);

      // Simulate log storage through dashboard server events
      const logEventHandler = processManager.listeners('log')[0];
      if (logEventHandler) {
        logs.forEach(log => {
          logEventHandler({ sessionId, log });
        });
      }

      // Verify LogStore.storeLogs was called
      expect(fs.appendFile).toHaveBeenCalled();
    });

    test('should handle process errors and recovery', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000
      });

      const sessionId = result.sessionId;

      // Simulate process error
      mockProcess.emit('error', new Error('ENOENT: command not found'));

      // Wait for error to be processed
      await global.waitFor(10);

      const sessions = processManager.getAllSessions();
      const session = sessions.find(s => s.id === sessionId);
      expect(session.status).toBe('error');
      expect(session.error).toBe('ENOENT: command not found');
    });
  });

  describe('Dashboard API Integration', () => {
    test('should provide real-time server status through API', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server through process manager
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3000,
        sessionName: 'API Test Server'
      });

      // Get status through dashboard API
      const response = await request(dashboardServer.app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.sessions[0]).toMatchObject({
        id: result.sessionId,
        name: 'API Test Server',
        command: 'npm start',
        port: 3000,
        status: 'starting'
      });
    });

    test('should start server through dashboard API', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const requestBody = {
        command: 'npm start',
        cwd: testProjectDir,
        port: 3001,
        sessionName: 'Dashboard Started Server'
      };

      // Start server through dashboard API
      const response = await request(dashboardServer.app)
        .post('/api/sessions')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.port).toBe(3001);

      // Verify server is in process manager
      const sessions = processManager.getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('Dashboard Started Server');
    });

    test('should stop server through dashboard API', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server first
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3002
      });

      // Stop server through dashboard API
      const response = await request(dashboardServer.app)
        .post(`/api/sessions/${result.sessionId}/stop`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    test('should retrieve logs through dashboard API', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3003
      });

      const sessionId = result.sessionId;

      // Generate logs
      mockProcess.stdout.emit('data', Buffer.from('API Test Log Entry\n'));

      // Wait for logs to be processed
      await global.waitFor(10);

      // Get logs through dashboard API
      const response = await request(dashboardServer.app)
        .get(`/api/sessions/${sessionId}/logs`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].data).toBe('API Test Log Entry\n');
    });
  });

  describe('MCP Tools Integration', () => {
    let mockServer;

    beforeEach(() => {
      mockServer = {
        setRequestHandler: jest.fn(),
        handlers: {}
      };

      // Capture request handlers
      mockServer.setRequestHandler.mockImplementation((schema, handler) => {
        if (schema.method === 'tools/list') {
          mockServer.handlers.listTools = handler;
        } else if (schema.method === 'tools/call') {
          mockServer.handlers.callTool = handler;
        }
      });

      setupTools(mockServer, processManager, logStore, mockLogger);
    });

    test('should start server through MCP tools', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: testProjectDir,
            command: 'npm start',
            port: 3004,
            sessionName: 'MCP Started Server'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(true);
      expect(responseData.port).toBe(3004);

      // Verify server is in process manager
      const sessions = processManager.getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('MCP Started Server');
    });

    test('should get server status through MCP tools', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start server first
      await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3005,
        sessionName: 'Status Test Server'
      });

      const request = {
        params: {
          name: 'server:status',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(true);
      expect(responseData.totalSessions).toBe(1);
      expect(responseData.sessions[0].name).toBe('Status Test Server');
    });

    test('should handle MCP tool errors gracefully', async () => {
      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/non/existent/directory'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('does not exist');
      expect(response.isError).toBe(true);
    });
  });

  describe('Cross-Component Event Flow', () => {
    test('should propagate events from ProcessManager to Dashboard', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Mock WebSocket broadcast
      dashboardServer.broadcast = jest.fn();

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3006
      });

      const sessionId = result.sessionId;

      // Emit log event
      mockProcess.stdout.emit('data', Buffer.from('Cross-component test log\n'));

      // Wait for event propagation
      await global.waitFor(10);

      // Verify dashboard received the event
      expect(dashboardServer.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          sessionId,
          log: expect.objectContaining({
            data: 'Cross-component test log\n'
          })
        })
      );
    });

    test('should handle server ready events across components', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Mock WebSocket broadcast
      dashboardServer.broadcast = jest.fn();

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3007
      });

      // Emit server ready output
      mockProcess.stdout.emit('data', Buffer.from('Server ready on http://localhost:3007\n'));

      // Wait for event propagation
      await global.waitFor(10);

      // Verify server status changed to running
      const sessions = processManager.getAllSessions();
      const session = sessions.find(s => s.id === result.sessionId);
      expect(session.status).toBe('running');

      // Verify dashboard received server-ready event
      expect(dashboardServer.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server-ready',
          session: expect.objectContaining({
            id: result.sessionId,
            status: 'running',
            port: 3007
          })
        })
      );
    });

    test('should handle process exit events across components', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Mock WebSocket broadcast
      dashboardServer.broadcast = jest.fn();

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3008
      });

      const sessionId = result.sessionId;

      // Emit process exit
      mockProcess.emit('exit', 0, null);

      // Wait for event propagation
      await global.waitFor(10);

      // Verify dashboard received process-exit event
      expect(dashboardServer.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'process-exit',
          sessionId,
          code: 0,
          signal: null
        })
      );
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle LogStore failures gracefully', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Mock LogStore to fail
      jest.spyOn(fs, 'appendFile').mockRejectedValue(new Error('Disk full'));

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3009
      });

      // Generate logs
      mockProcess.stdout.emit('data', Buffer.from('Test log that will fail to store\n'));

      // Wait for processing
      await global.waitFor(10);

      // Process should continue working despite log storage failure
      const logs = processManager.getLogs(result.sessionId);
      expect(logs).toHaveLength(1);
      expect(logs[0].data).toBe('Test log that will fail to store\n');

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store log'),
        expect.any(Object)
      );
    });

    test('should handle multiple simultaneous server operations', async () => {
      const mockProcess1 = global.mockChildProcess();
      const mockProcess2 = global.mockChildProcess();
      const mockProcess3 = global.mockChildProcess();
      
      spawn.mockReturnValueOnce(mockProcess1)
           .mockReturnValueOnce(mockProcess2)
           .mockReturnValueOnce(mockProcess3);

      // Start multiple servers simultaneously
      const promises = [
        processManager.startServer({
          command: 'npm start',
          cwd: testProjectDir,
          port: 3010,
          sessionName: 'Concurrent Server 1'
        }),
        processManager.startServer({
          command: 'npm run dev',
          cwd: testProjectDir,
          port: 3011,
          sessionName: 'Concurrent Server 2'
        }),
        processManager.startServer({
          command: 'npm run serve',
          cwd: testProjectDir,
          port: 3012,
          sessionName: 'Concurrent Server 3'
        })
      ];

      const results = await Promise.all(promises);

      // All servers should start successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('starting');
        expect(result.sessionId).toBeDefined();
      });

      // All servers should be tracked
      const sessions = processManager.getAllSessions();
      expect(sessions).toHaveLength(3);

      // Each should have unique ports
      const ports = sessions.map(s => s.port);
      expect(new Set(ports)).toHaveSize(3);
    });

    test('should handle dashboard server restart', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Start a server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3013
      });

      // Start dashboard server
      await dashboardServer.start(8090);

      // Verify server is accessible through API
      let response = await request(dashboardServer.app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body.sessions).toHaveLength(1);

      // Stop and restart dashboard server
      await dashboardServer.stop();
      await dashboardServer.start(8091);

      // Verify data is still accessible (process manager state preserved)
      response = await request(dashboardServer.app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body.sessions).toHaveLength(1);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle log rotation under load', async () => {
      const mockProcess = global.mockChildProcess();
      spawn.mockReturnValue(mockProcess);

      // Mock large file size to trigger rotation
      jest.spyOn(fs, 'stat').mockResolvedValue({
        size: 12 * 1024 * 1024, // 12MB
        mtime: new Date()
      });
      jest.spyOn(fs, 'rename').mockResolvedValue(undefined);

      // Start server
      const result = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3014
      });

      const sessionId = result.sessionId;

      // Generate many log entries
      for (let i = 0; i < 100; i++) {
        mockProcess.stdout.emit('data', Buffer.from(`Log entry ${i}\n`));
      }

      // Wait for processing
      await global.waitFor(50);

      // Verify logs are limited to 1000 entries in memory
      const logs = processManager.getLogs(sessionId);
      expect(logs.length).toBeLessThanOrEqual(1000);

      // Verify log file rotation was triggered during storage
      const logEventHandler = processManager.listeners('log')[0];
      if (logEventHandler && logs.length > 0) {
        logEventHandler({ sessionId, log: logs[0] });
        await global.waitFor(10);
        
        // Should have attempted to store and rotate
        expect(fs.appendFile).toHaveBeenCalled();
        expect(fs.rename).toHaveBeenCalled();
      }
    });

    test('should handle resource cleanup on shutdown', async () => {
      const mockProcess1 = global.mockChildProcess();
      const mockProcess2 = global.mockChildProcess();
      
      spawn.mockReturnValueOnce(mockProcess1).mockReturnValueOnce(mockProcess2);

      // Start multiple servers
      const result1 = await processManager.startServer({
        command: 'npm start',
        cwd: testProjectDir,
        port: 3015
      });
      
      const result2 = await processManager.startServer({
        command: 'npm run dev',
        cwd: testProjectDir,
        port: 3016
      });

      // Mark both as running
      processManager.processes.get(result1.sessionId).status = 'running';
      processManager.processes.get(result2.sessionId).status = 'running';

      // Start dashboard server
      await dashboardServer.start(8092);

      // Shutdown all components
      await processManager.stopAll();
      await dashboardServer.stop();

      // Verify all processes were terminated
      expect(mockProcess1.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess2.kill).toHaveBeenCalledWith('SIGTERM');

      // Verify dashboard server stopped cleanly
      expect(dashboardServer.getStatus().running).toBe(false);
    });
  });
});