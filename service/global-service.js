#!/usr/bin/env node

/**
 * Global Debug Host Service
 * Singleton service that manages all development servers system-wide
 */

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Import managers
const ProcessManager = require('./managers/process-manager');
const LogManager = require('./managers/log-manager');
const SessionManager = require('./managers/session-manager');

// Import API routes
const serverRoutes = require('./api/routes/servers');
const logRoutes = require('./api/routes/logs');
const sessionRoutes = require('./api/routes/sessions');
const systemRoutes = require('./api/routes/system');

// Configuration
const CONFIG = {
  apiPort: process.env.API_PORT || 8081,
  dashboardPort: process.env.DASHBOARD_PORT || 8080,
  healthPort: process.env.HEALTH_PORT || 8082,
  dataDir: process.env.DATA_DIR || path.join(process.env.HOME, '.apm-debug-host', 'data'),
  logDir: process.env.LOG_DIR || path.join(process.env.HOME, '.apm-debug-host', 'data', 'logs'),
  maxSessions: parseInt(process.env.MAX_SESSIONS) || 50,
  sessionTimeout: process.env.SESSION_TIMEOUT || '24h',
  corsOrigins: process.env.CORS_ORIGINS || '*'
};

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(CONFIG.logDir, 'service.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize managers
const processManager = new ProcessManager(logger, CONFIG);
const logManager = new LogManager(logger, CONFIG);
const sessionManager = new SessionManager(logger, CONFIG);

// Create Express app
const app = express();
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/api/v1/ws'
});

// WebSocket connection handling
const wsClients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const client = {
    id: clientId,
    ws,
    subscriptions: new Set(),
    authenticated: false,
    connectedAt: Date.now()
  };
  
  wsClients.set(clientId, client);
  logger.info(`WebSocket client connected: ${clientId}`);
  
  // Send initial connection success
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    timestamp: Date.now()
  }));
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(client, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });
  
  // Handle disconnect
  ws.on('close', () => {
    wsClients.delete(clientId);
    logger.info(`WebSocket client disconnected: ${clientId}`);
  });
  
  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Broadcast to all WebSocket clients
function broadcast(event) {
  const message = JSON.stringify(event);
  wsClients.forEach(client => {
    if (client.ws.readyState === 1) { // OPEN
      client.ws.send(message);
    }
  });
}

// Handle WebSocket messages
function handleWebSocketMessage(client, data) {
  switch (data.type) {
    case 'subscribe':
      if (data.channel) {
        client.subscriptions.add(data.channel);
        client.ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel
        }));
      }
      break;
      
    case 'unsubscribe':
      if (data.channel) {
        client.subscriptions.delete(data.channel);
        client.ws.send(JSON.stringify({
          type: 'unsubscribed',
          channel: data.channel
        }));
      }
      break;
      
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    default:
      logger.warn(`Unknown WebSocket message type: ${data.type}`);
  }
}

// Middleware
app.use(cors({
  origin: CONFIG.corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// API Routes
app.use('/api/v1/servers', serverRoutes(processManager, sessionManager, broadcast));
app.use('/api/v1/logs', logRoutes(logManager, sessionManager));
app.use('/api/v1/sessions', sessionRoutes(sessionManager));
app.use('/api/v1/system', systemRoutes(processManager, sessionManager, CONFIG));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    config: {
      apiPort: CONFIG.apiPort,
      dashboardPort: CONFIG.dashboardPort,
      maxSessions: CONFIG.maxSessions
    },
    stats: {
      activeSessions: sessionManager.getActiveSessions().length,
      totalSessions: sessionManager.getAllSessions().length,
      wsClients: wsClients.size
    }
  };
  res.json(health);
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: Date.now()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: Date.now()
  });
});

// Dashboard server (separate Express instance)
const dashboardApp = express();
const dashboardServer = createServer(dashboardApp);

dashboardApp.use(cors());
dashboardApp.use(express.static(path.join(__dirname, '..', 'src', 'dashboard', 'public')));

// Proxy API requests from dashboard to API server
dashboardApp.use('/api', (req, res) => {
  const apiUrl = `http://localhost:${CONFIG.apiPort}/api${req.path}`;
  // Simple proxy - in production use http-proxy-middleware
  res.redirect(307, apiUrl);
});

// Process event handlers
processManager.on('server-started', (session) => {
  broadcast({
    type: 'server-started',
    session,
    timestamp: Date.now()
  });
});

processManager.on('server-stopped', (session) => {
  broadcast({
    type: 'server-stopped',
    session,
    timestamp: Date.now()
  });
});

processManager.on('server-error', (session, error) => {
  broadcast({
    type: 'server-error',
    session,
    error: error.message,
    timestamp: Date.now()
  });
});

logManager.on('log-entry', (entry) => {
  broadcast({
    type: 'log-entry',
    entry,
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  // Close WebSocket connections
  wsClients.forEach(client => {
    client.ws.close(1000, 'Server shutting down');
  });
  
  // Stop all managed processes
  await processManager.stopAll();
  
  // Close servers
  server.close(() => {
    logger.info('API server closed');
  });
  
  dashboardServer.close(() => {
    logger.info('Dashboard server closed');
  });
  
  // Give time for cleanup
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Utility functions
function generateClientId() {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Start servers
server.listen(CONFIG.apiPort, () => {
  logger.info(`API server listening on port ${CONFIG.apiPort}`);
});

dashboardServer.listen(CONFIG.dashboardPort, () => {
  logger.info(`Dashboard server listening on port ${CONFIG.dashboardPort}`);
  logger.info(`Dashboard available at http://localhost:${CONFIG.dashboardPort}`);
});

// Health check server (minimal, separate)
const healthApp = express();
healthApp.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

healthApp.listen(CONFIG.healthPort, () => {
  logger.info(`Health check server listening on port ${CONFIG.healthPort}`);
});

// Export for testing
module.exports = { app, server, CONFIG };