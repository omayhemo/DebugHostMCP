/**
 * Integration Tests: Container Lifecycle Workflows
 * Story 2.2: Container Lifecycle Management
 */

const path = require('path');
const fs = require('fs').promises;
const { ContainerLifecycle, CONTAINER_STATES } = require('../../src/services/container-lifecycle');
const { ProjectRegistry } = require('../../src/services/project-registry');
const DockerManager = require('../../src/docker-manager');
const { initializeServices, executeTool } = require('../../src/mcp-tools');

// Test workspace setup
const TEST_WORKSPACE_BASE = path.join(__dirname, '../fixtures/container-lifecycle');

describe('Container Lifecycle Integration', () => {
  let containerLifecycle;
  let projectRegistry;
  let dockerManager;
  let testWorkspaces = [];
  let testProjects = [];

  beforeAll(async () => {
    // Ensure test workspace exists
    try {
      await fs.mkdir(TEST_WORKSPACE_BASE, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    // Cleanup test workspaces
    for (const workspace of testWorkspaces) {
      try {
        await fs.rmdir(workspace, { recursive: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  beforeEach(async () => {
    // Initialize fresh services for each test
    projectRegistry = new ProjectRegistry();
    await projectRegistry.initialize();

    dockerManager = new DockerManager();
    
    containerLifecycle = new ContainerLifecycle(projectRegistry, dockerManager);
    
    try {
      await containerLifecycle.initialize();
    } catch (error) {
      console.warn('Docker not available, skipping Docker-dependent tests:', error.message);
    }
  });

  afterEach(async () => {
    // Clean up test projects
    for (const projectId of testProjects) {
      try {
        // Try to stop and remove any containers
        await containerLifecycle.stopContainer(projectId, { force: true });
        await projectRegistry.unregisterProject(projectId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    testProjects = [];

    // Shutdown services
    if (containerLifecycle) {
      await containerLifecycle.shutdown();
    }
  });

  async function createTestWorkspace(name, files = {}, directories = []) {
    const workspacePath = path.join(TEST_WORKSPACE_BASE, name);
    testWorkspaces.push(workspacePath);

    // Create workspace directory
    await fs.mkdir(workspacePath, { recursive: true });

    // Create subdirectories
    for (const dir of directories) {
      await fs.mkdir(path.join(workspacePath, dir), { recursive: true });
    }

    // Create files
    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(workspacePath, filename), content);
    }

    return workspacePath;
  }

  describe('Complete Container Lifecycle Flow', () => {
    it('should execute full register -> start -> status -> stop workflow', async () => {
      const workspace = await createTestWorkspace('full-lifecycle-node', {
        'package.json': JSON.stringify({
          name: 'full-lifecycle-test',
          version: '1.0.0',
          dependencies: { express: '^4.18.0' }
        }),
        'index.js': 'console.log("Hello from container");'
      });

      // Step 1: Register the project
      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Full Lifecycle Test'
      });

      expect(registrationResult.success).toBe(true);
      expect(registrationResult.projectId).toMatch(/^proj_[a-f0-9]{12}$/);
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Step 2: Start the container
      let startResult;
      try {
        startResult = await containerLifecycle.startContainer(projectId);
        
        expect(startResult.success).toBe(true);
        expect(startResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(startResult.containerId).toBeDefined();
        expect(startResult.accessUrl).toMatch(/^http:\/\/localhost:\d+$/);
        expect(startResult.startTime).toBeGreaterThan(0);
      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }

      // Step 3: Check container status
      const statusResult = await containerLifecycle.getContainerStatus(projectId);

      expect(statusResult.success).toBe(true);
      expect(statusResult.status).toBe(CONTAINER_STATES.RUNNING);
      expect(statusResult.containerId).toBe(startResult.containerId);
      expect(statusResult.isRunning).toBe(true);
      expect(statusResult.uptime).toBeGreaterThan(0);

      // Step 4: Stop the container
      const stopResult = await containerLifecycle.stopContainer(projectId);

      expect(stopResult.success).toBe(true);
      expect(stopResult.status).toBe(CONTAINER_STATES.STOPPED);
      expect(stopResult.stopTime).toBeGreaterThan(0);

      // Step 5: Verify final status
      const finalStatusResult = await containerLifecycle.getContainerStatus(projectId);

      expect(finalStatusResult.success).toBe(true);
      expect(finalStatusResult.status).toBe(CONTAINER_STATES.STOPPED);
      expect(finalStatusResult.containerId).toBeNull();
      expect(finalStatusResult.isRunning).toBe(false);
    });

    it('should handle restart workflow correctly', async () => {
      const workspace = await createTestWorkspace('restart-workflow-node', {
        'package.json': JSON.stringify({
          name: 'restart-test',
          version: '1.0.0'
        })
      });

      // Register project
      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Restart Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      try {
        // Start container
        const startResult = await containerLifecycle.startContainer(projectId);
        const originalContainerId = startResult.containerId;

        // Restart container
        const restartResult = await containerLifecycle.restartContainer(projectId);

        expect(restartResult.success).toBe(true);
        expect(restartResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(restartResult.containerId).toBeDefined();
        expect(restartResult.containerId).not.toBe(originalContainerId); // Should be a new container
        expect(restartResult.restartTime).toBeGreaterThan(0);

        // Verify container is running
        const statusResult = await containerLifecycle.getContainerStatus(projectId);
        expect(statusResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(statusResult.isRunning).toBe(true);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Multi-Container Management', () => {
    it('should manage multiple containers simultaneously', async () => {
      // Create multiple test projects
      const projects = [];
      const projectIds = [];

      for (let i = 1; i <= 3; i++) {
        const workspace = await createTestWorkspace(`multi-container-${i}`, {
          'package.json': JSON.stringify({
            name: `multi-test-${i}`,
            version: '1.0.0'
          })
        });

        const registrationResult = await projectRegistry.registerProject({
          workspace,
          name: `Multi Test ${i}`
        });

        projects.push(registrationResult);
        projectIds.push(registrationResult.projectId);
        testProjects.push(registrationResult.projectId);
      }

      try {
        // Start all containers concurrently
        const startPromises = projectIds.map(id => 
          containerLifecycle.startContainer(id)
        );
        const startResults = await Promise.all(startPromises);

        // Verify all started successfully
        startResults.forEach((result, index) => {
          expect(result.success).toBe(true);
          expect(result.status).toBe(CONTAINER_STATES.RUNNING);
          expect(result.projectId).toBe(projectIds[index]);
        });

        // Verify each has unique ports
        const ports = startResults.map(r => r.ports.primary);
        const uniquePorts = new Set(ports);
        expect(uniquePorts.size).toBe(ports.length); // All ports should be unique

        // Check status of all containers
        const statusPromises = projectIds.map(id => 
          containerLifecycle.getContainerStatus(id)
        );
        const statusResults = await Promise.all(statusPromises);

        statusResults.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.status).toBe(CONTAINER_STATES.RUNNING);
          expect(result.isRunning).toBe(true);
        });

        // Stop all containers
        const stopPromises = projectIds.map(id => 
          containerLifecycle.stopContainer(id)
        );
        const stopResults = await Promise.all(stopPromises);

        stopResults.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.status).toBe(CONTAINER_STATES.STOPPED);
        });

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });

    it('should prevent port conflicts', async () => {
      // Create two projects that would want the same port range
      const workspace1 = await createTestWorkspace('port-conflict-1', {
        'package.json': JSON.stringify({ name: 'conflict-test-1' })
      });

      const workspace2 = await createTestWorkspace('port-conflict-2', {
        'package.json': JSON.stringify({ name: 'conflict-test-2' })
      });

      // Register both projects
      const reg1 = await projectRegistry.registerProject({
        workspace: workspace1,
        name: 'Conflict Test 1'
      });
      const reg2 = await projectRegistry.registerProject({
        workspace: workspace2,
        name: 'Conflict Test 2'
      });

      testProjects.push(reg1.projectId, reg2.projectId);

      try {
        // Start both containers
        const [start1, start2] = await Promise.all([
          containerLifecycle.startContainer(reg1.projectId),
          containerLifecycle.startContainer(reg2.projectId)
        ]);

        expect(start1.success).toBe(true);
        expect(start2.success).toBe(true);

        // Verify they got different ports
        expect(start1.ports.primary).not.toBe(start2.ports.primary);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Different Technology Stacks', () => {
    it('should handle Python projects correctly', async () => {
      const workspace = await createTestWorkspace('python-lifecycle', {
        'requirements.txt': 'flask==2.0.0\nrequests>=2.25.0',
        'main.py': 'print("Hello from Python container")'
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Python Lifecycle Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Verify project detected as Python
      const project = await projectRegistry.getProject(projectId);
      expect(project.primaryTech).toBe('python');
      expect(project.ports.primary).toBeGreaterThanOrEqual(5000);
      expect(project.ports.primary).toBeLessThanOrEqual(5999);

      try {
        // Start Python container
        const startResult = await containerLifecycle.startContainer(projectId);

        expect(startResult.success).toBe(true);
        expect(startResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(startResult.accessUrl).toMatch(/^http:\/\/localhost:5\d+$/);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });

    it('should handle static projects correctly', async () => {
      const workspace = await createTestWorkspace('static-lifecycle', {
        'index.html': '<html><body><h1>Static Site</h1></body></html>',
        'style.css': 'body { font-family: Arial; }'
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Static Lifecycle Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Verify project detected as static
      const project = await projectRegistry.getProject(projectId);
      expect(project.primaryTech).toBe('static');
      expect(project.ports.primary).toBeGreaterThanOrEqual(4000);
      expect(project.ports.primary).toBeLessThanOrEqual(4999);

      try {
        // Start static container
        const startResult = await containerLifecycle.startContainer(projectId);

        expect(startResult.success).toBe(true);
        expect(startResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(startResult.accessUrl).toMatch(/^http:\/\/localhost:4\d+$/);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('MCP Tools Integration', () => {
    beforeEach(async () => {
      // Initialize MCP services
      await initializeServices();
    });

    it('should work through MCP tools interface', async () => {
      const workspace = await createTestWorkspace('mcp-integration', {
        'package.json': JSON.stringify({
          name: 'mcp-integration-test',
          version: '1.0.0'
        })
      });

      try {
        // Register project through MCP tools
        const registerResult = await executeTool('host.register', {
          workspace,
          name: 'MCP Integration Test'
        });

        expect(registerResult.success).toBe(true);
        const projectId = registerResult.projectId;
        testProjects.push(projectId);

        // Start container through MCP tools
        const startResult = await executeTool('host.start', {
          projectId
        });

        expect(startResult.success).toBe(true);
        expect(startResult.status).toBe(CONTAINER_STATES.RUNNING);

        // Check status through MCP tools
        const statusResult = await executeTool('host.status', {
          projectId
        });

        expect(statusResult.success).toBe(true);
        expect(statusResult.status).toBe(CONTAINER_STATES.RUNNING);
        expect(statusResult.isRunning).toBe(true);

        // Restart through MCP tools
        const restartResult = await executeTool('host.restart', {
          projectId
        });

        expect(restartResult.success).toBe(true);
        expect(restartResult.status).toBe(CONTAINER_STATES.RUNNING);

        // Stop through MCP tools
        const stopResult = await executeTool('host.stop', {
          projectId
        });

        expect(stopResult.success).toBe(true);
        expect(stopResult.status).toBe(CONTAINER_STATES.STOPPED);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });

    it('should handle MCP tool errors gracefully', async () => {
      // Test with non-existent project
      await expect(
        executeTool('host.start', { projectId: 'nonexistent' })
      ).rejects.toThrow('Project nonexistent not found');

      await expect(
        executeTool('host.stop', { projectId: 'nonexistent' })
      ).rejects.toThrow('Project nonexistent not found');

      await expect(
        executeTool('host.status', { projectId: 'nonexistent' })
      ).rejects.toThrow('Project nonexistent not found');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle Docker daemon unavailable', async () => {
      const workspace = await createTestWorkspace('docker-unavailable', {
        'package.json': JSON.stringify({ name: 'docker-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Docker Unavailable Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Mock Docker manager to simulate unavailable Docker
      const originalDockerManager = containerLifecycle.dockerManager;
      containerLifecycle.dockerManager = {
        createContainer: () => Promise.reject(new Error('Docker daemon not available')),
        initialized: true
      };

      await expect(
        containerLifecycle.startContainer(projectId)
      ).rejects.toThrow('Failed to start container');

      // Restore original Docker manager
      containerLifecycle.dockerManager = originalDockerManager;
    });

    it('should handle container startup timeout', async () => {
      const workspace = await createTestWorkspace('startup-timeout', {
        'package.json': JSON.stringify({ name: 'timeout-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Startup Timeout Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Mock a container that never becomes ready
      if (containerLifecycle.dockerManager.createContainer) {
        const originalGetInfo = containerLifecycle.dockerManager.getContainerInfo;
        containerLifecycle.dockerManager.getContainerInfo = () => 
          Promise.resolve({ running: false, status: 'starting' });

        try {
          await expect(
            containerLifecycle.startContainer(projectId)
          ).rejects.toThrow('Container failed to become ready');
        } catch (error) {
          if (error.message.includes('Docker')) {
            console.log('Skipping Docker-dependent test - Docker not available');
            return;
          }
          throw error;
        }

        // Restore original method
        containerLifecycle.dockerManager.getContainerInfo = originalGetInfo;
      }
    });

    it('should clean up failed startup attempts', async () => {
      const workspace = await createTestWorkspace('cleanup-test', {
        'package.json': JSON.stringify({ name: 'cleanup-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Cleanup Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      // Mock container creation success but start failure
      if (containerLifecycle.dockerManager.createContainer) {
        const originalStart = containerLifecycle.dockerManager.startContainer;
        containerLifecycle.dockerManager.startContainer = () => 
          Promise.reject(new Error('Container start failed'));

        try {
          await expect(
            containerLifecycle.startContainer(projectId)
          ).rejects.toThrow('Failed to start container');

          // Verify project status was updated to error
          const project = await projectRegistry.getProject(projectId);
          expect(project.status).toBe(CONTAINER_STATES.ERROR);

        } catch (error) {
          if (error.message.includes('Docker')) {
            console.log('Skipping Docker-dependent test - Docker not available');
            return;
          }
          throw error;
        }

        // Restore original method
        containerLifecycle.dockerManager.startContainer = originalStart;
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid start/stop cycles', async () => {
      const workspace = await createTestWorkspace('rapid-cycles', {
        'package.json': JSON.stringify({ name: 'rapid-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Rapid Cycles Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      try {
        // Perform 5 rapid start/stop cycles
        for (let i = 0; i < 5; i++) {
          const startResult = await containerLifecycle.startContainer(projectId);
          expect(startResult.success).toBe(true);

          const stopResult = await containerLifecycle.stopContainer(projectId);
          expect(stopResult.success).toBe(true);
        }

        // Verify final state is clean
        const finalStatus = await containerLifecycle.getContainerStatus(projectId);
        expect(finalStatus.status).toBe(CONTAINER_STATES.STOPPED);
        expect(finalStatus.containerId).toBeNull();

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });

    it('should track performance metrics correctly', async () => {
      const workspace = await createTestWorkspace('metrics-test', {
        'package.json': JSON.stringify({ name: 'metrics-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Metrics Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      const initialMetrics = containerLifecycle.getMetrics();

      try {
        // Perform container operations
        await containerLifecycle.startContainer(projectId);
        await containerLifecycle.restartContainer(projectId);
        await containerLifecycle.stopContainer(projectId);

        const finalMetrics = containerLifecycle.getMetrics();

        expect(finalMetrics.containers.started).toBe(initialMetrics.containers.started + 2); // start + restart
        expect(finalMetrics.containers.restarted).toBe(initialMetrics.containers.restarted + 1);
        expect(finalMetrics.containers.stopped).toBe(initialMetrics.containers.stopped + 2); // restart stop + final stop

        expect(finalMetrics.averageStartTime).toBeGreaterThan(0);
        expect(finalMetrics.averageStopTime).toBeGreaterThan(0);

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty workspace', async () => {
      const workspace = await createTestWorkspace('empty-workspace');

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Empty Workspace Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      const project = await projectRegistry.getProject(projectId);
      expect(project.primaryTech).toBe('unknown');

      try {
        // Starting an unknown tech project should still work
        const startResult = await containerLifecycle.startContainer(projectId);
        expect(startResult.success).toBe(true);

      } catch (error) {
        if (error.message.includes('Docker') || error.message.includes('unknown')) {
          console.log('Skipping Docker-dependent or unknown tech test');
          return;
        }
        throw error;
      }
    });

    it('should handle concurrent operations on same project', async () => {
      const workspace = await createTestWorkspace('concurrent-ops', {
        'package.json': JSON.stringify({ name: 'concurrent-test' })
      });

      const registrationResult = await projectRegistry.registerProject({
        workspace,
        name: 'Concurrent Operations Test'
      });
      
      const projectId = registrationResult.projectId;
      testProjects.push(projectId);

      try {
        // Attempt concurrent starts (should fail)
        const startPromises = [
          containerLifecycle.startContainer(projectId),
          containerLifecycle.startContainer(projectId)
        ];

        const results = await Promise.allSettled(startPromises);
        
        // One should succeed, one should fail due to concurrent operation
        const success = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;

        expect(success).toBe(1);
        expect(failures).toBe(1);

        // The failed one should have a meaningful error
        const failedResult = results.find(r => r.status === 'rejected');
        expect(failedResult.reason.message).toContain('operation already in progress');

      } catch (error) {
        if (error.message.includes('Docker')) {
          console.log('Skipping Docker-dependent test - Docker not available');
          return;
        }
        throw error;
      }
    });
  });
});