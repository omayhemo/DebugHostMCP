/**
 * Server-Sent Events (SSE) Utilities
 * Handles SSE streaming for MCP Debug Host
 */

class SseManager {
  constructor() {
    // Map of projectId -> Set of response objects
    this.connections = new Map();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  /**
   * Initialize SSE response headers and connection
   */
  initializeConnection(res, projectId) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Store connection
    if (!this.connections.has(projectId)) {
      this.connections.set(projectId, new Set());
    }
    this.connections.get(projectId).add(res);

    // Send initial connection message
    this.sendToConnection(res, {
      type: 'connected',
      projectId,
      timestamp: Date.now()
    });

    return res;
  }

  /**
   * Send data to a specific connection
   */
  sendToConnection(res, data, eventType = 'log') {
    try {
      if (res.destroyed || res.headersSent === false) {
        return false;
      }

      const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(message);
      return true;
    } catch (error) {
      console.error('SSE send error:', error);
      return false;
    }
  }

  /**
   * Broadcast data to all connections for a project
   */
  broadcast(projectId, data, eventType = 'log') {
    const connections = this.connections.get(projectId);
    if (!connections) {
      return 0;
    }

    let sentCount = 0;
    const deadConnections = new Set();

    for (const res of connections) {
      if (this.sendToConnection(res, data, eventType)) {
        sentCount++;
      } else {
        deadConnections.add(res);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(res => {
      connections.delete(res);
    });

    // Remove empty project sets
    if (connections.size === 0) {
      this.connections.delete(projectId);
    }

    return sentCount;
  }

  /**
   * Remove a connection
   */
  removeConnection(res, projectId) {
    const connections = this.connections.get(projectId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        this.connections.delete(projectId);
      }
    }
  }

  /**
   * Get connection count for a project
   */
  getConnectionCount(projectId) {
    const connections = this.connections.get(projectId);
    return connections ? connections.size : 0;
  }

  /**
   * Get total connection count
   */
  getTotalConnections() {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Send heartbeat to all connections
   */
  sendHeartbeat() {
    const heartbeatData = {
      type: 'heartbeat',
      timestamp: Date.now(),
      totalConnections: this.getTotalConnections()
    };

    for (const [projectId, connections] of this.connections) {
      const deadConnections = new Set();
      
      for (const res of connections) {
        if (!this.sendToConnection(res, heartbeatData, 'heartbeat')) {
          deadConnections.add(res);
        }
      }

      // Clean up dead connections
      deadConnections.forEach(res => {
        connections.delete(res);
      });

      if (connections.size === 0) {
        this.connections.delete(projectId);
      }
    }
  }

  /**
   * Start heartbeat interval
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  /**
   * Stop heartbeat and close all connections
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const [projectId, connections] of this.connections) {
      for (const res of connections) {
        try {
          res.end();
        } catch (error) {
          // Connection may already be closed
        }
      }
    }

    this.connections.clear();
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalConnections: this.getTotalConnections(),
      projectCount: this.connections.size,
      projects: {}
    };

    for (const [projectId, connections] of this.connections) {
      stats.projects[projectId] = connections.size;
    }

    return stats;
  }
}

// Create singleton instance
const sseManager = new SseManager();

module.exports = {
  sseManager,
  SseManager
};