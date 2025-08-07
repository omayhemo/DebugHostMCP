/**
 * Log Streamer Service
 * Manages SSE-based real-time log streaming to clients
 */

const { EventEmitter } = require('events');
const { sseManager } = require('../utils/sse');
const { getLogCollector } = require('./log-collector');
const { getLogStorage } = require('./log-storage');

class LogStreamer extends EventEmitter {
  constructor() {
    super();
    this.logCollector = null;
    this.logStorage = null;
    this.activeStreams = new Map(); // projectId -> Set of client IDs
    this.streamConfigs = new Map(); // clientId -> config
    this.clientCounter = 0;
  }

  /**
   * Initialize the log streamer
   */
  async initialize() {
    try {
      // Get service instances
      this.logCollector = getLogCollector();
      this.logStorage = getLogStorage();
      
      // Initialize services if needed
      if (!this.logCollector.listenerCount('log')) {
        await this.logCollector.initialize();
      }
      
      if (!this.logStorage.baseDir) {
        await this.logStorage.initialize();
      }
      
      // Subscribe to log events from collector
      this.setupCollectorListeners();
      
      console.log('[LogStreamer] Initialized log streaming service');
      return true;
    } catch (error) {
      console.error('[LogStreamer] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup listeners for log collector events
   */
  setupCollectorListeners() {
    // Listen for new log entries
    this.logCollector.on('log', async (logEntry) => {
      // Store log persistently
      await this.logStorage.write(logEntry.containerName, logEntry);
      
      // Stream to connected clients
      this.streamToClients(logEntry);
    });

    // Listen for stream errors
    this.logCollector.on('streamError', (error) => {
      console.error('[LogStreamer] Collector stream error:', error);
      this.emit('collectorError', error);
    });

    // Listen for stream end
    this.logCollector.on('streamEnd', (info) => {
      console.log('[LogStreamer] Collector stream ended:', info);
      this.emit('collectorEnd', info);
    });
  }

  /**
   * Start streaming logs for a project
   */
  async startStreaming(res, projectId, containerName, options = {}) {
    try {
      // Generate unique client ID
      const clientId = `client_${++this.clientCounter}_${Date.now()}`;
      
      // Initialize SSE connection
      sseManager.initializeConnection(res, projectId);
      
      // Store stream configuration
      const config = {
        clientId,
        projectId,
        containerName,
        filters: {
          level: options.level,
          stream: options.stream,
          search: options.search
        },
        tail: options.tail || 100,
        follow: options.follow !== false,
        includeHistory: options.includeHistory !== false
      };
      
      this.streamConfigs.set(clientId, config);
      
      // Track active stream
      if (!this.activeStreams.has(projectId)) {
        this.activeStreams.set(projectId, new Set());
      }
      this.activeStreams.get(projectId).add(clientId);
      
      // Send historical logs if requested
      if (config.includeHistory) {
        await this.sendHistoricalLogs(res, containerName, config);
      }
      
      // Start collecting logs from container if not already
      if (config.follow) {
        await this.logCollector.startCollection(containerName, {
          tail: config.tail
        });
      }
      
      // Setup disconnect handler
      res.on('close', () => {
        this.handleClientDisconnect(clientId, projectId);
      });
      
      console.log(`[LogStreamer] Started streaming for ${projectId}/${containerName} (client: ${clientId})`);
      
      return {
        clientId,
        projectId,
        containerName,
        streaming: true
      };
    } catch (error) {
      console.error(`[LogStreamer] Error starting stream for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Send historical logs to client
   */
  async sendHistoricalLogs(res, containerName, config) {
    try {
      // Fetch historical logs from storage
      const historicalLogs = await this.logStorage.read(containerName, {
        limit: config.tail,
        level: config.filters.level,
        stream: config.filters.stream,
        search: config.filters.search
      });
      
      // Send each log entry
      for (const log of historicalLogs) {
        sseManager.sendToConnection(res, {
          ...log,
          historical: true
        }, 'log');
      }
      
      // Send marker to indicate end of historical logs
      sseManager.sendToConnection(res, {
        type: 'historical_complete',
        count: historicalLogs.length,
        timestamp: Date.now()
      }, 'status');
      
    } catch (error) {
      console.error('[LogStreamer] Error sending historical logs:', error);
      sseManager.sendToConnection(res, {
        type: 'error',
        message: 'Failed to load historical logs',
        error: error.message,
        timestamp: Date.now()
      }, 'error');
    }
  }

  /**
   * Stream log entry to connected clients
   */
  streamToClients(logEntry) {
    // Find relevant project ID from container name
    // This assumes containerName includes projectId or we have a mapping
    for (const [projectId, clientIds] of this.activeStreams) {
      for (const clientId of clientIds) {
        const config = this.streamConfigs.get(clientId);
        
        if (!config || config.containerName !== logEntry.containerName) {
          continue;
        }
        
        // Apply filters
        if (!this.shouldStreamLog(logEntry, config.filters)) {
          continue;
        }
        
        // Broadcast to project connections
        sseManager.broadcast(projectId, {
          ...logEntry,
          realtime: true
        }, 'log');
      }
    }
  }

  /**
   * Check if log should be streamed based on filters
   */
  shouldStreamLog(logEntry, filters) {
    if (filters.level && logEntry.level !== filters.level) {
      return false;
    }
    
    if (filters.stream && logEntry.stream !== filters.stream) {
      return false;
    }
    
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      if (!regex.test(logEntry.message)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Stop streaming for a specific client
   */
  stopStreaming(clientId) {
    const config = this.streamConfigs.get(clientId);
    
    if (config) {
      const projectStreams = this.activeStreams.get(config.projectId);
      if (projectStreams) {
        projectStreams.delete(clientId);
        
        if (projectStreams.size === 0) {
          this.activeStreams.delete(config.projectId);
          
          // Stop collecting if no more clients
          this.checkAndStopCollection(config.containerName);
        }
      }
      
      this.streamConfigs.delete(clientId);
      
      console.log(`[LogStreamer] Stopped streaming for client ${clientId}`);
    }
  }

  /**
   * Handle client disconnect
   */
  handleClientDisconnect(clientId, projectId) {
    console.log(`[LogStreamer] Client disconnected: ${clientId}`);
    
    // Remove from SSE manager
    // Note: sseManager handles this automatically
    
    // Stop streaming for this client
    this.stopStreaming(clientId);
  }

  /**
   * Check if we should stop collecting logs for a container
   */
  checkAndStopCollection(containerName) {
    // Check if any clients are still interested in this container
    let hasClients = false;
    
    for (const config of this.streamConfigs.values()) {
      if (config.containerName === containerName && config.follow) {
        hasClients = true;
        break;
      }
    }
    
    // Stop collection if no clients
    if (!hasClients) {
      this.logCollector.stopCollection(containerName);
      console.log(`[LogStreamer] Stopped collecting logs for ${containerName} (no clients)`);
    }
  }

  /**
   * Get logs with filtering and pagination
   */
  async getLogs(containerName, options = {}) {
    try {
      // Fetch from storage
      const logs = await this.logStorage.read(containerName, options);
      
      return {
        logs,
        total: logs.length,
        containerName,
        filters: options
      };
    } catch (error) {
      console.error(`[LogStreamer] Error getting logs for ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Search logs across containers
   */
  async searchLogs(searchQuery, options = {}) {
    try {
      const results = [];
      const containers = options.containers || [];
      
      // If no specific containers, search all
      if (containers.length === 0) {
        // Get all containers from storage stats
        const stats = await this.logStorage.getStats();
        containers.push(...Object.keys(stats.containers));
      }
      
      // Search each container
      for (const containerName of containers) {
        const logs = await this.logStorage.read(containerName, {
          search: searchQuery,
          level: options.level,
          stream: options.stream,
          since: options.since,
          until: options.until,
          limit: options.limit || 100
        });
        
        results.push({
          containerName,
          matches: logs.length,
          logs
        });
      }
      
      return {
        query: searchQuery,
        results,
        totalMatches: results.reduce((sum, r) => sum + r.matches, 0)
      };
    } catch (error) {
      console.error('[LogStreamer] Search error:', error);
      throw error;
    }
  }

  /**
   * Clear logs for a container
   */
  async clearLogs(containerName) {
    try {
      // Stop collection first
      await this.logCollector.stopCollection(containerName);
      
      // Clear buffer
      this.logCollector.clearBuffer(containerName);
      
      // Delete from storage
      await this.logStorage.deleteLogs(containerName);
      
      // Notify connected clients
      for (const [projectId, clientIds] of this.activeStreams) {
        for (const clientId of clientIds) {
          const config = this.streamConfigs.get(clientId);
          
          if (config && config.containerName === containerName) {
            sseManager.broadcast(projectId, {
              type: 'logs_cleared',
              containerName,
              timestamp: Date.now()
            }, 'status');
          }
        }
      }
      
      console.log(`[LogStreamer] Cleared logs for ${containerName}`);
      return true;
    } catch (error) {
      console.error(`[LogStreamer] Error clearing logs for ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Get streaming statistics
   */
  getStats() {
    const stats = {
      activeStreams: this.activeStreams.size,
      totalClients: this.streamConfigs.size,
      collectorStatus: this.logCollector.getStatus(),
      sseStats: sseManager.getStats(),
      streams: []
    };
    
    // Add per-project stats
    for (const [projectId, clientIds] of this.activeStreams) {
      const projectStreams = [];
      
      for (const clientId of clientIds) {
        const config = this.streamConfigs.get(clientId);
        if (config) {
          projectStreams.push({
            clientId,
            containerName: config.containerName,
            filters: config.filters,
            follow: config.follow
          });
        }
      }
      
      stats.streams.push({
        projectId,
        clientCount: clientIds.size,
        clients: projectStreams
      });
    }
    
    return stats;
  }

  /**
   * Export logs to file
   */
  async exportLogs(containerName, format = 'json', options = {}) {
    try {
      const logs = await this.logStorage.read(containerName, options);
      
      let content;
      let contentType;
      let filename;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(logs, null, 2);
          contentType = 'application/json';
          filename = `${containerName}_logs_${Date.now()}.json`;
          break;
          
        case 'csv':
          content = this.logsToCSV(logs);
          contentType = 'text/csv';
          filename = `${containerName}_logs_${Date.now()}.csv`;
          break;
          
        case 'text':
          content = logs.map(log => 
            `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${log.message}`
          ).join('\n');
          contentType = 'text/plain';
          filename = `${containerName}_logs_${Date.now()}.txt`;
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      return {
        content,
        contentType,
        filename,
        logCount: logs.length
      };
    } catch (error) {
      console.error(`[LogStreamer] Export error for ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Convert logs to CSV format
   */
  logsToCSV(logs) {
    const headers = ['Timestamp', 'Level', 'Stream', 'Message'];
    const rows = [headers.join(',')];
    
    for (const log of logs) {
      const row = [
        new Date(log.timestamp).toISOString(),
        log.level,
        log.stream,
        `"${log.message.replace(/"/g, '""')}"` // Escape quotes
      ];
      rows.push(row.join(','));
    }
    
    return rows.join('\n');
  }

  /**
   * Shutdown the streamer service
   */
  async shutdown() {
    try {
      // Stop all active streams
      for (const clientId of this.streamConfigs.keys()) {
        this.stopStreaming(clientId);
      }
      
      // Clear maps
      this.activeStreams.clear();
      this.streamConfigs.clear();
      
      // Remove listeners
      this.logCollector.removeAllListeners();
      
      console.log('[LogStreamer] Shutdown complete');
    } catch (error) {
      console.error('[LogStreamer] Shutdown error:', error);
    }
  }
}

// Create singleton instance
let logStreamer = null;

function getLogStreamer() {
  if (!logStreamer) {
    logStreamer = new LogStreamer();
  }
  return logStreamer;
}

module.exports = {
  LogStreamer,
  getLogStreamer
};