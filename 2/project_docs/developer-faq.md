# Developer FAQ - MCP Debug Host Platform

**Last Updated**: January 5, 2025  
**Purpose**: Common questions and clarifications for implementing Phase 1 stories

## General Questions

### Q: What is MCP?
**A**: MCP stands for Model Context Protocol. It's a standardized protocol that allows Claude Code agents to interact with external services through defined tools and APIs.

### Q: What Node.js version should I use?
**A**: Node.js 22 LTS. All base images and the MCP server should use Node 22.

### Q: Should I create all files mentioned in the stories?
**A**: Yes, create the exact file structure specified. The paths are deliberate and other stories depend on them.

### Q: What's the error handling philosophy?
**A**: 
- Fail fast with clear error messages
- Include suggestions when operations fail
- Log errors but don't expose internal details to clients
- Always clean up resources (containers, ports) on failure

---

## Story 1.1: Docker Base Images

### Q: Why Node 22 and not Node 20?
**A**: Node 22 is the latest LTS version as of January 2025. We want the most current stable features.

### Q: Should the images be based on Alpine or Debian slim?
**A**: Use Debian slim variants (node:22-slim, python:3.11-slim). Alpine can have compatibility issues with some npm packages.

### Q: How do I test file watching works?
**A**: 
```bash
# Start a container with the image
docker run -v $(pwd)/test-app:/app debug-host/node:latest

# In another terminal, modify a file
echo "// test" >> test-app/index.js

# Container should restart automatically
```

### Q: What if the image size exceeds 500MB?
**A**: 
1. Use multi-stage builds
2. Clean package manager caches (`apt-get clean`, `rm -rf /var/lib/apt/lists/*`)
3. Don't install recommended packages (`apt-get --no-install-recommends`)
4. Combine RUN commands to reduce layers

### Q: What should the build script look like?
**A**: 
```bash
#!/bin/bash
# docker/build-all.sh

echo "Building Debug Host base images..."

for type in node python php static; do
  echo "Building $type image..."
  docker build -t debug-host/$type:latest -f docker/images/$type/Dockerfile docker/images/
done

echo "Cleaning up dangling images..."
docker image prune -f

echo "Build complete. Images:"
docker images | grep debug-host
```

---

## Story 1.2: MCP HTTP Server

### Q: What's the exact MCP protocol format?
**A**: 
```javascript
// Initialize Response
{
  "protocol": "mcp",
  "version": "1.0",
  "capabilities": {
    "tools": true,
    "streaming": true
  }
}

// Tool List Response
{
  "tools": [
    {
      "name": "host.register",
      "description": "Register a new project",
      "inputSchema": { /* JSON Schema */ }
    }
  ]
}

// Tool Call Response
{
  "result": { /* tool-specific response */ },
  "error": null
}

// Error Response
{
  "result": null,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Missing required parameter: workspace"
  }
}
```

### Q: How do I implement SSE streaming?
**A**: 
```javascript
const express = require('express');
const app = express();

app.get('/mcp/logs/:projectId/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendLog = (log) => {
    res.write(`event: log\n`);
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  // Set up log watching for projectId
  // Send logs as they come in
  
  req.on('close', () => {
    // Clean up watchers
  });
});
```

### Q: Should I implement all tools in Story 1.2?
**A**: No, just create placeholder handlers that return mock responses. Real implementation comes in later stories.

### Q: What about CORS?
**A**: Since we're localhost-only, use permissive CORS for development:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```

---

## Story 1.3: Docker Manager

### Q: How do I check if Docker is available?
**A**: 
```javascript
const Docker = require('dockerode');
const docker = new Docker();

async function checkDocker() {
  try {
    await docker.ping();
    return true;
  } catch (error) {
    console.error('Docker not available:', error.message);
    return false;
  }
}
```

### Q: What's the exact network configuration?
**A**: 
```javascript
const networkConfig = {
  Name: 'debug-host-network',
  Driver: 'bridge',
  IPAM: {
    Driver: 'default',
    Config: [{
      Subnet: '172.28.0.0/16',
      Gateway: '172.28.0.1'
    }]
  },
  Labels: {
    'debug-host': 'true',
    'created': new Date().toISOString()
  }
};
```

### Q: How do I handle container cleanup on service restart?
**A**: 
```javascript
async function cleanupOrphans() {
  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: ['debug-host=true']
    }
  });
  
  for (const containerInfo of containers) {
    if (containerInfo.State === 'exited') {
      const container = docker.getContainer(containerInfo.Id);
      await container.remove();
    }
  }
}
```

### Q: What about Windows vs Linux paths?
**A**: Always convert Windows paths to Unix format:
```javascript
function normalizeWorkspacePath(workspace) {
  // Convert C:\Projects\my-app to /mnt/c/Projects/my-app
  if (workspace.match(/^[A-Z]:\\/)) {
    return workspace.replace(/^([A-Z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`)
                   .replace(/\\/g, '/');
  }
  return workspace;
}
```

---

## Story 1.4: Port Registry

### Q: How do I check if a port is in use?
**A**: 
```javascript
const net = require('net');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false); // Treat other errors as unavailable
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '127.0.0.1');
  });
}
```

### Q: What's the exact error format for port conflicts?
**A**: 
```javascript
{
  success: false,
  error: 'PORT_IN_USE',
  message: 'Port 3000 is already used by project "my-api"',
  details: {
    conflictingProject: 'proj_abc123def456',
    conflictingService: 'my-api',
    startedAt: '2025-01-05T10:00:00Z'
  },
  suggestions: [3001, 3002, 3003]
}
```

### Q: How do I generate project IDs?
**A**: 
```javascript
function generateProjectId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `proj_${timestamp}${random}`;
}
// Example: proj_ln3k4m8abc12
```

### Q: Should port history be limited?
**A**: Yes, keep last 100 entries in history array:
```javascript
function addToHistory(action, port, projectId) {
  registry.history.push({
    timestamp: new Date().toISOString(),
    action,
    port,
    projectId
  });
  
  // Keep only last 100 entries
  if (registry.history.length > 100) {
    registry.history = registry.history.slice(-100);
  }
}
```

---

## Integration Questions

### Q: In what order should I implement the stories?
**A**: 
1. Story 1.1 and 1.2 can be done in parallel
2. Story 1.3 depends on 1.1 being complete
3. Story 1.4 can start after 1.2 is partially done

### Q: How do the components communicate?
**A**: 
```
MCP Server (1.2) 
  ↓ calls
Docker Manager (1.3)
  ↓ uses
Port Registry (1.4)
  ↓ checks
System Ports
```

### Q: What's a minimal integration test?
**A**: 
```javascript
// Integration test
async function testIntegration() {
  // 1. Start MCP server
  const server = await startMCPServer();
  
  // 2. Register a project
  const project = await fetch('http://localhost:2601/mcp/tools/call', {
    method: 'POST',
    body: JSON.stringify({
      tool: 'host.register',
      arguments: {
        name: 'test-api',
        type: 'node',
        workspace: '/tmp/test-app'
      }
    })
  });
  
  // 3. Start the project
  const start = await fetch('http://localhost:2601/mcp/tools/call', {
    method: 'POST',
    body: JSON.stringify({
      tool: 'host.start',
      arguments: {
        projectId: project.projectId,
        port: 'auto'
      }
    })
  });
  
  // 4. Verify container is running
  const docker = new Docker();
  const containers = await docker.listContainers({
    filters: { label: [`project=${project.projectId}`] }
  });
  
  assert(containers.length === 1);
  assert(containers[0].State === 'running');
}
```

---

## Common Pitfalls

### 1. Forgetting to bind to localhost only
```javascript
// WRONG
app.listen(2601);

// RIGHT
app.listen(2601, '127.0.0.1');
```

### 2. Not handling Docker daemon unavailable
```javascript
// Always check Docker availability first
if (!await checkDocker()) {
  return { error: 'Docker service unavailable' };
}
```

### 3. Port leak on container stop
```javascript
// Always release port when container stops
async function stopContainer(projectId) {
  await docker.stop(containerId);
  await portRegistry.release(projectId); // Don't forget!
}
```

### 4. Not preserving file permissions in containers
```javascript
// Ensure mounted files keep permissions
const volumes = {
  [`${workspace}:/app:rw`]: {} // rw = read-write
};
```

---

## Testing Tips

### Unit Test Structure
```
tests/
├── unit/
│   ├── docker-manager.test.js
│   ├── port-registry.test.js
│   └── mcp-server.test.js
└── integration/
    └── phase1.test.js
```

### Mock Docker for Unit Tests
```javascript
// Mock dockerode for unit tests
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue(true),
    createContainer: jest.fn().mockResolvedValue({ id: 'mock123' }),
    // ... other methods
  }));
});
```

### Test Data
```javascript
// Use consistent test data
const TEST_PROJECT = {
  name: 'test-api',
  type: 'node',
  workspace: '/tmp/test-workspace'
};

const TEST_PORT_RANGES = {
  node: { start: 3000, end: 3999 }
};
```

---

## Questions? 

If you encounter issues not covered here:
1. Check the architecture document for design rationale
2. Refer to the specific story's acceptance criteria
3. Look for patterns in existing code
4. Ask for clarification before making assumptions

Remember: It's better to ask than to guess!