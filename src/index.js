#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const ProcessManager = require('./process-manager');
const LogStore = require('./log-store');
const DashboardServer = require('./dashboard/server');
const { setupTools } = require('./mcp-tools');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.env.HOME, '.apm-debug-host', 'server.log') 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize components
const processManager = new ProcessManager(logger);
const logStore = new LogStore(logger);
const dashboardServer = new DashboardServer(processManager, logStore, logger);

// Create MCP server
const server = new Server(
  {
    name: 'apm-debug-host',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Setup MCP tools
setupTools(server, processManager, logStore, logger);

// Start dashboard
const dashboardPort = process.env.PORT || 8080;
dashboardServer.start(dashboardPort).then(() => {
  logger.info(`Dashboard started on port ${dashboardPort}`);
}).catch((error) => {
  logger.error('Failed to start dashboard:', error);
});

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down MCP Debug Host...');
  await processManager.stopAll();
  await dashboardServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await processManager.stopAll();
  await dashboardServer.stop();
  process.exit(0);
});

// Start MCP server
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  logger.info('MCP Debug Host Server started');
}).catch((error) => {
  logger.error('Failed to start MCP server:', error);
  process.exit(1);
});