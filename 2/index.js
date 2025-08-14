#!/usr/bin/env node

/**
 * MCP Debug Host Server Entry Point
 * This is a simple passthrough to the actual MCP stdio server
 * Each Claude instance gets its own process, so no port conflicts
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simply spawn the MCP stdio server
// Each Claude instance gets its own process, so there's no conflict
const serverPath = path.join(__dirname, 'mcp-stdio-server.js');

const child = spawn('node', [serverPath], {
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