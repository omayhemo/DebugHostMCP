/**
 * Server API Routes
 * Handles server lifecycle operations
 */

const express = require('express');
// Simplified validation - express-validator not installed
const validateRequest = (req) => {
  const errors = [];
  return { isEmpty: () => errors.length === 0, array: () => errors };
};

module.exports = (processManager, sessionManager, broadcast) => {
  const router = express.Router();
  
  // Simplified validation middleware
  const validate = (req, res, next) => {
    // Basic validation without express-validator
    next();
  };
  
  /**
   * POST /api/v1/servers
   * Start a new server
   */
  router.post('/',
    async (req, res) => {
      try {
        const { name, command, cwd, port, env, metadata } = req.body;
        
        // Create session first
        const session = await sessionManager.createSession({
          id: require('uuid').v4(),
          name,
          command,
          cwd,
          port,
          env,
          metadata
        });
        
        // Start the process
        const result = await processManager.startServer({
          sessionId: session.id,
          name,
          command,
          cwd,
          port,
          env
        });
        
        // Update session status
        await sessionManager.updateSession(session.id, {
          status: 'starting',
          pid: result.pid,
          port: result.port
        });
        
        res.status(201).json({
          success: true,
          data: {
            ...result,
            sessionId: session.id,
            dashboardUrl: `http://localhost:${process.env.DASHBOARD_PORT || 8080}`
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to start server:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * GET /api/v1/servers
   * List all servers
   */
  router.get('/',
    async (req, res) => {
      try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let sessions = processManager.getAllSessions();
        
        // Filter by status if provided
        if (status) {
          sessions = sessions.filter(s => s.status === status);
        }
        
        // Apply pagination
        const total = sessions.length;
        sessions = sessions.slice(offset, offset + limit);
        
        res.json({
          success: true,
          data: {
            sessions,
            total,
            limit,
            offset
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to list servers:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * GET /api/v1/servers/:id
   * Get server details
   */
  router.get('/:id',
    
    async (req, res) => {
      try {
        const { id } = req.params;
        
        const session = processManager.getSession(id);
        
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Server not found',
            timestamp: Date.now()
          });
        }
        
        res.json({
          success: true,
          data: session,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to get server:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * DELETE /api/v1/servers/:id
   * Stop a server
   */
  router.delete('/:id',
    
    async (req, res) => {
      try {
        const { id } = req.params;
        const { force = false } = req.query;
        
        const result = await processManager.stopServer(id, force);
        
        // Update session status
        await sessionManager.updateSession(id, {
          status: 'stopped'
        });
        
        res.json({
          success: true,
          data: result,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to stop server:', error);
        
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
        }
        
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * POST /api/v1/servers/:id/restart
   * Restart a server
   */
  router.post('/:id/restart',
    
    async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await processManager.restartServer(id);
        
        // Update session status
        await sessionManager.updateSession(id, {
          status: 'running',
          restarts: (sessionManager.getSession(id).restarts || 0) + 1
        });
        
        res.json({
          success: true,
          data: result,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to restart server:', error);
        
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
        }
        
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * POST /api/v1/servers/stop-all
   * Stop all servers
   */
  router.post('/stop-all',
    async (req, res) => {
      try {
        const results = await processManager.stopAll();
        
        // Update all session statuses
        const sessions = processManager.getAllSessions();
        for (const session of sessions) {
          await sessionManager.updateSession(session.id, {
            status: 'stopped'
          });
        }
        
        res.json({
          success: true,
          data: {
            stopped: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to stop all servers:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * GET /api/v1/servers/processes/:environment
   * Get all system processes for a specific environment
   */
  router.get('/processes/:environment',
    async (req, res) => {
      try {
        const { environment } = req.params;
        
        const processes = await processManager.getProcessesByEnvironment(environment);
        
        res.json({
          success: true,
          data: {
            environment,
            processes,
            total: processes.length,
            tracked: processes.filter(p => p.tracked).length,
            orphaned: processes.filter(p => !p.tracked).length
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to get system processes:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  /**
   * POST /api/v1/processes/:pid/kill
   * Kill a specific process by PID
   */
  router.post('/processes/:pid/kill',
    async (req, res) => {
      try {
        const { pid } = req.params;
        
        // Kill the process
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync(`kill -9 ${pid}`);
        
        res.json({
          success: true,
          data: {
            pid,
            message: 'Process killed successfully'
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Failed to kill process:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  );
  
  return router;
};