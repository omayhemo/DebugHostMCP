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

const app = express();
const PORT = process.env.PORT || 2601;
const HOST = '127.0.0.1'; // Localhost only for security

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
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    sse: stats,
    memory: process.memoryUsage()
  });
});

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

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Server startup and shutdown handling
 */
let server = null;

function startServer() {
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
}

function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
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