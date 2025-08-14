/**
 * Docker Container Management Routes
 * Provides API endpoints for Docker container lifecycle management
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/containers - Create and start a new container
 */
router.post('/containers', async (req, res) => {
  try {
    const { projectId, type, workspace, port, command } = req.body;
    
    if (!projectId || !type || !workspace) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, type, workspace' 
      });
    }

    const dockerManager = req.app.locals.dockerManager;
    const portRegistry = req.app.locals.portRegistry;
    
    // Allocate port if not provided
    const assignedPort = port || await portRegistry.allocatePort(type, projectId);
    
    // Create container configuration
    const config = {
      projectId,
      type,
      workspace,
      port: assignedPort,
      env: {
        DEV_COMMAND: command || 'npm run dev'
      }
    };
    
    // Create and start the container
    const container = await dockerManager.createContainer(config);
    await dockerManager.startContainer(container.id);
    
    res.json({
      containerId: container.id,
      projectId,
      port: assignedPort,
      status: 'running'
    });
  } catch (error) {
    console.error('Error creating container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/containers - List all containers
 */
router.get('/containers', async (req, res) => {
  try {
    const dockerManager = req.app.locals.dockerManager;
    const containers = await dockerManager.listContainers();
    res.json(containers);
  } catch (error) {
    console.error('Error listing containers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/containers/:id/stop - Stop a container
 */
router.post('/containers/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    
    await dockerManager.stopContainer(id);
    res.json({ message: 'Container stopped', containerId: id });
  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/containers/:id/restart - Restart a container
 */
router.post('/containers/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    
    await dockerManager.restartContainer(id);
    res.json({ message: 'Container restarted', containerId: id });
  } catch (error) {
    console.error('Error restarting container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/containers/:id/logs - Get container logs
 */
router.get('/containers/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { tail = 50 } = req.query;
    const dockerManager = req.app.locals.dockerManager;
    
    const logs = await dockerManager.getContainerLogs(id, { tail: parseInt(tail) });
    res.send(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/containers/:id - Remove a container
 */
router.delete('/containers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    const portRegistry = req.app.locals.portRegistry;
    
    // Get container info to release port
    const container = await dockerManager.getContainer(id);
    const projectId = container.Labels?.['project-id'];
    
    // Stop and remove container
    await dockerManager.stopContainer(id);
    await dockerManager.removeContainer(id);
    
    // Release port
    if (projectId) {
      const ports = container.Ports || [];
      ports.forEach(p => {
        if (p.PublicPort) {
          portRegistry.releasePort(p.PublicPort);
        }
      });
    }
    
    res.json({ message: 'Container removed', containerId: id });
  } catch (error) {
    console.error('Error removing container:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;