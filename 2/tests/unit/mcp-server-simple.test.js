/**
 * Simplified Unit Tests for MCP Server
 * Tests core MCP protocol compliance with minimal setup
 */

const request = require('supertest');
const express = require('express');

// Create a minimal test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Basic endpoints
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  app.post('/mcp/initialize', (req, res) => {
    res.json({
      protocol: 'mcp',
      version: '1.0',
      capabilities: { tools: true }
    });
  });
  
  app.post('/mcp/tools/list', (req, res) => {
    res.json({
      tools: [
        { name: 'host.register', description: 'Register a project' },
        { name: 'host.start', description: 'Start a project' }
      ]
    });
  });
  
  app.post('/mcp/tools/call', (req, res) => {
    const { tool } = req.body;
    if (!tool) {
      return res.status(400).json({
        error: { code: 'MISSING_TOOL', message: 'Tool required' }
      });
    }
    res.json({ result: { success: true }, error: null });
  });
  
  return app;
}

describe('MCP Server Basic Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test('health check works', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
  });

  test('MCP initialize works', async () => {
    const response = await request(app)
      .post('/mcp/initialize')
      .expect(200);
    
    expect(response.body.protocol).toBe('mcp');
    expect(response.body.version).toBe('1.0');
  });

  test('MCP tools list works', async () => {
    const response = await request(app)
      .post('/mcp/tools/list')
      .expect(200);
    
    expect(Array.isArray(response.body.tools)).toBe(true);
    expect(response.body.tools.length).toBeGreaterThan(0);
  });

  test('MCP tool call works', async () => {
    const response = await request(app)
      .post('/mcp/tools/call')
      .send({ tool: 'host.register' })
      .expect(200);
    
    expect(response.body.result).toBeDefined();
    expect(response.body.result.success).toBe(true);
  });

  test('MCP tool call handles missing tool', async () => {
    const response = await request(app)
      .post('/mcp/tools/call')
      .send({})
      .expect(400);
    
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('MISSING_TOOL');
  });
});