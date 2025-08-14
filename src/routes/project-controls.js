/**
 * Project Controls API Routes
 * Implements Story 3.4: Advanced Project Controls
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

/**
 * Server/Project listing endpoints
 */

// List all projects/servers
router.get('/servers', async (req, res, next) => {
  try {
    const projectRegistry = req.app.locals.projectRegistry;
    
    if (!projectRegistry) {
      // Return empty list if no registry
      return res.json([]);
    }

    const result = await projectRegistry.getAllProjects();
    const projects = result.projects || result || [];
    
    // Transform to match frontend expectations
    const servers = (Array.isArray(projects) ? projects : []).map(project => ({
      id: project.id || project.name,
      name: project.name,
      status: project.status || 'stopped',
      port: project.port || null,
      type: project.type || 'docker',
      containerId: project.containerId,
      image: project.image,
      uptime: project.uptime,
      lastAction: project.lastAction,
      config: project.config || {}
    }));

    res.json(servers);
  } catch (error) {
    // Return empty array on error
    console.error('Error fetching servers:', error);
    res.json([]);
  }
});

// Get single project/server
router.get('/servers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectRegistry = req.app.locals.projectRegistry;
    
    if (!projectRegistry) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await projectRegistry.getProject(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const server = {
      id: project.id || project.name,
      name: project.name,
      status: project.status || 'stopped',
      port: project.port || null,
      type: project.type || 'docker',
      containerId: project.containerId,
      image: project.image,
      uptime: project.uptime,
      lastAction: project.lastAction,
      config: project.config || {}
    };

    res.json(server);
  } catch (error) {
    next(error);
  }
});

/**
 * Container lifecycle control endpoints
 */

// Start a project container
router.post('/projects/:id/start',
  param('id').notEmpty().withMessage('Project ID is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const containerLifecycle = req.app.locals.containerLifecycle;
      
      if (!containerLifecycle) {
        return res.status(500).json({ error: 'Container lifecycle service not initialized' });
      }

      const result = await containerLifecycle.startContainer(id);
      
      res.json({
        success: true,
        projectId: id,
        status: 'starting',
        containerId: result.containerId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Stop a project container
router.post('/projects/:id/stop',
  param('id').notEmpty().withMessage('Project ID is required'),
  body('force').optional().isBoolean().withMessage('Force must be a boolean'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { force = false } = req.body;
      const containerLifecycle = req.app.locals.containerLifecycle;
      
      if (!containerLifecycle) {
        return res.status(500).json({ error: 'Container lifecycle service not initialized' });
      }

      const result = await containerLifecycle.stopContainer(id, { force });
      
      res.json({
        success: true,
        projectId: id,
        status: 'stopped',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Restart a project container
router.post('/projects/:id/restart',
  param('id').notEmpty().withMessage('Project ID is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const containerLifecycle = req.app.locals.containerLifecycle;
      
      if (!containerLifecycle) {
        return res.status(500).json({ error: 'Container lifecycle service not initialized' });
      }

      const result = await containerLifecycle.restartContainer(id);
      
      res.json({
        success: true,
        projectId: id,
        status: 'restarting',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get health status of a project
router.get('/projects/:id/health',
  param('id').notEmpty().withMessage('Project ID is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const healthMonitor = req.app.locals.healthMonitor;
      
      if (!healthMonitor) {
        return res.status(500).json({ error: 'Health monitor service not initialized' });
      }

      const health = await healthMonitor.checkProjectHealth(id);
      
      res.json({
        projectId: id,
        healthy: health.healthy,
        status: health.status,
        checks: health.checks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Configuration management endpoints
 */

// Update project configuration
router.put('/projects/:id/config',
  param('id').notEmpty().withMessage('Project ID is required'),
  body('environment').optional().isObject().withMessage('Environment must be an object'),
  body('volumes').optional().isArray().withMessage('Volumes must be an array'),
  body('ports').optional().isObject().withMessage('Ports must be an object'),
  body('network').optional().isString().withMessage('Network must be a string'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const config = req.body;
      const projectRegistry = req.app.locals.projectRegistry;
      
      if (!projectRegistry) {
        return res.status(500).json({ error: 'Project registry service not initialized' });
      }

      // Validate port conflicts
      if (config.ports) {
        const portRegistry = req.app.locals.portRegistry;
        for (const [name, port] of Object.entries(config.ports)) {
          const isAvailable = await portRegistry.checkPort(port);
          if (!isAvailable) {
            return res.status(409).json({ 
              error: `Port ${port} is already in use`,
              suggestedPort: await portRegistry.getNextAvailablePort()
            });
          }
        }
      }

      // Update project configuration
      const project = await projectRegistry.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const updatedProject = await projectRegistry.updateProject(id, {
        config: {
          ...project.config,
          ...config
        }
      });

      // Restart container to apply changes
      const containerLifecycle = req.app.locals.containerLifecycle;
      if (containerLifecycle && project.status === 'running') {
        await containerLifecycle.restartContainer(id);
      }

      res.json({
        success: true,
        projectId: id,
        config: updatedProject.config,
        restarted: project.status === 'running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get project configuration
router.get('/projects/:id/config',
  param('id').notEmpty().withMessage('Project ID is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const projectRegistry = req.app.locals.projectRegistry;
      
      if (!projectRegistry) {
        return res.status(500).json({ error: 'Project registry service not initialized' });
      }

      const project = await projectRegistry.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        projectId: id,
        config: project.config || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Batch operations endpoint
 */

router.post('/projects/batch',
  body('action').isIn(['start', 'stop', 'restart']).withMessage('Invalid action'),
  body('projectIds').isArray().withMessage('Project IDs must be an array'),
  body('projectIds.*').isString().withMessage('Each project ID must be a string'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { action, projectIds } = req.body;
      const containerLifecycle = req.app.locals.containerLifecycle;
      
      if (!containerLifecycle) {
        return res.status(500).json({ error: 'Container lifecycle service not initialized' });
      }

      const results = {
        action,
        total: projectIds.length,
        succeeded: [],
        failed: [],
        timestamp: new Date().toISOString()
      };

      // Execute operations in parallel with error handling
      const operations = projectIds.map(async (projectId) => {
        try {
          switch(action) {
            case 'start':
              await containerLifecycle.startContainer(projectId);
              break;
            case 'stop':
              await containerLifecycle.stopContainer(projectId);
              break;
            case 'restart':
              await containerLifecycle.restartContainer(projectId);
              break;
          }
          results.succeeded.push(projectId);
        } catch (error) {
          results.failed.push({
            projectId,
            error: error.message
          });
        }
      });

      await Promise.all(operations);

      res.json(results);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Port management endpoints
 */

// Suggest available port
router.get('/ports/suggest',
  async (req, res, next) => {
    try {
      const portRegistry = req.app.locals.portRegistry;
      
      if (!portRegistry) {
        return res.status(500).json({ error: 'Port registry service not initialized' });
      }

      const port = await portRegistry.getNextAvailablePort();
      
      res.json({
        port,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Check port availability
router.get('/ports/:port/check',
  param('port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port number'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { port } = req.params;
      const portRegistry = req.app.locals.portRegistry;
      
      if (!portRegistry) {
        return res.status(500).json({ error: 'Port registry service not initialized' });
      }

      const available = await portRegistry.checkPort(parseInt(port));
      
      res.json({
        port: parseInt(port),
        available,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Container exec endpoint for debugging
 */

router.post('/projects/:id/exec',
  param('id').notEmpty().withMessage('Project ID is required'),
  body('command').notEmpty().withMessage('Command is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { command } = req.body;
      const dockerManager = req.app.locals.dockerManager;
      
      if (!dockerManager) {
        return res.status(500).json({ error: 'Docker manager service not initialized' });
      }

      const projectRegistry = req.app.locals.projectRegistry;
      const project = await projectRegistry.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!project.containerId) {
        return res.status(400).json({ error: 'Project has no running container' });
      }

      const result = await dockerManager.execCommand(project.containerId, command);
      
      res.json({
        success: true,
        projectId: id,
        output: result.output,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a project and clean up its data
router.delete('/projects/:id',
  param('id').notEmpty().withMessage('Project ID is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { projectRegistry, containerLifecycle } = req.app.locals;
      
      if (!projectRegistry) {
        return res.status(500).json({ error: 'Project registry not initialized' });
      }

      // Stop container if running
      if (containerLifecycle) {
        try {
          await containerLifecycle.stopContainer(id);
        } catch (e) {
          // Container might not be running
        }
      }

      // Remove from registry
      await projectRegistry.unregisterProject(id);
      
      res.json({
        success: true,
        message: `Project ${id} deleted`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Clear all projects (danger zone)
router.post('/projects/clear-all',
  body('confirm').equals('DELETE_ALL').withMessage('Must confirm with DELETE_ALL'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectRegistry, containerLifecycle } = req.app.locals;
      
      if (!projectRegistry) {
        return res.status(500).json({ error: 'Project registry not initialized' });
      }

      // Get all projects
      const result = await projectRegistry.getAllProjects();
      const projects = result.projects || result || [];
      
      let deleted = 0;
      let failed = 0;
      
      // Stop and delete each project
      for (const project of projects) {
        try {
          const projectId = project.projectId || project.id || project.name;
          
          // Stop container if running
          if (containerLifecycle) {
            try {
              await containerLifecycle.stopContainer(projectId);
            } catch (e) {
              // Container might not be running
            }
          }
          
          // Remove from registry
          await projectRegistry.unregisterProject(projectId);
          deleted++;
        } catch (e) {
          failed++;
        }
      }
      
      res.json({
        success: true,
        message: 'All projects cleared',
        deleted,
        failed,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Clear test/error projects only
router.post('/projects/clear-errors',
  async (req, res, next) => {
    try {
      const { projectRegistry, containerLifecycle } = req.app.locals;
      
      if (!projectRegistry) {
        return res.status(500).json({ error: 'Project registry not initialized' });
      }

      // Get all projects
      const result = await projectRegistry.getAllProjects();
      const projects = result.projects || result || [];
      
      let deleted = 0;
      
      // Delete only error/test projects
      for (const project of projects) {
        if (project.status === 'error' || project.name?.includes('Test')) {
          try {
            const projectId = project.projectId || project.id || project.name;
            
            // Stop container if running
            if (containerLifecycle) {
              try {
                await containerLifecycle.stopContainer(projectId);
              } catch (e) {
                // Container might not be running
              }
            }
            
            // Remove from registry
            await projectRegistry.unregisterProject(projectId);
            deleted++;
          } catch (e) {
            // Skip failed deletions
          }
        }
      }
      
      res.json({
        success: true,
        message: 'Error/test projects cleared',
        deleted,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;