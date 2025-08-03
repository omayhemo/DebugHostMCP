/**
 * Global test setup for MCP Debug Host Server
 * Sets up common test utilities, mocks, and configurations
 */

const path = require('path');
const fs = require('fs').promises;
const { tmpdir } = require('os');

// Global test configuration
global.TEST_CONFIG = {
  // Use temporary directory for test files
  testDir: path.join(tmpdir(), `mcp-host-test-${Date.now()}`),
  defaultTimeout: 10000,
  logLevel: 'error' // Reduce log noise during tests
};

// Create temporary test directory
beforeAll(async () => {
  await fs.mkdir(global.TEST_CONFIG.testDir, { recursive: true });
});

// Cleanup temporary test directory
afterAll(async () => {
  try {
    await fs.rmdir(global.TEST_CONFIG.testDir, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors in tests
  }
});

// Mock winston logger for tests
global.mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock MCP SDK
jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: { method: 'tools/list' },
  CallToolRequestSchema: { method: 'tools/call' }
}));

// Utility function to create test project structure
global.createTestProject = async (projectType, options = {}) => {
  const projectDir = path.join(global.TEST_CONFIG.testDir, `project-${Date.now()}`);
  await fs.mkdir(projectDir, { recursive: true });

  switch (projectType) {
    case 'react':
      const packageJson = {
        name: 'test-react-app',
        version: '1.0.0',
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        scripts: { start: 'react-scripts start', build: 'react-scripts build' },
        ...options.packageJson
      };
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      break;

    case 'express':
      const expressPackage = {
        name: 'test-express-app',
        version: '1.0.0',
        dependencies: { express: '^4.18.0' },
        scripts: { start: 'node server.js', dev: 'nodemon server.js' },
        ...options.packageJson
      };
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(expressPackage, null, 2)
      );
      await fs.writeFile(
        path.join(projectDir, 'server.js'),
        'const express = require("express"); const app = express(); app.listen(3000);'
      );
      break;

    case 'django':
      await fs.writeFile(
        path.join(projectDir, 'manage.py'),
        '#!/usr/bin/env python\nimport django\n'
      );
      break;

    case 'laravel':
      await fs.writeFile(
        path.join(projectDir, 'artisan'),
        '#!/usr/bin/env php\n<?php\n// Laravel artisan'
      );
      break;

    case 'static':
      await fs.writeFile(
        path.join(projectDir, 'index.html'),
        '<html><body>Test</body></html>'
      );
      await fs.writeFile(
        path.join(projectDir, 'style.css'),
        'body { margin: 0; }'
      );
      break;
  }

  return projectDir;
};

// Mock child process for testing
global.mockChildProcess = () => {
  const EventEmitter = require('events');
  const mockProcess = new EventEmitter();
  
  mockProcess.pid = Math.floor(Math.random() * 10000);
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
  mockProcess.kill = jest.fn();
  
  return mockProcess;
};

// Utility to wait for async operations
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cleanup function for async operations
global.asyncCleanup = [];
afterEach(async () => {
  // Run all cleanup functions
  for (const cleanup of global.asyncCleanup) {
    try {
      await cleanup();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  global.asyncCleanup = [];
});