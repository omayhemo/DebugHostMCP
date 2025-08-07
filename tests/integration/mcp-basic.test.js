/**
 * Integration Tests for MCP Basic Functionality
 * Tests server startup, MCP protocol compliance, and SSE streaming
 */

const request = require('supertest');
const http = require('http');
const { startServer, gracefulShutdown, PORT, HOST } = require('../../src/mcp-server');

describe('MCP Basic Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Ensure no server is running on the port
    await new Promise((resolve) => {
      const testServer = http.createServer();
      testServer.listen(PORT, HOST, (error) => {
        if (error && error.code === 'EADDRINUSE') {
          // Port is in use, that's expected
          resolve();
        } else {
          testServer.close(() => resolve());
        }
      });
    });

    // Start the MCP server
    server = await startServer();
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  }, 10000);

  describe('Server Startup', () => {
    test('should start server on correct port and host', async () => {
      // Test that server is accessible
      const response = await request(`http://${HOST}:${PORT}`)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('should bind to localhost only (127.0.0.1)', async () => {
      // This test verifies that the server is bound to localhost only
      // We can't easily test external access in a unit test environment,
      // but we can verify the configuration
      expect(HOST).toBe('127.0.0.1');
      expect(PORT).toBe(2601);
    });
  });

  describe('MCP Protocol Integration', () => {
    test('complete MCP workflow: initialize -> list tools -> call tool', async () => {
      // Step 1: Initialize MCP session
      const initResponse = await request(`http://${HOST}:${PORT}`)
        .post('/mcp/initialize')
        .send({})
        .expect(200);

      expect(initResponse.body.protocol).toBe('mcp');
      expect(initResponse.body.capabilities.tools).toBe(true);

      // Step 2: Get tool list
      const toolsResponse = await request(`http://${HOST}:${PORT}`)
        .post('/mcp/tools/list')
        .send({})
        .expect(200);

      expect(toolsResponse.body.tools).toBeDefined();
      expect(toolsResponse.body.tools.length).toBeGreaterThan(0);

      // Step 3: Call a tool
      const callResponse = await request(`http://${HOST}:${PORT}`)
        .post('/mcp/tools/call')
        .send({
          name: 'host.list',
          arguments: {}
        })
        .expect(200);

      expect(callResponse.body.result).toBeDefined();
      expect(callResponse.body.error).toBeNull();
    });

    test('should handle multiple concurrent tool calls', async () => {
      const promises = [];
      
      // Create 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        const promise = request(`http://${HOST}:${PORT}`)
          .post('/mcp/tools/call')
          .send({
            name: 'host.checkPort',
            arguments: { port: 3000 + i }
          })
          .expect(200);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.body.result).toBeDefined();
        expect(response.body.result.success).toBe(true);
        expect(response.body.error).toBeNull();
      });
    });

    test('should maintain MCP protocol format for all tool calls', async () => {
      const tools = ['host.list', 'host.checkPort'];
      const toolArgs = [
        {},
        { port: 8080 }
      ];

      for (let i = 0; i < tools.length; i++) {
        const response = await request(`http://${HOST}:${PORT}`)
          .post('/mcp/tools/call')
          .send({
            name: tools[i],
            arguments: toolArgs[i]
          })
          .expect(200);

        // Verify MCP protocol format
        expect(response.body).toHaveProperty('result');
        expect(response.body).toHaveProperty('error', null);
        expect(typeof response.body.result).toBe('object');
      }
    });
  });

  describe('SSE Streaming Integration', () => {
    test('should establish SSE connection for log streaming', (done) => {
      const projectId = 'test-project-sse';
      
      // Create HTTP request to SSE endpoint
      const options = {
        hostname: HOST,
        port: PORT,
        path: `/mcp/logs/${projectId}/stream`,
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      };

      const req = http.request(options, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/event-stream');
        expect(res.headers['cache-control']).toBe('no-cache');
        expect(res.headers['connection']).toBe('keep-alive');

        let eventCount = 0;
        let dataBuffer = '';

        res.on('data', (chunk) => {
          dataBuffer += chunk.toString();
          
          // Look for complete events (ending with \n\n)
          const events = dataBuffer.split('\n\n');
          if (events.length > 1) {
            // Process complete events
            for (let i = 0; i < events.length - 1; i++) {
              const event = events[i];
              if (event.includes('event:') && event.includes('data:')) {
                eventCount++;
                
                // Parse the event data
                const lines = event.split('\n');
                const eventType = lines.find(line => line.startsWith('event:'))?.split(':')[1]?.trim();
                const dataLine = lines.find(line => line.startsWith('data:'))?.split('data:')[1]?.trim();
                
                if (dataLine) {
                  try {
                    const eventData = JSON.parse(dataLine);
                    expect(eventData).toHaveProperty('projectId', projectId);
                    expect(eventData).toHaveProperty('timestamp');
                  } catch (e) {
                    // Some events might not be JSON
                  }
                }
                
                // After receiving first event, close connection
                if (eventCount >= 1) {
                  req.destroy();
                  done();
                  return;
                }
              }
            }
            // Keep remaining partial event
            dataBuffer = events[events.length - 1];
          }
        });

        res.on('error', (error) => {
          done(error);
        });
      });

      req.on('error', (error) => {
        done(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        done(new Error('SSE connection timeout'));
      });

      req.end();
    }, 10000);

    test('should handle multiple concurrent SSE connections', (done) => {
      const projectIds = ['project-1', 'project-2', 'project-3'];
      let completedConnections = 0;

      projectIds.forEach((projectId, index) => {
        const options = {
          hostname: HOST,
          port: PORT,
          path: `/mcp/logs/${projectId}/stream`,
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        };

        const req = http.request(options, (res) => {
          expect(res.statusCode).toBe(200);

          res.on('data', () => {
            // Just verify we get data, then close
            req.destroy();
            completedConnections++;
            
            if (completedConnections === projectIds.length) {
              done();
            }
          });

          res.on('error', (error) => {
            done(error);
          });
        });

        req.on('error', (error) => {
          done(error);
        });

        req.setTimeout(3000, () => {
          req.destroy();
          done(new Error(`SSE connection timeout for ${projectId}`));
        });

        req.end();
      });
    }, 15000);
  });

  describe('Error Handling Integration', () => {
    test('should return proper MCP error format for all error types', async () => {
      const errorTests = [
        {
          name: 'Invalid JSON',
          request: () => request(`http://${HOST}:${PORT}`)
            .post('/mcp/tools/call')
            .send('invalid json')
            .expect(400)
        },
        {
          name: 'Missing tool name',
          request: () => request(`http://${HOST}:${PORT}`)
            .post('/mcp/tools/call')
            .send({ arguments: {} })
            .expect(400)
        },
        {
          name: 'Unknown tool',
          request: () => request(`http://${HOST}:${PORT}`)
            .post('/mcp/tools/call')
            .send({ name: 'unknown.tool', arguments: {} })
            .expect(400)
        },
        {
          name: 'Unknown endpoint',
          request: () => request(`http://${HOST}:${PORT}`)
            .get('/unknown')
            .expect(404)
        }
      ];

      for (const test of errorTests) {
        const response = await test.request();
        
        // All errors should follow MCP format
        expect(response.body).toHaveProperty('result', null);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(typeof response.body.error.code).toBe('string');
        expect(typeof response.body.error.message).toBe('string');
      }
    });
  });

  describe('Performance and Load', () => {
    test('should handle rapid sequential requests', async () => {
      const startTime = Date.now();
      const requests = [];

      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(`http://${HOST}:${PORT}`)
            .post('/mcp/tools/list')
            .send({})
            .expect(200)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.tools).toBeDefined();
      });

      // Should complete within reasonable time (5 seconds for 10 requests)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate load with 20 tool calls
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(`http://${HOST}:${PORT}`)
            .post('/mcp/tools/call')
            .send({
              name: 'host.list',
              arguments: {}
            })
            .expect(200)
        );
      }

      await Promise.all(promises);
      
      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory shouldn't increase dramatically (allow 50MB increase)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
});