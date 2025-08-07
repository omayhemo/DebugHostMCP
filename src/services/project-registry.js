/**
 * Project Registry Service
 * Manages project registration, metadata, and lifecycle state
 * Part of Story 2.1: Project Registration System
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AtomicFile = require('../utils/atomic-file');
const { WorkspaceScanner } = require('./workspace-scanner');
const PortRegistry = require('../port-registry');
const { ErrorHandler } = require('./error-handler');
const { createMcpError, MCP_ERROR_CODES } = require('../middleware/error-handler');

/**
 * Project status constants
 */
const PROJECT_STATUS = {
  REGISTERED: 'registered',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error'
};

class ProjectRegistry {
  constructor(dataPath = null, portRegistry = null) {
    this.dataPath = dataPath || path.join(__dirname, '../../data/system/projects.json');
    this.portRegistry = portRegistry || new PortRegistry();
    this.workspaceScanner = new WorkspaceScanner();
    this.errorHandler = new ErrorHandler();
    
    // In-memory registry cache
    this.projects = new Map();
    this.registryMetadata = {
      version: '1.0.0',
      totalProjects: 0,
      lastUpdated: null
    };
  }

  /**
   * Initialize the project registry
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize port registry
      await this.portRegistry.initialize();
      
      // Load existing projects
      await this.loadProjects();
      
      console.log(`Project registry initialized with ${this.projects.size} registered projects`);
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'registry-initialization',
        component: 'project-registry'
      });
      
      console.error('Failed to initialize project registry:', errorResponse.error.message);
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Failed to initialize project registry',
        errorResponse.error
      );
    }
  }

  /**
   * Register a new project with workspace scanning
   * @param {Object} params - Registration parameters
   * @param {string} params.workspace - Workspace path
   * @param {string} params.name - Project name (optional, will be detected)
   * @param {Array} params.techStack - Tech stack override (optional)
   * @param {Array} params.ports - Port preferences (optional)
   * @returns {Promise<Object>} Registration result
   */
  async registerProject(params) {
    try {
      const { workspace, name = null, techStack = null, ports = null } = params;
      
      // Validate input parameters
      this.validateRegistrationParams(params);
      
      // Check for duplicate registration
      const existingProject = await this.findProjectByWorkspace(workspace);
      if (existingProject) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Project already registered for this workspace',
          { 
            existingProjectId: existingProject.projectId,
            workspace: workspace,
            suggestion: 'Use updateProject to modify existing registration'
          }
        );
      }
      
      // Scan workspace and detect tech stack
      const scanResult = await this.workspaceScanner.scanWorkspace(workspace);
      
      // Generate project metadata
      const projectData = await this.createProjectData(scanResult, params);
      
      // Allocate ports for the project
      const portAllocation = await this.allocateProjectPorts(projectData);
      projectData.ports = portAllocation;
      
      // Save project to registry
      const projectId = await this.saveProject(projectData);
      
      // Create success response
      const result = {
        success: true,
        projectId,
        message: `Project '${projectData.name}' registered successfully`,
        details: {
          ...projectData,
          registeredAt: new Date().toISOString()
        }
      };
      
      console.log(`Successfully registered project: ${projectId}`);
      return result;
      
    } catch (error) {
      if (error.code) {
        throw error; // Re-throw MCP errors
      }
      
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'project-registration',
        workspace: params.workspace,
        component: 'project-registry'
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Project registration failed',
        errorResponse.error
      );
    }
  }

  /**
   * Validate registration parameters
   * @param {Object} params - Parameters to validate
   */
  validateRegistrationParams(params) {
    if (!params) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Registration parameters are required'
      );
    }
    
    if (!params.workspace) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Workspace path is required'
      );
    }
    
    if (typeof params.workspace !== 'string') {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Workspace path must be a string'
      );
    }
    
    // Validate optional tech stack parameter
    if (params.techStack && !Array.isArray(params.techStack)) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Tech stack must be an array of strings'
      );
    }
    
    // Validate optional ports parameter
    if (params.ports && !Array.isArray(params.ports)) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Ports must be an array of numbers'
      );
    }
  }

  /**
   * Create project data from scan results and parameters
   * @param {Object} scanResult - Workspace scan results
   * @param {Object} params - Registration parameters
   * @returns {Promise<Object>} Project data structure
   */
  async createProjectData(scanResult, params) {
    const projectId = this.generateProjectId();
    const timestamp = new Date().toISOString();
    
    // Use provided name or detected name or fallback to directory name
    const projectName = params.name || scanResult.metadata.name || path.basename(scanResult.workspace);
    
    // Use provided tech stack or detected tech stack
    const detectedTechNames = scanResult.technologies.map(tech => tech.name);
    const finalTechStack = params.techStack || detectedTechNames;
    
    return {
      projectId,
      name: projectName,
      workspace: path.resolve(scanResult.workspace),
      status: PROJECT_STATUS.REGISTERED,
      techStack: finalTechStack,
      technologies: scanResult.technologies, // Full detection results with confidence
      metadata: {
        ...scanResult.metadata,
        version: scanResult.metadata.version || '1.0.0',
        description: scanResult.metadata.description || `${projectName} project`,
        isEmpty: scanResult.metadata.isEmpty || false
      },
      ports: null, // Will be populated by port allocation
      registeredAt: timestamp,
      lastAccessed: timestamp,
      lastModified: timestamp,
      stats: {
        startCount: 0,
        lastStarted: null,
        totalUptime: 0,
        errorCount: 0,
        lastError: null
      },
      config: {
        autoStart: false,
        restartOnChange: true,
        healthCheckEnabled: true,
        logRetentionDays: 3
      }
    };
  }

  /**
   * Allocate ports for a project based on its tech stack
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Port allocation result
   */
  async allocateProjectPorts(projectData) {
    try {
      // Determine primary tech stack for port allocation
      const primaryTech = projectData.technologies.length > 0 
        ? projectData.technologies[0].name 
        : 'node'; // Default to node
      
      // Get port preferences from tech stack
      const portPreferences = projectData.technologies.find(tech => tech.name === primaryTech)?.portPreference;
      
      // Try to allocate primary port
      const preferredPort = portPreferences?.default || 3000;
      
      let portAllocation;
      try {
        portAllocation = await this.portRegistry.allocatePort(
          preferredPort,
          primaryTech,
          projectData.name,
          projectData.projectId
        );
      } catch (portError) {
        // If preferred port fails, try auto-allocation in range
        console.log(`Preferred port ${preferredPort} not available, trying auto-allocation`);
        portAllocation = await this.portRegistry.allocatePortInRange(
          primaryTech,
          projectData.name,
          projectData.projectId
        );
      }
      
      return {
        primary: portAllocation.port,
        allocated: [portAllocation.port],
        range: portPreferences?.range || [3000, 9999],
        type: primaryTech,
        allocationId: portAllocation.allocationId
      };
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'port-allocation',
        projectId: projectData.projectId,
        techStack: projectData.techStack
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Failed to allocate ports for project',
        errorResponse.error
      );
    }
  }

  /**
   * Save project to registry
   * @param {Object} projectData - Project data to save
   * @returns {Promise<string>} Project ID
   */
  async saveProject(projectData) {
    try {
      // Add to in-memory cache
      this.projects.set(projectData.projectId, projectData);
      
      // Update metadata
      this.registryMetadata.totalProjects = this.projects.size;
      this.registryMetadata.lastUpdated = new Date().toISOString();
      
      // Persist to disk
      await this.persistRegistry();
      
      return projectData.projectId;
      
    } catch (error) {
      // Remove from cache if persistence fails
      this.projects.delete(projectData.projectId);
      
      throw error;
    }
  }

  /**
   * Find project by workspace path
   * @param {string} workspace - Workspace path to search
   * @returns {Promise<Object|null>} Project data or null if not found
   */
  async findProjectByWorkspace(workspace) {
    const normalizedWorkspace = path.resolve(workspace);
    
    for (const project of this.projects.values()) {
      if (project.workspace === normalizedWorkspace) {
        return project;
      }
    }
    
    return null;
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object|null>} Project data or null if not found
   */
  async getProject(projectId) {
    const project = this.projects.get(projectId);
    if (project) {
      // Update last accessed time
      project.lastAccessed = new Date().toISOString();
      await this.persistRegistry();
    }
    return project || null;
  }

  /**
   * List all projects with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} List of projects
   */
  async listProjects(filters = {}) {
    try {
      let projects = Array.from(this.projects.values());
      
      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        projects = projects.filter(p => p.status === filters.status);
      }
      
      // Apply tech stack filter
      if (filters.techStack) {
        projects = projects.filter(p => 
          p.techStack.some(tech => 
            tech.toLowerCase().includes(filters.techStack.toLowerCase())
          )
        );
      }
      
      // Sort by last accessed (most recent first)
      projects.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
      
      return {
        success: true,
        projects,
        total: projects.length,
        totalRegistered: this.projects.size,
        filters,
        metadata: this.registryMetadata
      };
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'list-projects',
        filters
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Failed to list projects',
        errorResponse.error
      );
    }
  }

  /**
   * Update project registration
   * @param {string} projectId - Project ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async updateProject(projectId, updates) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Project not found',
          { projectId }
        );
      }
      
      // Apply updates
      const updatedProject = {
        ...project,
        ...updates,
        lastModified: new Date().toISOString(),
        projectId: project.projectId // Prevent ID changes
      };
      
      // Save updated project
      this.projects.set(projectId, updatedProject);
      await this.persistRegistry();
      
      return {
        success: true,
        projectId,
        message: 'Project updated successfully',
        details: updatedProject
      };
      
    } catch (error) {
      if (error.code) {
        throw error; // Re-throw MCP errors
      }
      
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'update-project',
        projectId
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Failed to update project',
        errorResponse.error
      );
    }
  }

  /**
   * Unregister a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Unregister result
   */
  async unregisterProject(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Project not found',
          { projectId }
        );
      }
      
      // Release allocated ports
      if (project.ports && project.ports.allocationId) {
        try {
          await this.portRegistry.releaseAllocation(project.ports.allocationId);
        } catch (portError) {
          console.warn(`Failed to release ports for project ${projectId}:`, portError.message);
        }
      }
      
      // Remove from registry
      this.projects.delete(projectId);
      
      // Update metadata
      this.registryMetadata.totalProjects = this.projects.size;
      this.registryMetadata.lastUpdated = new Date().toISOString();
      
      // Persist changes
      await this.persistRegistry();
      
      return {
        success: true,
        projectId,
        message: `Project '${project.name}' unregistered successfully`,
        details: {
          name: project.name,
          workspace: project.workspace,
          unregisteredAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      if (error.code) {
        throw error; // Re-throw MCP errors
      }
      
      const errorResponse = this.errorHandler.handleError(error, {
        operation: 'unregister-project',
        projectId
      });
      
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Failed to unregister project',
        errorResponse.error
      );
    }
  }

  /**
   * Load projects from disk
   * @returns {Promise<void>}
   */
  async loadProjects() {
    try {
      const data = await AtomicFile.readJSON(this.dataPath);
      
      // Load projects from data
      if (data.projects) {
        this.projects.clear();
        for (const [projectId, projectData] of Object.entries(data.projects)) {
          this.projects.set(projectId, projectData);
        }
      }
      
      // Load metadata
      if (data.metadata) {
        this.registryMetadata = { ...this.registryMetadata, ...data.metadata };
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, start with empty registry
        console.log('Project registry file not found, starting with empty registry');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Persist registry to disk
   * @returns {Promise<void>}
   */
  async persistRegistry() {
    const data = {
      metadata: this.registryMetadata,
      projects: Object.fromEntries(this.projects),
      savedAt: new Date().toISOString()
    };
    
    await AtomicFile.writeJSON(this.dataPath, data);
  }

  /**
   * Generate unique project ID
   * @returns {string} Project ID
   */
  generateProjectId() {
    return `proj_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getRegistryStats() {
    const projects = Array.from(this.projects.values());
    
    const statusCounts = {};
    const techStackCounts = {};
    
    projects.forEach(project => {
      // Count by status
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
      
      // Count by tech stack
      project.techStack.forEach(tech => {
        techStackCounts[tech] = (techStackCounts[tech] || 0) + 1;
      });
    });
    
    return {
      total: projects.length,
      statusCounts,
      techStackCounts,
      metadata: this.registryMetadata,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  ProjectRegistry,
  PROJECT_STATUS
};
