/**
 * Integration Tests: Project Registration System
 * Stories 2.1 & 2.4: Project Registration + Error Handling
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const { ProjectRegistry } = require('../../src/services/project-registry');
const { ErrorHandler } = require('../../src/services/error-handler');
const { initializeServices } = require('../../src/mcp-tools');

// Create temporary test workspace
const TEST_WORKSPACE_BASE = path.join(__dirname, '../fixtures/test-workspaces');

describe('Project Registration Integration', () => {
  let testWorkspaces = [];
  
  beforeAll(async () => {
    // Ensure test workspace directory exists
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

  describe('Node.js Project Registration', () => {
    it('should register a complete Node.js project', async () => {
      const workspace = await createTestWorkspace('nodejs-project', {
        'package.json': JSON.stringify({
          name: 'test-nodejs-app',
          version: '1.0.0',
          description: 'Test Node.js application',
          dependencies: {
            express: '^4.18.0'
          }
        }),
        'index.js': 'console.log("Hello World");',
        'README.md': '# Test Node.js App'
      }, ['src', 'node_modules']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({
        workspace,
        name: 'Custom Project Name'
      });
      
      expect(result.success).toBe(true);
      expect(result.projectId).toMatch(/^proj_[a-f0-9]{12}$/);
      expect(result.details.name).toBe('Custom Project Name');
      expect(result.details.workspace).toBe(workspace);
      expect(result.details.techStack).toContain('nodejs');
      expect(result.details.ports.primary).toBeGreaterThanOrEqual(3000);
      expect(result.details.ports.primary).toBeLessThanOrEqual(3999);
      
      // Verify project can be retrieved
      const retrieved = await registry.getProject(result.projectId);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Custom Project Name');
    });
    
    it('should detect React framework in Node.js project', async () => {
      const workspace = await createTestWorkspace('react-project', {
        'package.json': JSON.stringify({
          name: 'react-test-app',
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          }
        }),
        'src/App.js': 'import React from "react"; export default function App() { return <div>Hello</div>; }'
      }, ['src', 'public']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      
      const techNames = result.details.technologies.map(tech => tech.name);
      expect(techNames).toContain('react');
      expect(techNames).toContain('nodejs');
    });
  });

  describe('Python Project Registration', () => {
    it('should register a Python project with requirements.txt', async () => {
      const workspace = await createTestWorkspace('python-project', {
        'requirements.txt': 'flask==2.0.0\nrequests>=2.25.0',
        'main.py': 'print("Hello Python!")',
        'README.md': '# Python Test Project'
      }, ['venv', 'src']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      expect(result.details.techStack).toContain('python');
      expect(result.details.ports.primary).toBeGreaterThanOrEqual(5000);
      expect(result.details.ports.primary).toBeLessThanOrEqual(5999);
    });
    
    it('should register a Python project with pyproject.toml', async () => {
      const workspace = await createTestWorkspace('python-modern-project', {
        'pyproject.toml': `
[project]
name = "modern-python-app"
version = "0.1.0"
description = "Modern Python application"
`,
        'src/main.py': 'def main(): print("Hello Modern Python!")',
      }, ['src']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      expect(result.details.name).toBe('modern-python-app');
      expect(result.details.techStack).toContain('python');
    });
  });

  describe('Multi-Technology Project Registration', () => {
    it('should register a full-stack project with multiple technologies', async () => {
      const workspace = await createTestWorkspace('fullstack-project', {
        'package.json': JSON.stringify({
          name: 'fullstack-app',
          dependencies: { express: '^4.0.0' }
        }),
        'requirements.txt': 'flask==2.0.0',
        'Dockerfile': 'FROM node:16\nCOPY . /app',
        'docker-compose.yml': 'version: "3"\nservices:\n  app:\n    build: .'
      }, ['frontend', 'backend', 'api']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      
      const techNames = result.details.technologies.map(tech => tech.name);
      expect(techNames).toContain('nodejs');
      expect(techNames).toContain('python');
      expect(techNames).toContain('docker');
      
      // Should use the highest confidence technology for port allocation
      const primaryTech = result.details.technologies[0].name;
      expect(['nodejs', 'python', 'docker']).toContain(primaryTech);
    });
  });

  describe('Static Website Registration', () => {
    it('should register a static HTML website', async () => {
      const workspace = await createTestWorkspace('static-site', {
        'index.html': '<html><body><h1>Static Site</h1></body></html>',
        'style.css': 'body { font-family: Arial; }',
        'script.js': 'console.log("Static site loaded");'
      }, ['assets', 'images']);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      expect(result.details.techStack).toContain('static');
      expect(result.details.ports.primary).toBeGreaterThanOrEqual(4000);
      expect(result.details.ports.primary).toBeLessThanOrEqual(4999);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid workspace gracefully', async () => {
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const invalidWorkspace = '/non/existent/workspace';
      
      await expect(
        registry.registerProject({ workspace: invalidWorkspace })
      ).rejects.toThrow('Project registration failed');
    });
    
    it('should prevent duplicate registration with clear error', async () => {
      const workspace = await createTestWorkspace('duplicate-test', {
        'package.json': JSON.stringify({ name: 'duplicate-project' })
      });
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      // First registration should succeed
      const result1 = await registry.registerProject({ workspace });
      expect(result1.success).toBe(true);
      
      // Second registration should fail with clear message
      await expect(
        registry.registerProject({ workspace })
      ).rejects.toThrow('Project already registered for this workspace');
    });
    
    it('should handle empty workspace gracefully', async () => {
      const workspace = await createTestWorkspace('empty-workspace');
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const result = await registry.registerProject({ workspace });
      
      expect(result.success).toBe(true);
      expect(result.details.metadata.isEmpty).toBe(true);
      expect(result.details.techStack).toHaveLength(0);
    });
  });

  describe('Project Listing and Management', () => {
    let registry;
    
    beforeEach(async () => {
      registry = new ProjectRegistry();
      await registry.initialize();
    });
    
    it('should list registered projects with filtering', async () => {
      // Register multiple projects
      const nodeWorkspace = await createTestWorkspace('list-node', {
        'package.json': JSON.stringify({ name: 'node-project' })
      });
      
      const pythonWorkspace = await createTestWorkspace('list-python', {
        'requirements.txt': 'flask==2.0.0'
      });
      
      await registry.registerProject({ workspace: nodeWorkspace });
      await registry.registerProject({ workspace: pythonWorkspace });
      
      // List all projects
      const allProjects = await registry.listProjects();
      expect(allProjects.success).toBe(true);
      expect(allProjects.projects).toHaveLength(2);
      expect(allProjects.totalRegistered).toBe(2);
      
      // Filter by tech stack
      const nodeProjects = await registry.listProjects({ techStack: 'nodejs' });
      expect(nodeProjects.success).toBe(true);
      expect(nodeProjects.projects).toHaveLength(1);
      expect(nodeProjects.projects[0].techStack).toContain('nodejs');
    });
    
    it('should update and unregister projects', async () => {
      const workspace = await createTestWorkspace('crud-test', {
        'package.json': JSON.stringify({ name: 'crud-project' })
      });
      
      // Register project
      const registrationResult = await registry.registerProject({ workspace });
      const projectId = registrationResult.projectId;
      
      // Update project
      const updateResult = await registry.updateProject(projectId, {
        name: 'Updated Project Name',
        config: { autoStart: true }
      });
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.details.name).toBe('Updated Project Name');
      expect(updateResult.details.config.autoStart).toBe(true);
      
      // Verify update
      const updatedProject = await registry.getProject(projectId);
      expect(updatedProject.name).toBe('Updated Project Name');
      
      // Unregister project
      const unregisterResult = await registry.unregisterProject(projectId);
      expect(unregisterResult.success).toBe(true);
      
      // Verify removal
      const removedProject = await registry.getProject(projectId);
      expect(removedProject).toBeNull();
    });
  });

  describe('MCP Tools Integration', () => {
    it('should work through MCP tools interface', async () => {
      const workspace = await createTestWorkspace('mcp-integration', {
        'package.json': JSON.stringify({
          name: 'mcp-test-app',
          description: 'MCP integration test'
        })
      });
      
      // Initialize services
      await initializeServices();
      
      const { executeTool } = require('../../src/mcp-tools');
      
      // Test host.register tool
      const registerResult = await executeTool('host.register', {
        workspace,
        name: 'MCP Test Project'
      });
      
      expect(registerResult.success).toBe(true);
      expect(registerResult.projectId).toBeDefined();
      expect(registerResult.details.name).toBe('MCP Test Project');
      
      // Test host.list tool
      const listResult = await executeTool('host.list', {});
      
      expect(listResult.success).toBe(true);
      expect(listResult.projects).toContain(
        expect.objectContaining({
          name: 'MCP Test Project'
        })
      );
    });
    
    it('should handle MCP tool errors gracefully', async () => {
      await initializeServices();
      
      const { executeTool } = require('../../src/mcp-tools');
      
      // Test with invalid workspace
      await expect(
        executeTool('host.register', {
          workspace: '/invalid/workspace'
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent registrations', async () => {
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      // Create multiple workspaces
      const workspaces = await Promise.all([
        createTestWorkspace('concurrent-1', { 'package.json': '{}' }),
        createTestWorkspace('concurrent-2', { 'requirements.txt': 'flask' }),
        createTestWorkspace('concurrent-3', { 'index.html': '<html></html>' })
      ]);
      
      // Register concurrently
      const registrationPromises = workspaces.map((workspace, i) => 
        registry.registerProject({
          workspace,
          name: `concurrent-project-${i + 1}`
        })
      );
      
      const results = await Promise.all(registrationPromises);
      
      // All registrations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // All projects should have unique IDs
      const projectIds = results.map(r => r.projectId);
      const uniqueIds = new Set(projectIds);
      expect(uniqueIds.size).toBe(projectIds.length);
    });
    
    it('should handle large workspace with many files', async () => {
      const largeWorkspace = {};
      const largeDirs = [];
      
      // Create 50 files and 10 directories
      for (let i = 0; i < 50; i++) {
        largeWorkspace[`file${i}.js`] = `console.log('File ${i}');`;
      }
      for (let i = 0; i < 10; i++) {
        largeDirs.push(`dir${i}`);
      }
      
      largeWorkspace['package.json'] = JSON.stringify({ name: 'large-project' });
      
      const workspace = await createTestWorkspace('large-workspace', largeWorkspace, largeDirs);
      
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      const startTime = Date.now();
      const result = await registry.registerProject({ workspace });
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.details.metadata.fileCount).toBe(51); // 50 files + package.json
      expect(result.details.metadata.directoryCount).toBe(10);
      
      // Should complete in reasonable time (under 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Registry Statistics and Monitoring', () => {
    it('should provide comprehensive registry statistics', async () => {
      const registry = new ProjectRegistry();
      await registry.initialize();
      
      // Register projects of different types
      const nodeWorkspace = await createTestWorkspace('stats-node', {
        'package.json': '{}'
      });
      const pythonWorkspace = await createTestWorkspace('stats-python', {
        'requirements.txt': 'flask'
      });
      
      await registry.registerProject({ workspace: nodeWorkspace });
      await registry.registerProject({ workspace: pythonWorkspace });
      
      const stats = registry.getRegistryStats();
      
      expect(stats.total).toBe(2);
      expect(stats.statusCounts.registered).toBe(2);
      expect(stats.techStackCounts.nodejs).toBe(1);
      expect(stats.techStackCounts.python).toBe(1);
      expect(stats.metadata.totalProjects).toBe(2);
    });
  });
});
