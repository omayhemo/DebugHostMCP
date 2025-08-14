#!/usr/bin/env node

/**
 * MCP Debug Host Server - Proper stdio implementation
 * Implements Model Context Protocol using stdio transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  return path.join(process.env.HOME || '', '.apm-debug-host', 'config.json');
}

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
      if (config.projects.length === 0) {
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
              config.projects.map(p => 
                `• ${p.name} (${p.type}) - ${p.path}${p.port ? ` - Port: ${p.port}` : ''}`
              ).join('\n'),
          },
        ],
      };
    }

    case 'register_project': {
      const config = await loadConfig();
      
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
      const index = config.projects.findIndex(p => p.name === args.name);
      
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

      config.projects.splice(index, 1);
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
      const project = config.projects.find(p => p.name === args.name);
      
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
      const project = config.projects.find(p => p.name === args.project);
      
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
          name: 'mcp-debug-host',
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
          count: config.projects.length,
          types: config.projects.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
          }, {}),
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