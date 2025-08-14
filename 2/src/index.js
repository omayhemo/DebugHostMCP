#!/usr/bin/env node

/**
 * MCP Debug Host Server
 * HTTP server implementing Model Context Protocol (MCP) for debug host management
 */

const express = require('express');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

// Import local modules
const { errorHandler, notFoundHandler, formatMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');
const { sseManager } = require('./utils/sse');
const { getToolDefinitions, executeTool, validateToolParams } = require('./mcp-tools');
const { getLogStreamer } = require('./services/log-streamer');

// Import metrics infrastructure
const DockerManager = require('./docker-manager');
const MetricsCollector = require('./services/metrics-collector');
const MetricsStorage = require('./services/metrics-storage');
const MetricsStreamManager = require('./services/metrics-stream');
const initializeMetricsRoutes = require('./routes/metrics');
const projectControlsRoutes = require('./routes/project-controls');

const app = express();
const PORT = process.env.PORT || 2601;
const HOST = '127.0.0.1'; // Localhost only for security

// Initialize metrics infrastructure
let dockerManager = null;
let metricsCollector = null;
let metricsStorage = null;
let metricsStreamManager = null;

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

/**
 * MCP Protocol Endpoints
 */

// MCP Initialize - Return server capabilities
app.post('/mcp/initialize', (req, res) => {
  console.log('MCP Initialize request received');
  
  const response = {
    protocol: 'mcp',
    version: '1.0',
    capabilities: {
      tools: true,
      streaming: true
    },
    serverInfo: {
      name: 'MCP Debug Host',
      version: '1.0.0',
      description: 'Debug host management server implementing MCP protocol'
    }
  };

  res.json(response);
});

// MCP Tools List - Return available tools
app.post('/mcp/tools/list', (req, res) => {
  console.log('MCP Tools list request received');
  
  const tools = getToolDefinitions();
  const response = {
    tools
  };

  res.json(response);
});

// MCP Tool Call - Execute a tool
app.post('/mcp/tools/call', 
  body('name').notEmpty().withMessage('Tool name is required'),
  body('arguments').optional().isObject().withMessage('Arguments must be an object'),
  async (req, res, next) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(formatMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Validation failed: ' + errors.array().map(e => e.msg).join(', ')
        ));
      }

      const { name: toolName, arguments: toolArgs = {} } = req.body;
      
      console.log(`MCP Tool call: ${toolName} with args:`, toolArgs);

      // Validate tool parameters
      validateToolParams(toolName, toolArgs);

      // Execute the tool
      const result = await executeTool(toolName, toolArgs);

      // Return MCP-compliant success response
      const response = {
        result,
        error: null
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
);

// SSE Log Streaming Endpoint
app.get('/mcp/logs/:projectId/stream', async (req, res) => {
  const { projectId } = req.params;
  const { containerName, level, stream, search, tail, follow, includeHistory } = req.query;
  
  console.log(`SSE connection established for project: ${projectId}, container: ${containerName}`);

  try {
    // Initialize log streamer if not already initialized
    const logStreamer = getLogStreamer();
    if (!logStreamer.logCollector) {
      await logStreamer.initialize();
    }

    // Start streaming logs
    const streamInfo = await logStreamer.startStreaming(res, projectId, containerName, {
      level,
      stream,
      search,
      tail: tail ? parseInt(tail) : 100,
      follow: follow !== 'false',
      includeHistory: includeHistory !== 'false'
    });

    console.log(`Log streaming started: ${JSON.stringify(streamInfo)}`);

  } catch (error) {
    console.error(`Failed to start log streaming for ${projectId}:`, error);
    
    // Send error and close connection
    res.writeHead(500, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`event: error\ndata: ${JSON.stringify({
      error: error.message,
      projectId,
      containerName
    })}\n\n`);
    res.end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = sseManager.getStats();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    sse: stats,
    memory: process.memoryUsage()
  };
  
  // Add metrics system health if available
  if (metricsCollector && metricsStorage && metricsStreamManager) {
    healthData.metrics = {
      collector: metricsCollector.getStats(),
      storage: metricsStorage.getStorageStats(),
      streaming: metricsStreamManager.getStreamStats()
    };
  }
  
  res.json(healthData);
});

// Metrics API Routes will be registered after initialization

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const tools = getToolDefinitions();
  
  res.json({
    protocol: 'MCP (Model Context Protocol)',
    version: '1.0',
    endpoints: {
      'POST /mcp/initialize': 'Initialize MCP session and get server capabilities',
      'POST /mcp/tools/list': 'Get list of available tools',
      'POST /mcp/tools/call': 'Execute a tool with parameters',
      'GET /mcp/logs/:projectId/stream': 'Server-Sent Events stream for project logs',
      'GET /api/metrics/containers': 'Get list of containers with metrics',
      'GET /api/metrics/:containerId': 'Get latest metrics for a container',
      'GET /api/metrics/:containerId/history': 'Query historical metrics',
      'GET /api/metrics/:containerId/stream': 'SSE stream for real-time metrics',
      'GET /api/metrics/stats': 'Get metrics system statistics',
      'POST /api/projects/:id/start': 'Start a project container',
      'POST /api/projects/:id/stop': 'Stop a project container',
      'POST /api/projects/:id/restart': 'Restart a project container',
      'GET /api/projects/:id/health': 'Get health status of a project',
      'PUT /api/projects/:id/config': 'Update project configuration',
      'GET /api/projects/:id/config': 'Get project configuration',
      'POST /api/projects/batch': 'Execute batch operations on multiple projects',
      'POST /api/projects/:id/exec': 'Execute command in project container',
      'GET /api/ports/suggest': 'Suggest an available port',
      'GET /api/ports/:port/check': 'Check if a port is available',
      'GET /health': 'Health check and server status',
      'GET /api/docs': 'This API documentation'
    },
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      schema: tool.inputSchema
    }))
  });
});

// Error handling middleware will be added after all routes are registered

/**
 * Initialize metrics infrastructure
 */
async function initializeMetricsInfrastructure() {
  try {
    console.log('Initializing metrics infrastructure...');
    
    // Initialize Docker Manager with timeout
    const dockerInitTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Docker initialization timeout')), 10000);
    });
    
    dockerManager = new DockerManager();
    await Promise.race([
      dockerManager.initialize(),
      dockerInitTimeout
    ]);
    
    console.log('Docker Manager initialized successfully');
    
    // Initialize Metrics Storage
    metricsStorage = new MetricsStorage();
    await metricsStorage.initialize();
    
    console.log('Metrics Storage initialized successfully');
    
    // Initialize Metrics Collector
    metricsCollector = new MetricsCollector(dockerManager);
    
    // Initialize Metrics Stream Manager
    metricsStreamManager = new MetricsStreamManager(metricsCollector, metricsStorage);
    
    console.log('Metrics Collector and Stream Manager initialized successfully');
    
    // Store metrics when collected
    metricsCollector.on('metrics', (data) => {
      metricsStorage.storeMetrics(data.metrics).catch(error => {
        console.error('Error storing metrics:', error);
      });
    });
    
    // Register metrics API routes
    app.use('/api/metrics', initializeMetricsRoutes({
      metricsStorage,
      metricsStreamManager,
      metricsCollector
    }));
    
    console.log('Metrics API routes registered');
    
    // Set up app.locals for project controls
    const { ContainerLifecycle } = require('./services/container-lifecycle');
    const { ProjectRegistry } = require('./services/project-registry');
    const { HealthMonitor } = require('./services/health-monitor');
    const PortRegistry = require('./port-registry');
    
    const projectRegistry = new ProjectRegistry();
    await projectRegistry.initialize();  // Initialize the registry
    
    const containerLifecycle = new ContainerLifecycle(projectRegistry, dockerManager);
    const healthMonitor = new HealthMonitor();
    const portRegistry = new PortRegistry();
    
    app.locals.dockerManager = dockerManager;
    app.locals.projectRegistry = projectRegistry;
    app.locals.containerLifecycle = containerLifecycle;
    app.locals.healthMonitor = healthMonitor;
    app.locals.portRegistry = portRegistry;
    
    // Register project controls API routes
    app.use('/api', projectControlsRoutes);
    
    console.log('Project Controls API routes registered');
    
    // Error handling middleware (must be last, after all routes)
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Auto-start metrics collection with medium interval
    setTimeout(() => {
      if (metricsCollector && !metricsCollector.isRunning) {
        console.log('Auto-starting metrics collection...');
        try {
          metricsCollector.start({ intervals: ['fast', 'medium'] });
        } catch (error) {
          console.error('Error auto-starting metrics collection:', error);
        }
      }
    }, 5000); // Start after 5 seconds
    
    console.log('Metrics infrastructure initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize metrics infrastructure:', error);
    console.error('Server will continue without metrics functionality');
    // Continue without metrics - this is not a fatal error
    
    // Set services to null to indicate they're not available
    dockerManager = null;
    metricsStorage = null;
    metricsCollector = null;
    metricsStreamManager = null;
  }
}

/**
 * Server startup and shutdown handling
 */
let server = null;

async function startServer() {
  try {
    // Initialize metrics infrastructure first
    await initializeMetricsInfrastructure();
    
    return new Promise((resolve, reject) => {
      server = app.listen(PORT, HOST, (error) => {
        if (error) {
          console.error('Failed to start MCP server:', error);
          reject(error);
        } else {
          console.log(`\n🚀 MCP Debug Host Server started successfully!`);
          console.log(`📡 Server: http://${HOST}:${PORT}`);
          console.log(`📋 API Docs: http://${HOST}:${PORT}/api/docs`);
          console.log(`💗 Health Check: http://${HOST}:${PORT}/health`);
          console.log(`📊 SSE Connections: ${sseManager.getTotalConnections()}`);
          if (metricsCollector && metricsStorage && metricsStreamManager) {
            console.log(`📈 Metrics API: http://${HOST}:${PORT}/api/metrics`);
            console.log(`📊 Metrics Streaming: Available`);
          }
          console.log(`⚡ Node.js: ${process.version}`);
          console.log(`🔒 Binding: ${HOST}:${PORT} (localhost only)\n`);
          resolve(server);
        }
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use. Please stop the existing server first.`);
        } else {
          console.error('Server error:', error);
        }
        reject(error);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Shutdown metrics infrastructure
    if (metricsCollector) {
      metricsCollector.stop();
      console.log('✅ Metrics collector stopped');
    }
    
    if (metricsStreamManager) {
      metricsStreamManager.shutdown();
      console.log('✅ Metrics stream manager shutdown');
    }
    
    if (metricsStorage) {
      await metricsStorage.shutdown();
      console.log('✅ Metrics storage shutdown');
    }
    
    if (dockerManager) {
      await dockerManager.shutdown();
      console.log('✅ Docker manager shutdown');
    }
    
  } catch (error) {
    console.error('Error during metrics shutdown:', error);
  }
  
  if (server) {
    server.close((error) => {
      if (error) {
        console.error('Error closing server:', error);
      } else {
        console.log('✅ HTTP server closed');
      }
      
      // Shutdown SSE manager
      sseManager.shutdown();
      console.log('✅ SSE connections closed');
      
      console.log('✅ MCP Debug Host Server shutdown complete\n');
      process.exit(error ? 1 : 0);
    });
  } else {
    sseManager.shutdown();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  gracefulShutdown,
  PORT,
  HOST
};