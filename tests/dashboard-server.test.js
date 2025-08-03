/**
 * Tests for Dashboard Server
 * Tests API endpoints, WebSocket communication, and server lifecycle
 */

const DashboardServer = require('../src/dashboard/server');
const request = require('supertest');
const WebSocket = require('ws');
const http = require('http');

// Mock WebSocket
jest.mock('ws', () => {
  const mockClients = new Set();
  
  const MockWebSocket = jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    readyState: 1, // OPEN
    on: jest.fn(),
    ping: jest.fn()
  }));

  MockWebSocket.Server = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn((callback) => callback && callback()),
    clients: mockClients
  }));

  MockWebSocket.OPEN = 1;

  return MockWebSocket;
});

describe('DashboardServer', () => {
  let dashboardServer;
  let mockProcessManager;
  let mockLogStore;
  let mockLogger;

  beforeEach(() => {
    mockLogger = global.mockLogger;

    mockProcessManager = {
      getAllSessions: jest.fn(),
      getLogs: jest.fn(),
      stopServer: jest.fn(),
      startServer: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    };

    mockLogStore = {
      getStorageStats: jest.fn(),
      exportLogs: jest.fn(),
      storeLogs: jest.fn()
    };

    dashboardServer = new DashboardServer(mockProcessManager, mockLogStore, mockLogger);
  });

  afterEach(async () => {
    if (dashboardServer.server && dashboardServer.server.listening) {
      await dashboardServer.stop();
    }
  });

  describe('Constructor', () => {
    test('should initialize with proper dependencies', () => {
      expect(dashboardServer.processManager).toBe(mockProcessManager);
      expect(dashboardServer.logStore).toBe(mockLogStore);
      expect(dashboardServer.logger).toBe(mockLogger);
      expect(dashboardServer.app).toBeDefined();
    });

    test('should set up process manager event listeners', () => {
      expect(mockProcessManager.on).toHaveBeenCalledWith('log', expect.any(Function));
      expect(mockProcessManager.on).toHaveBeenCalledWith('server-ready', expect.any(Function));
      expect(mockProcessManager.on).toHaveBeenCalledWith('process-exit', expect.any(Function));
      expect(mockProcessManager.on).toHaveBeenCalledWith('process-error', expect.any(Function));
    });
  });

  describe('API Endpoints', () => {
    describe('GET /api/health', () => {
      test('should return health status', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          status: 'ok',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
          version: '1.0.0'
        });
      });
    });

    describe('GET /api/sessions', () => {
      test('should return all sessions', async () => {
        const mockSessions = [
          { id: 'session-1', name: 'React App', status: 'running' },
          { id: 'session-2', name: 'Express API', status: 'stopped' }
        ];
        mockProcessManager.getAllSessions.mockReturnValue(mockSessions);

        const response = await request(dashboardServer.app)
          .get('/api/sessions')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          sessions: mockSessions,
          totalSessions: 2
        });
      });

      test('should handle process manager errors', async () => {
        mockProcessManager.getAllSessions.mockImplementation(() => {
          throw new Error('Database connection failed');
        });

        const response = await request(dashboardServer.app)
          .get('/api/sessions')
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Database connection failed'
        });
      });
    });

    describe('GET /api/sessions/:id/logs', () => {
      const sessionId = 'test-session-123';

      test('should return logs for valid session', async () => {
        const mockLogs = [
          { timestamp: Date.now(), type: 'stdout', data: 'Server starting...' },
          { timestamp: Date.now(), type: 'stdout', data: 'Server ready' }
        ];
        mockProcessManager.getLogs.mockReturnValue(mockLogs);

        const response = await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/logs`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          sessionId,
          logs: mockLogs,
          totalLogs: 2
        });

        expect(mockProcessManager.getLogs).toHaveBeenCalledWith(sessionId, {
          tail: 100,
          filter: undefined
        });
      });

      test('should apply query parameters', async () => {
        mockProcessManager.getLogs.mockReturnValue([]);

        await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/logs?tail=50&filter=error`)
          .expect(200);

        expect(mockProcessManager.getLogs).toHaveBeenCalledWith(sessionId, {
          tail: 50,
          filter: 'error'
        });
      });

      test('should require session ID', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/sessions//logs')
          .expect(404); // Express treats empty param as not found
      });

      test('should handle invalid tail parameter', async () => {
        mockProcessManager.getLogs.mockReturnValue([]);

        await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/logs?tail=invalid`)
          .expect(200);

        expect(mockProcessManager.getLogs).toHaveBeenCalledWith(sessionId, {
          tail: 100, // Default when parseInt fails
          filter: undefined
        });
      });
    });

    describe('POST /api/sessions/:id/stop', () => {
      const sessionId = 'test-session-456';

      test('should stop session successfully', async () => {
        const mockResult = {
          success: true,
          message: 'Server stopping gracefully'
        };
        mockProcessManager.stopServer.mockReturnValue(mockResult);

        const response = await request(dashboardServer.app)
          .post(`/api/sessions/${sessionId}/stop`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          sessionId,
          message: 'Server stopping gracefully'
        });

        expect(mockProcessManager.stopServer).toHaveBeenCalledWith(sessionId);
      });

      test('should handle session not found', async () => {
        mockProcessManager.stopServer.mockImplementation(() => {
          throw new Error('Session test-session-999 not found');
        });

        const response = await request(dashboardServer.app)
          .post('/api/sessions/test-session-999/stop')
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Session test-session-999 not found'
        });
      });

      test('should handle other stop errors', async () => {
        mockProcessManager.stopServer.mockImplementation(() => {
          throw new Error('Process kill failed');
        });

        const response = await request(dashboardServer.app)
          .post(`/api/sessions/${sessionId}/stop`)
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Process kill failed'
        });
      });
    });

    describe('POST /api/sessions', () => {
      test('should start new session successfully', async () => {
        const mockResult = {
          sessionId: 'new-session-789',
          pid: 12345,
          port: 3000,
          status: 'starting'
        };
        mockProcessManager.startServer.mockResolvedValue(mockResult);

        const requestBody = {
          command: 'npm start',
          cwd: '/test/project',
          env: { NODE_ENV: 'development' },
          port: 3000,
          sessionName: 'Test Server'
        };

        const response = await request(dashboardServer.app)
          .post('/api/sessions')
          .send(requestBody)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          sessionId: 'new-session-789',
          pid: 12345,
          port: 3000,
          status: 'starting'
        });

        expect(mockProcessManager.startServer).toHaveBeenCalledWith(requestBody);
      });

      test('should require cwd parameter', async () => {
        const requestBody = {
          command: 'npm start'
        };

        const response = await request(dashboardServer.app)
          .post('/api/sessions')
          .send(requestBody)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Working directory (cwd) is required'
        });
      });

      test('should handle start server errors', async () => {
        mockProcessManager.startServer.mockRejectedValue(new Error('Port already in use'));

        const requestBody = {
          cwd: '/test/project',
          command: 'npm start'
        };

        const response = await request(dashboardServer.app)
          .post('/api/sessions')
          .send(requestBody)
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Port already in use'
        });
      });
    });

    describe('GET /api/sessions/:id', () => {
      test('should return session details', async () => {
        const mockSessions = [
          { id: 'session-1', name: 'React App', status: 'running', port: 3000 }
        ];
        mockProcessManager.getAllSessions.mockReturnValue(mockSessions);

        const response = await request(dashboardServer.app)
          .get('/api/sessions/session-1')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          session: mockSessions[0]
        });
      });

      test('should handle session not found', async () => {
        mockProcessManager.getAllSessions.mockReturnValue([]);

        const response = await request(dashboardServer.app)
          .get('/api/sessions/non-existent')
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Session not found'
        });
      });
    });

    describe('GET /api/sessions/:id/export', () => {
      const sessionId = 'export-session';

      test('should export logs in JSON format', async () => {
        const mockExportData = JSON.stringify({
          sessionId,
          logs: [{ timestamp: Date.now(), type: 'stdout', data: 'test' }]
        });
        mockLogStore.exportLogs.mockResolvedValue(mockExportData);

        const response = await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/export`)
          .expect(200);

        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(response.headers['content-disposition']).toMatch(/attachment; filename="logs-.*\.json"/);
        expect(response.text).toBe(mockExportData);
      });

      test('should export logs in text format', async () => {
        const mockExportData = '[2023-01-01T00:00:00.000Z] STDOUT: test log';
        mockLogStore.exportLogs.mockResolvedValue(mockExportData);

        const response = await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/export?format=text`)
          .expect(200);

        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.headers['content-disposition']).toMatch(/attachment; filename="logs-.*\.text"/);
        expect(response.text).toBe(mockExportData);
      });

      test('should handle export errors', async () => {
        mockLogStore.exportLogs.mockRejectedValue(new Error('Export failed'));

        const response = await request(dashboardServer.app)
          .get(`/api/sessions/${sessionId}/export`)
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Export failed'
        });
      });
    });

    describe('GET /api/storage/stats', () => {
      test('should return storage statistics', async () => {
        const mockStats = {
          totalSessions: 5,
          totalSize: 1024000,
          averageSize: 204800,
          sessions: []
        };
        mockLogStore.getStorageStats.mockResolvedValue(mockStats);

        const response = await request(dashboardServer.app)
          .get('/api/storage/stats')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          ...mockStats
        });
      });

      test('should handle storage stats errors', async () => {
        mockLogStore.getStorageStats.mockRejectedValue(new Error('Storage unavailable'));

        const response = await request(dashboardServer.app)
          .get('/api/storage/stats')
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Storage unavailable'
        });
      });
    });

    describe('POST /api/hook/notify', () => {
      test('should handle hook notifications', async () => {
        const notification = {
          type: 'server:start',
          command: 'npm start',
          timestamp: Date.now()
        };

        const response = await request(dashboardServer.app)
          .post('/api/hook/notify')
          .send(notification)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Notification received'
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Hook notification received:',
          notification
        );
      });

      test('should handle hook notification errors', async () => {
        // Mock logger to throw error
        mockLogger.info.mockImplementation(() => {
          throw new Error('Logging failed');
        });

        const response = await request(dashboardServer.app)
          .post('/api/hook/notify')
          .send({ type: 'test' })
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Logging failed'
        });
      });
    });

    describe('Static File Serving and Routing', () => {
      test('should serve dashboard on root path', async () => {
        const response = await request(dashboardServer.app)
          .get('/')
          .expect(200);

        // Since we're testing without actual static files, this would normally serve index.html
        // In test environment, it might return a 404 or error, which is fine for our test
      });

      test('should return 404 for unknown routes', async () => {
        const response = await request(dashboardServer.app)
          .get('/unknown/route')
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Not found',
          path: '/unknown/route'
        });
      });
    });

    describe('CORS and Middleware', () => {
      test('should include CORS headers', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/health')
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-methods']).toContain('GET');
      });

      test('should handle OPTIONS requests', async () => {
        await request(dashboardServer.app)
          .options('/api/sessions')
          .expect(200);
      });

      test('should handle JSON parsing errors', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/sessions')
          .send('invalid json')
          .set('Content-Type', 'application/json')
          .expect(400);
      });
    });
  });

  describe('WebSocket Functionality', () => {
    let mockWss;
    let mockWs;

    beforeEach(() => {
      mockWs = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: WebSocket.OPEN,
        ping: jest.fn()
      };

      mockWss = {
        on: jest.fn(),
        close: jest.fn((callback) => callback && callback()),
        clients: new Set([mockWs])
      };

      WebSocket.Server.mockReturnValue(mockWss);
    });

    test('should setup WebSocket server when HTTP server exists', () => {
      dashboardServer.server = http.createServer();
      dashboardServer.setupWebSocket();

      expect(WebSocket.Server).toHaveBeenCalledWith({
        server: dashboardServer.server,
        path: '/ws'
      });
    });

    test('should handle WebSocket connections', () => {
      dashboardServer.server = http.createServer();
      dashboardServer.setupWebSocket();

      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')[1];
      expect(connectionHandler).toBeDefined();

      // Simulate connection
      const mockReq = { socket: { remoteAddress: '127.0.0.1' }, headers: {} };
      connectionHandler(mockWs, mockReq);

      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('initial-state'));
    });

    test('should broadcast messages to all connected clients', () => {
      dashboardServer.wss = mockWss;

      dashboardServer.broadcast({
        type: 'test-message',
        data: 'test data'
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'test-message',
          data: 'test data'
        })
      );
    });

    test('should handle WebSocket message parsing', () => {
      dashboardServer.server = http.createServer();
      dashboardServer.setupWebSocket();

      const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')[1];
      const mockReq = { socket: { remoteAddress: '127.0.0.1' }, headers: {} };
      
      connectionHandler(mockWs, mockReq);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      expect(messageHandler).toBeDefined();

      // Test valid message
      messageHandler(JSON.stringify({ type: 'ping' }));
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );

      // Test invalid message
      messageHandler('invalid json');
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
    });

    test('should handle process manager events and broadcast', () => {
      dashboardServer.wss = mockWss;

      // Get the log event handler
      const logHandler = mockProcessManager.on.mock.calls
        .find(call => call[0] === 'log')[1];

      // Simulate log event
      logHandler({
        sessionId: 'test-session',
        log: { timestamp: Date.now(), type: 'stdout', data: 'test log' }
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"log"')
      );
    });
  });

  describe('Server Lifecycle', () => {
    test('should start server on specified port', async () => {
      const port = 8081;
      await dashboardServer.start(port);

      expect(dashboardServer.server.listening).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Dashboard server started:',
        expect.objectContaining({
          port,
          url: `http://localhost:${port}`,
          websocket: 'enabled'
        })
      );
    });

    test('should handle server start errors', async () => {
      // Mock server to emit error
      const originalCreateServer = http.createServer;
      http.createServer = jest.fn().mockReturnValue({
        listen: jest.fn((port, callback) => {
          process.nextTick(() => {
            const error = new Error('EADDRINUSE');
            error.code = 'EADDRINUSE';
            error.emit('error', error);
          });
        }),
        on: jest.fn()
      });

      await expect(dashboardServer.start(8080)).rejects.toThrow();

      // Restore original function
      http.createServer = originalCreateServer;
    });

    test('should stop server gracefully', async () => {
      await dashboardServer.start(8082);
      await dashboardServer.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('WebSocket server closed');
      expect(mockLogger.info).toHaveBeenCalledWith('Dashboard server stopped');
    });

    test('should return server status', async () => {
      const status = dashboardServer.getStatus();

      expect(status).toMatchObject({
        running: false,
        port: null,
        connections: 0,
        uptime: expect.any(Number)
      });

      await dashboardServer.start(8083);
      const runningStatus = dashboardServer.getStatus();

      expect(runningStatus.running).toBe(true);
      expect(runningStatus.port).toBe(8083);
    });
  });

  describe('Error Handling', () => {
    test('should handle middleware errors', async () => {
      // Create a route that throws an error
      dashboardServer.app.get('/test-error', (req, res, next) => {
        throw new Error('Test middleware error');
      });

      const response = await request(dashboardServer.app)
        .get('/test-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Internal server error',
        message: 'Test middleware error'
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Express error:',
        expect.objectContaining({
          error: 'Test middleware error',
          url: '/test-error',
          method: 'GET'
        })
      );
    });

    test('should handle request logging', async () => {
      await request(dashboardServer.app)
        .get('/api/health')
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request:',
        expect.objectContaining({
          method: 'GET',
          url: '/api/health'
        })
      );
    });
  });
});