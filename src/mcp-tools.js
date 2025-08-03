/**
 * MCP Tools Implementation for Debug Host Server - Fixed Version
 * Provides the 4 core MCP tools: server_start, server_stop, server_logs, server_status
 */

const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function setupTools(server, processManager, logStore, logger) {
  logger.info('Setting up MCP tools with proper schema handling...');

  // Register tools list handler using proper schema
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    logger.info('Handling tools/list request');
    
    return {
      tools: [
        {
          name: 'server_start',
          description: 'Start a development server with automatic tech stack detection',
          inputSchema: {
            type: 'object',
            properties: {
              command: { 
                type: 'string', 
                description: 'Command to run (auto-detected if not provided based on project type)' 
              },
              cwd: { 
                type: 'string', 
                description: 'Working directory path - project root directory' 
              },
              env: { 
                type: 'object', 
                description: 'Environment variables to set for the server process',
                additionalProperties: { type: 'string' }
              },
              port: { 
                type: 'number', 
                description: 'Port number for the server (auto-detected if not provided)',
                minimum: 1024,
                maximum: 65535
              },
              sessionName: { 
                type: 'string', 
                description: 'Friendly name for this server session' 
              }
            },
            required: ['cwd']
          }
        },
        {
          name: 'server_stop',
          description: 'Stop a running server session',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { 
                type: 'string', 
                description: 'Unique session ID of the server to stop' 
              }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'server_logs',
          description: 'Get console logs from a server session with filtering',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { 
                type: 'string', 
                description: 'Unique session ID to get logs from' 
              },
              tail: { 
                type: 'number', 
                description: 'Number of recent log entries to return',
                default: 100,
                minimum: 1,
                maximum: 10000
              },
              filter: { 
                type: 'string', 
                description: 'Regex pattern to filter log entries by content' 
              }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'server_status',
          description: 'Get status of all server sessions including health and uptime',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        }
      ]
    };
  });

  // Register tool call handler using proper schema
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    logger.info(`Handling MCP tool call: ${name}`, { arguments: args });

    try {
      if (name === 'server_start') {
        const {
          command,
          cwd = process.cwd(),
          env = {},
          port = 3000,
          sessionName
        } = args;

        // Validate required parameters
        if (!cwd) {
          throw new Error('Working directory (cwd) is required');
        }

        logger.info('Starting server with parameters:', {
          command,
          cwd,
          port,
          sessionName,
          hasEnv: Object.keys(env).length > 0
        });

        const result = await processManager.startServer({
          command,
          cwd,
          env,
          port,
          sessionName
        });

        logger.info('Server start result:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                ...result,
                message: `Server started successfully on port ${result.port}`,
                dashboardUrl: `http://localhost:${process.env.PORT || 8080}`
              }, null, 2)
            }
          ]
        };
      }
      
      if (name === 'server_stop') {
        const { sessionId } = args;
        
        if (!sessionId) {
          throw new Error('Session ID is required');
        }

        logger.info('Stopping server:', { sessionId });

        const result = processManager.stopServer(sessionId);
        
        logger.info('Server stop result:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                ...result,
                message: `Server ${sessionId} stopped successfully`
              }, null, 2)
            }
          ]
        };
      }
      
      if (name === 'server_logs') {
        const { 
          sessionId, 
          tail = 100, 
          filter = null 
        } = args;
        
        if (!sessionId) {
          throw new Error('Session ID is required');
        }

        logger.info('Getting logs:', { sessionId, tail, filter });

        const logs = processManager.getLogs(sessionId, { tail, filter });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sessionId,
                totalLogs: logs.length,
                logs: logs.map(log => ({
                  timestamp: new Date(log.timestamp).toISOString(),
                  type: log.type,
                  data: log.data.trim()
                })),
                message: `Retrieved ${logs.length} log entries for session ${sessionId}`
              }, null, 2)
            }
          ]
        };
      }
      
      if (name === 'server_status') {
        logger.info('Getting server status for all sessions');

        const sessions = processManager.getAllSessions();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                totalSessions: sessions.length,
                sessions: sessions.map(session => ({
                  ...session,
                  uptime: session.uptime ? Math.floor(session.uptime / 1000) + 's' : 'N/A',
                  url: session.port ? `http://localhost:${session.port}` : null
                })),
                dashboardUrl: `http://localhost:${process.env.PORT || 8080}`,
                message: `Found ${sessions.length} server sessions`
              }, null, 2)
            }
          ]
        };
      }

      // Unknown tool
      throw new Error(`Unknown tool: ${name}`);

    } catch (error) {
      logger.error(`Error handling tool ${name}:`, {
        error: error.message,
        stack: error.stack,
        arguments: args
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              tool: name,
              message: `Failed to execute ${name}: ${error.message}`
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  });

  logger.info('MCP tools registered successfully with schema validation:', {
    tools: ['server_start', 'server_stop', 'server_logs', 'server_status']
  });
}

module.exports = { setupTools };