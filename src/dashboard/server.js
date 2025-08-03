/**
 * Dashboard Server for MCP Debug Host
 * Provides web interface and WebSocket communication for real-time monitoring
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

class DashboardServer {
  constructor(processManager, logStore, logger) {
    this.processManager = processManager;
    this.logStore = logStore;
    this.logger = logger;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Map(); // Enhanced client tracking
    this.messageQueue = new Map(); // Message queuing for offline clients
    this.compressionEnabled = true;
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionTimeout = 10000; // 10 seconds
    this.maxReconnectAttempts = 10;
    this.authTokens = new Set(); // Simple token-based auth for development - use secure storage in production
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupProcessEvents();
  }
  
  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info('HTTP Request:', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Enhanced CORS middleware with security considerations
    this.app.use((req, res, next) => {
      // Only allow localhost origins for development
      const allowedOrigins = ['http://localhost:8080', 'http://127.0.0.1:8080'];
      const origin = req.headers.origin;
      
      if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }
      
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static file serving with production-grade caching
    const publicPath = path.join(__dirname, 'public');
    this.app.use(express.static(publicPath, {
      // Enable production caching
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0',
      etag: true,
      lastModified: true,
      // Security headers
      setHeaders: (res, path, stat) => {
        // Cache static assets more aggressively
        if (path.endsWith('.css') || path.endsWith('.js')) {
          res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        }
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
    }));
    
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      this.logger.error('Express error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    });
  }
  
  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
    
    // Get all sessions
    this.app.get('/api/sessions', (req, res) => {
      try {
        const sessions = this.processManager.getAllSessions();
        res.json({
          success: true,
          sessions,
          totalSessions: sessions.length
        });
      } catch (error) {
        this.logger.error('Error getting sessions:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get logs for a specific session
    this.app.get('/api/sessions/:id/logs', async (req, res) => {
      try {
        const { id } = req.params;
        const { tail = 100, filter } = req.query;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Session ID is required'
          });
        }

        const logs = this.processManager.getLogs(id, {
          tail: parseInt(tail) || 100,
          filter
        });
        
        res.json({
          success: true,
          sessionId: id,
          logs,
          totalLogs: logs.length
        });
      } catch (error) {
        this.logger.error('Error getting logs:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Stop a server session
    this.app.post('/api/sessions/:id/stop', (req, res) => {
      try {
        const { id } = req.params;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Session ID is required'
          });
        }

        const result = this.processManager.stopServer(id);
        
        res.json({
          success: true,
          ...result,
          sessionId: id
        });
      } catch (error) {
        this.logger.error('Error stopping session:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: error.message
        });
      }
    });

    // Start a new server session
    this.app.post('/api/sessions', async (req, res) => {
      try {
        const { command, cwd, env, port, sessionName } = req.body;
        
        if (!cwd) {
          return res.status(400).json({
            success: false,
            error: 'Working directory (cwd) is required'
          });
        }

        const result = await this.processManager.startServer({
          command,
          cwd,
          env,
          port,
          sessionName
        });
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        this.logger.error('Error starting session:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get session details
    this.app.get('/api/sessions/:id', (req, res) => {
      try {
        const { id } = req.params;
        const sessions = this.processManager.getAllSessions();
        const session = sessions.find(s => s.id === id);
        
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found'
          });
        }

        res.json({
          success: true,
          session
        });
      } catch (error) {
        this.logger.error('Error getting session details:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Export session logs
    this.app.get('/api/sessions/:id/export', async (req, res) => {
      try {
        const { id } = req.params;
        const { format = 'json' } = req.query;
        
        const exportData = await this.logStore.exportLogs(id, format);
        
        const filename = `logs-${id}-${new Date().toISOString().split('T')[0]}.${format}`;
        const contentType = format === 'json' ? 'application/json' : 'text/plain';
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.send(exportData);
      } catch (error) {
        this.logger.error('Error exporting logs:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get storage statistics
    this.app.get('/api/storage/stats', async (req, res) => {
      try {
        const stats = await this.logStore.getStorageStats();
        res.json({
          success: true,
          ...stats
        });
      } catch (error) {
        this.logger.error('Error getting storage stats:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Hook notification endpoint (for installer integration)
    this.app.post('/api/hook/notify', (req, res) => {
      try {
        const { type, command, timestamp } = req.body;
        
        this.logger.info('Hook notification received:', {
          type,
          command,
          timestamp
        });
        
        // You could add logic here to automatically start servers based on hooks
        
        res.json({
          success: true,
          message: 'Notification received'
        });
      } catch (error) {
        this.logger.error('Error handling hook notification:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Enhanced default route with caching and compression
    this.app.get('/', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // API status endpoint for monitoring
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: this.wss ? this.wss.clients.size : 0,
        activeSessions: this.processManager.getAllSessions().length,
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
        path: req.originalUrl
      });
    });
  }
  
  /**
   * Setup enhanced WebSocket server for robust real-time updates
   */
  setupWebSocket() {
    if (!this.server) {
      this.logger.error('HTTP server not initialized - cannot setup WebSocket');
      return;
    }

    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws',
      perMessageDeflate: this.compressionEnabled ? {
        zlibDeflateOptions: {
          level: zlib.constants.Z_BEST_SPEED,
          memLevel: 8
        },
        threshold: 1024,
        concurrencyLimit: 10,
        clientMaxWindowBits: 15,
        serverMaxWindowBits: 15
      } : false
    });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Extract auth token from header or query param (sanitized)
      const authToken = req.headers['sec-websocket-protocol'] || 
                       (req.url.includes('?token=') ? req.url.split('?token=')[1] : null);
      
      // Enhanced client object with state tracking
      const client = {
        id: clientId,
        ws: ws,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        connectedAt: Date.now(),
        lastPing: Date.now(),
        lastPong: Date.now(),
        isAlive: true,
        subscriptions: new Set(),
        messagesSent: 0,
        messagesReceived: 0,
        authToken: authToken,
        authenticated: this.validateAuthToken(authToken)
      };
      
      this.clients.set(clientId, client);
      
      this.logger.info('WebSocket client connected:', {
        clientId,
        ip: client.ip,
        userAgent: client.userAgent,
        authenticated: client.authenticated,
        totalClients: this.clients.size
      });
      
      // Send authentication status and initial state
      this.sendToClient(client, {
        type: 'connection-established',
        clientId: clientId,
        authenticated: client.authenticated,
        serverCapabilities: {
          compression: this.compressionEnabled,
          heartbeat: this.heartbeatInterval,
          messageQueue: true,
          subscriptions: true
        },
        timestamp: Date.now()
      });
      
      if (client.authenticated) {
        // Send initial state for authenticated clients
        this.sendToClient(client, {
          type: 'initial-state',
          sessions: this.processManager.getAllSessions(),
          timestamp: Date.now()
        });
        
        // Deliver any queued messages
        this.deliverQueuedMessages(clientId);
      }
      
      // Enhanced message handling
      ws.on('message', (message) => {
        try {
          client.messagesReceived++;
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(client, data);
        } catch (error) {
          this.logger.warn('Invalid WebSocket message:', {
            clientId,
            message: message.toString(),
            error: error.message
          });
          
          this.sendToClient(client, {
            type: 'error',
            error: 'Invalid message format',
            code: 'INVALID_MESSAGE'
          });
        }
      });
      
      // Enhanced pong handling for heartbeat
      ws.on('pong', () => {
        client.lastPong = Date.now();
        client.isAlive = true;
      });
      
      // Handle client disconnect with cleanup
      ws.on('close', (code, reason) => {
        this.handleClientDisconnect(client, code, reason);
      });

      // Enhanced error handling
      ws.on('error', (error) => {
        this.logger.error('WebSocket client error:', {
          clientId,
          error: error.message,
          code: error.code
        });
        
        // Clean up client on error
        this.handleClientDisconnect(client, null, 'error');
      });
    });
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();
    
    // Setup connection cleanup
    this.setupConnectionCleanup();

    this.logger.info('Enhanced WebSocket server initialized:', {
      compression: this.compressionEnabled,
      heartbeatInterval: this.heartbeatInterval,
      connectionTimeout: this.connectionTimeout
    });
  }

  /**
   * Enhanced WebSocket message handling with authentication and validation
   */
  handleWebSocketMessage(client, data) {
    const { type, payload, messageId } = data;
    
    this.logger.debug('WebSocket message received:', {
      clientId: client.id,
      type,
      messageId,
      authenticated: client.authenticated
    });

    // Authentication check for sensitive operations
    if (!client.authenticated && ['subscribe', 'unsubscribe', 'get-logs', 'clear-logs'].includes(type)) {
      this.sendToClient(client, {
        type: 'error',
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        messageId
      });
      return;
    }

    switch (type) {
      case 'authenticate':
        this.handleAuthentication(client, payload, messageId);
        break;
        
      case 'subscribe':
        this.handleSubscription(client, payload, messageId);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(client, payload, messageId);
        break;
        
      case 'ping':
        client.lastPing = Date.now();
        this.sendToClient(client, {
          type: 'pong',
          timestamp: Date.now(),
          messageId
        });
        break;
        
      case 'get-logs':
        this.handleGetLogs(client, payload, messageId);
        break;
        
      case 'clear-logs':
        this.handleClearLogs(client, payload, messageId);
        break;
        
      case 'heartbeat':
        // Client heartbeat - update alive status
        client.isAlive = true;
        client.lastPing = Date.now();
        break;
        
      default:
        this.logger.warn('Unknown WebSocket message type:', { type, clientId: client.id });
        this.sendToClient(client, {
          type: 'error',
          error: `Unknown message type: ${type}`,
          code: 'UNKNOWN_MESSAGE_TYPE',
          messageId
        });
    }
  }
  
  /**
   * Setup process manager event listeners
   */
  setupProcessEvents() {
    // Listen for new logs
    this.processManager.on('log', ({ sessionId, log }) => {
      this.broadcast({
        type: 'log',
        sessionId,
        log,
        timestamp: Date.now()
      });

      // Store logs persistently
      this.logStore.storeLogs(sessionId, [log]).catch(error => {
        this.logger.error('Failed to store log:', { sessionId, error: error.message });
      });
    });
    
    // Listen for server ready events
    this.processManager.on('server-ready', (session) => {
      this.broadcast({
        type: 'server-ready',
        session: {
          id: session.id,
          name: session.name,
          port: session.port,
          status: session.status,
          pid: session.pid,
          url: `http://localhost:${session.port}`
        },
        timestamp: Date.now()
      });
    });
    
    // Listen for process exit events
    this.processManager.on('process-exit', ({ sessionId, code, signal }) => {
      this.broadcast({
        type: 'process-exit',
        sessionId,
        code,
        signal,
        timestamp: Date.now()
      });
    });

    // Listen for process error events
    this.processManager.on('process-error', ({ sessionId, error }) => {
      this.broadcast({
        type: 'process-error',
        sessionId,
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Enhanced broadcast with subscription filtering and message queuing
   */
  broadcast(data, options = {}) {
    if (!this.wss) return;
    
    const { subscriptionFilter, excludeClient, queueForOffline = true } = options;
    let sentCount = 0;
    let queuedCount = 0;
    
    this.clients.forEach(client => {
      // Skip excluded clients
      if (excludeClient && client.id === excludeClient) {
        return;
      }
      
      // Apply subscription filter
      if (subscriptionFilter && !client.subscriptions.has(subscriptionFilter)) {
        return;
      }
      
      if (client.ws.readyState === WebSocket.OPEN && client.authenticated) {
        try {
          this.sendToClient(client, data);
          sentCount++;
        } catch (error) {
          this.logger.warn('Failed to send WebSocket message:', {
            clientId: client.id,
            error: error.message
          });
        }
      } else if (queueForOffline && client.authenticated) {
        // Queue message for offline clients
        this.queueMessage(client.id, data);
        queuedCount++;
      }
    });
    
    if (sentCount > 0 || queuedCount > 0) {
      this.logger.debug('Message broadcast completed:', {
        type: data.type,
        sentCount,
        queuedCount,
        totalClients: this.clients.size
      });
    }
  }
  
  /**
   * Start the dashboard server
   * @param {number} port - Port to listen on
   * @returns {Promise} Promise that resolves when server is started
   */
  async start(port = 8080) {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      
      // Setup WebSocket after HTTP server is created
      this.setupWebSocket();
      
      this.server.listen(port, () => {
        this.logger.info('Dashboard server started:', {
          port,
          url: `http://localhost:${port}`,
          websocket: 'enabled'
        });
        resolve();
      });
      
      this.server.on('error', (error) => {
        this.logger.error('Dashboard server error:', {
          error: error.message,
          code: error.code,
          port
        });
        reject(error);
      });
    });
  }
  
  /**
   * Stop the dashboard server
   * @returns {Promise} Promise that resolves when server is stopped
   */
  async stop() {
    const promises = [];
    
    // Close WebSocket server
    if (this.wss) {
      promises.push(new Promise((resolve) => {
        this.wss.close(() => {
          this.logger.info('WebSocket server closed');
          resolve();
        });
      }));
    }
    
    // Close HTTP server
    if (this.server) {
      promises.push(new Promise((resolve) => {
        this.server.close(() => {
          this.logger.info('Dashboard server stopped');
          resolve();
        });
      }));
    }
    
    await Promise.all(promises);
  }

  /**
   * Start heartbeat monitoring for WebSocket connections
   */
  startHeartbeatMonitoring() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((client) => {
        if (!client.isAlive) {
          this.logger.debug('Terminating unresponsive client:', { clientId: client.id });
          client.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        client.ping();
      });
    }, this.heartbeatInterval);

    this.logger.debug('Heartbeat monitoring started');
  }

  /**
   * Setup connection cleanup handlers
   */
  setupConnectionCleanup() {
    process.on('SIGTERM', this.handleGracefulShutdown.bind(this));
    process.on('SIGINT', this.handleGracefulShutdown.bind(this));
    process.on('exit', this.cleanup.bind(this));
  }

  /**
   * Handle graceful shutdown
   */
  async handleGracefulShutdown() {
    this.logger.info('Received shutdown signal, cleaning up...');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all WebSocket connections gracefully
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1000, 'Server shutdown');
        }
      });
    }

    await this.stop();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.clients.clear();
    this.messageQueue.clear();
  }

  /**
   * Get server status
   * @returns {Object} Server status information
   */
  getStatus() {
    return {
      running: !!this.server && this.server.listening,
      port: this.server ? this.server.address()?.port : null,
      connections: this.wss ? this.wss.clients.size : 0,
      uptime: process.uptime()
    };
  }
}

module.exports = DashboardServer;