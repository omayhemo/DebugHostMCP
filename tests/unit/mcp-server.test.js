/**
 * Unit Tests for MCP Server
 * Tests core MCP protocol compliance and functionality
 */

const request = require('supertest');
const express = require('express');

// Create a test instance of the app without starting the server
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Import middleware and routes from mcp-server
  const cors = require('cors');
  app.use(cors({ origin: true, credentials: true }));
  
  // Import the MCP tools
  const MCPTools = require('../../src/mcp-tools');
  
  // Add health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Add API docs
  app.get('/api/docs', (req, res) => {
    res.json({ endpoints: [] });
  });
  
  // MCP endpoints
  app.post('/mcp/initialize', (req, res) => {
    res.json({
      protocol: 'mcp',
      version: '1.0',
      capabilities: { tools: true, streaming: true }
    });
  });
  
  app.post('/mcp/tools/list', (req, res) => {
    res.json({ tools: MCPTools.getToolDefinitions() });
  });
  
  app.post('/mcp/tools/call', async (req, res) => {
    const { tool, arguments: args } = req.body;
    if (!tool) {
      return res.status(400).json({
        result: null,
        error: { code: 'MISSING_TOOL', message: 'Tool parameter is required' }
      });
    }
    
    const handler = MCPTools.TOOL_HANDLERS[tool];
    if (!handler) {
      return res.status(400).json({
        result: null,
        error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${tool}` }
      });
    }
    
    try {
      const result = await handler(args || {});
      res.json({ result, error: null });
    } catch (error) {
      res.status(400).json({
        result: null,
        error: { code: 'TOOL_ERROR', message: error.message }
      });
    }
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  return app;
}

describe('MCP Server Unit Tests', () => {
  let app;

  beforeAll(() => {
    // Create test app without starting server
    app = createTestApp();
  });

  afterAll(() => {
    // No server to close
  });

  describe('Server Health', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('sse');
      expect(response.body).toHaveProperty('memory');
    });

    test('should serve API documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body).toHaveProperty('protocol', 'MCP (Model Context Protocol)');
      expect(response.body).toHaveProperty('version', '1.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
    });
  });

  describe('MCP Protocol Compliance', () => {
    test('MCP initialize should return correct format', async () => {
      const response = await request(app)
        .post('/mcp/initialize')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('protocol', 'mcp');
      expect(response.body).toHaveProperty('version', '1.0');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body.capabilities).toHaveProperty('tools', true);
      expect(response.body.capabilities).toHaveProperty('streaming', true);
      expect(response.body).toHaveProperty('serverInfo');
    });

    test('MCP tools list should return available tools', async () => {
      const response = await request(app)
        .post('/mcp/tools/list')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      
      // Check required tools are present
      const toolNames = response.body.tools.map(tool => tool.name);
      expect(toolNames).toContain('host.register');
      expect(toolNames).toContain('host.start');
      expect(toolNames).toContain('host.stop');
      expect(toolNames).toContain('host.list');
      expect(toolNames).toContain('host.checkPort');

      // Validate tool structure
      response.body.tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    test('MCP tool call should handle valid requests', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.list',
          arguments: {}
        })
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('error', null);
      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('projects');
      expect(Array.isArray(response.body.result.projects)).toBe(true);
    });

    test('MCP tool call should handle tool with parameters', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.checkPort',
          arguments: { port: 8080 }
        })
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('error', null);
      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('port', 8080);
      expect(response.body.result).toHaveProperty('available');
      expect(typeof response.body.result.available).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('result', null);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'METHOD_NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });

    test('should handle invalid JSON in tool calls', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('result', null);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    test('should validate required tool parameters', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.register',
          arguments: {} // Missing required workspace and name
        })
        .expect(400);

      expect(response.body).toHaveProperty('result', null);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_PARAMS');
    });

    test('should handle unknown tool calls', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'unknown.tool',
          arguments: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('result', null);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'TOOL_NOT_FOUND');
    });

    test('should validate tool call request format', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          // Missing name field
          arguments: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('result', null);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_PARAMS');
    });
  });

  describe('CORS Configuration', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/mcp/initialize')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Tool Implementations', () => {
    test('host.register should create project with valid parameters', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.register',
          arguments: {
            workspace: '/path/to/project',
            name: 'test-project',
            techStack: ['node', 'express'],
            ports: [3000]
          }
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('projectId');
      expect(response.body.result).toHaveProperty('message');
      expect(response.body.result.details).toHaveProperty('workspace', '/path/to/project');
      expect(response.body.result.details).toHaveProperty('name', 'test-project');
    });

    test('host.start should start project with valid ID', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.start',
          arguments: {
            projectId: 'test-project-123'
          }
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('projectId', 'test-project-123');
      expect(response.body.result).toHaveProperty('status', 'starting');
    });

    test('host.stop should stop project with valid ID', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.stop',
          arguments: {
            projectId: 'test-project-123'
          }
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('projectId', 'test-project-123');
      expect(response.body.result).toHaveProperty('status', 'stopped');
    });

    test('host.list should filter by status', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.list',
          arguments: {
            status: 'running'
          }
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('success', true);
      expect(response.body.result.filters).toHaveProperty('status', 'running');
    });

    test('host.checkPort should validate port range', async () => {
      const response = await request(app)
        .post('/mcp/tools/call')
        .send({
          name: 'host.checkPort',
          arguments: {
            port: 70000 // Invalid port
          }
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Port must be between 1 and 65535');
    });
  });
});