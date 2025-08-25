#!/home/dougw/.nvm/versions/node/v22.16.0/bin/node

/**
 * MCP Debug Host Server Entry Point
 * This is a simple passthrough to the actual MCP stdio server
 * Each Claude instance gets its own process, so no port conflicts
 */

const { spawn } = require('child_process');
const path = require('path');

// Simply spawn the MCP stdio server
// Each Claude instance gets its own process, so there's no conflict
const serverPath = path.join(__dirname, 'mcp-stdio-server.js');

// Use full path to node to avoid PATH issues with NVM
const nodePath = '/home/dougw/.nvm/versions/node/v22.16.0/bin/node';
const child = spawn(nodePath, [serverPath], {
  stdio: 'inherit', // Pass through stdio for JSON-RPC communication
  env: process.env,
});

child.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Forward signals to child
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));