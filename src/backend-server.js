#!/usr/bin/env node

/**
 * Backend HTTP Server for Container Management
 * Runs independently from the MCP server on port 2601
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require for loading CommonJS modules
const customRequire = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 2603;
const HOST = '127.0.0.1';

// Docker mode configuration
const USE_DOCKER = process.env.USE_DOCKER === 'true' || false;
let dockerManager = null;
let DockerManager = null;

// Try to load Docker Manager module if Docker mode is enabled
if (USE_DOCKER) {
  try {
    DockerManager = customRequire('./docker-manager.cjs');
  } catch (error) {
    console.error('Failed to load Docker Manager module:', error.message);
  }
}

// Initialize Docker Manager if enabled
async function initializeDocker() {
  if (USE_DOCKER && DockerManager) {
    try {
      dockerManager = new DockerManager();
      await dockerManager.initialize();
      console.log('Docker mode enabled and initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Docker:', error.message);
      console.log('Falling back to native process mode');
      return false;
    }
  }
  return false;
}

// Initialize Docker on startup
initializeDocker().catch(console.error);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    service: 'backend-server',
    memory: process.memoryUsage()
  });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MCP Debug Host Backend',
    version: '2.0.0',
    description: 'Container management backend server',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/info': 'API information',
      'GET /api/projects': 'List all projects',
      'POST /api/projects/:id/start': 'Start a project',
      'POST /api/projects/:id/stop': 'Stop a project',
      'POST /api/projects/:id/restart': 'Restart a project',
      'GET /api/projects/:id/status': 'Get project status',
      'GET /api/projects/:id/logs': 'Get project logs'
    }
  });
});

// List projects endpoint - returns servers format for dashboard
app.get('/api/servers', async (req, res) => {
  try {
    // Try to read from MCP Debug Host config
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    let projects = [];
    
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(data);
      projects = config.projects || [];
    } catch (e) {
      console.log('Config not found, using empty project list');
    }
    
    // Transform to server format expected by frontend
    const servers = [];
    for (const project of projects) {
      let status = 'stopped';
      let pid = null;
      let actualPort = null;
      let containerId = null;
      let mode = 'native';
      
      // First check for Docker container if Docker mode is enabled
      if (USE_DOCKER && dockerManager) {
        try {
          const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${project.name}.json`);
          const containerData = await fs.readFile(containerFile, 'utf-8');
          const containerInfo = JSON.parse(containerData);
          
          if (containerInfo.mode === 'docker' && containerInfo.containerId) {
            // Check if container is still running
            try {
              const container = await dockerManager.getContainer(containerInfo.containerId);
              if (container.State && container.State.Running) {
                status = 'running';
                containerId = containerInfo.containerId;
                actualPort = project.port;
                mode = 'docker';
              } else {
                status = 'stopped';
                containerId = containerInfo.containerId;
                mode = 'docker';
              }
            } catch (e) {
              // Container doesn't exist anymore
              await fs.unlink(containerFile).catch(() => {});
            }
          }
        } catch (e) {
          // No container file or error reading it
        }
      }
      
      // If not using Docker or no Docker container found, check native process
      if (status === 'stopped' && mode === 'native') {
        // Check PID file to see if we started this server
        const pidFile = path.join(process.env.HOME || '', '.apm-debug-host', 'pids', `${project.name}.pid`);
        try {
          const pidData = await fs.readFile(pidFile, 'utf-8');
          const processInfo = JSON.parse(pidData);
          
          // Check if the process is still running
          try {
            // Check if process exists (kill -0 just checks, doesn't kill)
            await execAsync(`kill -0 ${processInfo.pid} 2>/dev/null`);
            
            // Process exists, now verify it's actually our process
            const { stdout: cmdline } = await execAsync(`ps -p ${processInfo.pid} -o args= 2>/dev/null || true`);
            
            // Check if it's running our expected command
            if (cmdline && (cmdline.includes(project.path) || cmdline.includes('tsx') || cmdline.includes('npm'))) {
              status = 'running';
              pid = processInfo.pid;
              
              // Also check if it's actually listening on the expected port
              if (project.port) {
                const { stdout: portCheck } = await execAsync(`lsof -i :${project.port} -t 2>/dev/null | grep ^${processInfo.pid}$ || true`);
                if (portCheck.trim()) {
                  actualPort = project.port;
                }
              }
            } else {
              // Process exists but it's not our process - clean up PID file
              await fs.unlink(pidFile).catch(() => {});
            }
          } catch (e) {
            // Process doesn't exist - clean up PID file
            await fs.unlink(pidFile).catch(() => {});
          }
        } catch (e) {
          // No PID file or invalid PID file
          // Fall back to port checking but this is less reliable
          if (project.port) {
            try {
              const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
              if (stdout.trim()) {
                // Something is on the port but we don't know if it's our server
                console.warn(`Port ${project.port} is in use but no PID file for ${project.name} - may not be our process`);
                // Don't set status to running unless we're sure
              }
            } catch (e) {
              // Port check failed
            }
          }
        }
      }
      
      servers.push({
        sessionId: project.name,
        id: project.name,
        name: project.name,
        command: project.type === 'node' ? 'npm run dev' : 
                 project.type === 'python' ? 'python app.py' : 
                 'npm start',
        cwd: project.path,
        port: project.port,
        type: project.type,
        status: status,
        pid: pid,
        path: project.path,
        actualPort: actualPort,
        mode: mode,
        containerId: containerId
      });
    }
    
    res.json(servers);
  } catch (error) {
    console.error('Error listing servers:', error);
    res.json([]);
  }
});

// Alias for backward compatibility
app.get('/api/projects', async (req, res) => {
  return app._router.handle({ ...req, url: '/api/servers' }, res);
});

// Get all servers status - needed by LogsPage
app.get('/api/servers/status', async (req, res) => {
  try {
    // Get all servers with their current status
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    let projects = [];
    
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(data);
      projects = config.projects || [];
    } catch (e) {
      console.log('Config not found, using empty project list');
    }
    
    // Check status for all servers
    const servers = [];
    for (const project of projects) {
      let status = 'stopped';
      let pid = null;
      
      if (project.port) {
        try {
          const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
          if (stdout.trim()) {
            status = 'running';
            const parts = stdout.trim().split(/\s+/);
            if (parts[1]) {
              pid = parseInt(parts[1]);
            }
          }
        } catch (e) {
          // Port check failed
        }
      }
      
      servers.push({
        sessionId: project.name,
        id: project.name,
        name: project.name,
        command: project.type === 'node' ? 'npm run dev' : 
                 project.type === 'python' ? 'python app.py' : 
                 'npm start',
        cwd: project.path,
        port: project.port,
        type: project.type,
        status: status,
        pid: pid,
        path: project.path,
        startedAt: status === 'running' ? new Date().toISOString() : null
      });
    }
    
    res.json(servers);
  } catch (error) {
    console.error('Error getting servers status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single server status  
app.get('/api/servers/:id/status', async (req, res) => {
  const { id } = req.params;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    let status = 'stopped';
    let pid = null;
    
    if (project.port) {
      try {
        const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
        if (stdout.trim()) {
          status = 'running';
          const parts = stdout.trim().split(/\s+/);
          if (parts[1]) {
            pid = parseInt(parts[1]);
          }
        }
      } catch (e) {
        // Port check failed
      }
    }
    
    res.json({
      sessionId: project.name,
      name: project.name,
      status,
      port: project.port,
      type: project.type,
      path: project.path,
      pid: pid,
      startedAt: status === 'running' ? new Date().toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project status (old endpoint for compatibility)
app.get('/api/projects/:id/status', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if there's a process running on the project's port
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    let status = 'stopped';
    if (project.port) {
      try {
        const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN`);
        if (stdout) {
          status = 'running';
        }
      } catch {
        // Port not in use, service is stopped
      }
    }
    
    res.json({
      name: project.name,
      status,
      port: project.port,
      type: project.type,
      path: project.path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server endpoint (compatible with both /servers and /projects paths)
app.post('/api/servers/:id/start', async (req, res) => {
  const { id } = req.params;
  const forceNative = req.query.native === 'true' || req.body?.forceNative === true;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if we already started this server
    const pidFile = path.join(process.env.HOME || '', '.apm-debug-host', 'pids', `${id}.pid`);
    const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${id}.json`);
    
    // Check for existing PID file (native process)
    try {
      const pidData = await fs.readFile(pidFile, 'utf-8');
      const processInfo = JSON.parse(pidData);
      
      // Check if process is still running
      try {
        await execAsync(`kill -0 ${processInfo.pid} 2>/dev/null`);
        // Process exists and is ours
        return res.json({ 
          success: true,
          message: `Server ${id} is already running (native process)`,
          status: 'running',
          pid: processInfo.pid,
          mode: 'native'
        });
      } catch (e) {
        // Process doesn't exist, clean up PID file
        await fs.unlink(pidFile).catch(() => {});
      }
    } catch (e) {
      // No PID file
    }
    
    // Check for existing Docker container
    if (USE_DOCKER && dockerManager) {
      try {
        const containerData = await fs.readFile(containerFile, 'utf-8');
        const containerInfo = JSON.parse(containerData);
        
        if (containerInfo.mode === 'docker' && containerInfo.containerId) {
          const container = await dockerManager.getContainer(containerInfo.containerId);
          if (container.State && container.State.Running) {
            return res.json({ 
              success: true,
              message: `Server ${id} is already running (Docker container)`,
              status: 'running',
              containerId: containerInfo.containerId,
              mode: 'docker'
            });
          }
        }
      } catch (e) {
        // No container file or container not running
      }
    }
    
    // Check if port is in use by another process
    if (project.port) {
      try {
        const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
        if (stdout.trim()) {
          // Port is in use but not by our process
          console.warn(`Port ${project.port} is already in use by another process`);
          return res.status(409).json({ 
            success: false,
            error: `Port ${project.port} is already in use by another process. Please stop that process first.`,
            status: 'port_conflict'
          });
        }
      } catch (e) {
        // Port not in use, continue with start
      }
    }
    
    // Use Docker if enabled and available (unless forced to native mode)
    if (USE_DOCKER && dockerManager && !forceNative) {
      try {
        console.log(`Starting ${id} using Docker`);
        
        // Check if container already exists for this project
        const existingContainer = await dockerManager.getContainerByProject(id).catch(() => null);
        
        if (existingContainer) {
          // Start existing container
          await dockerManager.startContainer(existingContainer.id);
          
          return res.json({
            success: true,
            message: `Docker container for ${id} started successfully`,
            containerId: existingContainer.id,
            containerName: existingContainer.name,
            port: project.port,
            mode: 'docker'
          });
        } else {
          // Create and start new container
          const containerInfo = await dockerManager.createContainer({
            projectId: id,
            type: project.type,
            workspace: project.path,
            port: project.port,
            env: {}
          });
          
          await dockerManager.startContainer(containerInfo.containerId);
          
          // Wait a moment and check if container is still running
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const containerStatus = await dockerManager.getContainer(containerInfo.containerId);
            if (!containerStatus.State || !containerStatus.State.Running) {
              // Container crashed - get logs for diagnostics
              const logs = await dockerManager.getContainerLogs(containerInfo.containerId, { tail: 50 });
              
              // Clean up the failed container
              await dockerManager.removeContainer(containerInfo.containerId, true);
              
              // Try to identify the problem
              let problemDetails = "Container failed to start.";
              let suggestion = "Check the application configuration.";
              
              if (logs.includes('nodemon') && project.path.includes('vite')) {
                problemDetails = "The Docker image uses nodemon but this appears to be a Vite project.";
                suggestion = "Try using native mode instead (disable Docker mode).";
              } else if (logs.includes('EADDRINUSE')) {
                problemDetails = `Port ${project.port} is already in use inside the container.`;
                suggestion = "Stop any other processes using this port.";
              } else if (logs.includes('Cannot find module')) {
                problemDetails = "Missing dependencies in the container.";
                suggestion = "Run 'npm install' in the project directory.";
              }
              
              console.error(`Docker container for ${id} failed:`, problemDetails);
              console.error('Container logs:', logs);
              
              return res.status(500).json({
                success: false,
                error: `Docker container crashed: ${problemDetails}`,
                suggestion,
                logs: logs.substring(0, 500), // Include some logs for debugging
                fallbackAvailable: true,
                mode: 'docker'
              });
            }
          } catch (e) {
            console.error(`Failed to check container status for ${id}:`, e);
          }
          
          // Save container ID to tracking file
          const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${id}.json`);
          await fs.mkdir(path.dirname(containerFile), { recursive: true }).catch(() => {});
          await fs.writeFile(containerFile, JSON.stringify({
            containerId: containerInfo.containerId,
            containerName: containerInfo.name,
            projectId: id,
            port: project.port,
            startedAt: new Date().toISOString(),
            mode: 'docker'
          }, null, 2));
          
          return res.json({
            success: true,
            message: `Docker container for ${id} created and started`,
            containerId: containerInfo.containerId,
            containerName: containerInfo.name,
            port: project.port,
            mode: 'docker'
          });
        }
      } catch (dockerError) {
        console.error(`Docker start failed for ${id}, falling back to native:`, dockerError.message);
        // Fall through to native process mode
      }
    }
    
    // Native process mode (original logic)
    console.log(`Starting ${id} using native process`);
    
    // Start based on project type
    let command;
    const logFile = path.join('/tmp', `${id}.log`);
    
    switch (project.type) {
      case 'node':
        // Check for package.json and determine the right command
        try {
          const packageJsonPath = path.join(project.path, 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
          
          // Check for dev script first, then start
          if (packageJson.scripts?.dev) {
            command = 'npm run dev';
          } else if (packageJson.scripts?.start) {
            command = 'npm start';
          } else {
            command = 'node index.js';
          }
        } catch {
          command = 'npm run dev';
        }
        break;
      case 'python':
        command = 'python app.py';
        break;
      case 'php':
        command = `php -S 127.0.0.1:${project.port || 8080}`;
        break;
      case 'static':
        command = `python -m http.server ${project.port || 8080}`;
        break;
      default:
        return res.status(400).json({ error: 'Unknown project type' });
    }
    
    // Start the project in background
    console.log(`Starting ${id}: cd ${project.path} && ${command}`);
    
    // Ensure PID directory exists
    await fs.mkdir(path.dirname(pidFile), { recursive: true }).catch(() => {});
    
    exec(`cd ${project.path} && nohup ${command} > ${logFile} 2>&1 & echo $!`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting ${id}:`, error);
        return res.status(500).json({ error: error.message });
      }
      
      const pid = stdout.trim();
      console.log(`Started ${id} with PID ${pid}`);
      
      // Save PID and metadata to file
      const processInfo = {
        pid: parseInt(pid),
        projectId: id,
        command,
        port: project.port,
        startedAt: new Date().toISOString(),
        path: project.path,
        mode: 'native'
      };
      
      try {
        await fs.writeFile(pidFile, JSON.stringify(processInfo, null, 2));
        console.log(`Saved PID file for ${id}: ${pidFile}`);
      } catch (e) {
        console.error(`Failed to save PID file for ${id}:`, e);
      }
      
      res.json({ 
        success: true,
        message: `Server ${id} started successfully`,
        command,
        pid: parseInt(pid),
        logFile,
        pidFile,
        port: project.port,
        mode: 'native'
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for projects path - redirect to servers endpoint
app.post('/api/projects/:id/start', async (req, res) => {
  return app._router.handle({ ...req, url: `/api/servers/${req.params.id}/start` }, res);
});

// Stop server endpoint
app.post('/api/servers/:id/stop', async (req, res) => {
  const { id } = req.params;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    let stopped = false;
    
    // Check for Docker container first
    if (USE_DOCKER && dockerManager) {
      try {
        const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${id}.json`);
        const containerData = await fs.readFile(containerFile, 'utf-8');
        const containerInfo = JSON.parse(containerData);
        
        if (containerInfo.mode === 'docker' && containerInfo.containerId) {
          // Stop Docker container
          await dockerManager.stopContainer(containerInfo.containerId);
          console.log(`Stopped Docker container ${containerInfo.containerId} for ${id}`);
          
          // Don't remove container file - keep it for restart
          stopped = true;
          
          return res.json({
            success: true,
            message: `Docker container for ${id} stopped`,
            stopped: true,
            mode: 'docker'
          });
        }
      } catch (e) {
        // No container file or not Docker mode
        console.log(`No Docker container for ${id}, checking native process`);
      }
    }
    
    // Native process mode
    const pidFile = path.join(process.env.HOME || '', '.apm-debug-host', 'pids', `${id}.pid`);
    
    // First try to stop using PID file
    try {
      const pidData = await fs.readFile(pidFile, 'utf-8');
      const processInfo = JSON.parse(pidData);
      
      // Try to kill the process
      try {
        await execAsync(`kill ${processInfo.pid}`);
        console.log(`Stopped process ${processInfo.pid} for server ${id}`);
        stopped = true;
        
        // Clean up PID file
        await fs.unlink(pidFile).catch(() => {});
      } catch (e) {
        // Process might already be dead
        console.log(`Process ${processInfo.pid} for ${id} may already be stopped`);
        await fs.unlink(pidFile).catch(() => {});
      }
    } catch (e) {
      console.log(`No PID file for ${id}, falling back to port-based stop`);
      
      // Fall back to port-based stopping (less reliable)
      if (project.port) {
        try {
          const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
          if (stdout.trim()) {
            const parts = stdout.trim().split(/\s+/);
            if (parts[1]) {
              const pid = parseInt(parts[1]);
              await execAsync(`kill ${pid}`);
              console.log(`Stopped process ${pid} on port ${project.port} for server ${id}`);
              stopped = true;
            }
          }
        } catch (e) {
          console.error(`Error stopping server ${id} by port:`, e);
        }
      }
    }
    
    res.json({ 
      success: true,
      message: stopped ? `Server ${id} stopped` : `Server ${id} was not running`,
      stopped,
      mode: 'native'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for projects
app.post('/api/projects/:id/stop', async (req, res) => {
  const { id } = req.params;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.port) {
      // Kill process using the port
      try {
        const { stdout } = await execAsync(`lsof -t -i:${project.port}`);
        if (stdout) {
          const pids = stdout.trim().split('\n');
          for (const pid of pids) {
            await execAsync(`kill ${pid}`);
          }
        }
      } catch {
        // No process found
      }
    }
    
    res.json({ message: `Project ${id} stopped` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart server endpoint
app.post('/api/servers/:id/restart', async (req, res) => {
  const { id } = req.params;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    const project = config.projects?.find(p => p.name === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check for Docker container first
    if (USE_DOCKER && dockerManager) {
      try {
        const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${id}.json`);
        const containerData = await fs.readFile(containerFile, 'utf-8');
        const containerInfo = JSON.parse(containerData);
        
        if (containerInfo.mode === 'docker' && containerInfo.containerId) {
          // Restart Docker container
          await dockerManager.restartContainer(containerInfo.containerId);
          console.log(`Restarted Docker container ${containerInfo.containerId} for ${id}`);
          
          return res.json({
            success: true,
            message: `Docker container for ${id} restarted`,
            containerId: containerInfo.containerId,
            port: project.port,
            mode: 'docker'
          });
        }
      } catch (e) {
        // No container file or not Docker mode
        console.log(`No Docker container for ${id}, restarting native process`);
      }
    }
    
    // Native process mode - stop the server first if it's running
    if (project.port) {
      try {
        const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
        if (stdout.trim()) {
          const parts = stdout.trim().split(/\s+/);
          if (parts[1]) {
            const pid = parseInt(parts[1]);
            await execAsync(`kill ${pid}`);
            console.log(`Stopped process ${pid} for server ${id}`);
            // Wait a bit for port to be released
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (e) {
        console.error(`Error stopping server ${id} for restart:`, e);
      }
    }
    
    // Now start it again using the same logic as start endpoint
    let command;
    const logFile = path.join('/tmp', `${id}.log`);
    
    switch (project.type) {
      case 'node':
        try {
          const packageJsonPath = path.join(project.path, 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
          
          if (packageJson.scripts?.dev) {
            command = 'npm run dev';
          } else if (packageJson.scripts?.start) {
            command = 'npm start';
          } else {
            command = 'node index.js';
          }
        } catch {
          command = 'npm run dev';
        }
        break;
      case 'python':
        command = 'python app.py';
        break;
      case 'php':
        command = `php -S 127.0.0.1:${project.port || 8080}`;
        break;
      case 'static':
        command = `python -m http.server ${project.port || 8080}`;
        break;
      default:
        return res.status(400).json({ error: 'Unknown project type' });
    }
    
    // Start the project in background
    console.log(`Restarting ${id}: cd ${project.path} && ${command}`);
    exec(`cd ${project.path} && nohup ${command} > ${logFile} 2>&1 & echo $!`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error restarting ${id}:`, error);
        return res.status(500).json({ error: error.message });
      }
      
      const pid = stdout.trim();
      console.log(`Restarted ${id} with PID ${pid}`);
      
      res.json({ 
        success: true,
        message: `Server ${id} restarted successfully`,
        command,
        pid: parseInt(pid),
        logFile,
        port: project.port
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for projects - redirect to servers endpoint
app.post('/api/projects/:id/restart', async (req, res) => {
  return app._router.handle({ ...req, url: `/api/servers/${req.params.id}/restart` }, res);
});

// Get project logs (supports both Docker and native)
app.get('/api/projects/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { tail = 100 } = req.query;
  
  try {
    let logs = '';
    let source = 'none';
    
    // Check for Docker container first
    if (USE_DOCKER && dockerManager) {
      try {
        const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${id}.json`);
        const containerData = await fs.readFile(containerFile, 'utf-8');
        const containerInfo = JSON.parse(containerData);
        
        if (containerInfo.containerId) {
          try {
            logs = await dockerManager.getContainerLogs(containerInfo.containerId, { tail: parseInt(tail) });
            source = 'docker';
          } catch (e) {
            console.log(`Failed to get Docker logs for ${id}:`, e.message);
          }
        }
      } catch (e) {
        // No container file
      }
    }
    
    // Fall back to native process logs
    if (!logs) {
      const logFile = `/tmp/${id}.log`;
      try {
        const { stdout } = await execAsync(`tail -n ${tail} ${logFile} 2>/dev/null`);
        if (stdout) {
          logs = stdout;
          source = 'native';
        }
      } catch (e) {
        // No native logs
      }
    }
    
    res.json({
      project: id,
      logs: logs || 'No logs available',
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      project: id,
      logs: 'Error fetching logs',
      error: error.message
    });
  }
});

// Alias for servers
app.get('/api/servers/:id/logs', async (req, res) => {
  return app._router.handle({ ...req, url: `/api/projects/${req.params.id}/logs` }, res);
});

// SSE Log streaming endpoint for real-time logs
app.get('/api/mcp/logs/:source/stream', async (req, res) => {
  const { source } = req.params; // 'local' or other sources
  const { containerName, tail = 100, follow = 'true' } = req.query;
  
  if (!containerName) {
    return res.status(400).json({ error: 'containerName is required' });
  }
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to log stream' })}\n\n`);
  
  let logProcess = null;
  let dockerLogStream = null;
  
  try {
    // Check if this is a Docker container
    let isDocker = false;
    let containerId = null;
    
    if (USE_DOCKER && dockerManager) {
      try {
        const containerFile = path.join(process.env.HOME || '', '.apm-debug-host', 'containers', `${containerName}.json`);
        const containerData = await fs.readFile(containerFile, 'utf-8');
        const containerInfo = JSON.parse(containerData);
        if (containerInfo.containerId) {
          isDocker = true;
          containerId = containerInfo.containerId;
        }
      } catch (e) {
        // Not a Docker container
      }
    }
    
    if (isDocker && containerId) {
      // Stream Docker logs
      console.log(`Streaming Docker logs for ${containerName} (${containerId})`);
      
      try {
        const container = dockerManager.docker.getContainer(containerId);
        
        // First send historical logs
        const historicalLogs = await dockerManager.getContainerLogs(containerId, { tail: parseInt(tail) });
        if (historicalLogs) {
          const lines = historicalLogs.split('\n').filter(line => line.trim());
          for (const line of lines) {
            // Clean up Docker log format (remove the binary header if present)
            const cleanLine = line.replace(/^[\x00-\x08].*?[TZ]\s+/, '');
            res.write(`data: ${JSON.stringify({ 
              log: cleanLine + '\n',
              source: 'docker',
              timestamp: new Date().toISOString()
            })}\n\n`);
          }
        }
        
        // Now stream new logs if follow is true
        if (follow === 'true') {
          const stream = await container.logs({
            stdout: true,
            stderr: true,
            follow: true,
            tail: 0  // Only new logs from this point
          });
          
          dockerLogStream = stream;
          
          stream.on('data', (chunk) => {
            // Docker logs come with a header we need to strip
            let log = chunk.toString('utf8');
            // Remove Docker's 8-byte header if present
            if (log.charCodeAt(0) < 32) {
              log = log.substring(8);
            }
            
            res.write(`data: ${JSON.stringify({ 
              log: log,
              source: 'docker',
              timestamp: new Date().toISOString()
            })}\n\n`);
          });
          
          stream.on('error', (error) => {
            console.error('Docker log stream error:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
          });
        }
      } catch (error) {
        console.error(`Failed to stream Docker logs for ${containerName}:`, error);
        res.write(`event: error\ndata: ${JSON.stringify({ 
          error: `Failed to stream Docker logs: ${error.message}` 
        })}\n\n`);
      }
    } else {
      // Stream native process logs
      const logFile = `/tmp/${containerName}.log`;
      console.log(`Streaming native logs for ${containerName} from ${logFile}`);
      
      // Check if log file exists
      try {
        await fs.access(logFile);
      } catch (e) {
        res.write(`event: error\ndata: ${JSON.stringify({ 
          error: `Log file not found: ${logFile}` 
        })}\n\n`);
        res.end();
        return;
      }
      
      // First send historical logs
      try {
        const { stdout: historicalLogs } = await execAsync(`tail -n ${tail} ${logFile} 2>/dev/null`);
        if (historicalLogs) {
          const lines = historicalLogs.split('\n').filter(line => line.trim());
          for (const line of lines) {
            res.write(`data: ${JSON.stringify({ 
              log: line + '\n',
              source: 'native',
              timestamp: new Date().toISOString()
            })}\n\n`);
          }
        }
      } catch (e) {
        console.log('No historical logs available');
      }
      
      // Stream new logs if follow is true
      if (follow === 'true') {
        const tailF = exec(`tail -f -n 0 ${logFile}`, { encoding: 'utf8' });
        logProcess = tailF;
        
        tailF.stdout.on('data', (data) => {
          const lines = data.split('\n').filter(line => line.trim());
          for (const line of lines) {
            res.write(`data: ${JSON.stringify({ 
              log: line + '\n',
              source: 'native',
              timestamp: new Date().toISOString()
            })}\n\n`);
          }
        });
        
        tailF.stderr.on('data', (data) => {
          res.write(`event: error\ndata: ${JSON.stringify({ error: data })}\n\n`);
        });
        
        tailF.on('error', (error) => {
          console.error('Tail process error:', error);
          res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
        });
      }
    }
    
    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);
    
    // Clean up on client disconnect
    req.on('close', () => {
      console.log(`Client disconnected from log stream for ${containerName}`);
      clearInterval(heartbeat);
      
      if (logProcess) {
        logProcess.kill();
      }
      
      if (dockerLogStream) {
        dockerLogStream.destroy();
      }
      
      res.end();
    });
    
  } catch (error) {
    console.error(`Error setting up log stream for ${containerName}:`, error);
    res.write(`event: error\ndata: ${JSON.stringify({ 
      error: `Failed to set up log stream: ${error.message}` 
    })}\n\n`);
    res.end();
  }
});

// Delete server/project
app.delete('/api/servers/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const configPath = path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
    
    // Read current config
    let config = { projects: [] };
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(data);
    } catch (e) {
      // Config doesn't exist yet
    }
    
    // Find the project
    const projectIndex = config.projects?.findIndex(p => p.name === id);
    if (projectIndex === -1 || projectIndex === undefined) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const project = config.projects[projectIndex];
    
    // Stop the server if it's running
    if (project.port) {
      try {
        const { stdout } = await execAsync(`lsof -i :${project.port} | grep LISTEN || true`);
        if (stdout.trim()) {
          // Get PID and kill the process
          const parts = stdout.trim().split(/\s+/);
          if (parts[1]) {
            const pid = parseInt(parts[1]);
            await execAsync(`kill ${pid}`);
            console.log(`Stopped process ${pid} for server ${id}`);
          }
        }
      } catch (e) {
        console.error(`Error stopping server ${id}:`, e);
      }
    }
    
    // Remove from config
    config.projects.splice(projectIndex, 1);
    
    // Save updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    res.json({ 
      success: true,
      message: `Server ${id} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias for projects
app.delete('/api/projects/:id', async (req, res) => {
  return app._router.handle({ ...req, url: `/api/servers/${req.params.id}` }, res);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Backend server running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`API info: http://${HOST}:${PORT}/api/info`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});