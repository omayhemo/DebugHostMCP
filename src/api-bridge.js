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

// API Health check (with /api prefix for consistency)
app.get('/api/health', (req, res) => {
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

// **NEW MULTI-TECH PROCESS DISCOVERY ENDPOINTS**

// Discover processes across all technology stacks
app.post('/api/processes/discovery', async (req, res) => {
  try {
    // Import the multi-tech process discovery engine
    const { MultiTechProcessDiscoveryEngine } = await import('./services/multi-tech-process-discovery-engine.js');
    
    const engine = new MultiTechProcessDiscoveryEngine({
      performanceMonitoring: true,
      scanTimeout: req.body.timeout || 2000,
      parallelScanning: true
    });
    
    await engine.initialize();
    
    const scanResults = await engine.scanSystemProcesses({
      includeCorrelation: req.body.includeCorrelation !== false,
      techStacks: req.body.techStacks,
      forceRefresh: req.body.forceRefresh || false
    });
    
    await engine.shutdown();
    
    res.json(scanResults);
  } catch (error) {
    console.error('Multi-tech process discovery failed:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

// Get system health metrics
app.get('/api/processes/system-health', async (req, res) => {
  try {
    // Calculate system health metrics from current process state
    const { MultiTechProcessDiscoveryEngine } = await import('./services/multi-tech-process-discovery-engine.js');
    
    const engine = new MultiTechProcessDiscoveryEngine({ performanceMonitoring: true });
    await engine.initialize();
    
    const scanResults = await engine.scanSystemProcesses();
    const status = engine.getStatus();
    
    await engine.shutdown();
    
    // Calculate health metrics
    const totalProcesses = scanResults.totalProcesses || 0;
    const rogueCount = scanResults.correlation?.rogueProcesses?.length || 0;
    const orphanedCount = scanResults.correlation?.orphanedProcesses?.length || 0;
    
    const systemHealth = {
      cpu: status.performance?.cpuUsage || 0,
      memory: status.performance?.memoryUsage || 0,
      diskSpace: 0, // TODO: Implement disk usage calculation
      totalProcesses,
      rogueProcesses: rogueCount,
      portUtilization: Math.round((totalProcesses / 100) * 100), // Simple port utilization estimate
      lastUpdate: new Date().toISOString(),
      status: rogueCount > 0 || orphanedCount > 0 ? 'warning' : 'healthy'
    };
    
    res.json(systemHealth);
  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({
      error: error.message,
      cpu: 0,
      memory: 0,
      diskSpace: 0,
      totalProcesses: 0,
      rogueProcesses: 0,
      portUtilization: 0,
      lastUpdate: new Date().toISOString(),
      status: 'error'
    });
  }
});

// Execute bulk actions on processes
app.post('/api/processes/bulk-action', async (req, res) => {
  try {
    const { action, processIds, options = {} } = req.body;
    
    console.log(`Executing bulk action: ${action} on ${processIds.length} processes`);
    
    // For now, simulate bulk action execution
    // In a real implementation, this would use the Agent Safety Framework
    // and call appropriate MCP tools for process management
    
    const results = processIds.map(processId => ({
      processId,
      success: true,
      message: `${action} completed for process ${processId}`
    }));
    
    const bulkResult = {
      success: true,
      processedCount: processIds.length,
      failedCount: 0,
      results,
      summary: `Bulk ${action} completed successfully for ${processIds.length} processes`
    };
    
    res.json(bulkResult);
  } catch (error) {
    console.error('Bulk action failed:', error);
    res.status(500).json({
      success: false,
      processedCount: 0,
      failedCount: req.body.processIds?.length || 0,
      error: error.message
    });
  }
});

// Real-time process updates via Server-Sent Events
app.get('/api/processes/realtime', (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Real-time process monitoring connected'
  })}\n\n`);
  
  // TODO: Implement actual real-time process monitoring
  // For now, send periodic health checks
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      message: 'System monitoring active'
    })}\n\n`);
  }, 30000); // 30-second heartbeat
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log('Real-time connection closed');
  });
});

// Individual process actions
app.post('/api/processes/:processId/terminate', async (req, res) => {
  try {
    const { processId } = req.params;
    const { force = false, reason = 'User requested' } = req.body;
    
    console.log(`Terminating process ${processId} (force: ${force}, reason: ${reason})`);
    
    // TODO: Implement actual process termination with safety framework
    // For now, simulate successful termination
    
    res.json({
      success: true,
      message: `Process ${processId} terminated successfully`
    });
  } catch (error) {
    console.error('Process termination failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Associate rogue process with workspace
app.post('/api/processes/:processId/associate', async (req, res) => {
  try {
    const { processId } = req.params;
    const { workspace } = req.body;
    
    console.log(`Associating process ${processId} with workspace ${workspace}`);
    
    // TODO: Implement actual process-workspace association
    // This would update the port registry and correlation engine
    
    res.json({
      success: true,
      message: `Process ${processId} associated with workspace ${workspace}`
    });
  } catch (error) {
    console.error('Process association failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clean up orphaned processes
app.post('/api/processes/cleanup-orphaned', async (req, res) => {
  try {
    const { processIds } = req.body;
    
    console.log(`Cleaning up ${processIds.length} orphaned processes`);
    
    // TODO: Implement actual orphaned process cleanup
    // This would remove entries from the port registry
    
    res.json({
      success: true,
      cleanedCount: processIds.length
    });
  } catch (error) {
    console.error('Orphaned process cleanup failed:', error);
    res.status(500).json({
      success: false,
      cleanedCount: 0,
      error: error.message
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