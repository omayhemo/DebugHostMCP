#!/usr/bin/env node

/**
 * MCP Adapter
 * Stateless adapter that translates MCP calls to HTTP API calls
 * This runs per-Claude-session with no state or port bindings
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.DEBUG_HOST_API_URL || 'http://localhost:8081/api/v1';
const API_KEY = process.env.DEBUG_HOST_API_KEY || '';
const DASHBOARD_URL = process.env.DEBUG_HOST_DASHBOARD_URL || 'http://localhost:8080';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
  }
});

// Error handler for API calls
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Debug Host Service is not running. Please start the service first.');
    }
    throw error;
  }
);

// Create MCP server
const server = new Server(
  {
    name: 'debug-host-adapter',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Tool: server_start
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'server_start':
        return await handleServerStart(args);
        
      case 'server_stop':
        return await handleServerStop(args);
        
      case 'server_restart':
        return await handleServerRestart(args);
        
      case 'server_status':
        return await handleServerStatus(args);
        
      case 'server_logs':
        return await handleServerLogs(args);
        
      case 'server_list':
        return await handleServerList(args);
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Tool error (${name}):`, error.message);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }, null, 2)
      }]
    };
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'server_start',
        description: 'Start a new development server',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name for the server session'
            },
            command: {
              type: 'string',
              description: 'Command to run (e.g., "npm start", "python app.py")'
            },
            cwd: {
              type: 'string',
              description: 'Working directory for the server'
            },
            port: {
              type: 'number',
              description: 'Port number (optional, will auto-assign if not specified)'
            },
            env: {
              type: 'object',
              description: 'Environment variables'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'server_stop',
        description: 'Stop a running server',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the server to stop'
            },
            force: {
              type: 'boolean',
              description: 'Force kill the process'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'server_restart',
        description: 'Restart a server',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the server to restart'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'server_status',
        description: 'Get status of a specific server or all servers',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID (optional, returns all if not specified)'
            }
          }
        }
      },
      {
        name: 'server_logs',
        description: 'Get logs from a server',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the server'
            },
            limit: {
              type: 'number',
              description: 'Number of log lines to return',
              default: 100
            },
            tail: {
              type: 'boolean',
              description: 'Get most recent logs',
              default: true
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'server_list',
        description: 'List all server sessions',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['starting', 'running', 'stopping', 'stopped', 'failed'],
              description: 'Filter by status'
            }
          }
        }
      }
    ]
  };
});

// Tool handlers

async function handleServerStart(args) {
  try {
    const response = await api.post('/servers', {
      name: args.name,
      command: args.command || 'npm start',
      cwd: args.cwd || process.cwd(),
      port: args.port,
      env: args.env
    });
    
    const data = response.data.data;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: data.sessionId,
          pid: data.pid,
          port: data.port,
          status: data.status,
          url: data.url,
          message: `Server started successfully on port ${data.port}`,
          dashboardUrl: DASHBOARD_URL
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

async function handleServerStop(args) {
  try {
    const response = await api.delete(`/servers/${args.sessionId}`, {
      params: { force: args.force }
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Server ${args.sessionId} stopped successfully`
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

async function handleServerRestart(args) {
  try {
    const response = await api.post(`/servers/${args.sessionId}/restart`);
    
    const data = response.data.data;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: args.sessionId,
          message: 'Server restarted successfully',
          ...data
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

async function handleServerStatus(args) {
  try {
    let response;
    
    if (args.sessionId) {
      response = await api.get(`/servers/${args.sessionId}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            session: response.data.data,
            dashboardUrl: DASHBOARD_URL
          }, null, 2)
        }]
      };
    } else {
      response = await api.get('/servers');
      
      const sessions = response.data.data.sessions;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            totalSessions: sessions.length,
            sessions: sessions,
            dashboardUrl: DASHBOARD_URL,
            message: `Found ${sessions.length} server sessions`
          }, null, 2)
        }]
      };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

async function handleServerLogs(args) {
  try {
    const response = await api.get(`/logs/${args.sessionId}`, {
      params: {
        limit: args.limit || args.tail || 100,
        offset: 0
      }
    });
    
    const logs = response.data.data;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: args.sessionId,
          totalLogs: logs.length,
          logs: logs,
          message: `Retrieved ${logs.length} log entries for session ${args.sessionId}`
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

async function handleServerList(args) {
  try {
    const response = await api.get('/servers', {
      params: {
        status: args.status
      }
    });
    
    const { sessions, total } = response.data.data;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          total,
          sessions,
          dashboardUrl: DASHBOARD_URL,
          message: `Found ${total} server sessions`
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

// Health check to verify service is running
async function checkServiceHealth() {
  try {
    const response = await api.get('/health');
    console.error('Debug Host Service is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('Warning: Debug Host Service is not responding. Some features may not work.');
    console.error('Start the service with: node service/global-service.js');
    return false;
  }
}

// Main execution
async function main() {
  // Check service health
  await checkServiceHealth();
  
  // Create transport
  const transport = new StdioServerTransport();
  
  // Connect server to transport
  await server.connect(transport);
  
  console.error('MCP Adapter connected and ready');
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the adapter
main().catch(error => {
  console.error('Failed to start MCP adapter:', error);
  process.exit(1);
});