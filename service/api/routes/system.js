/**
 * System API Routes
 */

const express = require('express');
const os = require('os');

module.exports = (processManager, sessionManager, config) => {
  const router = express.Router();
  
  // GET /api/v1/system/metrics
  router.get('/metrics', (req, res) => {
    const metrics = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg()
      },
      service: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        pid: process.pid,
        versions: process.versions
      },
      sessions: {
        total: sessionManager.getAllSessions().length,
        active: sessionManager.getActiveSessions().length
      }
    };
    
    res.json({
      success: true,
      data: metrics,
      timestamp: Date.now()
    });
  });
  
  // GET /api/v1/system/config
  router.get('/config', (req, res) => {
    res.json({
      success: true,
      data: {
        apiPort: config.apiPort,
        dashboardPort: config.dashboardPort,
        maxSessions: config.maxSessions,
        sessionTimeout: config.sessionTimeout
      },
      timestamp: Date.now()
    });
  });
  
  return router;
};