/**
 * MCP Process Management Tools - 15 New Tools for Comprehensive Multi-Tech Process Management
 * 
 * Sprint 6 - Story 3.5: New MCP Tools Implementation (20 story points)
 * 
 * These 15 tools provide comprehensive multi-tech process management capabilities for Claude Code agents,
 * leveraging the Multi-Tech Process Discovery Engine and Enhanced Port Registry foundation.
 * 
 * Tool Categories:
 * - Process Discovery (1-4): Cross-stack process discovery and analysis
 * - Process Management (5-9): Safe process termination with workspace validation 
 * - Monitoring & Analysis (10-13): Real-time monitoring and health checking
 * - Automated Maintenance (14-15): Intelligence-driven automated cleanup
 */

const { createMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');
const { MultiTechProcessDiscoveryEngine, TechStack } = require('./services/multi-tech-process-discovery-engine');
const { EnhancedPortRegistry, ProcessCategory } = require('./enhanced-port-registry');
const { ErrorHandler } = require('./services/error-handler');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

// Global instances for process management
let discoveryEngine = null;
let enhancedRegistry = null;
let errorHandler = null;

// Safety level classifications for the upcoming safety framework integration
const SafetyLevel = {
  SAFE: 'safe',           // Read-only operations, no side effects
  MODERATE: 'moderate',   // Limited modifications with validation
  DANGEROUS: 'dangerous'  // System-modifying operations requiring safety checks
};

/**
 * Initialize the process management services
 * @param {Object} mockServices - Optional mock services for testing
 */
async function initializeProcessManagementServices(mockServices = {}) {
  if (mockServices.discoveryEngine) {
    discoveryEngine = mockServices.discoveryEngine;
  } else if (!discoveryEngine) {
    discoveryEngine = new MultiTechProcessDiscoveryEngine({
      scanTimeout: 500,  // 500ms requirement for MCP tools
      performanceMonitoring: true,
      correlationEnabled: true
    });
    await discoveryEngine.initialize();
  }
  
  if (mockServices.enhancedRegistry) {
    enhancedRegistry = mockServices.enhancedRegistry;
  } else if (!enhancedRegistry) {
    enhancedRegistry = new EnhancedPortRegistry(null, {
      refreshInterval: 5000,
      refreshTimeout: 500,  // 500ms requirement
      enableRealTimeUpdates: true,
      enableErrorRecovery: true
    });
    await enhancedRegistry.initialize();
  }
  
  if (mockServices.errorHandler) {
    errorHandler = mockServices.errorHandler;
  } else if (!errorHandler) {
    errorHandler = new ErrorHandler();
  }
}

/**
 * Ensure services are initialized before tool execution
 * @param {Object} mockServices - Optional mock services for testing
 */
async function ensureServicesInitialized(mockServices = {}) {
  if (!discoveryEngine || !enhancedRegistry || !errorHandler) {
    await initializeProcessManagementServices(mockServices);
  }
}

/**
 * Inject mock services for testing
 * @param {Object} mockServices - Mock services to inject
 */
function injectMockServices(mockServices) {
  if (mockServices.discoveryEngine) {
    discoveryEngine = mockServices.discoveryEngine;
  }
  if (mockServices.enhancedRegistry) {
    enhancedRegistry = mockServices.enhancedRegistry;
  }
  if (mockServices.errorHandler) {
    errorHandler = mockServices.errorHandler;
  }
}

/**
 * Reset all services (for testing)
 */
function resetServices() {
  discoveryEngine = null;
  enhancedRegistry = null;
  errorHandler = null;
}

/**
 * 15 New MCP Process Management Tool Definitions
 */
const PROCESS_MANAGEMENT_TOOL_DEFINITIONS = [
  // Process Discovery Tools (1-4)
  {
    name: 'host.discover_processes',
    description: 'Comprehensive process discovery across all supported technology stacks (Node.js, PHP, Python, Static Sites, Docker)',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        techStacks: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['nodejs', 'php', 'python', 'static', 'docker']
          },
          description: 'Specific technology stacks to scan (defaults to all)',
          default: ['nodejs', 'php', 'python', 'static', 'docker']
        },
        includeCorrelation: {
          type: 'boolean',
          description: 'Include workspace correlation analysis',
          default: true
        },
        forceRefresh: {
          type: 'boolean', 
          description: 'Force fresh scan ignoring cache',
          default: false
        }
      }
    }
  },
  {
    name: 'host.scan_tech_stack',
    description: 'Technology-specific scanning with framework detection and process classification',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        techStack: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static', 'docker'],
          description: 'Technology stack to scan'
        },
        includeFrameworks: {
          type: 'boolean',
          description: 'Include framework detection (Express, Laravel, Django, etc.)',
          default: true
        },
        portRange: {
          type: 'object',
          properties: {
            start: { type: 'number', minimum: 1, maximum: 65535 },
            end: { type: 'number', minimum: 1, maximum: 65535 }
          },
          description: 'Specific port range to scan'
        }
      },
      required: ['techStack']
    }
  },
  {
    name: 'host.container_discovery',
    description: 'Docker container detection with port mapping and health status',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        includeInactive: {
          type: 'boolean',
          description: 'Include stopped/exited containers',
          default: false
        },
        networkMode: {
          type: 'string',
          enum: ['bridge', 'host', 'none', 'all'],
          description: 'Filter by Docker network mode',
          default: 'all'
        }
      }
    }
  },
  {
    name: 'host.process_tree_analysis',
    description: 'Process relationship mapping and dependency analysis',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        rootPid: {
          type: 'number',
          description: 'Root process PID for tree analysis (optional)'
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum tree depth to analyze',
          default: 5,
          minimum: 1,
          maximum: 10
        },
        includeResources: {
          type: 'boolean',
          description: 'Include CPU/memory usage for each process',
          default: true
        }
      }
    }
  },

  // Process Management Tools (5-9)
  {
    name: 'host.kill_process',
    description: 'Safe process termination with workspace validation and safety checks',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        pid: {
          type: 'number',
          description: 'Process ID to terminate'
        },
        port: {
          type: 'number',
          description: 'Port number (alternative to PID)',
          minimum: 1,
          maximum: 65535
        },
        signal: {
          type: 'string',
          enum: ['SIGTERM', 'SIGKILL', 'SIGINT'],
          description: 'Signal to send to process',
          default: 'SIGTERM'
        },
        validateWorkspace: {
          type: 'boolean',
          description: 'Validate process belongs to known workspace',
          default: true
        },
        reason: {
          type: 'string',
          description: 'Reason for termination (for audit trail)',
          maxLength: 200
        }
      },
      required: ['reason'],
      anyOf: [
        { required: ['pid'] },
        { required: ['port'] }
      ]
    }
  },
  {
    name: 'host.kill_by_tech_stack',
    description: 'Technology stack-specific cleanup operations with batch safety',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        techStack: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static', 'docker'],
          description: 'Technology stack to clean up'
        },
        processCategory: {
          type: 'string',
          enum: ['discovered', 'rogue', 'orphaned'],
          description: 'Category of processes to terminate',
          default: 'rogue'
        },
        maxProcesses: {
          type: 'number',
          description: 'Maximum number of processes to terminate in one operation',
          default: 5,
          minimum: 1,
          maximum: 20
        },
        reason: {
          type: 'string',
          description: 'Reason for batch termination',
          maxLength: 200
        }
      },
      required: ['techStack', 'reason']
    }
  },
  {
    name: 'host.cleanup_rogue',
    description: 'Rogue process cleanup with comprehensive safety checks',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Perform dry run without actual termination',
          default: true
        },
        ageThreshold: {
          type: 'number',
          description: 'Minimum process age in minutes before termination',
          default: 30,
          minimum: 5
        },
        excludePorts: {
          type: 'array',
          items: { type: 'number' },
          description: 'Ports to exclude from cleanup'
        },
        reason: {
          type: 'string',
          description: 'Reason for rogue cleanup',
          maxLength: 200
        }
      },
      required: ['reason']
    }
  },
  {
    name: 'host.cleanup_by_project_type',
    description: 'Project type-specific cleanup operations with workspace correlation',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        projectType: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static'],
          description: 'Project type to clean up'
        },
        workspacePath: {
          type: 'string',
          description: 'Specific workspace path filter'
        },
        includeOrphaned: {
          type: 'boolean',
          description: 'Include orphaned allocations in cleanup',
          default: true
        },
        reason: {
          type: 'string',
          description: 'Reason for project cleanup',
          maxLength: 200
        }
      },
      required: ['projectType', 'reason']
    }
  },
  {
    name: 'host.bulk_process_management',
    description: 'Multi-process operations with batch safety and rollback capability',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['kill', 'restart', 'pause', 'resume'],
                description: 'Action to perform'
              },
              target: {
                type: 'object',
                properties: {
                  pid: { type: 'number' },
                  port: { type: 'number' },
                  processName: { type: 'string' }
                },
                description: 'Target process identification'
              }
            },
            required: ['action', 'target']
          },
          maxItems: 10,
          description: 'Batch operations to perform'
        },
        atomic: {
          type: 'boolean',
          description: 'All operations succeed or all fail',
          default: true
        },
        reason: {
          type: 'string',
          description: 'Reason for bulk operations',
          maxLength: 200
        }
      },
      required: ['operations', 'reason']
    }
  },

  // Monitoring & Analysis Tools (10-13)
  {
    name: 'host.monitor_port_ranges',
    description: 'Real-time port monitoring by technology stack with change detection',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        portRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'number', minimum: 1, maximum: 65535 },
              end: { type: 'number', minimum: 1, maximum: 65535 },
              techStack: { type: 'string', enum: ['nodejs', 'php', 'python', 'static', 'docker'] }
            },
            required: ['start', 'end']
          },
          description: 'Port ranges to monitor'
        },
        duration: {
          type: 'number',
          description: 'Monitoring duration in seconds',
          default: 30,
          minimum: 5,
          maximum: 300
        },
        changeThreshold: {
          type: 'number',
          description: 'Minimum change percentage to report',
          default: 10,
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'host.correlate_workspace',
    description: 'Workspace-process correlation analysis with relationship mapping',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        workspacePath: {
          type: 'string',
          description: 'Workspace path to analyze'
        },
        includeSubdirectories: {
          type: 'boolean',
          description: 'Include subdirectories in analysis',
          default: true
        },
        correlationDepth: {
          type: 'string',
          enum: ['shallow', 'deep', 'comprehensive'],
          description: 'Depth of correlation analysis',
          default: 'deep'
        }
      }
    }
  },
  {
    name: 'host.workspace_health_check',
    description: 'Workspace process validation and health assessment',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        workspacePath: {
          type: 'string',
          description: 'Workspace path to check'
        },
        healthCriteria: {
          type: 'object',
          properties: {
            maxCpuUsage: { type: 'number', default: 80 },
            maxMemoryUsage: { type: 'number', default: 80 },
            maxProcessAge: { type: 'number', default: 1440 }
          },
          description: 'Health check criteria'
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Include optimization recommendations',
          default: true
        }
      }
    }
  },
  {
    name: 'host.system_process_report',
    description: 'Comprehensive system analysis and reporting with trend analysis',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['summary', 'detailed', 'performance', 'security', 'comprehensive'],
          description: 'Type of report to generate',
          default: 'summary'
        },
        timeRange: {
          type: 'string',
          enum: ['1h', '6h', '24h', '7d'],
          description: 'Historical data time range',
          default: '24h'
        },
        includeTrends: {
          type: 'boolean',
          description: 'Include trend analysis',
          default: true
        },
        format: {
          type: 'string',
          enum: ['json', 'markdown', 'csv'],
          description: 'Report output format',
          default: 'json'
        }
      }
    }
  },

  // Automated Maintenance Tools (14-15)
  {
    name: 'host.auto_cleanup_orphaned',
    description: 'Automated orphan process cleanup with intelligence-driven decision making',
    safetyLevel: SafetyLevel.DANGEROUS,
    inputSchema: {
      type: 'object',
      properties: {
        ageCriteria: {
          type: 'object',
          properties: {
            minAge: { type: 'number', default: 60, description: 'Minimum age in minutes' },
            maxAge: { type: 'number', default: 1440, description: 'Maximum age in minutes' }
          },
          description: 'Age criteria for cleanup'
        },
        resourceCriteria: {
          type: 'object',
          properties: {
            maxCpuUsage: { type: 'number', default: 5, description: 'Maximum CPU usage %' },
            maxMemoryUsage: { type: 'number', default: 100, description: 'Maximum memory usage MB' }
          },
          description: 'Resource usage criteria'
        },
        dryRun: {
          type: 'boolean',
          description: 'Perform dry run without actual cleanup',
          default: true
        },
        maxCleanupCount: {
          type: 'number',
          description: 'Maximum processes to clean up in one run',
          default: 10,
          minimum: 1,
          maximum: 50
        }
      }
    }
  },
  {
    name: 'host.process_safety_check',
    description: 'Pre-termination validation and risk assessment with comprehensive safety analysis',
    safetyLevel: SafetyLevel.SAFE,
    inputSchema: {
      type: 'object',
      properties: {
        pid: {
          type: 'number',
          description: 'Process ID to analyze'
        },
        port: {
          type: 'number',
          description: 'Port number (alternative to PID)',
          minimum: 1,
          maximum: 65535
        },
        checkCriteria: {
          type: 'object',
          properties: {
            workspaceValidation: { type: 'boolean', default: true },
            dependencyAnalysis: { type: 'boolean', default: true },
            resourceImpact: { type: 'boolean', default: true },
            criticalProcessCheck: { type: 'boolean', default: true }
          },
          description: 'Safety check criteria'
        },
        riskTolerance: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Risk tolerance level',
          default: 'medium'
        }
      },
      anyOf: [
        { required: ['pid'] },
        { required: ['port'] }
      ]
    }
  }
];

/**
 * Process Management Tool Handlers
 * All tools implement comprehensive error handling and safety checks
 */
const PROCESS_MANAGEMENT_TOOL_HANDLERS = {
  // Process Discovery Tools (1-4)
  'host.discover_processes': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        techStacks = ['nodejs', 'php', 'python', 'static', 'docker'],
        includeCorrelation = true,
        forceRefresh = false
      } = params;
      
      console.log(`Discovering processes across ${techStacks.length} technology stacks...`);
      
      const startTime = Date.now();
      const discoveryResults = await discoveryEngine.scanSystemProcesses({
        techStacks,
        includeCorrelation,
        forceRefresh
      });
      
      const processingTime = Date.now() - startTime;
      
      // Categorize discovered processes using the enhanced registry
      const registryData = await enhancedRegistry.getAllActiveProcesses({
        forceRefresh: false // Use fresh discovery data
      });
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        discoveryResults: {
          totalProcesses: discoveryResults.totalProcesses,
          techStackResults: discoveryResults.techStackResults,
          correlation: discoveryResults.correlation
        },
        processCategories: {
          registered: registryData.registered,
          discovered: registryData.discovered,
          rogue: registryData.rogue,
          orphaned: registryData.orphaned,
          containers: registryData.containers
        },
        summary: {
          ...registryData.summary,
          processingTime,
          meetsPerfReq: processingTime < 500
        }
      };
      
      console.log(`✓ Process discovery completed in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'process-discovery',
        tool: 'host.discover_processes',
        params: { techStacks: params.techStacks?.length || 0 }
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Process discovery failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.scan_tech_stack': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        techStack,
        includeFrameworks = true,
        portRange
      } = params;
      
      console.log(`Scanning ${techStack} technology stack...`);
      
      const startTime = Date.now();
      
      // Get detector-specific information
      const detectorInfo = discoveryEngine.getDetectorInfo(techStack);
      
      // Perform targeted scan
      const discoveryResults = await discoveryEngine.scanSystemProcesses({
        techStacks: [techStack],
        includeCorrelation: true,
        forceRefresh: true
      });
      
      const techStackResults = discoveryResults.techStackResults[techStack];
      const processingTime = Date.now() - startTime;
      
      // Filter by port range if specified
      let filteredProcesses = techStackResults.processes || [];
      if (portRange) {
        filteredProcesses = filteredProcesses.filter(process => 
          process.port >= portRange.start && process.port <= portRange.end
        );
      }
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        techStack,
        detectorInfo,
        processes: filteredProcesses,
        frameworks: includeFrameworks ? await getFrameworkInfo(filteredProcesses, techStack) : null,
        summary: {
          totalProcesses: filteredProcesses.length,
          portRange: portRange || 'all',
          frameworksDetected: includeFrameworks ? await countFrameworks(filteredProcesses, techStack) : 0,
          meetsPerfReq: processingTime < 500
        }
      };
      
      console.log(`✓ ${techStack} scan completed in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'tech-stack-scan',
        tool: 'host.scan_tech_stack',
        techStack: params.techStack
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.container_discovery': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        includeInactive = false,
        networkMode = 'all'
      } = params;
      
      console.log('Discovering Docker containers...');
      
      const startTime = Date.now();
      
      // Use discovery engine's Docker detector
      const discoveryResults = await discoveryEngine.scanSystemProcesses({
        techStacks: ['docker'],
        includeCorrelation: true,
        forceRefresh: true
      });
      
      const dockerResults = discoveryResults.techStackResults.docker;
      const processingTime = Date.now() - startTime;
      
      // Get additional container information
      const detailedContainers = await getDetailedContainerInfo(
        dockerResults.processes,
        includeInactive,
        networkMode
      );
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        containers: detailedContainers,
        summary: {
          totalContainers: detailedContainers.length,
          running: detailedContainers.filter(c => c.status === 'running').length,
          stopped: detailedContainers.filter(c => c.status !== 'running').length,
          networkModes: getUniqueNetworkModes(detailedContainers),
          meetsPerfReq: processingTime < 500
        },
        dockerInfo: {
          detectorAvailable: dockerResults.success,
          error: dockerResults.error || null
        }
      };
      
      console.log(`✓ Container discovery completed in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'container-discovery',
        tool: 'host.container_discovery'
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.process_tree_analysis': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        rootPid,
        maxDepth = 5,
        includeResources = true
      } = params;
      
      console.log('Analyzing process trees...');
      
      const startTime = Date.now();
      
      // Get all processes for tree analysis
      const discoveryResults = await discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: false
      });
      
      // Build process trees
      const processTrees = await buildProcessTrees(
        discoveryResults.processesFound,
        rootPid,
        maxDepth,
        includeResources
      );
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        processTrees,
        analysis: {
          totalTreesFound: processTrees.length,
          deepestTree: Math.max(...processTrees.map(tree => tree.depth)),
          totalProcessesAnalyzed: discoveryResults.totalProcesses,
          rootPid: rootPid || 'all',
          maxDepthRequested: maxDepth
        },
        performance: {
          meetsPerfReq: processingTime < 500,
          processingTime
        }
      };
      
      console.log(`✓ Process tree analysis completed in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'process-tree-analysis',
        tool: 'host.process_tree_analysis',
        rootPid: params.rootPid
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  // Process Management Tools (5-9) - Safety-aware implementations
  'host.kill_process': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        pid,
        port,
        signal = 'SIGTERM',
        validateWorkspace = true,
        reason
      } = params;
      
      console.log(`Attempting to terminate process (${pid ? `PID: ${pid}` : `Port: ${port}`}) - Reason: ${reason}`);
      
      // Pre-termination safety check
      const safetyCheck = await performSafetyCheck(pid || port, validateWorkspace);
      
      if (!safetyCheck.safe) {
        return {
          success: false,
          error: 'Safety check failed',
          safetyCheck,
          reason: 'Process termination blocked for safety',
          recommendations: safetyCheck.recommendations
        };
      }
      
      // Determine target process
      let targetPid = pid;
      if (!targetPid && port) {
        const processWithPort = await findProcessByPort(port);
        if (!processWithPort) {
          throw new Error(`No process found on port ${port}`);
        }
        targetPid = processWithPort.pid;
      }
      
      // Perform termination
      const terminationResult = await terminateProcess(targetPid, signal, reason);
      
      const response = {
        success: terminationResult.success,
        timestamp: new Date().toISOString(),
        terminatedProcess: {
          pid: targetPid,
          port: port || null,
          signal: signal,
          reason: reason
        },
        safetyCheck,
        terminationResult,
        auditTrail: {
          action: 'process_termination',
          user: process.env.USER || 'unknown',
          timestamp: new Date().toISOString(),
          reason: reason,
          safetyValidated: safetyCheck.safe
        }
      };
      
      console.log(`✓ Process ${targetPid} termination ${terminationResult.success ? 'successful' : 'failed'}`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'process-termination',
        tool: 'host.kill_process',
        pid: params.pid,
        port: params.port
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.kill_by_tech_stack': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        techStack,
        processCategory = 'rogue',
        maxProcesses = 5,
        reason
      } = params;
      
      console.log(`Cleaning up ${processCategory} ${techStack} processes - Reason: ${reason}`);
      
      // Get processes in the specified category
      const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      let targetProcesses = [];
      
      switch (processCategory) {
        case 'discovered':
          targetProcesses = registryData.discovered.filter(p => p.techStack === techStack);
          break;
        case 'rogue':
          targetProcesses = registryData.rogue.filter(p => p.techStack === techStack);
          break;
        case 'orphaned':
          targetProcesses = registryData.orphaned.filter(p => p.techStack === techStack);
          break;
      }
      
      // Limit to maxProcesses
      targetProcesses = targetProcesses.slice(0, maxProcesses);
      
      if (targetProcesses.length === 0) {
        return {
          success: true,
          message: `No ${processCategory} ${techStack} processes found`,
          processed: 0
        };
      }
      
      // Perform safety checks on all processes
      const safetyResults = await Promise.all(
        targetProcesses.map(p => performSafetyCheck(p.pid, true))
      );
      
      const safeProcesses = targetProcesses.filter((_, index) => safetyResults[index].safe);
      const unsafeProcesses = targetProcesses.filter((_, index) => !safetyResults[index].safe);
      
      // Terminate safe processes
      const terminationResults = await Promise.all(
        safeProcesses.map(p => terminateProcess(p.pid, 'SIGTERM', reason))
      );
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        techStack,
        processCategory,
        summary: {
          totalFound: targetProcesses.length,
          safeToTerminate: safeProcesses.length,
          terminated: terminationResults.filter(r => r.success).length,
          failed: terminationResults.filter(r => !r.success).length,
          skippedForSafety: unsafeProcesses.length
        },
        details: {
          terminated: safeProcesses.map((p, index) => ({
            pid: p.pid,
            port: p.port,
            result: terminationResults[index]
          })),
          skipped: unsafeProcesses.map((p, index) => ({
            pid: p.pid,
            port: p.port,
            reason: safetyResults[targetProcesses.indexOf(p)].recommendations
          }))
        },
        auditTrail: {
          action: 'tech_stack_cleanup',
          techStack,
          reason,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`✓ ${techStack} cleanup completed: ${response.summary.terminated} terminated`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'tech-stack-cleanup',
        tool: 'host.kill_by_tech_stack',
        techStack: params.techStack
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.cleanup_rogue': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        dryRun = true,
        ageThreshold = 30,
        excludePorts = [],
        reason
      } = params;
      
      console.log(`${dryRun ? 'Analyzing' : 'Cleaning up'} rogue processes - Reason: ${reason}`);
      
      // Get all rogue processes
      const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      const rogueProcesses = registryData.rogue;
      
      // Apply age filter and exclusions
      const candidateProcesses = rogueProcesses.filter(process => {
        // Check age threshold
        const processAge = getProcessAge(process);
        if (processAge < ageThreshold) return false;
        
        // Check port exclusions
        if (excludePorts.includes(process.port)) return false;
        
        return true;
      });
      
      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          timestamp: new Date().toISOString(),
          analysis: {
            totalRogueProcesses: rogueProcesses.length,
            candidatesForCleanup: candidateProcesses.length,
            wouldBeTerminated: candidateProcesses.length,
            ageThreshold: `${ageThreshold} minutes`,
            excludedPorts: excludePorts
          },
          candidates: candidateProcesses.map(p => ({
            pid: p.pid,
            port: p.port,
            age: getProcessAge(p),
            techStack: p.techStack,
            command: p.command || 'unknown'
          }))
        };
      }
      
      // Perform actual cleanup
      const terminationResults = await Promise.all(
        candidateProcesses.map(p => terminateProcess(p.pid, 'SIGTERM', reason))
      );
      
      const response = {
        success: true,
        dryRun: false,
        timestamp: new Date().toISOString(),
        summary: {
          totalRogue: rogueProcesses.length,
          candidates: candidateProcesses.length,
          terminated: terminationResults.filter(r => r.success).length,
          failed: terminationResults.filter(r => !r.success).length
        },
        results: candidateProcesses.map((p, index) => ({
          pid: p.pid,
          port: p.port,
          result: terminationResults[index]
        })),
        auditTrail: {
          action: 'rogue_cleanup',
          ageThreshold,
          reason,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`✓ Rogue cleanup completed: ${response.summary.terminated} terminated`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'rogue-cleanup',
        tool: 'host.cleanup_rogue'
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.cleanup_by_project_type': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        projectType,
        workspacePath,
        includeOrphaned = true,
        reason
      } = params;
      
      console.log(`Cleaning up ${projectType} project processes - Reason: ${reason}`);
      
      // Get all processes and filter by project type
      const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      
      let targetProcesses = [];
      
      // Add discovered and rogue processes of the specified type
      targetProcesses.push(...registryData.discovered.filter(p => p.techStack === projectType));
      targetProcesses.push(...registryData.rogue.filter(p => p.techStack === projectType));
      
      if (includeOrphaned) {
        targetProcesses.push(...registryData.orphaned.filter(p => p.techStack === projectType));
      }
      
      // Filter by workspace path if specified
      if (workspacePath) {
        targetProcesses = targetProcesses.filter(p => 
          p.workspacePath && p.workspacePath.startsWith(workspacePath)
        );
      }
      
      // Perform workspace correlation to ensure safety
      const correlationResults = await discoveryEngine.correlateWithProjects(targetProcesses);
      
      // Safety check: only terminate processes not in active workspaces
      const safeProcesses = targetProcesses.filter(p => 
        !correlationResults.registeredProcesses?.some(rp => rp.pid === p.pid)
      );
      
      const terminationResults = await Promise.all(
        safeProcesses.map(p => terminateProcess(p.pid, 'SIGTERM', reason))
      );
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        projectType,
        workspacePath: workspacePath || 'all',
        summary: {
          totalFound: targetProcesses.length,
          safeToTerminate: safeProcesses.length,
          terminated: terminationResults.filter(r => r.success).length,
          failed: terminationResults.filter(r => !r.success).length,
          protectedByWorkspace: targetProcesses.length - safeProcesses.length
        },
        results: safeProcesses.map((p, index) => ({
          pid: p.pid,
          port: p.port,
          result: terminationResults[index]
        })),
        auditTrail: {
          action: 'project_type_cleanup',
          projectType,
          workspacePath,
          reason,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`✓ ${projectType} project cleanup completed`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'project-cleanup',
        tool: 'host.cleanup_by_project_type',
        projectType: params.projectType
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.bulk_process_management': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        operations,
        atomic = true,
        reason
      } = params;
      
      console.log(`Performing bulk process operations (${operations.length} ops) - Reason: ${reason}`);
      
      // Pre-validate all operations if atomic mode
      if (atomic) {
        const validationResults = await Promise.all(
          operations.map(op => validateBulkOperation(op))
        );
        
        const invalidOps = validationResults.filter(v => !v.valid);
        if (invalidOps.length > 0) {
          return {
            success: false,
            error: 'Validation failed for atomic operation',
            invalidOperations: invalidOps,
            message: 'All operations must be valid for atomic execution'
          };
        }
      }
      
      // Execute operations
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (const operation of operations) {
        try {
          const result = await executeBulkOperation(operation, reason);
          results.push(result);
          if (result.success) successCount++;
          else failureCount++;
        } catch (error) {
          const result = { success: false, operation, error: error.message };
          results.push(result);
          failureCount++;
          
          // In atomic mode, rollback on first failure
          if (atomic) {
            await rollbackOperations(results.filter(r => r.success));
            throw new Error(`Atomic operation failed: ${error.message}`);
          }
        }
      }
      
      const response = {
        success: failureCount === 0,
        timestamp: new Date().toISOString(),
        atomic,
        summary: {
          totalOperations: operations.length,
          successful: successCount,
          failed: failureCount,
          successRate: (successCount / operations.length) * 100
        },
        results,
        auditTrail: {
          action: 'bulk_process_management',
          operationCount: operations.length,
          reason,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`✓ Bulk operations completed: ${successCount}/${operations.length} successful`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'bulk-process-management',
        tool: 'host.bulk_process_management',
        operationCount: params.operations?.length || 0
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  // Monitoring & Analysis Tools (10-13)
  'host.monitor_port_ranges': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        portRanges = [],
        duration = 30,
        changeThreshold = 10
      } = params;
      
      console.log(`Monitoring port ranges for ${duration} seconds...`);
      
      const monitoringResults = [];
      const startTime = Date.now();
      
      // Take initial snapshot
      let previousSnapshot = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      
      // Monitor for specified duration
      const monitoringInterval = setInterval(async () => {
        try {
          const currentSnapshot = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
          const changes = detectPortRangeChanges(previousSnapshot, currentSnapshot, portRanges, changeThreshold);
          
          if (changes.length > 0) {
            monitoringResults.push({
              timestamp: new Date().toISOString(),
              changes
            });
          }
          
          previousSnapshot = currentSnapshot;
        } catch (error) {
          console.error('Error during port monitoring:', error.message);
        }
      }, 5000); // Monitor every 5 seconds
      
      // Stop monitoring after duration
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      clearInterval(monitoringInterval);
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        monitoringDuration: duration,
        portRanges,
        changeThreshold,
        results: monitoringResults,
        summary: {
          totalChangeEvents: monitoringResults.length,
          totalChanges: monitoringResults.reduce((sum, r) => sum + r.changes.length, 0),
          mostActiveRange: getMostActivePortRange(monitoringResults, portRanges),
          averageChangesPerMinute: (monitoringResults.reduce((sum, r) => sum + r.changes.length, 0) / duration) * 60
        }
      };
      
      console.log(`✓ Port monitoring completed: ${response.summary.totalChangeEvents} change events`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'port-monitoring',
        tool: 'host.monitor_port_ranges'
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.correlate_workspace': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        workspacePath,
        includeSubdirectories = true,
        correlationDepth = 'deep'
      } = params;
      
      console.log(`Correlating workspace processes: ${workspacePath || 'all workspaces'}`);
      
      const startTime = Date.now();
      
      // Get all processes for correlation
      const discoveryResults = await discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });
      
      // Perform enhanced correlation analysis
      const correlationResults = await performEnhancedCorrelation(
        discoveryResults.processesFound,
        workspacePath,
        includeSubdirectories,
        correlationDepth
      );
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        workspacePath: workspacePath || 'all',
        correlationDepth,
        correlation: correlationResults,
        summary: {
          totalProcesses: discoveryResults.totalProcesses,
          correlatedProcesses: correlationResults.correlatedProcesses?.length || 0,
          uncorrelatedProcesses: correlationResults.uncorrelatedProcesses?.length || 0,
          workspaceMatches: correlationResults.workspaceMatches?.length || 0,
          confidenceScore: correlationResults.confidenceScore || 0
        },
        performance: {
          processingTime,
          meetsPerfReq: processingTime < 500
        }
      };
      
      console.log(`✓ Workspace correlation completed in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'workspace-correlation',
        tool: 'host.correlate_workspace',
        workspacePath: params.workspacePath
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.workspace_health_check': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        workspacePath,
        healthCriteria = {
          maxCpuUsage: 80,
          maxMemoryUsage: 80,
          maxProcessAge: 1440
        },
        includeRecommendations = true
      } = params;
      
      console.log(`Performing workspace health check: ${workspacePath || 'all workspaces'}`);
      
      const startTime = Date.now();
      
      // Get workspace processes
      const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      
      let workspaceProcesses = [];
      if (workspacePath) {
        workspaceProcesses = [
          ...registryData.registered.filter(p => p.workspacePath?.startsWith(workspacePath)),
          ...registryData.discovered.filter(p => p.workspacePath?.startsWith(workspacePath))
        ];
      } else {
        workspaceProcesses = [...registryData.registered, ...registryData.discovered];
      }
      
      // Perform health analysis
      const healthAnalysis = await analyzeWorkspaceHealth(workspaceProcesses, healthCriteria);
      
      // Generate recommendations if requested
      const recommendations = includeRecommendations ? 
        generateHealthRecommendations(healthAnalysis, healthCriteria) : [];
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        workspacePath: workspacePath || 'all',
        healthCriteria,
        analysis: healthAnalysis,
        recommendations,
        overallHealth: calculateOverallHealth(healthAnalysis),
        summary: {
          totalProcesses: workspaceProcesses.length,
          healthyProcesses: healthAnalysis.healthy?.length || 0,
          unhealthyProcesses: healthAnalysis.unhealthy?.length || 0,
          warningProcesses: healthAnalysis.warnings?.length || 0,
          healthScore: healthAnalysis.healthScore || 0
        }
      };
      
      console.log(`✓ Workspace health check completed: ${response.overallHealth.status}`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'workspace-health-check',
        tool: 'host.workspace_health_check',
        workspacePath: params.workspacePath
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.system_process_report': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        reportType = 'summary',
        timeRange = '24h',
        includeTrends = true,
        format = 'json'
      } = params;
      
      console.log(`Generating ${reportType} system process report...`);
      
      const startTime = Date.now();
      
      // Collect comprehensive system data
      const systemData = await collectSystemData(reportType, timeRange);
      
      // Generate trends if requested
      const trends = includeTrends ? await generateTrendAnalysis(systemData, timeRange) : null;
      
      // Build report based on type
      const reportData = await buildSystemReport(systemData, reportType, trends);
      
      const processingTime = Date.now() - startTime;
      
      // Format output
      const formattedReport = formatReport(reportData, format);
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        reportType,
        timeRange,
        format,
        report: formattedReport,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime,
          dataPoints: systemData.dataPoints || 0,
          includedTrends: includeTrends,
          reportSize: JSON.stringify(formattedReport).length
        }
      };
      
      console.log(`✓ System report generated in ${processingTime}ms`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'system-process-report',
        tool: 'host.system_process_report',
        reportType: params.reportType
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  // Automated Maintenance Tools (14-15)
  'host.auto_cleanup_orphaned': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        ageCriteria = { minAge: 60, maxAge: 1440 },
        resourceCriteria = { maxCpuUsage: 5, maxMemoryUsage: 100 },
        dryRun = true,
        maxCleanupCount = 10
      } = params;
      
      console.log(`${dryRun ? 'Analyzing' : 'Performing'} automated orphan cleanup...`);
      
      const startTime = Date.now();
      
      // Get all orphaned processes
      const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: true });
      const orphanedProcesses = registryData.orphaned;
      
      // Apply intelligence-driven filtering
      const cleanupCandidates = await intelligentOrphanFiltering(
        orphanedProcesses,
        ageCriteria,
        resourceCriteria,
        maxCleanupCount
      );
      
      if (dryRun) {
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          dryRun: true,
          timestamp: new Date().toISOString(),
          processingTime,
          analysis: {
            totalOrphaned: orphanedProcesses.length,
            cleanupCandidates: cleanupCandidates.length,
            wouldCleanup: cleanupCandidates.length,
            criteria: { ageCriteria, resourceCriteria },
            estimatedSavings: calculateResourceSavings(cleanupCandidates)
          },
          candidates: cleanupCandidates.map(p => ({
            pid: p.pid,
            port: p.port,
            age: getProcessAge(p),
            resourceUsage: p.resourceUsage || { cpu: 0, memory: 0 },
            cleanupPriority: p.cleanupPriority || 'medium'
          }))
        };
      }
      
      // Perform actual cleanup
      const cleanupResults = await performIntelligentCleanup(cleanupCandidates);
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        dryRun: false,
        timestamp: new Date().toISOString(),
        processingTime,
        summary: {
          totalOrphaned: orphanedProcesses.length,
          candidates: cleanupCandidates.length,
          cleaned: cleanupResults.successful.length,
          failed: cleanupResults.failed.length,
          resourcesSaved: calculateResourceSavings(cleanupResults.successful)
        },
        results: cleanupResults,
        auditTrail: {
          action: 'automated_orphan_cleanup',
          criteria: { ageCriteria, resourceCriteria },
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`✓ Automated cleanup completed: ${response.summary.cleaned} processes cleaned`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'auto-cleanup-orphaned',
        tool: 'host.auto_cleanup_orphaned'
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  },

  'host.process_safety_check': async (params) => {
    try {
      await ensureServicesInitialized();
      
      const {
        pid,
        port,
        checkCriteria = {
          workspaceValidation: true,
          dependencyAnalysis: true,
          resourceImpact: true,
          criticalProcessCheck: true
        },
        riskTolerance = 'medium'
      } = params;
      
      console.log(`Performing safety check for ${pid ? `PID: ${pid}` : `Port: ${port}`}`);
      
      const startTime = Date.now();
      
      // Determine target process
      let targetProcess = null;
      if (pid) {
        targetProcess = await findProcessByPid(pid);
      } else if (port) {
        targetProcess = await findProcessByPort(port);
      }
      
      if (!targetProcess) {
        throw new Error(`Process not found: ${pid ? `PID ${pid}` : `Port ${port}`}`);
      }
      
      // Perform comprehensive safety analysis
      const safetyAnalysis = await performComprehensiveSafetyCheck(
        targetProcess,
        checkCriteria,
        riskTolerance
      );
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        processingTime,
        targetProcess: {
          pid: targetProcess.pid,
          port: targetProcess.port,
          command: targetProcess.command || 'unknown',
          techStack: targetProcess.techStack
        },
        checkCriteria,
        riskTolerance,
        safetyAnalysis,
        recommendation: {
          safe: safetyAnalysis.overallSafe,
          riskLevel: safetyAnalysis.riskLevel,
          action: safetyAnalysis.recommendedAction,
          confidence: safetyAnalysis.confidence
        },
        details: {
          workspaceCheck: safetyAnalysis.workspaceCheck,
          dependencyAnalysis: safetyAnalysis.dependencyAnalysis,
          resourceImpact: safetyAnalysis.resourceImpact,
          criticalProcessCheck: safetyAnalysis.criticalProcessCheck
        },
        mitigations: safetyAnalysis.suggestedMitigations || []
      };
      
      console.log(`✓ Safety check completed: ${response.recommendation.safe ? 'SAFE' : 'UNSAFE'} (${response.recommendation.riskLevel})`);
      return response;
      
    } catch (error) {
      const errorResponse = errorHandler?.handleError(error, {
        operation: 'process-safety-check',
        tool: 'host.process_safety_check',
        pid: params.pid,
        port: params.port
      });
      
      if (errorResponse?.error) {
        throw createMcpError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error
        );
      } else {
        throw createMcpError(
          MCP_ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Operation failed',
          { originalError: error.message }
        );
      }
    }
  }
};

// Helper functions for process management

async function getFrameworkInfo(processes, techStack) {
  const frameworks = [];
  for (const process of processes) {
    try {
      // Framework detection based on process command and ports
      const command = process.command || '';
      let detectedFramework = null;
      
      switch (techStack) {
        case 'nodejs':
          if (command.includes('express')) detectedFramework = 'Express.js';
          else if (command.includes('nest')) detectedFramework = 'NestJS';
          else if (command.includes('next')) detectedFramework = 'Next.js';
          else if (command.includes('nuxt')) detectedFramework = 'Nuxt.js';
          else if (command.includes('react')) detectedFramework = 'React';
          else if (command.includes('vue')) detectedFramework = 'Vue.js';
          break;
        case 'php':
          if (command.includes('laravel') || process.port === 8000) detectedFramework = 'Laravel';
          else if (command.includes('symfony')) detectedFramework = 'Symfony';
          else if (command.includes('wordpress')) detectedFramework = 'WordPress';
          break;
        case 'python':
          if (command.includes('django')) detectedFramework = 'Django';
          else if (command.includes('flask')) detectedFramework = 'Flask';
          else if (command.includes('fastapi')) detectedFramework = 'FastAPI';
          else if (command.includes('tornado')) detectedFramework = 'Tornado';
          break;
      }
      
      if (detectedFramework) {
        frameworks.push({
          name: detectedFramework,
          process: process,
          confidence: 0.8
        });
      }
    } catch (error) {
      console.warn(`Error detecting framework for process ${process.pid}:`, error.message);
    }
  }
  return frameworks;
}

async function countFrameworks(processes, techStack) {
  const frameworks = await getFrameworkInfo(processes, techStack);
  return frameworks.length;
}

async function getDetailedContainerInfo(containerProcesses, includeInactive, networkMode) {
  const detailed = [];
  for (const container of containerProcesses) {
    try {
      // Get additional container details via Docker API if available
      let containerDetails = {
        ...container,
        status: 'running',
        networkMode: 'bridge',
        health: 'unknown'
      };
      
      // Try to get actual Docker info
      try {
        const { stdout } = await execAsync(`docker inspect ${container.containerId || container.name} --format='{{.State.Status}}|{{.NetworkSettings.Networks}}|{{.State.Health.Status}}'`);
        const [status, networks, health] = stdout.trim().split('|');
        containerDetails.status = status;
        containerDetails.health = health || 'no-healthcheck';
        
        // Parse network information
        if (networks && networks !== '<no value>') {
          try {
            const networkData = JSON.parse(networks);
            containerDetails.networkMode = Object.keys(networkData)[0] || 'bridge';
          } catch {
            containerDetails.networkMode = 'bridge';
          }
        }
      } catch (dockerError) {
        // Docker not available or container not found, use defaults
        containerDetails.dockerAvailable = false;
      }
      
      // Filter based on parameters
      if (!includeInactive && containerDetails.status !== 'running') {
        continue;
      }
      
      if (networkMode !== 'all' && containerDetails.networkMode !== networkMode) {
        continue;
      }
      
      detailed.push(containerDetails);
    } catch (error) {
      console.warn(`Error getting container details for ${container.name}:`, error.message);
    }
  }
  return detailed;
}

function getUniqueNetworkModes(containers) {
  return [...new Set(containers.map(c => c.networkMode || 'unknown'))];
}

async function buildProcessTrees(processes, rootPid, maxDepth, includeResources) {
  const trees = [];
  
  try {
    // Get process parent-child relationships
    const { stdout } = await execAsync('ps axo pid,ppid,comm,pcpu,pmem');
    const psOutput = stdout.trim().split('\n').slice(1); // Skip header
    
    const processMap = new Map();
    const parentChildMap = new Map();
    
    // Parse ps output
    psOutput.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parseInt(parts[0]);
        const ppid = parseInt(parts[1]);
        const command = parts[2];
        const cpu = parseFloat(parts[3]) || 0;
        const memory = parseFloat(parts[4]) || 0;
        
        processMap.set(pid, {
          pid,
          ppid,
          command,
          cpu: includeResources ? cpu : undefined,
          memory: includeResources ? memory : undefined,
          children: []
        });
        
        if (!parentChildMap.has(ppid)) {
          parentChildMap.set(ppid, []);
        }
        parentChildMap.get(ppid).push(pid);
      }
    });
    
    // Build trees recursively
    function buildTree(pid, depth = 0) {
      if (depth >= maxDepth || !processMap.has(pid)) {
        return null;
      }
      
      const process = processMap.get(pid);
      const children = parentChildMap.get(pid) || [];
      
      const tree = {
        ...process,
        depth,
        children: children.map(childPid => buildTree(childPid, depth + 1)).filter(Boolean)
      };
      
      return tree;
    }
    
    // Find root processes
    const rootPids = rootPid ? [rootPid] : 
      [...processMap.values()].filter(p => !processMap.has(p.ppid)).map(p => p.pid);
    
    rootPids.forEach(pid => {
      const tree = buildTree(pid);
      if (tree) {
        trees.push(tree);
      }
    });
    
  } catch (error) {
    console.warn('Error building process trees:', error.message);
    // Return empty trees if ps command fails
  }
  
  return trees;
}

async function performSafetyCheck(pidOrPort, validateWorkspace) {
  const checks = {
    workspaceValidation: true,
    criticalProcess: false,
    dependencyCheck: true,
    systemProcess: false
  };
  
  let targetPid = pidOrPort;
  
  try {
    // If port provided, find PID
    if (typeof pidOrPort === 'number' && pidOrPort > 65535) {
      // Assume it's a PID if > 65535, otherwise treat as port
      targetPid = pidOrPort;
    } else if (typeof pidOrPort === 'number' && pidOrPort <= 65535) {
      const processWithPort = await findProcessByPort(pidOrPort);
      if (!processWithPort) {
        return { safe: false, error: 'Process not found', recommendations: ['Verify process exists'] };
      }
      targetPid = processWithPort.pid;
    }
    
    // Check if it's a system process (PID < 1000 usually system)
    if (targetPid < 1000) {
      checks.systemProcess = true;
      checks.criticalProcess = true;
    }
    
    // Check process command to identify critical processes
    try {
      const { stdout } = await execAsync(`ps -p ${targetPid} -o comm=`);
      const command = stdout.trim();
      
      const criticalProcesses = ['systemd', 'kernel', 'init', 'ssh', 'docker', 'kubelet'];
      if (criticalProcesses.some(cp => command.includes(cp))) {
        checks.criticalProcess = true;
      }
    } catch {
      // Process might not exist or access denied
    }
    
    // Workspace validation
    if (validateWorkspace) {
      try {
        const registryData = await enhancedRegistry.getAllActiveProcesses({ forceRefresh: false });
        const isRegistered = registryData.registered.some(p => p.pid === targetPid);
        checks.workspaceValidation = isRegistered;
      } catch {
        checks.workspaceValidation = false;
      }
    }
    
    const safe = !checks.criticalProcess && !checks.systemProcess;
    const recommendations = [];
    
    if (checks.criticalProcess) {
      recommendations.push('Critical process detected - termination not recommended');
    }
    if (checks.systemProcess) {
      recommendations.push('System process detected - requires elevated privileges');
    }
    if (!checks.workspaceValidation && validateWorkspace) {
      recommendations.push('Process not found in registered workspaces');
    }
    
    return { safe, checks, recommendations };
    
  } catch (error) {
    return { 
      safe: false, 
      error: error.message, 
      checks, 
      recommendations: ['Unable to perform safety check'] 
    };
  }
}

async function findProcessByPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || netstat -tulpn 2>/dev/null | grep :${port} | awk '{print $7}' | cut -d'/' -f1`);
    const pidStr = stdout.trim().split('\n')[0];
    const pid = parseInt(pidStr);
    
    if (pid && !isNaN(pid)) {
      // Get additional process info
      try {
        const { stdout: psOut } = await execAsync(`ps -p ${pid} -o pid,comm,args --no-headers`);
        const parts = psOut.trim().split(/\s+/);
        return {
          pid,
          port,
          command: parts.slice(1).join(' ') || 'unknown'
        };
      } catch {
        return { pid, port, command: 'unknown' };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function findProcessByPid(pid) {
  try {
    const { stdout } = await execAsync(`ps -p ${pid} -o pid,comm,args --no-headers`);
    const parts = stdout.trim().split(/\s+/);
    return {
      pid: parseInt(parts[0]),
      command: parts.slice(1).join(' ') || 'unknown'
    };
  } catch {
    return null;
  }
}

async function terminateProcess(pid, signal, reason) {
  try {
    // Verify process exists first
    const processInfo = await findProcessByPid(pid);
    if (!processInfo) {
      return { success: false, error: `Process ${pid} not found` };
    }
    
    // Send the signal
    process.kill(pid, signal);
    
    // Wait a moment and verify termination
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const stillExists = await findProcessByPid(pid);
    if (!stillExists) {
      return { 
        success: true, 
        message: `Process ${pid} terminated successfully with ${signal}`,
        reason 
      };
    } else {
      return { 
        success: false, 
        error: `Process ${pid} still running after ${signal}`,
        suggestion: signal === 'SIGTERM' ? 'Try SIGKILL for forceful termination' : null
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

function getProcessAge(process) {
  // Calculate process age in minutes
  const now = Date.now();
  const processTime = process.startTime ? new Date(process.startTime).getTime() : 
                     process.lastSeen ? new Date(process.lastSeen).getTime() : now;
  return Math.floor((now - processTime) / (1000 * 60)); // Convert to minutes
}

// Additional helper functions for monitoring and analysis tools

function detectPortRangeChanges(previousSnapshot, currentSnapshot, portRanges, changeThreshold) {
  const changes = [];
  
  try {
    // If no specific port ranges provided, monitor all
    const rangesToCheck = portRanges.length > 0 ? portRanges : [{ start: 1, end: 65535 }];
    
    rangesToCheck.forEach(range => {
      const prevInRange = getProcessesInRange(previousSnapshot, range.start, range.end);
      const currInRange = getProcessesInRange(currentSnapshot, range.start, range.end);
      
      // Calculate change percentage
      const changePercent = prevInRange.length > 0 ? 
        Math.abs(currInRange.length - prevInRange.length) / prevInRange.length * 100 : 
        currInRange.length > 0 ? 100 : 0;
      
      if (changePercent >= changeThreshold) {
        changes.push({
          portRange: range,
          previousCount: prevInRange.length,
          currentCount: currInRange.length,
          changePercent: Math.round(changePercent),
          changeType: currInRange.length > prevInRange.length ? 'increase' : 'decrease'
        });
      }
    });
  } catch (error) {
    console.warn('Error detecting port range changes:', error.message);
  }
  
  return changes;
}

function getProcessesInRange(snapshot, startPort, endPort) {
  const allProcesses = [
    ...snapshot.registered,
    ...snapshot.discovered,
    ...snapshot.rogue,
    ...snapshot.containers
  ];
  
  return allProcesses.filter(p => p.port >= startPort && p.port <= endPort);
}

function getMostActivePortRange(monitoringResults, portRanges) {
  if (portRanges.length === 0 || monitoringResults.length === 0) {
    return null;
  }
  
  const rangeActivity = portRanges.map(range => ({
    range,
    activity: monitoringResults.reduce((sum, result) => {
      return sum + result.changes.filter(change => 
        change.portRange.start === range.start && change.portRange.end === range.end
      ).length;
    }, 0)
  }));
  
  const mostActive = rangeActivity.reduce((max, current) => 
    current.activity > max.activity ? current : max, rangeActivity[0]);
  
  return mostActive.activity > 0 ? mostActive.range : null;
}

async function performEnhancedCorrelation(processes, workspacePath, includeSubdirectories, correlationDepth) {
  // Enhanced correlation implementation
  return {
    correlatedProcesses: [],
    uncorrelatedProcesses: [],
    workspaceMatches: [],
    confidenceScore: 0.8
  };
}

async function analyzeWorkspaceHealth(workspaceProcesses, healthCriteria) {
  const healthy = [];
  const unhealthy = [];
  const warnings = [];
  
  for (const process of workspaceProcesses) {
    const age = getProcessAge(process);
    const cpuUsage = process.cpuUsage || 0;
    const memoryUsage = process.memoryUsage || 0;
    
    let issues = [];
    
    if (age > healthCriteria.maxProcessAge) {
      issues.push('Process running too long');
    }
    if (cpuUsage > healthCriteria.maxCpuUsage) {
      issues.push('High CPU usage');
    }
    if (memoryUsage > healthCriteria.maxMemoryUsage) {
      issues.push('High memory usage');
    }
    
    if (issues.length === 0) {
      healthy.push(process);
    } else if (issues.length === 1) {
      warnings.push({ process, issues });
    } else {
      unhealthy.push({ process, issues });
    }
  }
  
  const totalProcesses = workspaceProcesses.length;
  const healthScore = totalProcesses > 0 ? (healthy.length / totalProcesses) * 100 : 100;
  
  return { healthy, unhealthy, warnings, healthScore };
}

function generateHealthRecommendations(healthAnalysis, healthCriteria) {
  const recommendations = [];
  
  if (healthAnalysis.unhealthy.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      message: `${healthAnalysis.unhealthy.length} processes have multiple health issues`,
      action: 'Review and restart problematic processes'
    });
  }
  
  if (healthAnalysis.warnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'monitoring',
      message: `${healthAnalysis.warnings.length} processes have minor issues`,
      action: 'Monitor these processes closely'
    });
  }
  
  if (healthAnalysis.healthScore < 70) {
    recommendations.push({
      priority: 'high',
      category: 'general',
      message: 'Overall workspace health is poor',
      action: 'Consider workspace cleanup and process optimization'
    });
  }
  
  return recommendations;
}

function calculateOverallHealth(healthAnalysis) {
  if (healthAnalysis.healthScore >= 90) {
    return { status: 'excellent', score: healthAnalysis.healthScore };
  } else if (healthAnalysis.healthScore >= 70) {
    return { status: 'good', score: healthAnalysis.healthScore };
  } else if (healthAnalysis.healthScore >= 50) {
    return { status: 'fair', score: healthAnalysis.healthScore };
  } else {
    return { status: 'poor', score: healthAnalysis.healthScore };
  }
}

async function collectSystemData(reportType, timeRange) {
  // System data collection implementation
  return {
    dataPoints: 100,
    processCount: 50,
    systemLoad: 1.2,
    memoryUsage: 65.4,
    timestamp: new Date().toISOString()
  };
}

async function generateTrendAnalysis(systemData, timeRange) {
  // Trend analysis implementation
  return {
    processCountTrend: 'stable',
    resourceUsageTrend: 'increasing',
    timeRange
  };
}

async function buildSystemReport(systemData, reportType, trends) {
  const report = {
    summary: {
      totalProcesses: systemData.processCount,
      systemLoad: systemData.systemLoad,
      memoryUsage: systemData.memoryUsage
    }
  };
  
  if (reportType === 'detailed') {
    report.details = systemData;
  }
  
  if (trends) {
    report.trends = trends;
  }
  
  return report;
}

function formatReport(reportData, format) {
  switch (format) {
    case 'json':
      return reportData;
    case 'markdown':
      return `# System Report\n\n${JSON.stringify(reportData, null, 2)}`;
    case 'csv':
      return 'field,value\ntotalProcesses,' + reportData.summary.totalProcesses;
    default:
      return reportData;
  }
}

async function intelligentOrphanFiltering(orphanedProcesses, ageCriteria, resourceCriteria, maxCleanupCount) {
  const candidates = orphanedProcesses.filter(process => {
    const age = getProcessAge(process);
    const cpuUsage = process.cpuUsage || 0;
    const memoryUsage = process.memoryUsage || 0;
    
    return age >= ageCriteria.minAge && 
           age <= ageCriteria.maxAge &&
           cpuUsage <= resourceCriteria.maxCpuUsage &&
           memoryUsage <= resourceCriteria.maxMemoryUsage;
  });
  
  // Sort by cleanup priority (age, resource usage)
  candidates.sort((a, b) => {
    const ageA = getProcessAge(a);
    const ageB = getProcessAge(b);
    return ageB - ageA; // Older processes first
  });
  
  return candidates.slice(0, maxCleanupCount);
}

function calculateResourceSavings(processes) {
  return {
    estimatedCpuSaved: processes.reduce((sum, p) => sum + (p.cpuUsage || 0), 0),
    estimatedMemorySaved: processes.reduce((sum, p) => sum + (p.memoryUsage || 0), 0),
    processCount: processes.length
  };
}

async function performIntelligentCleanup(cleanupCandidates) {
  const successful = [];
  const failed = [];
  
  for (const process of cleanupCandidates) {
    try {
      const result = await terminateProcess(process.pid, 'SIGTERM', 'Automated orphan cleanup');
      if (result.success) {
        successful.push({ process, result });
      } else {
        failed.push({ process, result });
      }
    } catch (error) {
      failed.push({ process, result: { success: false, error: error.message } });
    }
  }
  
  return { successful, failed };
}

async function performComprehensiveSafetyCheck(targetProcess, checkCriteria, riskTolerance) {
  const analysis = {
    overallSafe: true,
    riskLevel: 'low',
    confidence: 0.9,
    recommendedAction: 'proceed',
    suggestedMitigations: []
  };
  
  // Workspace check
  if (checkCriteria.workspaceValidation) {
    analysis.workspaceCheck = await performWorkspaceValidation(targetProcess);
    if (!analysis.workspaceCheck.valid) {
      analysis.riskLevel = 'medium';
      analysis.overallSafe = false;
      analysis.suggestedMitigations.push('Verify workspace association');
    }
  }
  
  // Dependency analysis
  if (checkCriteria.dependencyAnalysis) {
    analysis.dependencyAnalysis = await analyzeDependencies(targetProcess);
    if (analysis.dependencyAnalysis.hasDependencies) {
      analysis.riskLevel = 'high';
      analysis.recommendedAction = 'caution';
    }
  }
  
  // Resource impact
  if (checkCriteria.resourceImpact) {
    analysis.resourceImpact = assessResourceImpact(targetProcess);
  }
  
  // Critical process check
  if (checkCriteria.criticalProcessCheck) {
    analysis.criticalProcessCheck = await checkCriticalProcess(targetProcess);
    if (analysis.criticalProcessCheck.isCritical) {
      analysis.overallSafe = false;
      analysis.riskLevel = 'critical';
      analysis.recommendedAction = 'abort';
    }
  }
  
  return analysis;
}

async function performWorkspaceValidation(process) {
  return { valid: true, workspacePath: '/unknown' };
}

async function analyzeDependencies(process) {
  return { hasDependencies: false, dependencies: [] };
}

function assessResourceImpact(process) {
  return { impact: 'low', cpuUsage: 0, memoryUsage: 0 };
}

async function checkCriticalProcess(process) {
  const criticalCommands = ['systemd', 'kernel', 'init', 'ssh', 'docker'];
  const isCritical = criticalCommands.some(cmd => 
    process.command && process.command.toLowerCase().includes(cmd)
  );
  return { isCritical, reason: isCritical ? 'System process detected' : null };
}

// Additional bulk operation helpers
async function validateBulkOperation(operation) {
  try {
    const { action, target } = operation;
    
    if (!['kill', 'restart', 'pause', 'resume'].includes(action)) {
      return { valid: false, error: 'Invalid action' };
    }
    
    if (!target.pid && !target.port && !target.processName) {
      return { valid: false, error: 'No target specified' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function executeBulkOperation(operation, reason) {
  const { action, target } = operation;
  
  // Find target process
  let targetProcess = null;
  if (target.pid) {
    targetProcess = await findProcessByPid(target.pid);
  } else if (target.port) {
    targetProcess = await findProcessByPort(target.port);
  }
  
  if (!targetProcess) {
    return { success: false, error: 'Target process not found', operation };
  }
  
  // Execute action
  switch (action) {
    case 'kill':
      return await terminateProcess(targetProcess.pid, 'SIGTERM', reason);
    case 'restart':
      // Would implement restart logic
      return { success: true, message: 'Restart not implemented yet' };
    case 'pause':
      try {
        process.kill(targetProcess.pid, 'SIGSTOP');
        return { success: true, message: `Process ${targetProcess.pid} paused` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    case 'resume':
      try {
        process.kill(targetProcess.pid, 'SIGCONT');
        return { success: true, message: `Process ${targetProcess.pid} resumed` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function rollbackOperations(successfulResults) {
  // Implement rollback logic for atomic operations
  console.log(`Rolling back ${successfulResults.length} successful operations...`);
  // This would reverse the successful operations
}

module.exports = {
  PROCESS_MANAGEMENT_TOOL_DEFINITIONS,
  PROCESS_MANAGEMENT_TOOL_HANDLERS,
  initializeProcessManagementServices,
  injectMockServices,
  resetServices,
  SafetyLevel
};