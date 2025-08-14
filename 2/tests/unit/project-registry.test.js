/**
 * Unit Tests: Project Registry Service
 * Story 2.1: Project Registration System
 */

const { ProjectRegistry, PROJECT_STATUS } = require('../../src/services/project-registry');
const { WorkspaceScanner } = require('../../src/services/workspace-scanner');
const PortRegistry = require('../../src/port-registry');
const { ErrorHandler } = require('../../src/services/error-handler');
const AtomicFile = require('../../src/utils/atomic-file');

// Mock dependencies
jest.mock('../../src/services/workspace-scanner');
jest.mock('../../src/port-registry');
jest.mock('../../src/services/error-handler');
jest.mock('../../src/utils/atomic-file');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234-5678-9012')
}));

describe('ProjectRegistry', () => {
  let registry;
  let mockPortRegistry;
  let mockWorkspaceScanner;
  let mockErrorHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockPortRegistry = {
      initialize: jest.fn().mockResolvedValue(),
      allocatePort: jest.fn().mockResolvedValue({
        port: 3001,
        allocationId: 'alloc_123'
      }),
      allocatePortInRange: jest.fn().mockResolvedValue({
        port: 3002,
        allocationId: 'alloc_124'
      }),
      releaseAllocation: jest.fn().mockResolvedValue()
    };
    PortRegistry.mockImplementation(() => mockPortRegistry);
    
    mockWorkspaceScanner = {
      scanWorkspace: jest.fn().mockResolvedValue({
        success: true,
        workspace: '/mock/workspace',
        technologies: [
          {
            name: 'nodejs',
            confidence: 100,
            evidence: ['Found package.json'],
            portPreference: { range: [3000, 3999], default: 3000 }
          }
        ],
        metadata: {
          name: 'test-project',
          version: '1.0.0',
          isEmpty: false
        }
      })
    };
    WorkspaceScanner.mockImplementation(() => mockWorkspaceScanner);
    
    mockErrorHandler = {
      handleError: jest.fn((error, context) => ({
        error: {
          code: 'MOCK_ERROR',
          message: error.message || 'Mock error',
          type: 'system'
        }
      }))
    };
    ErrorHandler.mockImplementation(() => mockErrorHandler);
    
    AtomicFile.readJSON.mockResolvedValue({ projects: {}, metadata: {} });
    AtomicFile.writeJSON.mockResolvedValue();
    
    registry = new ProjectRegistry();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await registry.initialize();
      
      expect(mockPortRegistry.initialize).toHaveBeenCalled();
      expect(AtomicFile.readJSON).toHaveBeenCalled();
    });
    
    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockPortRegistry.initialize.mockRejectedValue(error);
      
      await expect(registry.initialize()).rejects.toThrow('Failed to initialize project registry');
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('validateRegistrationParams', () => {
    it('should validate valid parameters', () => {
      const params = {
        workspace: '/valid/workspace',
        name: 'test-project',
        techStack: ['nodejs'],
        ports: [3000]
      };
      
      expect(() => registry.validateRegistrationParams(params)).not.toThrow();
    });
    
    it('should throw error for missing workspace', () => {
      const params = { name: 'test-project' };
      
      expect(() => registry.validateRegistrationParams(params)).toThrow('Workspace path is required');
    });
    
    it('should throw error for non-string workspace', () => {
      const params = { workspace: 123 };
      
      expect(() => registry.validateRegistrationParams(params)).toThrow('Workspace path must be a string');
    });
    
    it('should throw error for invalid techStack type', () => {
      const params = {
        workspace: '/valid/workspace',
        techStack: 'nodejs' // Should be array
      };
      
      expect(() => registry.validateRegistrationParams(params)).toThrow('Tech stack must be an array of strings');
    });
    
    it('should throw error for invalid ports type', () => {
      const params = {
        workspace: '/valid/workspace',
        ports: 3000 // Should be array
      };
      
      expect(() => registry.validateRegistrationParams(params)).toThrow('Ports must be an array of numbers');
    });
  });

  describe('registerProject', () => {
    const mockWorkspace = '/mock/workspace';
    const validParams = {
      workspace: mockWorkspace,
      name: 'test-project'
    };
    
    beforeEach(async () => {
      await registry.initialize();
    });
    
    it('should register a new project successfully', async () => {
      const result = await registry.registerProject(validParams);
      
      expect(result.success).toBe(true);
      expect(result.projectId).toContain('proj_');
      expect(result.details.name).toBe('test-project');
      expect(result.details.workspace).toBe(mockWorkspace);
      expect(result.details.status).toBe(PROJECT_STATUS.REGISTERED);
      expect(result.details.ports).toBeDefined();
      
      expect(mockWorkspaceScanner.scanWorkspace).toHaveBeenCalledWith(mockWorkspace);
      expect(mockPortRegistry.allocatePort).toHaveBeenCalled();
      expect(AtomicFile.writeJSON).toHaveBeenCalled();
    });
    
    it('should use detected project name from scan results', async () => {
      const paramsWithoutName = { workspace: mockWorkspace };
      
      const result = await registry.registerProject(paramsWithoutName);
      
      expect(result.details.name).toBe('test-project'); // From mock scan result
    });
    
    it('should handle port allocation fallback', async () => {
      // Make preferred port allocation fail
      mockPortRegistry.allocatePort.mockRejectedValue(new Error('Port unavailable'));
      
      const result = await registry.registerProject(validParams);
      
      expect(result.success).toBe(true);
      expect(mockPortRegistry.allocatePort).toHaveBeenCalled();
      expect(mockPortRegistry.allocatePortInRange).toHaveBeenCalled();
    });
    
    it('should prevent duplicate registration', async () => {
      // First registration
      await registry.registerProject(validParams);
      
      // Second registration with same workspace
      await expect(registry.registerProject(validParams))
        .rejects.toThrow('Project already registered for this workspace');
    });
    
    it('should handle workspace scan errors', async () => {
      const error = new Error('Scan failed');
      mockWorkspaceScanner.scanWorkspace.mockRejectedValue(error);
      
      await expect(registry.registerProject(validParams))
        .rejects.toThrow('Project registration failed');
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error, expect.any(Object));
    });
    
    it('should handle port allocation errors', async () => {
      mockPortRegistry.allocatePort.mockRejectedValue(new Error('Port error'));
      mockPortRegistry.allocatePortInRange.mockRejectedValue(new Error('Range error'));
      
      await expect(registry.registerProject(validParams))
        .rejects.toThrow('Project registration failed');
    });
  });

  describe('getProject', () => {
    beforeEach(async () => {
      await registry.initialize();
    });
    
    it('should return project by ID', async () => {
      // Register a project first
      const registrationResult = await registry.registerProject({
        workspace: '/mock/workspace',
        name: 'test-project'
      });
      
      const project = await registry.getProject(registrationResult.projectId);
      
      expect(project).toBeDefined();
      expect(project.projectId).toBe(registrationResult.projectId);
      expect(project.name).toBe('test-project');
    });
    
    it('should return null for non-existent project', async () => {
      const project = await registry.getProject('non-existent-id');
      
      expect(project).toBeNull();
    });
    
    it('should update lastAccessed timestamp', async () => {
      const registrationResult = await registry.registerProject({
        workspace: '/mock/workspace',
        name: 'test-project'
      });
      
      const originalLastAccessed = registrationResult.details.lastAccessed;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const project = await registry.getProject(registrationResult.projectId);
      
      expect(new Date(project.lastAccessed).getTime())
        .toBeGreaterThan(new Date(originalLastAccessed).getTime());
    });
  });

  describe('listProjects', () => {
    beforeEach(async () => {
      await registry.initialize();
      
      // Register multiple test projects
      await registry.registerProject({
        workspace: '/workspace1',
        name: 'project1',
        techStack: ['nodejs']
      });
      
      await registry.registerProject({
        workspace: '/workspace2',
        name: 'project2',
        techStack: ['python']
      });
    });
    
    it('should list all projects', async () => {
      const result = await registry.listProjects();
      
      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalRegistered).toBe(2);
    });
    
    it('should filter by status', async () => {
      const result = await registry.listProjects({ status: PROJECT_STATUS.REGISTERED });
      
      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(2); // Both are registered
      expect(result.filters.status).toBe(PROJECT_STATUS.REGISTERED);
    });
    
    it('should filter by tech stack', async () => {
      const result = await registry.listProjects({ techStack: 'nodejs' });
      
      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('project1');
    });
    
    it('should sort by last accessed', async () => {
      const projects = await registry.listProjects();
      
      // Projects should be sorted by lastAccessed (most recent first)
      const timestamps = projects.projects.map(p => new Date(p.lastAccessed).getTime());
      
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });
  });

  describe('updateProject', () => {
    let projectId;
    
    beforeEach(async () => {
      await registry.initialize();
      
      const registrationResult = await registry.registerProject({
        workspace: '/mock/workspace',
        name: 'test-project'
      });
      
      projectId = registrationResult.projectId;
    });
    
    it('should update project successfully', async () => {
      const updates = {
        name: 'updated-project',
        config: { autoStart: true }
      };
      
      const result = await registry.updateProject(projectId, updates);
      
      expect(result.success).toBe(true);
      expect(result.details.name).toBe('updated-project');
      expect(result.details.config.autoStart).toBe(true);
      expect(result.details.lastModified).toBeDefined();
      
      // Verify project was actually updated
      const updatedProject = await registry.getProject(projectId);
      expect(updatedProject.name).toBe('updated-project');
    });
    
    it('should prevent projectId changes', async () => {
      const updates = {
        projectId: 'malicious-id-change',
        name: 'updated-project'
      };
      
      const result = await registry.updateProject(projectId, updates);
      
      expect(result.success).toBe(true);
      expect(result.details.projectId).toBe(projectId); // Should remain unchanged
    });
    
    it('should throw error for non-existent project', async () => {
      const updates = { name: 'updated-name' };
      
      await expect(registry.updateProject('non-existent-id', updates))
        .rejects.toThrow('Project not found');
    });
  });

  describe('unregisterProject', () => {
    let projectId;
    
    beforeEach(async () => {
      await registry.initialize();
      
      const registrationResult = await registry.registerProject({
        workspace: '/mock/workspace',
        name: 'test-project'
      });
      
      projectId = registrationResult.projectId;
    });
    
    it('should unregister project successfully', async () => {
      const result = await registry.unregisterProject(projectId);
      
      expect(result.success).toBe(true);
      expect(result.details.name).toBe('test-project');
      expect(result.details.unregisteredAt).toBeDefined();
      
      // Verify project was removed
      const project = await registry.getProject(projectId);
      expect(project).toBeNull();
      
      // Verify port was released
      expect(mockPortRegistry.releaseAllocation).toHaveBeenCalledWith('alloc_123');
    });
    
    it('should handle port release errors gracefully', async () => {
      mockPortRegistry.releaseAllocation.mockRejectedValue(new Error('Release failed'));
      
      // Should still succeed despite port release error
      const result = await registry.unregisterProject(projectId);
      
      expect(result.success).toBe(true);
    });
    
    it('should throw error for non-existent project', async () => {
      await expect(registry.unregisterProject('non-existent-id'))
        .rejects.toThrow('Project not found');
    });
  });

  describe('findProjectByWorkspace', () => {
    beforeEach(async () => {
      await registry.initialize();
    });
    
    it('should find project by workspace path', async () => {
      const workspace = '/unique/workspace';
      
      await registry.registerProject({
        workspace,
        name: 'workspace-project'
      });
      
      const found = await registry.findProjectByWorkspace(workspace);
      
      expect(found).toBeDefined();
      expect(found.workspace).toBe(workspace);
      expect(found.name).toBe('workspace-project');
    });
    
    it('should return null for non-existent workspace', async () => {
      const found = await registry.findProjectByWorkspace('/non/existent/workspace');
      
      expect(found).toBeNull();
    });
    
    it('should normalize workspace paths', async () => {
      const workspace = '/test/workspace';
      
      await registry.registerProject({
        workspace,
        name: 'test-project'
      });
      
      // Search with different but equivalent path
      const found = await registry.findProjectByWorkspace('/test/workspace/.');
      
      expect(found).toBeDefined();
    });
  });

  describe('getRegistryStats', () => {
    beforeEach(async () => {
      await registry.initialize();
      
      // Register projects with different statuses and tech stacks
      await registry.registerProject({
        workspace: '/workspace1',
        name: 'project1',
        techStack: ['nodejs']
      });
      
      await registry.registerProject({
        workspace: '/workspace2', 
        name: 'project2',
        techStack: ['python', 'docker']
      });
    });
    
    it('should return comprehensive registry statistics', async () => {
      const stats = registry.getRegistryStats();
      
      expect(stats.total).toBe(2);
      expect(stats.statusCounts[PROJECT_STATUS.REGISTERED]).toBe(2);
      expect(stats.techStackCounts.nodejs).toBe(1);
      expect(stats.techStackCounts.python).toBe(1);
      expect(stats.techStackCounts.docker).toBe(1);
      expect(stats.metadata).toBeDefined();
      expect(stats.generatedAt).toBeDefined();
    });
  });

  describe('persistRegistry', () => {
    beforeEach(async () => {
      await registry.initialize();
    });
    
    it('should persist registry data correctly', async () => {
      await registry.registerProject({
        workspace: '/test/workspace',
        name: 'test-project'
      });
      
      // persistRegistry is called internally, check if AtomicFile.writeJSON was called
      expect(AtomicFile.writeJSON).toHaveBeenCalled();
      
      const lastCall = AtomicFile.writeJSON.mock.calls[AtomicFile.writeJSON.mock.calls.length - 1];
      const [, data] = lastCall;
      
      expect(data.metadata).toBeDefined();
      expect(data.projects).toBeDefined();
      expect(data.savedAt).toBeDefined();
    });
  });

  describe('loadProjects', () => {
    it('should load projects from disk', async () => {
      const mockData = {
        metadata: { totalProjects: 1 },
        projects: {
          'proj_123': {
            projectId: 'proj_123',
            name: 'loaded-project',
            workspace: '/loaded/workspace'
          }
        }
      };
      
      AtomicFile.readJSON.mockResolvedValue(mockData);
      
      await registry.loadProjects();
      
      const project = await registry.getProject('proj_123');
      expect(project).toBeDefined();
      expect(project.name).toBe('loaded-project');
    });
    
    it('should handle missing registry file', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      AtomicFile.readJSON.mockRejectedValue(error);
      
      // Should not throw error
      await expect(registry.loadProjects()).resolves.not.toThrow();
    });
  });

  describe('generateProjectId', () => {
    it('should generate valid project IDs', () => {
      const id1 = registry.generateProjectId();
      const id2 = registry.generateProjectId();
      
      expect(id1).toMatch(/^proj_[a-f0-9]{12}$/);
      expect(id2).toMatch(/^proj_[a-f0-9]{12}$/);
      expect(id1).not.toBe(id2);
    });
  });
});
