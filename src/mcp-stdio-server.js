#!/home/dougw/.nvm/versions/node/v22.16.0/bin/node

/**
 * MCP Debug Host Server - Proper stdio implementation
 * Implements Model Context Protocol using stdio transport
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs/promises');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Create the MCP server
const server = new Server(
  {
    name: 'mcp-debug-host',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Get config path
function getConfigPath() {
  return path.join(process.env.HOME || '', '.plopdock', 'config.json');
}

// Project state tracking
const runningProjects = new Map(); // projectName -> { process, pid, port, startTime }

// Load or create config
async function loadConfig() {
  const configPath = getConfigPath();
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

// Save config
async function saveConfig(config) {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_projects',
        description: 'List all registered development projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'register_project',
        description: 'Register a new development project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            path: {
              type: 'string',
              description: 'Absolute path to project directory',
            },
            type: {
              type: 'string',
              description: 'Project type (node, python, php, static)',
              enum: ['node', 'python', 'php', 'static'],
            },
            port: {
              type: 'number',
              description: 'Port number for the project',
            },
          },
          required: ['name', 'path', 'type'],
        },
      },
      {
        name: 'unregister_project',
        description: 'Remove a project from the registry',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name to remove',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'project_info',
        description: 'Get detailed information about a project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'execute_command',
        description: 'Execute a shell command in a project directory',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            command: {
              type: 'string',
              description: 'Command to execute',
            },
          },
          required: ['project', 'command'],
        },
      },
      {
        name: 'system_status',
        description: 'Get system and MCP server status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'host_start',
        description: 'Start a registered project server',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project name to start',
            },
            command: {
              type: 'string',
              description: 'Start command (defaults to "npm run dev")',
              default: 'npm run dev'
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'host_stop',
        description: 'Stop a running project server',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project name to stop',
            },
            force: {
              type: 'boolean',
              description: 'Force kill the process',
              default: false
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'host_restart',
        description: 'Restart a project server',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project name to restart',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'host_status',
        description: 'Get detailed status of a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project name to check',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'host_logs',
        description: 'Get recent logs from a running project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project name to get logs for',
            },
            lines: {
              type: 'number',
              description: 'Number of recent lines to return',
              default: 50
            },
          },
          required: ['projectId'],
        },
      },
    ],
  };
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'debug-host://config',
        name: 'Debug Host Configuration',
        description: 'Current configuration and registered projects',
        mimeType: 'application/json',
      },
      {
        uri: 'debug-host://status',
        name: 'System Status',
        description: 'Current status of the debug host system',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'debug-host://config') {
    const config = await loadConfig();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }

  if (uri === 'debug-host://status') {
    const status = {
      version: '2.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_projects': {
      const config = await loadConfig();
      const projects = config.projects || [];
      if (projects.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No projects registered yet. Use "register_project" to add a project.',
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'Registered projects:\n' + 
              projects.map(p => 
                `• ${p.name} (${p.type}) - ${p.path}${p.port ? ` - Port: ${p.port}` : ''}`
              ).join('\n'),
          },
        ],
      };
    }

    case 'register_project': {
      const config = await loadConfig();
      // Ensure projects array exists
      if (!config.projects) {
        config.projects = [];
      }
      
      // Validate path exists
      try {
        await fs.access(args.path);
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Path "${args.path}" does not exist or is not accessible.`,
            },
          ],
        };
      }

      // Check if project already exists
      const existingIndex = config.projects.findIndex(p => p.name === args.name);
      if (existingIndex >= 0) {
        config.projects[existingIndex] = args;
        await saveConfig(config);
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.name}" updated successfully.`,
            },
          ],
        };
      } else {
        config.projects.push(args);
        await saveConfig(config);
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.name}" registered successfully at ${args.path}`,
            },
          ],
        };
      }
    }

    case 'unregister_project': {
      const config = await loadConfig();
      const projects = config.projects || [];
      const index = projects.findIndex(p => p.name === args.name);
      
      if (index === -1) {
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.name}" not found.`,
            },
          ],
        };
      }

      projects.splice(index, 1);
      config.projects = projects;
      await saveConfig(config);
      
      return {
        content: [
          {
            type: 'text',
            text: `Project "${args.name}" removed successfully.`,
          },
        ],
      };
    }

    case 'project_info': {
      const config = await loadConfig();
      const projects = config.projects || [];
      const project = projects.find(p => p.name === args.name);
      
      if (!project) {
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.name}" not found.`,
            },
          ],
        };
      }

      // Get additional info about the project
      let info = {
        ...project,
        exists: true,
      };

      try {
        const stats = await fs.stat(project.path);
        info.isDirectory = stats.isDirectory();
        info.lastModified = stats.mtime;
        
        // Check for package.json if it's a node project
        if (project.type === 'node') {
          try {
            const packageJson = await fs.readFile(
              path.join(project.path, 'package.json'),
              'utf-8'
            );
            const pkg = JSON.parse(packageJson);
            info.packageName = pkg.name;
            info.version = pkg.version;
            info.scripts = pkg.scripts || {};
          } catch {
            // No package.json
          }
        }
      } catch {
        info.exists = false;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    }

    case 'execute_command': {
      const config = await loadConfig();
      const projects = config.projects || [];
      const project = projects.find(p => p.name === args.project);
      
      if (!project) {
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.project}" not found.`,
            },
          ],
        };
      }

      // Security: Only allow certain commands
      const allowedCommands = [
        'ls', 'pwd', 'git status', 'git branch', 'npm list',
        'npm run', 'yarn list', 'pip list', 'composer show'
      ];
      
      const isAllowed = allowedCommands.some(cmd => 
        args.command.startsWith(cmd)
      );
      
      if (!isAllowed) {
        return {
          content: [
            {
              type: 'text',
              text: `Command not allowed. Allowed commands: ${allowedCommands.join(', ')}`,
            },
          ],
        };
      }

      try {
        const { stdout, stderr } = await execAsync(args.command, {
          cwd: project.path,
          timeout: 10000, // 10 second timeout
        });
        
        return {
          content: [
            {
              type: 'text',
              text: stdout || stderr || 'Command executed successfully (no output)',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing command: ${error.message}`,
            },
          ],
        };
      }
    }

    case 'system_status': {
      const config = await loadConfig();
      const status = {
        server: {
          name: 'plopdock',
          version: '2.0.0',
          uptime: Math.floor(process.uptime()),
          pid: process.pid,
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB',
          },
        },
        projects: {
          count: (config.projects || []).length,
          running: runningProjects.size,
          types: (config.projects || []).reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
          }, {}),
          runningList: Array.from(runningProjects.keys()),
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    case 'host_start': {
      const config = await loadConfig();
      const projects = config.projects || [];
      const project = projects.find(p => p.name === args.projectId);
      
      if (!project) {
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" not found. Register it first.`,
          }],
        };
      }

      // Check if already running
      if (runningProjects.has(args.projectId)) {
        const runningInfo = runningProjects.get(args.projectId);
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" is already running (PID: ${runningInfo.pid})`,
          }],
        };
      }

      try {
        const startCommand = args.command || 'npm run dev';
        const child = spawn('bash', ['-c', startCommand], {
          cwd: project.path,
          detached: false,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        // Store running project info
        runningProjects.set(args.projectId, {
          process: child,
          pid: child.pid,
          port: project.port,
          startTime: new Date().toISOString(),
          logs: []
        });

        // Capture logs
        const projectInfo = runningProjects.get(args.projectId);
        child.stdout.on('data', (data) => {
          projectInfo.logs.push({ time: new Date().toISOString(), type: 'stdout', data: data.toString() });
          if (projectInfo.logs.length > 1000) projectInfo.logs.shift(); // Keep last 1000 entries
        });
        child.stderr.on('data', (data) => {
          projectInfo.logs.push({ time: new Date().toISOString(), type: 'stderr', data: data.toString() });
          if (projectInfo.logs.length > 1000) projectInfo.logs.shift();
        });

        child.on('exit', (code) => {
          runningProjects.delete(args.projectId);
        });

        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" started successfully (PID: ${child.pid}${project.port ? `, Port: ${project.port}` : ''})`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to start project "${args.projectId}": ${error.message}`,
          }],
        };
      }
    }

    case 'host_stop': {
      if (!runningProjects.has(args.projectId)) {
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" is not running`,
          }],
        };
      }

      try {
        const projectInfo = runningProjects.get(args.projectId);
        const signal = args.force ? 'SIGKILL' : 'SIGTERM';
        
        projectInfo.process.kill(signal);
        runningProjects.delete(args.projectId);
        
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" stopped successfully`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to stop project "${args.projectId}": ${error.message}`,
          }],
        };
      }
    }

    case 'host_restart': {
      // Stop first
      if (runningProjects.has(args.projectId)) {
        const projectInfo = runningProjects.get(args.projectId);
        projectInfo.process.kill('SIGTERM');
        runningProjects.delete(args.projectId);
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Then start (reuse start logic)
      const config = await loadConfig();
      const projects = config.projects || [];
      const project = projects.find(p => p.name === args.projectId);
      
      if (!project) {
        return {
          content: [{ type: 'text', text: `Project \"${args.projectId}\" not found. Register it first.` }],
        };
      }

      try {
        const startCommand = 'npm run dev';
        const child = spawn('bash', ['-c', startCommand], {
          cwd: project.path,
          detached: false,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        runningProjects.set(args.projectId, {
          process: child,
          pid: child.pid,
          port: project.port,
          startTime: new Date().toISOString(),
          logs: []
        });

        const projectInfo = runningProjects.get(args.projectId);
        child.stdout.on('data', (data) => {
          projectInfo.logs.push({ time: new Date().toISOString(), type: 'stdout', data: data.toString() });
          if (projectInfo.logs.length > 1000) projectInfo.logs.shift();
        });
        child.stderr.on('data', (data) => {
          projectInfo.logs.push({ time: new Date().toISOString(), type: 'stderr', data: data.toString() });
          if (projectInfo.logs.length > 1000) projectInfo.logs.shift();
        });

        child.on('exit', (code) => {
          runningProjects.delete(args.projectId);
        });

        return {
          content: [{ type: 'text', text: `Project \"${args.projectId}\" restarted successfully (PID: ${child.pid})` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to restart project \"${args.projectId}\": ${error.message}` }],
        };
      }
    }

    case 'host_status': {
      const config = await loadConfig();
      const projects = config.projects || [];
      const project = projects.find(p => p.name === args.projectId);
      
      if (!project) {
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" not found`,
          }],
        };
      }

      const isRunning = runningProjects.has(args.projectId);
      const status = {
        name: project.name,
        path: project.path,
        type: project.type,
        port: project.port,
        status: isRunning ? 'running' : 'stopped',
      };

      if (isRunning) {
        const runningInfo = runningProjects.get(args.projectId);
        status.pid = runningInfo.pid;
        status.startTime = runningInfo.startTime;
        status.uptime = Math.floor((new Date() - new Date(runningInfo.startTime)) / 1000);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(status, null, 2),
        }],
      };
    }

    case 'host_logs': {
      if (!runningProjects.has(args.projectId)) {
        return {
          content: [{
            type: 'text',
            text: `Project "${args.projectId}" is not running`,
          }],
        };
      }

      const projectInfo = runningProjects.get(args.projectId);
      const lines = args.lines || 50;
      const recentLogs = projectInfo.logs.slice(-lines);
      
      const logText = recentLogs.map(log => 
        `[${log.time}] [${log.type}] ${log.data.trim()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: logText || 'No logs available',
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Main function to start the server
async function main() {
  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  // The server is now running and will communicate via stdio
  // Note: We must NOT write to stdout as it would corrupt the JSON-RPC messages
  // Any logging should go to stderr
  console.error('MCP Debug Host Server v2.0.0 started (stdio transport)');
}

// Start the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});