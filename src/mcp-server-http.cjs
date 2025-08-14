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
const HOST = '127.0.0.1';

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
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    memory: process.memoryUsage()
  });
});

// Basic routes for dashboard
app.get('/api/servers', (req, res) => {
  res.json([]);
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: [] });
});

app.get('/api/metrics/containers', (req, res) => {
  res.json([]);
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`HTTP server running at http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
