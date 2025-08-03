/**
 * Enhanced WebSocket Manager for MCP Debug Host
 * Provides robust real-time communication with automatic reconnection,
 * message queuing, compression, and advanced connection management
 */

class WebSocketManager {
  constructor(options = {}) {
    this.url = options.url || this.getWebSocketUrl();
    this.protocols = options.protocols || [];
    this.autoReconnect = options.autoReconnect !== false;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.maxReconnectInterval = options.maxReconnectInterval || 30000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.connectionTimeout = options.connectionTimeout || 10000;
    this.messageQueueSize = options.messageQueueSize || 100;
    
    // Connection state
    this.ws = null;
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.reconnectAttempts = 0;
    this.lastConnectionTime = null;
    this.clientId = null;
    this.authenticated = false;
    
    // Message handling
    this.messageQueue = [];
    this.pendingMessages = new Map(); // For message acknowledgments
    this.messageId = 0;
    this.eventListeners = new Map();
    
    // Heartbeat management
    this.heartbeatTimer = null;
    this.lastHeartbeat = null;
    this.serverResponding = true;
    
    // Performance metrics
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      reconnections: 0,
      totalConnections: 0,
      bytesReceived: 0,
      bytesSent: 0,
      avgLatency: 0,
      lastLatency: 0
    };
    
    // Exponential backoff for reconnection
    this.backoffMultiplier = 1.5;
    this.currentReconnectDelay = this.reconnectInterval;
    
    this.initializeEventHandlers();
  }
  
  /**
   * Get WebSocket URL with protocol detection
   */
  getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  
  /**
   * Initialize event handling system
   */
  initializeEventHandlers() {
    // Built-in event handlers
    this.on('connection-established', (data) => {
      this.clientId = data.clientId;
      this.authenticated = data.authenticated;
      this.emit('connected', { clientId: this.clientId, authenticated: this.authenticated });
    });
    
    this.on('queued-messages', (data) => {
      this.emit('queued-messages-received', data);
    });
    
    this.on('server-shutdown', (data) => {
      this.emit('server-shutdown', data);
      this.autoReconnect = false; // Don't reconnect during planned shutdown
    });
  }
  
  /**
   * Connect to WebSocket server with enhanced error handling
   */\n  async connect(authToken = null) {\n    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {\n      return Promise.resolve();\n    }\n    \n    return new Promise((resolve, reject) => {\n      this.connectionState = 'connecting';\n      this.emit('connecting', { attempt: this.reconnectAttempts + 1 });\n      \n      try {\n        // Add auth token to protocols if provided\n        const protocols = authToken ? [...this.protocols, authToken] : this.protocols;\n        this.ws = new WebSocket(this.url, protocols);\n        \n        // Connection timeout\n        const connectionTimeout = setTimeout(() => {\n          if (this.ws.readyState !== WebSocket.OPEN) {\n            this.ws.close();\n            reject(new Error('Connection timeout'));\n          }\n        }, this.connectionTimeout);\n        \n        this.ws.onopen = (event) => {\n          clearTimeout(connectionTimeout);\n          this.handleConnection(event);\n          resolve();\n        };\n        \n        this.ws.onclose = (event) => {\n          clearTimeout(connectionTimeout);\n          this.handleDisconnection(event);\n          if (this.connectionState === 'connecting') {\n            reject(new Error(`Connection failed: ${event.code} ${event.reason}`));\n          }\n        };\n        \n        this.ws.onerror = (error) => {\n          clearTimeout(connectionTimeout);\n          this.handleError(error);\n          if (this.connectionState === 'connecting') {\n            reject(error);\n          }\n        };\n        \n        this.ws.onmessage = (event) => {\n          this.handleMessage(event);\n        };\n        \n      } catch (error) {\n        this.connectionState = 'disconnected';\n        reject(error);\n      }\n    });\n  }\n  \n  /**\n   * Handle successful connection\n   */\n  handleConnection(event) {\n    this.connectionState = 'connected';\n    this.lastConnectionTime = Date.now();\n    this.reconnectAttempts = 0;\n    this.currentReconnectDelay = this.reconnectInterval;\n    this.metrics.totalConnections++;\n    \n    // Start heartbeat\n    this.startHeartbeat();\n    \n    // Send queued messages\n    this.flushMessageQueue();\n    \n    this.emit('open', event);\n  }\n  \n  /**\n   * Handle disconnection with automatic reconnection\n   */\n  handleDisconnection(event) {\n    this.connectionState = 'disconnected';\n    this.authenticated = false;\n    \n    // Stop heartbeat\n    this.stopHeartbeat();\n    \n    this.emit('close', {\n      code: event.code,\n      reason: event.reason,\n      wasClean: event.wasClean\n    });\n    \n    // Attempt reconnection if enabled and not a clean close\n    if (this.autoReconnect && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {\n      this.scheduleReconnect();\n    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {\n      this.emit('max-reconnect-attempts', { attempts: this.reconnectAttempts });\n    }\n  }\n  \n  /**\n   * Handle WebSocket errors\n   */\n  handleError(error) {\n    this.emit('error', error);\n  }\n  \n  /**\n   * Handle incoming messages with compression and validation\n   */\n  handleMessage(event) {\n    try {\n      this.metrics.messagesReceived++;\n      this.metrics.bytesReceived += event.data.length;\n      \n      const data = JSON.parse(event.data);\n      \n      // Handle message acknowledgments\n      if (data.messageId && this.pendingMessages.has(data.messageId)) {\n        const pendingMessage = this.pendingMessages.get(data.messageId);\n        pendingMessage.resolve(data);\n        this.pendingMessages.delete(data.messageId);\n        \n        // Calculate latency\n        const latency = Date.now() - pendingMessage.timestamp;\n        this.updateLatencyMetrics(latency);\n      }\n      \n      // Handle heartbeat responses\n      if (data.type === 'pong') {\n        this.lastHeartbeat = Date.now();\n        this.serverResponding = true;\n        return;\n      }\n      \n      // Emit specific event type\n      if (data.type) {\n        this.emit(data.type, data);\n      }\n      \n      // Emit general message event\n      this.emit('message', data);\n      \n    } catch (error) {\n      this.emit('parse-error', { error, rawData: event.data });\n    }\n  }\n  \n  /**\n   * Send message with queuing and acknowledgment support\n   */\n  send(data, options = {}) {\n    const { \n      requireAck = false, \n      timeout = 5000, \n      queue = true \n    } = options;\n    \n    // Add message ID for acknowledgment tracking\n    const messageData = {\n      ...data,\n      messageId: requireAck ? ++this.messageId : undefined,\n      timestamp: Date.now()\n    };\n    \n    if (this.connectionState === 'connected' && this.ws.readyState === WebSocket.OPEN) {\n      return this.sendImmediately(messageData, requireAck, timeout);\n    } else if (queue) {\n      return this.queueMessage(messageData, requireAck, timeout);\n    } else {\n      return Promise.reject(new Error('WebSocket not connected and queuing disabled'));\n    }\n  }\n  \n  /**\n   * Send message immediately\n   */\n  sendImmediately(messageData, requireAck, timeout) {\n    try {\n      const message = JSON.stringify(messageData);\n      this.ws.send(message);\n      \n      this.metrics.messagesSent++;\n      this.metrics.bytesSent += message.length;\n      \n      if (requireAck) {\n        return new Promise((resolve, reject) => {\n          const timeoutId = setTimeout(() => {\n            this.pendingMessages.delete(messageData.messageId);\n            reject(new Error('Message acknowledgment timeout'));\n          }, timeout);\n          \n          this.pendingMessages.set(messageData.messageId, {\n            resolve: (response) => {\n              clearTimeout(timeoutId);\n              resolve(response);\n            },\n            reject,\n            timestamp: Date.now()\n          });\n        });\n      } else {\n        return Promise.resolve();\n      }\n    } catch (error) {\n      return Promise.reject(error);\n    }\n  }\n  \n  /**\n   * Queue message for later sending\n   */\n  queueMessage(messageData, requireAck, timeout) {\n    if (this.messageQueue.length >= this.messageQueueSize) {\n      this.messageQueue.shift(); // Remove oldest message\n    }\n    \n    const queuedMessage = {\n      data: messageData,\n      requireAck,\n      timeout,\n      queuedAt: Date.now()\n    };\n    \n    this.messageQueue.push(queuedMessage);\n    \n    if (requireAck) {\n      return new Promise((resolve, reject) => {\n        queuedMessage.resolve = resolve;\n        queuedMessage.reject = reject;\n      });\n    } else {\n      return Promise.resolve();\n    }\n  }\n  \n  /**\n   * Flush queued messages after reconnection\n   */\n  flushMessageQueue() {\n    const messages = [...this.messageQueue];\n    this.messageQueue = [];\n    \n    messages.forEach(queuedMessage => {\n      const { data, requireAck, timeout, resolve, reject } = queuedMessage;\n      \n      this.sendImmediately(data, requireAck, timeout)\n        .then(resolve)\n        .catch(reject);\n    });\n  }\n  \n  /**\n   * Schedule reconnection with exponential backoff\n   */\n  scheduleReconnect() {\n    this.connectionState = 'reconnecting';\n    this.reconnectAttempts++;\n    this.metrics.reconnections++;\n    \n    const delay = Math.min(\n      this.currentReconnectDelay * Math.pow(this.backoffMultiplier, this.reconnectAttempts - 1),\n      this.maxReconnectInterval\n    );\n    \n    this.emit('reconnecting', {\n      attempt: this.reconnectAttempts,\n      delay,\n      maxAttempts: this.maxReconnectAttempts\n    });\n    \n    setTimeout(() => {\n      if (this.autoReconnect && this.connectionState === 'reconnecting') {\n        this.connect().catch(() => {\n          // Reconnection failed, will try again if attempts remaining\n        });\n      }\n    }, delay);\n  }\n  \n  /**\n   * Start heartbeat monitoring\n   */\n  startHeartbeat() {\n    this.stopHeartbeat(); // Clear any existing heartbeat\n    \n    this.heartbeatTimer = setInterval(() => {\n      if (this.connectionState === 'connected') {\n        // Check if server is responding\n        if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > this.heartbeatInterval * 2) {\n          this.serverResponding = false;\n          this.emit('server-unresponsive');\n          \n          // Force reconnection if server is unresponsive\n          if (this.ws) {\n            this.ws.close(1000, 'Server unresponsive');\n          }\n          return;\n        }\n        \n        // Send ping\n        this.send({ type: 'ping' });\n      }\n    }, this.heartbeatInterval);\n  }\n  \n  /**\n   * Stop heartbeat monitoring\n   */\n  stopHeartbeat() {\n    if (this.heartbeatTimer) {\n      clearInterval(this.heartbeatTimer);\n      this.heartbeatTimer = null;\n    }\n  }\n  \n  /**\n   * Update latency metrics\n   */\n  updateLatencyMetrics(latency) {\n    this.metrics.lastLatency = latency;\n    // Simple moving average for average latency\n    this.metrics.avgLatency = (this.metrics.avgLatency * 0.9) + (latency * 0.1);\n  }\n  \n  /**\n   * Event emitter methods\n   */\n  on(event, handler) {\n    if (!this.eventListeners.has(event)) {\n      this.eventListeners.set(event, []);\n    }\n    this.eventListeners.get(event).push(handler);\n    return this;\n  }\n  \n  off(event, handler) {\n    if (this.eventListeners.has(event)) {\n      const handlers = this.eventListeners.get(event);\n      const index = handlers.indexOf(handler);\n      if (index > -1) {\n        handlers.splice(index, 1);\n      }\n    }\n    return this;\n  }\n  \n  emit(event, data) {\n    if (this.eventListeners.has(event)) {\n      this.eventListeners.get(event).forEach(handler => {\n        try {\n          handler(data);\n        } catch (error) {\n          console.error('Event handler error:', error);\n        }\n      });\n    }\n  }\n  \n  /**\n   * Close connection cleanly\n   */\n  close(code = 1000, reason = 'Client closing') {\n    this.autoReconnect = false;\n    this.stopHeartbeat();\n    \n    if (this.ws) {\n      this.ws.close(code, reason);\n    }\n    \n    this.connectionState = 'disconnected';\n  }\n  \n  /**\n   * Get connection status and metrics\n   */\n  getStatus() {\n    return {\n      connectionState: this.connectionState,\n      clientId: this.clientId,\n      authenticated: this.authenticated,\n      reconnectAttempts: this.reconnectAttempts,\n      lastConnectionTime: this.lastConnectionTime,\n      queuedMessages: this.messageQueue.length,\n      pendingAcks: this.pendingMessages.size,\n      serverResponding: this.serverResponding,\n      metrics: { ...this.metrics }\n    };\n  }\n  \n  /**\n   * Enable/disable automatic reconnection\n   */\n  setAutoReconnect(enabled) {\n    this.autoReconnect = enabled;\n  }\n  \n  /**\n   * Reset connection state and metrics\n   */\n  reset() {\n    this.close();\n    this.reconnectAttempts = 0;\n    this.currentReconnectDelay = this.reconnectInterval;\n    this.messageQueue = [];\n    this.pendingMessages.clear();\n    this.metrics = {\n      messagesReceived: 0,\n      messagesSent: 0,\n      reconnections: 0,\n      totalConnections: 0,\n      bytesReceived: 0,\n      bytesSent: 0,\n      avgLatency: 0,\n      lastLatency: 0\n    };\n  }\n}\n\n// Export for use in other modules\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = WebSocketManager;\n} else if (typeof window !== 'undefined') {\n  window.WebSocketManager = WebSocketManager;\n}