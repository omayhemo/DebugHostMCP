#!/usr/bin/env node

/**
 * API Bridge Server
 * Provides REST API endpoints for the dashboard by bridging to MCP server
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 2602;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Import MCP client for communicating with MCP server
async function callMCPTool(toolName, params = {}) {
  try {
    // Use the MCP Debug Host tools directly through the available MCP interface
    const { spawn } = await import('child_process');
    
    // Call the MCP server using stdio
    return new Promise((resolve, reject) => {
      const mcpPath = path.join(__dirname, 'mcp-stdio-server.js');
      const child = spawn('node', [mcpPath]);
      
      const request = {
        jsonrpc: '2.0',
        method: toolName,
        params: params,
        id: Date.now()
      };
      
      child.stdin.write(JSON.stringify(request) + '\n');
      
      let response = '';
      child.stdout.on('data', (data) => {
        response += data.toString();
      });
      
      child.on('close', () => {
        try {
          const parsed = JSON.parse(response.trim());
          if (parsed.error) {
            reject(parsed.error);
          } else {
            resolve(parsed.result);
          }
        } catch (e) {
          reject(e);
        }
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('MCP call timeout'));
      }, 5000);
    });
  } catch (error) {
    console.error('MCP call failed:', error);
    throw error;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-bridge',
    timestamp: new Date().toISOString()
  });
});

// Get all servers/projects - maps to containers for the dashboard
app.get('/api/servers', async (req, res) => {
  try {
    // Get projects from MCP
    const projects = await callMCPTool('list_projects');
    
    // Get container status for each project
    const containers = await callMCPTool('list_containers');
    
    // Transform to match the frontend's expected format
    const servers = [];
    
    if (typeof projects === 'string') {
      // Parse the projects string response
      const lines = projects.split('\n').filter(line => line.includes('•'));
      for (const line of lines) {
        const match = line.match(/• (.+?) \((.+?)\) - (.+?) - Port: (\d+)/);
        if (match) {
          const [, name, type, path, port] = match;
          servers.push({
            sessionId: name,
            id: name,
            name: name,
            command: type === 'node' ? 'npm run dev' : 'python app.py',
            cwd: path,
            port: parseInt(port),
            type: type,
            status: 'stopped', // Default status
            path: path
          });
        }
      }
    }
    
    // Check actual running status
    for (const server of servers) {
      if (server.port) {
        try {
          const { stdout } = await execAsync(`lsof -i :${server.port} | grep LISTEN || true`);
          if (stdout.trim()) {
            server.status = 'running';
            server.pid = parseInt(stdout.split(/\s+/)[1]);
          }
        } catch (e) {
          // Port check failed, keep as stopped
        }
      }
    }
    
    res.json(servers);
  } catch (error) {
    console.error('Failed to list servers:', error);
    res.json([]);
  }
});

// Get server status
app.get('/api/servers/:id/status', async (req, res) => {
  const { id } = req.params;
  
  try {
    const servers = await callMCPTool('list_projects');
    // Find the specific project and return its status
    
    res.json({
      sessionId: id,
      status: 'stopped',
      name: id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.post('/api/servers/:id/start', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await callMCPTool('start_dev_server', { 
      project: id,
      command: req.body.command || 'npm run dev'
    });
    
    res.json({ 
      success: true,
      message: `Server ${id} started`,
      result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Stop server
app.post('/api/servers/:id/stop', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await callMCPTool('stop_dev_server', { project: id });
    
    res.json({ 
      success: true,
      message: `Server ${id} stopped`,
      result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Restart server
app.post('/api/servers/:id/restart', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await callMCPTool('restart_dev_server', { project: id });
    
    res.json({ 
      success: true,
      message: `Server ${id} restarted`,
      result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get logs
app.get('/api/servers/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;
  
  try {
    const result = await callMCPTool('server_logs', { 
      project: id,
      lines: parseInt(limit)
    });
    
    res.json({
      logs: result.split('\n'),
      hasMore: false
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      logs: [],
      hasMore: false
    });
  }
});

// Catch all for unimplemented endpoints
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Bridge Server running on http://0.0.0.0:${PORT}`);
  console.log('Bridging REST API requests to MCP server...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down API Bridge Server...');
  process.exit(0);
});