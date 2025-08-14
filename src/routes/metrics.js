/**
 * Metrics API Routes
 * 
 * REST endpoints for historical data queries and container metrics management.
 * Provides endpoints for querying metrics data and managing streaming connections.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

/**
 * Initialize metrics routes with dependencies
 * 
 * @param {object} dependencies - Required services
 * @param {MetricsStorage} dependencies.metricsStorage - Metrics storage service
 * @param {MetricsStreamManager} dependencies.metricsStreamManager - Stream manager
 * @param {MetricsCollector} dependencies.metricsCollector - Metrics collector
 * @returns {object} Express router
 */
function initializeMetricsRoutes(dependencies) {
  const { metricsStorage, metricsStreamManager, metricsCollector } = dependencies;
  
  if (!metricsStorage || !metricsStreamManager || !metricsCollector) {
    throw new Error('All metrics dependencies are required: metricsStorage, metricsStreamManager, metricsCollector');
  }
  
  /**
   * GET /api/metrics/containers
   * Get list of containers with metrics
   */
  router.get('/containers', async (req, res) => {
    try {
      const containers = metricsStorage.getContainerList();
      const containerDetails = [];
      
      // Get latest metrics for each container
      for (const containerId of containers) {
        const latestMetrics = metricsStorage.getLatestMetrics(containerId);
        if (latestMetrics) {
          containerDetails.push({
            containerId,
            name: latestMetrics.name,
            projectId: latestMetrics.projectId,
            status: latestMetrics.status,
            lastMetricsTime: latestMetrics.timestamp,
            uptime: latestMetrics.uptime,
            activeStreams: metricsStreamManager.getContainerStreams(containerId).length
          });
        }
      }
      
      res.json({
        success: true,
        containers: containerDetails,
        totalContainers: containerDetails.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error getting containers list:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get containers list',
        message: error.message
      });
    }
  });
  
  /**
   * GET /api/metrics/:containerId
   * Get latest metrics for a specific container
   */
  router.get('/:containerId',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        const latestMetrics = metricsStorage.getLatestMetrics(containerId);
        
        if (!latestMetrics) {
          return res.status(404).json({
            success: false,
            error: 'Container not found',
            message: `No metrics found for container ${containerId}`
          });
        }
        
        // Get stream information
        const streams = metricsStreamManager.getContainerStreams(containerId);
        
        res.json({
          success: true,
          containerId,
          metrics: latestMetrics,
          streams: {
            active: streams.length,
            details: streams
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`Error getting metrics for container ${req.params.containerId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to get container metrics',
          message: error.message
        });
      }
    }
  );
  
  /**
   * GET /api/metrics/:containerId/history
   * Query historical metrics for a container
   */
  router.get('/:containerId/history',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    query('startTime').optional().isInt({ min: 0 }).withMessage('Start time must be a positive integer'),
    query('endTime').optional().isInt({ min: 0 }).withMessage('End time must be a positive integer'),
    query('resolution').optional().isIn(['raw', 'minute', 'fiveMinute', 'fifteenMinute', 'hour', 'day']).withMessage('Invalid resolution'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    query('metrics').optional().isString().withMessage('Metrics must be a comma-separated string'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        const {
          startTime = Date.now() - 24 * 60 * 60 * 1000, // Default: last 24 hours
          endTime = Date.now(),
          resolution = 'raw',
          limit = 1000,
          metrics: requestedMetrics
        } = req.query;
        
        // Parse requested metrics
        let metricsFilter = null;
        if (requestedMetrics) {
          metricsFilter = requestedMetrics.split(',').map(m => m.trim());
        }
        
        // Query metrics
        const historicalData = await metricsStorage.queryMetrics(containerId, {
          startTime: parseInt(startTime),
          endTime: parseInt(endTime),
          resolution,
          limit: parseInt(limit)
        });
        
        // Filter metrics if requested
        let filteredData = historicalData;
        if (metricsFilter && metricsFilter.length > 0) {
          filteredData = historicalData.map(entry => {
            const filtered = {
              containerId: entry.containerId,
              name: entry.name,
              timestamp: entry.timestamp,
              projectId: entry.projectId
            };
            
            metricsFilter.forEach(metricType => {
              if (entry[metricType]) {
                filtered[metricType] = entry[metricType];
              }
            });
            
            return filtered;
          });
        }
        
        res.json({
          success: true,
          containerId,
          query: {
            startTime: parseInt(startTime),
            endTime: parseInt(endTime),
            resolution,
            limit: parseInt(limit),
            requestedMetrics: metricsFilter
          },
          data: filteredData,
          dataPoints: filteredData.length,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`Error getting historical metrics for container ${req.params.containerId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to get historical metrics',
          message: error.message
        });
      }
    }
  );
  
  /**
   * GET /api/metrics/:containerId/stream
   * Start SSE metrics streaming for a container
   */
  router.get('/:containerId/stream',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    query('interval').optional().isIn(['fast', 'medium', 'slow']).withMessage('Invalid interval'),
    query('metrics').optional().isString().withMessage('Metrics must be a comma-separated string'),
    query('includeHistory').optional().isBoolean().withMessage('Include history must be a boolean'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        const {
          interval = 'fast',
          metrics: requestedMetrics = 'cpu,memory,network,disk',
          includeHistory = false
        } = req.query;
        
        // Parse requested metrics
        const metricsArray = requestedMetrics.split(',').map(m => m.trim());
        
        const streamOptions = {
          interval,
          metrics: metricsArray,
          includeHistory: includeHistory === 'true',
          maxHistoryPoints: 100
        };
        
        // Start streaming
        const streamInfo = await metricsStreamManager.startStream(res, containerId, streamOptions);
        
        console.log(`Started metrics stream for container ${containerId}:`, streamInfo);
        
      } catch (error) {
        console.error(`Error starting metrics stream for container ${req.params.containerId}:`, error);
        
        // Send error and close connection
        res.writeHead(500, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        res.write(`event: error\ndata: ${JSON.stringify({
          error: error.message,
          containerId: req.params.containerId
        })}\n\n`);
        res.end();
      }
    }
  );
  
  /**
   * POST /api/metrics/:containerId/start-monitoring
   * Start metrics collection for a container
   */
  router.post('/:containerId/start-monitoring',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    body('intervals').optional().isArray().withMessage('Intervals must be an array'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        const { intervals = ['fast', 'medium'] } = req.body;
        
        // Add container to monitoring
        metricsCollector.addContainer(containerId);
        
        res.json({
          success: true,
          message: `Started monitoring container ${containerId}`,
          containerId,
          intervals,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`Error starting monitoring for container ${req.params.containerId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to start monitoring',
          message: error.message
        });
      }
    }
  );
  
  /**
   * DELETE /api/metrics/:containerId/stop-monitoring
   * Stop metrics collection for a container
   */
  router.delete('/:containerId/stop-monitoring',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        
        // Remove container from monitoring
        metricsCollector.removeContainer(containerId);
        
        res.json({
          success: true,
          message: `Stopped monitoring container ${containerId}`,
          containerId,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`Error stopping monitoring for container ${req.params.containerId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to stop monitoring',
          message: error.message
        });
      }
    }
  );
  
  /**
   * GET /api/metrics/stats
   * Get metrics system statistics
   */
  router.get('/stats', async (req, res) => {
    try {
      const collectorStats = metricsCollector.getStats();
      const storageStats = metricsStorage.getStorageStats();
      const streamStats = metricsStreamManager.getStreamStats();
      
      res.json({
        success: true,
        stats: {
          collector: collectorStats,
          storage: storageStats,
          streaming: streamStats,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: Date.now()
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting metrics stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
        message: error.message
      });
    }
  });
  
  /**
   * POST /api/metrics/collector/start
   * Start the metrics collector
   */
  router.post('/collector/start',
    body('containerIds').optional().isArray().withMessage('Container IDs must be an array'),
    body('intervals').optional().isArray().withMessage('Intervals must be an array'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerIds, intervals = ['fast', 'medium'] } = req.body;
        
        metricsCollector.start({ containerIds, intervals });
        
        res.json({
          success: true,
          message: 'Metrics collector started',
          configuration: {
            containerIds: containerIds || 'all',
            intervals
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Error starting metrics collector:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to start collector',
          message: error.message
        });
      }
    }
  );
  
  /**
   * POST /api/metrics/collector/stop
   * Stop the metrics collector
   */
  router.post('/collector/stop', async (req, res) => {
    try {
      metricsCollector.stop();
      
      res.json({
        success: true,
        message: 'Metrics collector stopped',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error stopping metrics collector:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop collector',
        message: error.message
      });
    }
  });
  
  /**
   * DELETE /api/metrics/:containerId
   * Delete all metrics data for a container
   */
  router.delete('/:containerId',
    param('containerId').isLength({ min: 1 }).withMessage('Container ID is required'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        
        const { containerId } = req.params;
        
        // Stop monitoring and streaming
        metricsCollector.removeContainer(containerId);
        
        // Stop any active streams
        const streams = metricsStreamManager.getContainerStreams(containerId);
        for (const stream of streams) {
          metricsStreamManager.stopStream(stream.id);
        }
        
        // Note: For now, we don't delete stored metrics data
        // In a full implementation, you might want to add a method to delete data
        
        res.json({
          success: true,
          message: `Stopped all monitoring and streaming for container ${containerId}`,
          containerId,
          stoppedStreams: streams.length,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`Error deleting metrics for container ${req.params.containerId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete container metrics',
          message: error.message
        });
      }
    }
  );
  
  return router;
}

module.exports = initializeMetricsRoutes;