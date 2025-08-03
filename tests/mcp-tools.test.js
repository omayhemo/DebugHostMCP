/**
 * Tests for MCP Tools Implementation
 * Tests the 4 core MCP tools: server:start, server:stop, server:logs, server:status
 */

const { setupTools } = require('../src/mcp-tools');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

describe('MCP Tools', () => {
  let mockServer;
  let mockProcessManager;
  let mockLogStore;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockProcessManager = {
      startServer: jest.fn(),
      stopServer: jest.fn(),
      getLogs: jest.fn(),
      getAllSessions: jest.fn()
    };

    mockLogStore = {
      storeLogs: jest.fn(),
      retrieveLogs: jest.fn()
    };

    mockServer = {
      setRequestHandler: jest.fn(),
      handlers: {}
    };

    // Capture request handlers
    mockServer.setRequestHandler.mockImplementation((schema, handler) => {
      if (schema === ListToolsRequestSchema) {
        mockServer.handlers.listTools = handler;
      } else if (schema === CallToolRequestSchema) {
        mockServer.handlers.callTool = handler;
      }
    });

    setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);
  });

  describe('Tool Registration', () => {
    test('should register ListToolsRequestSchema handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        ListToolsRequestSchema,
        expect.any(Function)
      );
    });

    test('should register CallToolRequestSchema handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        CallToolRequestSchema,
        expect.any(Function)
      );
    });

    test('should log successful tool registration', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MCP tools registered successfully with schema validation:',
        { tools: ['server:start', 'server:stop', 'server:logs', 'server:status'] }
      );
    });
  });

  describe('List Tools Handler', () => {
    test('should return all 4 core tools', async () => {
      const request = { method: 'tools/list' };
      const response = await mockServer.handlers.listTools(request);

      expect(response.tools).toHaveLength(4);
      expect(response.tools.map(t => t.name)).toEqual([
        'server:start',
        'server:stop', 
        'server:logs',
        'server:status'
      ]);
    });

    test('should include proper tool schemas', async () => {
      const request = { method: 'tools/list' };
      const response = await mockServer.handlers.listTools(request);

      const startTool = response.tools.find(t => t.name === 'server:start');
      expect(startTool.inputSchema.required).toContain('cwd');
      expect(startTool.inputSchema.properties).toHaveProperty('command');
      expect(startTool.inputSchema.properties).toHaveProperty('port');
      expect(startTool.inputSchema.properties).toHaveProperty('env');
      expect(startTool.inputSchema.properties).toHaveProperty('sessionName');

      const stopTool = response.tools.find(t => t.name === 'server:stop');
      expect(stopTool.inputSchema.required).toContain('sessionId');

      const logsTool = response.tools.find(t => t.name === 'server:logs');
      expect(logsTool.inputSchema.required).toContain('sessionId');
      expect(logsTool.inputSchema.properties).toHaveProperty('tail');
      expect(logsTool.inputSchema.properties).toHaveProperty('filter');

      const statusTool = response.tools.find(t => t.name === 'server:status');
      expect(statusTool.inputSchema.properties).toEqual({});
    });
  });

  describe('Server Start Tool', () => {
    test('should start server with valid parameters', async () => {
      const mockResult = {
        sessionId: 'test-session-123',
        pid: 12345,
        port: 3000,
        status: 'starting',
        url: 'http://localhost:3000'
      };

      mockProcessManager.startServer.mockResolvedValue(mockResult);

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/test/project',
            command: 'npm start',
            port: 3000,
            env: { NODE_ENV: 'development' },
            sessionName: 'Test Server'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);

      expect(mockProcessManager.startServer).toHaveBeenCalledWith({
        command: 'npm start',
        cwd: '/test/project',
        env: { NODE_ENV: 'development' },
        port: 3000,
        sessionName: 'Test Server'
      });

      expect(response.content[0].type).toBe('text');
      const responseData = JSON.parse(response.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.sessionId).toBe('test-session-123');
      expect(responseData.port).toBe(3000);
    });

    test('should require cwd parameter', async () => {
      const request = {
        params: {
          name: 'server:start',
          arguments: {
            command: 'npm start'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Working directory (cwd) is required');
    });

    test('should handle process manager errors', async () => {
      mockProcessManager.startServer.mockRejectedValue(new Error('Failed to start server'));

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/test/project'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to start server');
      expect(response.isError).toBe(true);
    });

    test('should use default values for optional parameters', async () => {
      const mockResult = {
        sessionId: 'test-session-456',
        pid: 12346,
        port: 3000,
        status: 'starting'
      };

      mockProcessManager.startServer.mockResolvedValue(mockResult);

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/test/project'
          }
        }
      };

      await mockServer.handlers.callTool(request);

      expect(mockProcessManager.startServer).toHaveBeenCalledWith({
        command: undefined,
        cwd: '/test/project',
        env: {},
        port: 3000,
        sessionName: undefined
      });
    });
  });

  describe('Server Stop Tool', () => {
    test('should stop server with valid session ID', async () => {
      const mockResult = {
        success: true,
        message: 'Server test-session-123 stopping gracefully'
      };

      mockProcessManager.stopServer.mockReturnValue(mockResult);

      const request = {
        params: {
          name: 'server:stop',
          arguments: {
            sessionId: 'test-session-123'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);

      expect(mockProcessManager.stopServer).toHaveBeenCalledWith('test-session-123');

      const responseData = JSON.parse(response.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('test-session-123 stopped successfully');
    });

    test('should require sessionId parameter', async () => {
      const request = {
        params: {
          name: 'server:stop',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Session ID is required');
    });

    test('should handle session not found errors', async () => {
      mockProcessManager.stopServer.mockImplementation(() => {
        throw new Error('Session test-session-999 not found');
      });

      const request = {
        params: {
          name: 'server:stop',
          arguments: {
            sessionId: 'test-session-999'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('not found');
    });
  });

  describe('Server Logs Tool', () => {
    test('should retrieve logs with default parameters', async () => {
      const mockLogs = [
        { timestamp: Date.now() - 1000, type: 'stdout', data: 'Server starting...' },
        { timestamp: Date.now(), type: 'stdout', data: 'Server ready on port 3000' }
      ];

      mockProcessManager.getLogs.mockReturnValue(mockLogs);

      const request = {
        params: {
          name: 'server:logs',
          arguments: {
            sessionId: 'test-session-123'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);

      expect(mockProcessManager.getLogs).toHaveBeenCalledWith('test-session-123', {
        tail: 100,
        filter: null
      });

      const responseData = JSON.parse(response.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.sessionId).toBe('test-session-123');
      expect(responseData.logs).toHaveLength(2);
      expect(responseData.logs[0].data).toBe('Server starting...');
    });

    test('should apply tail and filter parameters', async () => {
      const mockLogs = [
        { timestamp: Date.now(), type: 'stderr', data: 'Error: Connection failed' }
      ];

      mockProcessManager.getLogs.mockReturnValue(mockLogs);

      const request = {
        params: {
          name: 'server:logs',
          arguments: {
            sessionId: 'test-session-123',
            tail: 50,
            filter: 'error'
          }
        }
      };

      await mockServer.handlers.callTool(request);

      expect(mockProcessManager.getLogs).toHaveBeenCalledWith('test-session-123', {
        tail: 50,
        filter: 'error'
      });
    });

    test('should require sessionId parameter', async () => {
      const request = {
        params: {
          name: 'server:logs',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Session ID is required');
    });

    test('should format log timestamps as ISO strings', async () => {
      const timestamp = Date.now();
      const mockLogs = [
        { timestamp, type: 'stdout', data: 'Test log entry' }
      ];

      mockProcessManager.getLogs.mockReturnValue(mockLogs);

      const request = {
        params: {
          name: 'server:logs',
          arguments: {
            sessionId: 'test-session-123'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.logs[0].timestamp).toBe(new Date(timestamp).toISOString());
    });
  });

  describe('Server Status Tool', () => {
    test('should return status of all sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          name: 'React App',
          command: 'npm start',
          port: 3000,
          status: 'running',
          pid: 12345,
          startTime: Date.now() - 60000,
          uptime: 60000
        },
        {
          id: 'session-2',
          name: 'Express API',
          command: 'npm run dev',
          port: 3001,
          status: 'stopped',
          pid: 12346,
          startTime: Date.now() - 120000,
          endTime: Date.now() - 30000
        }
      ];

      mockProcessManager.getAllSessions.mockReturnValue(mockSessions);

      const request = {
        params: {
          name: 'server:status',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(true);
      expect(responseData.totalSessions).toBe(2);
      expect(responseData.sessions).toHaveLength(2);
      
      const runningSession = responseData.sessions.find(s => s.id === 'session-1');
      expect(runningSession.uptime).toBe('60s');
      expect(runningSession.url).toBe('http://localhost:3000');

      const stoppedSession = responseData.sessions.find(s => s.id === 'session-2');
      expect(stoppedSession.uptime).toBe('N/A');
    });

    test('should handle empty session list', async () => {
      mockProcessManager.getAllSessions.mockReturnValue([]);

      const request = {
        params: {
          name: 'server:status',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(true);
      expect(responseData.totalSessions).toBe(0);
      expect(responseData.sessions).toHaveLength(0);
      expect(responseData.message).toContain('Found 0 server sessions');
    });

    test('should include dashboard URL in response', async () => {
      mockProcessManager.getAllSessions.mockReturnValue([]);

      const request = {
        params: {
          name: 'server:status',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.dashboardUrl).toBe('http://localhost:8080');
    });
  });

  describe('Unknown Tool Handling', () => {
    test('should handle unknown tools gracefully', async () => {
      const request = {
        params: {
          name: 'unknown:tool',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unknown tool: unknown:tool');
      expect(response.isError).toBe(true);
    });
  });

  describe('Error Logging', () => {
    test('should log errors with proper context', async () => {
      mockProcessManager.startServer.mockRejectedValue(new Error('Test error'));

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/test/project'
          }
        }
      };

      await mockServer.handlers.callTool(request);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error handling tool server:start:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          arguments: { cwd: '/test/project' }
        })
      );
    });
  });
});