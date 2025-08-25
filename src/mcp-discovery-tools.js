/**
 * MCP Multi-Tech Process Discovery Tools
 * 
 * Extension to existing MCP tools that adds multi-tech process discovery capabilities.
 * These tools will be integrated into the main mcp-tools.js for Story 3.5.
 */

const { createMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');
const { MultiTechProcessDiscoveryEngine, TechStack } = require('./services/multi-tech-process-discovery-engine');
const PortRegistry = require('./port-registry');

// Global discovery engine instance
let discoveryEngine = null;
let portRegistry = null;

/**
 * Initialize the multi-tech discovery engine
 */
async function initializeDiscoveryEngine() {
  if (!portRegistry) {
    portRegistry = new PortRegistry();
    await portRegistry.initialize();
  }
  
  if (!discoveryEngine) {
    discoveryEngine = new MultiTechProcessDiscoveryEngine({
      scanTimeout: 2000,
      performanceMonitoring: true,
      portRegistry: portRegistry
    });
    
    await discoveryEngine.initialize();
  }
}

/**
 * Enhanced MCP Tools for Multi-Tech Process Discovery
 * These complement the existing MCP tools with v2.1 capabilities
 */
const DISCOVERY_TOOLS = {
  
  // Core discovery tools
  'host.discover_processes': {
    description: 'Comprehensive process discovery across all technology stacks',
    inputSchema: {
      type: 'object',
      properties: {
        techStacks: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['nodejs', 'php', 'python', 'static', 'docker']
          },
          description: 'Specific tech stacks to scan (default: all)'
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
        },
        workspacePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional workspace paths for correlation'
        }
      }
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      const options = {
        techStacks: args.techStacks || Object.values(TechStack),
        includeCorrelation: args.includeCorrelation !== false,
        forceRefresh: args.forceRefresh || false,
        workspacePaths: args.workspacePaths || []
      };
      
      const results = await discoveryEngine.scanSystemProcesses(options);
      
      return {
        success: true,
        scanId: results.scanId,
        timestamp: results.timestamp,
        duration: results.duration,
        totalProcesses: results.totalProcesses,
        techStackResults: results.techStackResults,
        correlation: results.correlation,
        performance: results.performance
      };
    }
  },
  
  'host.scan_tech_stack': {
    description: 'Technology-specific process scanning with detailed framework detection',
    inputSchema: {
      type: 'object',
      properties: {
        techStack: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static', 'docker'],
          description: 'Technology stack to scan'
        },
        includeHealth: {
          type: 'boolean',
          description: 'Include health validation for found processes',
          default: false
        }
      },
      required: ['techStack']
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      const results = await discoveryEngine.scanSystemProcesses({
        techStacks: [args.techStack],
        includeCorrelation: true
      });
      
      const techStackResult = results.techStackResults[args.techStack];
      const processes = techStackResult?.processes || [];
      
      // Add health checks if requested
      if (args.includeHealth && processes.length > 0) {
        const detectorInfo = discoveryEngine.getDetectorInfo(args.techStack);
        const detector = discoveryEngine.detectors.get(args.techStack);
        
        if (detector) {
          for (const process of processes) {
            try {
              process.healthStatus = await detector.validateProcessHealth(process);
            } catch (error) {
              process.healthStatus = { status: 'unknown', error: error.message };
            }
          }
        }
      }
      
      return {
        success: true,
        techStack: args.techStack,
        processCount: processes.length,
        processes: processes,
        detectorInfo: discoveryEngine.getDetectorInfo(args.techStack)
      };
    }
  },
  
  'host.correlate_workspace': {
    description: 'Correlate discovered processes with workspace information',
    inputSchema: {
      type: 'object',
      properties: {
        workspacePath: {
          type: 'string',
          description: 'Workspace path to correlate with'
        },
        techStack: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static', 'docker'],
          description: 'Optional tech stack filter'
        }
      },
      required: ['workspacePath']
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      // Scan for processes
      const scanOptions = {
        workspacePaths: [args.workspacePath],
        includeCorrelation: true
      };
      
      if (args.techStack) {
        scanOptions.techStacks = [args.techStack];
      }
      
      const results = await discoveryEngine.scanSystemProcesses(scanOptions);
      
      // Filter processes that correlate with the workspace
      const correlatedProcesses = [];
      
      if (results.correlation) {
        // Check discovered processes
        for (const process of results.correlation.discoveredProcesses || []) {
          if (process.workspacePath && process.workspacePath.includes(args.workspacePath)) {
            correlatedProcesses.push(process);
          }
        }
        
        // Check registered processes
        for (const process of results.correlation.registeredProcesses || []) {
          if (process.workspacePath && process.workspacePath.includes(args.workspacePath)) {
            correlatedProcesses.push(process);
          }
        }
      }
      
      return {
        success: true,
        workspacePath: args.workspacePath,
        correlatedProcesses: correlatedProcesses.length,
        processes: correlatedProcesses,
        correlationTime: results.correlationTime
      };
    }
  },
  
  'host.cleanup_rogue': {
    description: 'Identify and optionally cleanup rogue processes',
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Only identify rogue processes without cleanup',
          default: true
        },
        techStack: {
          type: 'string',
          enum: ['nodejs', 'php', 'python', 'static', 'docker'],
          description: 'Optional tech stack filter'
        }
      }
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      const rogueProcesses = await discoveryEngine.detectRogueProcesses();
      
      // Filter by tech stack if specified
      let filteredRogues = rogueProcesses;
      if (args.techStack) {
        filteredRogues = rogueProcesses.filter(p => p.techStack === args.techStack);
      }
      
      const result = {
        success: true,
        dryRun: args.dryRun !== false,
        totalRogueProcesses: filteredRogues.length,
        rogueProcesses: filteredRogues.map(p => ({
          pid: p.pid,
          port: p.port,
          techStack: p.techStack,
          framework: p.framework,
          workspacePath: p.workspacePath,
          rogueReason: p.rogueReason,
          confidence: p.confidence
        }))
      };
      
      // TODO: Implement actual cleanup logic for non-dry-run mode
      // This would be part of Story 3.6 (Agent Safety Framework)
      if (!args.dryRun) {
        result.warning = 'Process cleanup not yet implemented - safety framework required';
      }
      
      return result;
    }
  },
  
  'host.monitor_port_ranges': {
    description: 'Monitor port ranges for technology-specific development servers',
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Monitoring duration in seconds',
          default: 30
        },
        interval: {
          type: 'number',
          description: 'Check interval in seconds',
          default: 5
        }
      }
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      const duration = args.duration || 30;
      const interval = args.interval || 5;
      const maxChecks = Math.floor(duration / interval);
      
      const monitoring = {
        startTime: new Date().toISOString(),
        duration: duration,
        interval: interval,
        checks: []
      };
      
      for (let i = 0; i < maxChecks; i++) {
        const checkStart = Date.now();
        
        try {
          const results = await discoveryEngine.scanSystemProcesses({
            includeCorrelation: false
          });
          
          const checkResult = {
            timestamp: new Date().toISOString(),
            scanDuration: Date.now() - checkStart,
            totalProcesses: results.totalProcesses,
            techStackBreakdown: {}
          };
          
          // Build tech stack breakdown
          for (const [techStack, result] of Object.entries(results.techStackResults)) {
            checkResult.techStackBreakdown[techStack] = {
              count: result.processes?.length || 0,
              success: result.success
            };
          }
          
          monitoring.checks.push(checkResult);
          
        } catch (error) {
          monitoring.checks.push({
            timestamp: new Date().toISOString(),
            error: error.message
          });
        }
        
        // Wait for next interval (except on last iteration)
        if (i < maxChecks - 1) {
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
      }
      
      monitoring.endTime = new Date().toISOString();
      
      // Calculate summary statistics
      const successfulChecks = monitoring.checks.filter(c => !c.error);
      monitoring.summary = {
        totalChecks: monitoring.checks.length,
        successfulChecks: successfulChecks.length,
        averageScanTime: successfulChecks.length > 0 ? 
          successfulChecks.reduce((sum, c) => sum + c.scanDuration, 0) / successfulChecks.length : 0,
        averageProcessCount: successfulChecks.length > 0 ?
          successfulChecks.reduce((sum, c) => sum + c.totalProcesses, 0) / successfulChecks.length : 0
      };
      
      return {
        success: true,
        monitoring
      };
    }
  },
  
  'host.system_process_report': {
    description: 'Generate comprehensive system process analysis report',
    inputSchema: {
      type: 'object',
      properties: {
        includePerformance: {
          type: 'boolean',
          description: 'Include performance metrics in report',
          default: true
        },
        includeHealth: {
          type: 'boolean', 
          description: 'Include health status for all processes',
          default: false
        }
      }
    },
    handler: async (args) => {
      await initializeDiscoveryEngine();
      
      const reportStart = Date.now();
      
      // Perform comprehensive scan
      const scanResults = await discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });
      
      // Get engine status and statistics
      const engineStatus = discoveryEngine.getStatus();
      const performanceMetrics = args.includePerformance ? 
        discoveryEngine.performanceMonitor.getCurrentMetrics() : null;
      const healthStatus = args.includePerformance ?
        discoveryEngine.performanceMonitor.getHealthStatus() : null;
      
      // Build comprehensive report
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          reportDuration: Date.now() - reportStart,
          version: '2.1.0'
        },
        summary: {
          totalProcesses: scanResults.totalProcesses,
          scanDuration: scanResults.duration,
          techStacksScanned: Object.keys(scanResults.techStackResults).length,
          correlationEnabled: scanResults.correlation !== null
        },
        techStacks: {},
        correlation: scanResults.correlation,
        engine: {
          status: engineStatus,
          detectors: {}
        }
      };
      
      // Add tech stack details
      for (const [techStack, result] of Object.entries(scanResults.techStackResults)) {
        report.techStacks[techStack] = {
          processCount: result.processes?.length || 0,
          success: result.success,
          detectorInfo: discoveryEngine.getDetectorInfo(techStack)
        };
        
        if (result.processes && result.processes.length > 0) {
          report.techStacks[techStack].sampleProcesses = result.processes.slice(0, 3).map(p => ({
            pid: p.pid,
            port: p.port,
            framework: p.framework,
            workspacePath: p.workspacePath,
            correlationStatus: p.correlationStatus
          }));
        }
      }
      
      // Add detector details
      for (const techStack of engineStatus.availableDetectors) {
        try {
          report.engine.detectors[techStack] = discoveryEngine.getDetectorInfo(techStack);
        } catch (error) {
          report.engine.detectors[techStack] = { error: error.message };
        }
      }
      
      // Add performance metrics if requested
      if (args.includePerformance && performanceMetrics) {
        report.performance = {
          metrics: performanceMetrics,
          health: healthStatus,
          statistics: discoveryEngine.performanceMonitor.getStatistics()
        };
      }
      
      // Add registry information
      if (portRegistry) {
        report.portRegistry = {
          allocations: Object.keys(portRegistry.getAllocations()).length,
          statistics: portRegistry.getStats()
        };
      }
      
      return {
        success: true,
        report
      };
    }
  }
};

/**
 * Get all discovery tool definitions
 */
function getDiscoveryToolDefinitions() {
  return Object.keys(DISCOVERY_TOOLS).map(name => ({
    name,
    description: DISCOVERY_TOOLS[name].description,
    inputSchema: DISCOVERY_TOOLS[name].inputSchema
  }));
}

/**
 * Execute a discovery tool
 */
async function executeDiscoveryTool(toolName, args) {
  const tool = DISCOVERY_TOOLS[toolName];
  if (!tool) {
    throw createMcpError(
      MCP_ERROR_CODES.METHOD_NOT_FOUND,
      `Tool not found: ${toolName}`
    );
  }
  
  try {
    return await tool.handler(args);
  } catch (error) {
    console.error(`Discovery tool ${toolName} failed:`, error);
    throw createMcpError(
      MCP_ERROR_CODES.INTERNAL_ERROR,
      `Tool execution failed: ${error.message}`,
      error
    );
  }
}

/**
 * Shutdown discovery services
 */
async function shutdownDiscoveryServices() {
  if (discoveryEngine) {
    await discoveryEngine.shutdown();
    discoveryEngine = null;
  }
}

module.exports = {
  DISCOVERY_TOOLS,
  getDiscoveryToolDefinitions,
  executeDiscoveryTool,
  shutdownDiscoveryServices,
  initializeDiscoveryEngine
};