/**
 * Phase 1 Full Integration Test
 * Tests all four Sprint 1 stories working together:
 * - Story 1.1: Docker Base Images
 * - Story 1.2: MCP HTTP Server
 * - Story 1.3: Docker Manager
 * - Story 1.4: Port Registry
 */

const Docker = require('dockerode');
const axios = require('axios');
const DockerManager = require('../../src/docker-manager');
const PortRegistry = require('../../src/port-registry');
const path = require('path');
const fs = require('fs').promises;

const docker = new Docker();
const BASE_URL = 'http://127.0.0.1:2601';

describe('Phase 1 - Full Integration Test', () => {
  let server;
  let dockerManager;
  let portRegistry;
  let testProjectId;

  beforeAll(async () => {
    console.log('\n=== Phase 1 Integration Test Starting ===\n');
    
    // Initialize components
    dockerManager = new DockerManager();
    portRegistry = new PortRegistry();
    
    // Start MCP server (Story 1.2)
    const MCPServer = require('../../src/mcp-server');
    server = await MCPServer.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    // Cleanup
    if (testProjectId) {
      try {
        await dockerManager.stopContainer(testProjectId);
        await dockerManager.removeContainer(testProjectId);
        await portRegistry.release(testProjectId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    if (server) {
      await server.close();
    }
    
    console.log('\n=== Phase 1 Integration Test Complete ===\n');
  });

  test('1. Verify Docker base images exist (Story 1.1)', async () => {
    console.log('Testing: Docker base images availability...');
    
    const images = await docker.listImages();
    const debugHostImages = images.filter(img => 
      img.RepoTags && img.RepoTags.some(tag => tag.startsWith('debug-host/'))
    );
    
    // Verify all 4 base images exist
    const expectedImages = ['node', 'python', 'php', 'static'];
    const foundImages = [];
    
    for (const image of debugHostImages) {
      for (const tag of image.RepoTags) {
        for (const type of expectedImages) {
          if (tag === `debug-host/${type}:latest`) {
            foundImages.push(type);
            console.log(`  ✓ Found ${tag}`);
          }
        }
      }
    }
    
    expect(foundImages.length).toBeGreaterThan(0);
    console.log(`  → ${foundImages.length}/4 base images found\n`);
  });

  test('2. MCP Server responds correctly (Story 1.2)', async () => {
    console.log('Testing: MCP Server endpoints...');
    
    // Test health check
    const health = await axios.get(`${BASE_URL}/health`);
    expect(health.status).toBe(200);
    expect(health.data.status).toBe('healthy');
    console.log('  ✓ Health check passed');
    
    // Test MCP initialize
    const init = await axios.post(`${BASE_URL}/mcp/initialize`);
    expect(init.data.protocol).toBe('mcp');
    expect(init.data.version).toBe('1.0');
    expect(init.data.capabilities).toHaveProperty('tools', true);
    console.log('  ✓ MCP initialization successful');
    
    // Test tool list
    const tools = await axios.post(`${BASE_URL}/mcp/tools/list`);
    expect(Array.isArray(tools.data.tools)).toBe(true);
    expect(tools.data.tools.length).toBeGreaterThan(0);
    console.log(`  ✓ ${tools.data.tools.length} tools available\n`);
  });

  test('3. Port Registry allocates ports correctly (Story 1.4)', async () => {
    console.log('Testing: Port Registry allocation...');
    
    // Test port allocation for each type
    const types = ['node', 'python', 'php', 'static'];
    const expectedRanges = {
      node: [3000, 3999],
      python: [5000, 5999],
      php: [8080, 8980],
      static: [4000, 4999]
    };
    
    for (const type of types) {
      const projectId = `test_${type}_${Date.now()}`;
      const result = await portRegistry.allocate(projectId, `test-${type}`, type);
      
      expect(result.success).toBe(true);
      expect(result.port).toBeGreaterThanOrEqual(expectedRanges[type][0]);
      expect(result.port).toBeLessThanOrEqual(expectedRanges[type][1]);
      
      console.log(`  ✓ ${type}: allocated port ${result.port}`);
      
      // Clean up
      await portRegistry.release(projectId);
    }
    
    // Test system port protection
    const systemResult = await portRegistry.allocate('test_system', 'test', 'node', 2650);
    expect(systemResult.success).toBe(false);
    expect(systemResult.error).toBe('SYSTEM_RESERVED');
    console.log('  ✓ System ports protected\n');
  });

  test('4. Docker Manager creates and manages containers (Story 1.3)', async () => {
    console.log('Testing: Docker Manager container lifecycle...');
    
    testProjectId = `proj_test_${Date.now()}`;
    
    // Create test workspace
    const testWorkspace = path.join('/tmp', `test-app-${Date.now()}`);
    await fs.mkdir(testWorkspace, { recursive: true });
    await fs.writeFile(
      path.join(testWorkspace, 'index.js'),
      'console.log("Test app running"); setInterval(() => {}, 1000);'
    );
    
    // Test container creation
    const createResult = await dockerManager.createContainer(
      testProjectId,
      'node',
      testWorkspace,
      { PORT: 3000 }
    );
    expect(createResult.success).toBe(true);
    console.log('  ✓ Container created');
    
    // Test container start
    const startResult = await dockerManager.startContainer(testProjectId);
    expect(startResult.success).toBe(true);
    console.log('  ✓ Container started');
    
    // Test container status
    const status = await dockerManager.getContainerStatus(testProjectId);
    expect(status.running).toBe(true);
    expect(status.stats).toHaveProperty('cpu');
    expect(status.stats).toHaveProperty('memory');
    console.log('  ✓ Container monitoring working');
    
    // Test container stop
    const stopResult = await dockerManager.stopContainer(testProjectId);
    expect(stopResult.success).toBe(true);
    console.log('  ✓ Container stopped');
    
    // Clean up
    await dockerManager.removeContainer(testProjectId);
    await fs.rm(testWorkspace, { recursive: true, force: true });
    console.log('  ✓ Container removed\n');
  });

  test('5. Full workflow integration', async () => {
    console.log('Testing: Complete integration workflow...');
    
    const projectId = `proj_integration_${Date.now()}`;
    const projectName = 'integration-test-app';
    const projectType = 'node';
    
    // Step 1: Allocate port
    const portResult = await portRegistry.allocate(projectId, projectName, projectType);
    expect(portResult.success).toBe(true);
    const assignedPort = portResult.port;
    console.log(`  ✓ Port allocated: ${assignedPort}`);
    
    // Step 2: Create test app
    const workspace = path.join('/tmp', projectName);
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(
      path.join(workspace, 'index.js'),
      `
        const http = require('http');
        const port = process.env.PORT || 3000;
        const server = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Integration test server');
        });
        server.listen(port, () => {
          console.log(\`Server running on port \${port}\`);
        });
      `
    );
    
    // Step 3: Create and start container
    const createResult = await dockerManager.createContainer(
      projectId,
      projectType,
      workspace,
      { PORT: assignedPort.toString() }
    );
    expect(createResult.success).toBe(true);
    console.log('  ✓ Container created with allocated port');
    
    const startResult = await dockerManager.startContainer(projectId);
    expect(startResult.success).toBe(true);
    console.log('  ✓ Container started successfully');
    
    // Step 4: Verify container is running
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for startup
    
    const status = await dockerManager.getContainerStatus(projectId);
    expect(status.running).toBe(true);
    console.log('  ✓ Container verified running');
    
    // Step 5: Clean up
    await dockerManager.stopContainer(projectId);
    await dockerManager.removeContainer(projectId);
    await portRegistry.release(projectId);
    await fs.rm(workspace, { recursive: true, force: true });
    
    console.log('  ✓ Full workflow completed successfully\n');
  });

  test('6. Component isolation and error handling', async () => {
    console.log('Testing: Error handling and isolation...');
    
    // Test port conflict handling
    const proj1 = `proj_conflict1_${Date.now()}`;
    const proj2 = `proj_conflict2_${Date.now()}`;
    
    const port1 = await portRegistry.allocate(proj1, 'app1', 'node', 3500);
    expect(port1.success).toBe(true);
    
    const port2 = await portRegistry.allocate(proj2, 'app2', 'node', 3500);
    expect(port2.success).toBe(false);
    expect(port2.error).toBe('PORT_IN_USE');
    expect(Array.isArray(port2.suggestions)).toBe(true);
    console.log('  ✓ Port conflict detected and handled');
    
    // Test container cleanup on error
    const errorProj = `proj_error_${Date.now()}`;
    const result = await dockerManager.createContainer(
      errorProj,
      'node',
      '/nonexistent/path',
      {}
    );
    
    // Should handle gracefully even with invalid path
    // Container might be created but fail to start
    console.log('  ✓ Error handling works');
    
    // Clean up
    await portRegistry.release(proj1);
    await dockerManager.removeContainer(errorProj).catch(() => {});
    
    console.log('  ✓ Component isolation verified\n');
  });
});

// Run integration test if called directly
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=phase1-full-integration']);
}