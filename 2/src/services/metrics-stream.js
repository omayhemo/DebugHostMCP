/**
 * Metrics Streaming Service
 * 
 * WebSocket/SSE streaming endpoint for real-time container metrics updates.
 * Integrates with MetricsCollector and MetricsStorage to provide live data streams.
 */

const EventEmitter = require('events');
const { sseManager } = require('../utils/sse');

class MetricsStreamManager extends EventEmitter {
  constructor(metricsCollector, metricsStorage) {
    super();
    
    this.metricsCollector = metricsCollector;
    this.metricsStorage = metricsStorage;
    
    // Active streams tracking
    this.activeStreams = new Map(); // streamId -> stream info
    this.containerSubscriptions = new Map(); // containerId -> Set of streamIds
    
    // Stream configuration
    this.defaultOptions = {
      interval: 'fast', // fast, medium, slow
      metrics: ['cpu', 'memory', 'network', 'disk'], // metrics to include
      includeHistory: false,
      maxHistoryPoints: 100
    };
    
    // Statistics
    this.stats = {
      totalStreams: 0,
      activeStreams: 0,
      totalDataSent: 0,
      totalErrors: 0,
      startedAt: Date.now()
    };
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('MetricsStreamManager initialized');
  }
  
  /**
   * Setup event listeners for metrics collection
   */
  setupEventListeners() {
    // Listen for new metrics from collector
    this.metricsCollector.on('metrics', (data) => {
      this.handleNewMetrics(data);
    });
    
    // Handle collector errors
    this.metricsCollector.on('error', (error) => {
      this.broadcastError(error);
    });
    
    // Handle collector state changes
    this.metricsCollector.on('started', (data) => {
      this.broadcastMessage('collector_started', data);
    });
    
    this.metricsCollector.on('stopped', () => {
      this.broadcastMessage('collector_stopped', {});
    });
  }
  
  /**
   * Start metrics streaming for a container
   * 
   * @param {object} res - Express response object (for SSE)
   * @param {string} containerId - Container ID to stream
   * @param {object} options - Stream options
   * @returns {object} Stream information
   */
  async startStream(res, containerId, options = {}) {
    const streamOptions = { ...this.defaultOptions, ...options };
    const streamId = this.generateStreamId();
    
    try {
      // Setup SSE connection
      const sseConnection = sseManager.createConnection(res, {
        keepAlive: true,
        headers: {
          'X-Stream-Type': 'metrics',
          'X-Container-ID': containerId
        }
      });
      
      // Create stream info
      const streamInfo = {
        id: streamId,
        containerId,
        connection: sseConnection,
        options: streamOptions,
        startTime: Date.now(),
        lastDataTime: null,
        dataSent: 0,
        errors: 0
      };
      
      // Register stream
      this.activeStreams.set(streamId, streamInfo);
      
      // Track container subscription
      if (!this.containerSubscriptions.has(containerId)) {
        this.containerSubscriptions.set(containerId, new Set());
      }
      this.containerSubscriptions.get(containerId).add(streamId);
      
      // Ensure container is being monitored
      this.metricsCollector.addContainer(containerId);
      
      // Send initial data if requested
      if (streamOptions.includeHistory) {
        await this.sendHistoricalData(streamInfo);
      }
      
      // Send welcome message
      this.sendToStream(streamInfo, 'stream_started', {
        streamId,
        containerId,
        options: streamOptions,
        timestamp: Date.now()
      });
      
      // Update statistics
      this.stats.totalStreams++;
      this.stats.activeStreams = this.activeStreams.size;
      
      console.log(`Started metrics stream ${streamId} for container ${containerId}`);
      
      // Handle client disconnect
      res.on('close', () => {
        this.stopStream(streamId);
      });
      
      return {
        streamId,
        containerId,
        options: streamOptions
      };
      
    } catch (error) {
      console.error(`Failed to start metrics stream for container ${containerId}:`, error);
      this.stats.totalErrors++;
      throw error;
    }
  }
  
  /**
   * Stop a metrics stream
   * 
   * @param {string} streamId - Stream ID to stop
   */
  stopStream(streamId) {
    const streamInfo = this.activeStreams.get(streamId);
    
    if (!streamInfo) {
      return;
    }
    
    try {
      // Remove from container subscriptions
      const containerStreams = this.containerSubscriptions.get(streamInfo.containerId);
      if (containerStreams) {
        containerStreams.delete(streamId);
        
        // Remove container subscription if no more streams
        if (containerStreams.size === 0) {
          this.containerSubscriptions.delete(streamInfo.containerId);
          // Optionally remove from metrics collector monitoring
          // this.metricsCollector.removeContainer(streamInfo.containerId);
        }
      }
      
      // Close SSE connection
      if (streamInfo.connection && streamInfo.connection.end) {
        streamInfo.connection.end();
      }
      
      // Remove stream
      this.activeStreams.delete(streamId);
      
      // Update statistics
      this.stats.activeStreams = this.activeStreams.size;
      
      console.log(`Stopped metrics stream ${streamId} for container ${streamInfo.containerId}`);
      
    } catch (error) {
      console.error(`Error stopping stream ${streamId}:`, error);
      this.stats.totalErrors++;
    }
  }
  
  /**
   * Handle new metrics from collector
   * 
   * @param {object} data - Metrics data from collector
   */
  handleNewMetrics(data) {
    const { timestamp, interval, metrics } = data;
    
    try {
      // Group metrics by container
      const metricsByContainer = new Map();
      
      metrics.forEach(metric => {
        if (!metricsByContainer.has(metric.containerId)) {
          metricsByContainer.set(metric.containerId, []);
        }
        metricsByContainer.get(metric.containerId).push(metric);
      });
      
      // Send to relevant streams
      for (const [containerId, containerMetrics] of metricsByContainer) {
        const streams = this.containerSubscriptions.get(containerId);
        
        if (streams && streams.size > 0) {
          const streamData = {
            timestamp,
            interval,
            containerId,
            metrics: containerMetrics[0] // Take first (should only be one per container)
          };
          
          streams.forEach(streamId => {
            const streamInfo = this.activeStreams.get(streamId);
            if (streamInfo && streamInfo.options.interval === interval) {
              this.sendMetricsToStream(streamInfo, streamData);
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error handling new metrics:', error);
      this.stats.totalErrors++;
    }
  }
  
  /**
   * Send metrics data to a specific stream
   * 
   * @param {object} streamInfo - Stream information
   * @param {object} data - Metrics data to send
   */
  sendMetricsToStream(streamInfo, data) {
    try {
      // Filter metrics based on stream options
      const filteredMetrics = this.filterMetrics(data.metrics, streamInfo.options.metrics);
      
      const streamData = {
        ...data,
        metrics: filteredMetrics,
        streamId: streamInfo.id
      };
      
      this.sendToStream(streamInfo, 'metrics', streamData);
      
      // Update stream statistics
      streamInfo.lastDataTime = Date.now();
      streamInfo.dataSent++;
      
    } catch (error) {
      console.error(`Error sending metrics to stream ${streamInfo.id}:`, error);
      streamInfo.errors++;
      this.stats.totalErrors++;
    }
  }
  
  /**
   * Send historical data to a stream
   * 
   * @param {object} streamInfo - Stream information
   */
  async sendHistoricalData(streamInfo) {
    try {
      const { containerId, options } = streamInfo;
      const endTime = Date.now();
      const startTime = endTime - (60 * 60 * 1000); // Last hour
      
      // Get historical data
      const historicalData = await this.metricsStorage.queryMetrics(containerId, {
        startTime,
        endTime,
        resolution: 'raw',
        limit: options.maxHistoryPoints
      });
      
      if (historicalData.length > 0) {
        // Send historical data in chunks to avoid overwhelming the client
        const chunkSize = 10;
        for (let i = 0; i < historicalData.length; i += chunkSize) {
          const chunk = historicalData.slice(i, i + chunkSize);
          
          this.sendToStream(streamInfo, 'historical', {
            containerId,
            metrics: chunk,
            isLast: i + chunkSize >= historicalData.length,
            totalPoints: historicalData.length,
            chunkIndex: Math.floor(i / chunkSize)
          });
          
          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
    } catch (error) {
      console.error(`Error sending historical data to stream ${streamInfo.id}:`, error);
      streamInfo.errors++;
    }
  }
  
  /**
   * Filter metrics based on requested metric types
   * 
   * @param {object} metrics - Full metrics object
   * @param {string[]} requestedMetrics - Array of metric types to include
   * @returns {object} Filtered metrics
   */
  filterMetrics(metrics, requestedMetrics) {
    const filtered = {
      containerId: metrics.containerId,
      name: metrics.name,
      timestamp: metrics.timestamp,
      projectId: metrics.projectId,
      status: metrics.status,
      uptime: metrics.uptime
    };
    
    requestedMetrics.forEach(metricType => {
      if (metrics[metricType]) {
        filtered[metricType] = metrics[metricType];
      }
    });
    
    return filtered;
  }
  
  /**
   * Send data to a specific stream
   * 
   * @param {object} streamInfo - Stream information
   * @param {string} eventType - Event type
   * @param {object} data - Data to send
   */
  sendToStream(streamInfo, eventType, data) {
    try {
      const message = JSON.stringify(data);
      
      if (streamInfo.connection && streamInfo.connection.write) {
        streamInfo.connection.write(`event: ${eventType}\ndata: ${message}\n\n`);
        this.stats.totalDataSent++;
      } else {
        console.warn(`Stream ${streamInfo.id} connection not available`);
      }
      
    } catch (error) {
      console.error(`Error sending to stream ${streamInfo.id}:`, error);
      streamInfo.errors++;
      
      // Stop stream if connection is broken
      this.stopStream(streamInfo.id);
    }
  }
  
  /**
   * Broadcast message to all active streams
   * 
   * @param {string} eventType - Event type
   * @param {object} data - Data to broadcast
   */
  broadcastMessage(eventType, data) {
    for (const streamInfo of this.activeStreams.values()) {
      this.sendToStream(streamInfo, eventType, data);
    }
  }
  
  /**
   * Broadcast error to all active streams
   * 
   * @param {Error} error - Error to broadcast
   */
  broadcastError(error) {
    const errorData = {
      message: error.message,
      type: error.constructor.name,
      timestamp: Date.now()
    };
    
    this.broadcastMessage('error', errorData);
  }
  
  /**
   * Get stream statistics
   * 
   * @returns {object} Stream statistics
   */
  getStreamStats() {
    const streamDetails = {};
    
    for (const [streamId, streamInfo] of this.activeStreams) {
      streamDetails[streamId] = {
        containerId: streamInfo.containerId,
        startTime: streamInfo.startTime,
        lastDataTime: streamInfo.lastDataTime,
        dataSent: streamInfo.dataSent,
        errors: streamInfo.errors,
        uptime: Date.now() - streamInfo.startTime,
        options: streamInfo.options
      };
    }
    
    return {
      ...this.stats,
      activeStreams: this.activeStreams.size,
      containerSubscriptions: Array.from(this.containerSubscriptions.keys()),
      streamDetails,
      uptime: Date.now() - this.stats.startedAt
    };
  }
  
  /**
   * Get streams for a specific container
   * 
   * @param {string} containerId - Container ID
   * @returns {object[]} Array of stream information
   */
  getContainerStreams(containerId) {
    const streams = this.containerSubscriptions.get(containerId);
    if (!streams) return [];
    
    return Array.from(streams).map(streamId => {
      const streamInfo = this.activeStreams.get(streamId);
      return streamInfo ? {
        id: streamId,
        startTime: streamInfo.startTime,
        lastDataTime: streamInfo.lastDataTime,
        dataSent: streamInfo.dataSent,
        errors: streamInfo.errors,
        options: streamInfo.options
      } : null;
    }).filter(Boolean);
  }
  
  /**
   * Generate unique stream ID
   * 
   * @returns {string} Unique stream ID
   */
  generateStreamId() {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Cleanup disconnected streams
   */
  cleanupStreams() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [streamId, streamInfo] of this.activeStreams) {
      // Check if stream has been inactive for too long
      if (streamInfo.lastDataTime && (now - streamInfo.lastDataTime) > timeout) {
        console.log(`Cleaning up inactive stream ${streamId}`);
        this.stopStream(streamId);
      }
    }
  }
  
  /**
   * Shutdown the stream manager
   */
  shutdown() {
    console.log('Shutting down MetricsStreamManager...');
    
    // Stop all active streams
    for (const streamId of this.activeStreams.keys()) {
      this.stopStream(streamId);
    }
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('MetricsStreamManager shutdown complete');
  }
}

module.exports = MetricsStreamManager;