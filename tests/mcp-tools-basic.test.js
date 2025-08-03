/**
 * Basic MCP Tools Tests
 * Tests the basic functionality of MCP tools without complex mocking
 */

// Mock the MCP SDK at the module level
jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: { method: 'tools/list' },
  CallToolRequestSchema: { method: 'tools/call' }
}));

const { setupTools } = require('../src/mcp-tools');

describe('MCP Tools Basic Tests', () => {
  let mockServer;
  let mockProcessManager;
  let mockLogStore;
  let mockLogger;

  beforeEach(() => {
    mockLogger = global.mockLogger;

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
      if (schema.method === 'tools/list') {
        mockServer.handlers.listTools = handler;
      } else if (schema.method === 'tools/call') {
        mockServer.handlers.callTool = handler;
      }
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Setup and Registration', () => {
    test('should register MCP tools correctly', () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Setting up MCP tools with proper schema handling...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MCP tools registered successfully with schema validation:',
        { tools: ['server:start', 'server:stop', 'server:logs', 'server:status'] }
      );
    });

    test('should register tools list handler', () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const listToolsCall = mockServer.setRequestHandler.mock.calls.find(
        call => call[0].method === 'tools/list'
      );
      expect(listToolsCall).toBeDefined();
    });

    test('should register tool call handler', () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const callToolCall = mockServer.setRequestHandler.mock.calls.find(
        call => call[0].method === 'tools/call'
      );
      expect(callToolCall).toBeDefined();
    });
  });

  describe('Tools List Handler', () => {
    test('should return all 4 core tools', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

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

    test('should include proper tool descriptions', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const request = { method: 'tools/list' };
      const response = await mockServer.handlers.listTools(request);

      const startTool = response.tools.find(t => t.name === 'server:start');
      expect(startTool.description).toContain('Start a development server');
      expect(startTool.inputSchema.required).toContain('cwd');

      const stopTool = response.tools.find(t => t.name === 'server:stop');
      expect(stopTool.description).toContain('Stop a running server');
      expect(stopTool.inputSchema.required).toContain('sessionId');

      const logsTool = response.tools.find(t => t.name === 'server:logs');
      expect(logsTool.description).toContain('Get console logs');
      expect(logsTool.inputSchema.required).toContain('sessionId');

      const statusTool = response.tools.find(t => t.name === 'server:status');
      expect(statusTool.description).toContain('Get status of all server sessions');
    });
  });

  describe('Tool Call Handler Basic Structure', () => {
    test('should handle unknown tool names', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

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

    test('should handle server:start parameter validation', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            // Missing required 'cwd' parameter
            command: 'npm start'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      // The error might be about cwd or port - both are validation errors
      expect(responseData.error).toBeDefined();
      expect(typeof responseData.error).toBe('string');
    });

    test('should handle server:stop parameter validation', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const request = {
        params: {
          name: 'server:stop',
          arguments: {
            // Missing required 'sessionId' parameter
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Session ID is required');
    });

    test('should handle server:logs parameter validation', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      const request = {
        params: {
          name: 'server:logs',
          arguments: {
            // Missing required 'sessionId' parameter
            tail: 50
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Session ID is required');
    });

    test('should handle server:status calls', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      mockProcessManager.getAllSessions.mockReturnValue([
        {
          id: 'test-session',
          name: 'Test Server',
          status: 'running',
          port: 3000,
          uptime: 60000
        }
      ]);

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
      expect(responseData.sessions).toHaveLength(1);
      expect(responseData.sessions[0].uptime).toBe('60s');
    });
  });

  describe('Error Handling', () => {
    test('should log errors with proper context', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      mockProcessManager.startServer.mockRejectedValue(new Error('Test error'));

      const request = {
        params: {
          name: 'server:start',
          arguments: {
            cwd: '/test/project'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error handling tool server:start:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          arguments: { cwd: '/test/project' }
        })
      );

      const responseData = JSON.parse(response.content[0].text);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Test error');
    });

    test('should handle process manager failures gracefully', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      mockProcessManager.stopServer.mockImplementation(() => {
        throw new Error('Process not found');
      });

      const request = {
        params: {
          name: 'server:stop',
          arguments: {
            sessionId: 'non-existent'
          }
        }
      };

      const response = await mockServer.handlers.callTool(request);
      const responseData = JSON.parse(response.content[0].text);

      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Process not found');
      expect(response.isError).toBe(true);
    });
  });

  describe('Response Format Validation', () => {
    test('should return properly formatted responses', async () => {
      setupTools(mockServer, mockProcessManager, mockLogStore, mockLogger);

      mockProcessManager.getAllSessions.mockReturnValue([]);

      const request = {
        params: {
          name: 'server:status',
          arguments: {}
        }
      };

      const response = await mockServer.handlers.callTool(request);

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Verify JSON is valid
      expect(() => JSON.parse(response.content[0].text)).not.toThrow();

      const responseData = JSON.parse(response.content[0].text);
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('message');
    });
  });
});