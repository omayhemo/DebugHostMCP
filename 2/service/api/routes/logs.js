/**
 * Log API Routes
 */

const express = require('express');

module.exports = (logManager, sessionManager) => {
  const router = express.Router();
  
  // GET /api/v1/logs/:sessionId
  router.get('/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      
      const logs = await logManager.readLogs(sessionId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: logs,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  });
  
  // GET /api/v1/logs/:sessionId/stream - Server-Sent Events
  router.get('/:sessionId/stream', (req, res) => {
    const { sessionId } = req.params;
    
    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send initial ping
    res.write('data: {"type":"connected"}\n\n');
    
    // Subscribe to logs
    const unsubscribe = logManager.streamLogs(sessionId, (log) => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });
    
    // Clean up on disconnect
    req.on('close', () => {
      unsubscribe();
    });
  });
  
  return router;
};