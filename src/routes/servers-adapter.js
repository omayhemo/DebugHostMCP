/**
 * Servers Adapter Routes
 * Adapts Docker container data to the Server format expected by the dashboard
 */

const express = require('express');
const router = express.Router();

/**
 * Transform Docker container to Server format
 */
function containerToServer(container) {
  const projectId = container.Labels?.['project-id'] || 'unknown';
  const containerType = container.Labels?.['container-type'] || 'unknown';
  const isRunning = container.State === 'running';
  
  // Extract port from Ports array
  let port;
  if (container.Ports && container.Ports.length > 0) {
    port = container.Ports[0].PublicPort;
  }
  
  return {
    sessionId: container.Id.substring(0, 12), // Use short container ID
    name: projectId,
    command: `docker run ${containerType}`,
    cwd: `/app`, // Default working directory in container
    port: port,
    status: isRunning ? 'running' : 'stopped',
    pid: null, // Docker containers don't expose host PID
    startedAt: new Date(container.Created * 1000).toISOString(),
    env: {
      PROJECT_ID: projectId,
      CONTAINER_TYPE: containerType,
      DEBUG_HOST: 'true'
    }
  };
}

/**
 * GET /api/servers - List all servers (containers)
 */
router.get('/servers', async (req, res) => {
  try {
    const dockerManager = req.app.locals.dockerManager;
    
    if (!dockerManager) {
      return res.json([]);
    }
    
    const containers = await dockerManager.listContainers();
    const servers = containers.map(containerToServer);
    
    res.json(servers);
  } catch (error) {
    console.error('Error listing servers:', error);
    res.json([]);
  }
});

/**
 * GET /api/servers/status - Get status of all servers
 */
router.get('/servers/status', async (req, res) => {
  try {
    const dockerManager = req.app.locals.dockerManager;
    
    if (!dockerManager) {
      return res.json([]);
    }
    
    const containers = await dockerManager.listContainers();
    const servers = containers.map(containerToServer);
    
    res.json(servers);
  } catch (error) {
    console.error('Error getting servers status:', error);
    res.json([]);
  }
});

/**
 * POST /api/servers/:id/start - Start a server (container)
 */
router.post('/servers/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    
    // Find the full container ID
    const containers = await dockerManager.listContainers();
    const container = containers.find(c => c.Id.startsWith(id));
    
    if (!container) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await dockerManager.startContainer(container.Id);
    res.json({ success: true, message: 'Server started' });
  } catch (error) {
    console.error('Error starting server:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/servers/:id/stop - Stop a server (container)
 */
router.post('/servers/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    
    // Find the full container ID
    const containers = await dockerManager.listContainers();
    const container = containers.find(c => c.Id.startsWith(id));
    
    if (!container) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await dockerManager.stopContainer(container.Id);
    res.json({ success: true, message: 'Server stopped' });
  } catch (error) {
    console.error('Error stopping server:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/servers/:id/restart - Restart a server (container)
 */
router.post('/servers/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const dockerManager = req.app.locals.dockerManager;
    
    // Find the full container ID
    const containers = await dockerManager.listContainers();
    const container = containers.find(c => c.Id.startsWith(id));
    
    if (!container) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await dockerManager.restartContainer(container.Id);
    res.json({ success: true, message: 'Server restarted' });
  } catch (error) {
    console.error('Error restarting server:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/servers/:id/logs - Get server logs
 */
router.get('/servers/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { tail = 100 } = req.query;
    const dockerManager = req.app.locals.dockerManager;
    
    // Find the full container ID
    const containers = await dockerManager.listContainers();
    const container = containers.find(c => c.Id.startsWith(id));
    
    if (!container) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const logs = await dockerManager.getContainerLogs(container.Id, { tail: parseInt(tail) });
    res.json({ logs });
  } catch (error) {
    console.error('Error getting server logs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;