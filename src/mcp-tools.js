/**
 * MCP Tools Definitions and Handlers
 * Defines available tools with full implementations using new services
 */

const { createMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');
const { ProjectRegistry } = require('./services/project-registry');
const { ErrorHandler } = require('./services/error-handler');
const { ContainerLifecycle } = require('./services/container-lifecycle');
const { getLogStreamer } = require('./services/log-streamer');
const { getLogSearch } = require('./services/log-search');

// Global instances
let projectRegistry = null;
let containerLifecycle = null;
let errorHandler = null;
let logStreamer = null;
let logSearch = null;

// Initialize services
async function initializeServices() {
  if (!projectRegistry) {
    projectRegistry = new ProjectRegistry();
    await projectRegistry.initialize();
  }
  
  if (!containerLifecycle) {
    containerLifecycle = new ContainerLifecycle(projectRegistry);
    await containerLifecycle.initialize();
  }
  
  if (!errorHandler) {
    errorHandler = new ErrorHandler();
  }
  
  if (!logStreamer) {
    logStreamer = getLogStreamer();
    await logStreamer.initialize();
  }
  
  if (!logSearch) {
    logSearch = getLogSearch();
    await logSearch.initialize();
  }
}

// Ensure services are initialized before tool execution
async function ensureServicesInitialized() {
  if (!projectRegistry || !containerLifecycle || !errorHandler) {
    await initializeServices();
  }
}

// Ensure error handler is available
function ensureErrorHandler() {
  if (!errorHandler) {
    errorHandler = new ErrorHandler();
  }
  return errorHandler;
}

/**
 * Tool definitions with JSON schemas for validation
 */
const TOOL_DEFINITIONS = [
  {
    name: 'host.register',
    description: 'Register a new project with the debug host',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'string',
          description: 'Path to the project workspace'
        },
        name: {
          type: 'string',
          description: 'Project name'
        },
        techStack: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technology stack (e.g., ["node", "express"])'
        },
        ports: {
          type: 'array',
          items: { type: 'number' },
          description: 'Ports the project will use'
        }
      },
      required: ['workspace', 'name']
    }
  },
  {
    name: 'host.start',
    description: 'Start a registered project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique project identifier'
        },
        environment: {
          type: 'string',
          enum: ['development', 'staging', 'production'],
          description: 'Environment to start the project in',
          default: 'development'
        },
        dockerConfig: {
          type: 'object',
          properties: {
            image: { type: 'string' },
            ports: { 
              type: 'array',
              items: { type: 'number' }
            },
            env: { type: 'object' }
          },
          description: 'Docker configuration for containerized projects'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'host.stop',
    description: 'Stop a running project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique project identifier'
        },
        force: {
          type: 'boolean',
          description: 'Force stop without graceful shutdown',
          default: false
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'host.list',
    description: 'List all registered projects and their status',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'running', 'stopped'],
          description: 'Filter projects by status',
          default: 'all'
        },
        techStack: {
          type: 'string',
          description: 'Filter by technology stack'
        }
      }
    }
  },
  {
    name: 'host.restart',
    description: 'Restart a running project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique project identifier'
        },
        environment: {
          type: 'string',
          enum: ['development', 'staging', 'production'],
          description: 'Environment to restart the project in',
          default: 'development'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'host.status',
    description: 'Get status of a project and its container',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique project identifier'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'host.checkPort',
    description: 'Check if a port is available',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          minimum: 1,
          maximum: 65535,
          description: 'Port number to check'
        },
        host: {
          type: 'string',
          description: 'Host to check (defaults to localhost)',
          default: 'localhost'
        }
      },
      required: ['port']
    }
  },
  {
    name: 'host.logs',
    description: 'Get logs for a project container',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID'
        },
        containerName: {
          type: 'string',
          description: 'Container name'
        },
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          description: 'Filter by log level'
        },
        stream: {
          type: 'string',
          enum: ['stdout', 'stderr'],
          description: 'Filter by stream type'
        },
        search: {
          type: 'string',
          description: 'Search text in logs'
        },
        since: {
          type: 'string',
          description: 'Start time (ISO 8601 format)'
        },
        until: {
          type: 'string',
          description: 'End time (ISO 8601 format)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of log entries to return',
          default: 100
        }
      },
      required: ['containerName']
    }
  },
  {
    name: 'host.searchLogs',
    description: 'Search logs across multiple containers',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (supports advanced syntax: level:error, -exclude, "exact phrase")'
        },
        containers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Container names to search (all if not specified)'
        },
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          description: 'Filter by log level'
        },
        since: {
          type: 'string',
          description: 'Start time (ISO 8601 format)'
        },
        until: {
          type: 'string',
          description: 'End time (ISO 8601 format)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results per container',
          default: 100
        },
        includeFacets: {
          type: 'boolean',
          description: 'Include search facets (counts by level, container, etc.)',
          default: false
        }
      },
      required: ['query']
    }
  },
  {
    name: 'host.clearLogs',
    description: 'Clear logs for a container',
    inputSchema: {
      type: 'object',
      properties: {
        containerName: {
          type: 'string',
          description: 'Container name'
        }
      },
      required: ['containerName']
    }
  },
  {
    name: 'host.exportLogs',
    description: 'Export logs to a file',
    inputSchema: {
      type: 'object',
      properties: {
        containerName: {
          type: 'string',
          description: 'Container name'
        },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'text'],
          description: 'Export format',
          default: 'json'
        },
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          description: 'Filter by log level'
        },
        since: {
          type: 'string',
          description: 'Start time (ISO 8601 format)'
        },
        until: {
          type: 'string',
          description: 'End time (ISO 8601 format)'
        }
      },
      required: ['containerName']
    }
  },
  {
    name: 'host.logStats',
    description: 'Get log statistics and aggregated metrics',
    inputSchema: {
      type: 'object',
      properties: {
        containerName: {
          type: 'string',
          description: 'Container name (optional, returns all if not specified)'
        }
      }
    }
  }
];

/**
 * Tool handlers with full service implementations
 * Story 2.1 & 2.4: Registration system with error handling
 */
const TOOL_HANDLERS = {
  'host.register': async (params) => {
    try {
      await ensureServicesInitialized();
      
      // Use the project registry service for full implementation
      const result = await projectRegistry.registerProject(params);
      
      return result;
      
    } catch (error) {
      // Handle errors through our error handler
      const errorResponse = errorHandler.handleError(error, {
        operation: 'project-registration',
        tool: 'host.register',
        params: {
          workspace: params.workspace,
          name: params.name,
          techStack: params.techStack?.length || 0
        }
      });
      
      // Re-throw as MCP error for consistent handling
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.start': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { projectId, environment = 'development', dockerConfig } = params;
      
      // Use the container lifecycle service for starting containers
      const result = await containerLifecycle.startContainer(projectId, {
        env: {
          NODE_ENV: environment,
          ...(dockerConfig?.env || {})
        }
      });
      
      return result;
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'container-start',
        tool: 'host.start',
        projectId: params.projectId
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.stop': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { projectId, force = false } = params;
      
      // Use the container lifecycle service for stopping containers
      const result = await containerLifecycle.stopContainer(projectId, {
        force
      });
      
      return result;
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'container-stop',
        tool: 'host.stop',
        projectId: params.projectId
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.restart': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { projectId, environment = 'development' } = params;
      
      // Use the container lifecycle service for restarting containers
      const result = await containerLifecycle.restartContainer(projectId, {
        env: {
          NODE_ENV: environment
        }
      });
      
      return result;
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'container-restart',
        tool: 'host.restart',
        projectId: params.projectId
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.status': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { projectId } = params;
      
      // Use the container lifecycle service for getting container status
      const result = await containerLifecycle.getContainerStatus(projectId);
      
      return result;
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'container-status',
        tool: 'host.status',
        projectId: params.projectId
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.list': async (params) => {
    try {
      await ensureServicesInitialized();
      
      // Use the project registry service for listing projects
      const result = await projectRegistry.listProjects(params);
      
      return result;
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'list-projects',
        tool: 'host.list',
        params
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.checkPort': async (params) => {
    // Placeholder implementation
    const { port, host = 'localhost' } = params;
    
    if (!port) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Missing required parameter: port'
      );
    }

    if (port < 1 || port > 65535) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Port must be between 1 and 65535'
      );
    }

    // Mock port check - randomly report some ports as in use
    const isAvailable = Math.random() > 0.3; // 70% chance of being available
    
    return {
      success: true,
      port,
      host,
      available: isAvailable,
      status: isAvailable ? 'available' : 'in_use',
      checkedAt: new Date().toISOString()
    };
  },

  'host.logs': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { containerName, ...options } = params;
      
      // Get logs from streamer service
      const result = await logStreamer.getLogs(containerName, options);
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'get-logs',
        tool: 'host.logs',
        containerName: params.containerName
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.searchLogs': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { query, ...options } = params;
      
      // Search logs using search service
      const result = await logSearch.search(query, options);
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'search-logs',
        tool: 'host.searchLogs',
        query: params.query
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.clearLogs': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { containerName } = params;
      
      // Clear logs for container
      await logStreamer.clearLogs(containerName);
      
      return {
        success: true,
        message: `Logs cleared for container: ${containerName}`,
        containerName
      };
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'clear-logs',
        tool: 'host.clearLogs',
        containerName: params.containerName
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.exportLogs': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { containerName, format = 'json', ...options } = params;
      
      // Export logs using streamer service
      const result = await logStreamer.exportLogs(containerName, format, options);
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'export-logs',
        tool: 'host.exportLogs',
        containerName: params.containerName,
        format: params.format
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  },

  'host.logStats': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const { containerName } = params;
      
      let result;
      if (containerName) {
        // Get stats for specific container
        result = await logSearch.getAggregatedStats(containerName);
      } else {
        // Get overall streaming stats
        const streamingStats = logStreamer.getStats();
        const storageStats = await logStreamer.logStorage.getStats();
        
        result = {
          streaming: streamingStats,
          storage: storageStats
        };
      }
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      const errorResponse = ensureErrorHandler().handleError(error, {
        operation: 'log-stats',
        tool: 'host.logStats',
        containerName: params.containerName
      });
      
      throw createMcpError(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error
      );
    }
  }
};

/**
 * Get all tool definitions
 */
function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

/**
 * Execute a tool by name
 */
async function executeTool(toolName, params) {
  const handler = TOOL_HANDLERS[toolName];
  
  if (!handler) {
    throw createMcpError(
      MCP_ERROR_CODES.TOOL_NOT_FOUND,
      `Tool '${toolName}' not found`
    );
  }

  try {
    const result = await handler(params);
    return result;
  } catch (error) {
    if (error.code) {
      // Re-throw MCP errors
      throw error;
    } else {
      // Wrap other errors
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Tool execution failed: ${error.message}`
      );
    }
  }
}

/**
 * Validate tool parameters against schema
 */
function validateToolParams(toolName, params) {
  const tool = TOOL_DEFINITIONS.find(t => t.name === toolName);
  if (!tool) {
    throw createMcpError(
      MCP_ERROR_CODES.TOOL_NOT_FOUND,
      `Tool '${toolName}' not found`
    );
  }

  // Basic validation - check required fields
  const schema = tool.inputSchema;
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in params)) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          `Missing required parameter: ${requiredField}`
        );
      }
    }
  }

  return true;
}

module.exports = {
  getToolDefinitions,
  executeTool,
  validateToolParams,
  initializeServices,
  TOOL_DEFINITIONS,
  TOOL_HANDLERS
};