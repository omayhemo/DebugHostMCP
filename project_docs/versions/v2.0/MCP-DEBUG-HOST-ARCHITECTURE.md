# MCP Debug Host Platform - Architecture Specification

**Version**: 1.0.0  
**Date**: January 5, 2025  
**Status**: Approved for Implementation  
**Author**: Architect Agent (APM Framework)

## Executive Summary

The MCP Debug Host Platform is a centralized service management system designed specifically for Claude Code agents to orchestrate multiple project services without port conflicts or resource contention. The platform provides a unified MCP (Model Context Protocol) interface for starting, stopping, monitoring, and managing containerized applications across multiple programming languages.

## Core Architecture Decisions

### Approved Design Choices

- ✅ **4 Pre-built Docker base images** (node, python, php, static)
- ✅ **MCP over HTTP/SSE** at port 2601
- ✅ **Simple registration** followed by agent-specific start commands
- ✅ **Auto-restart with file watching** for all language environments
- ✅ **Port ranges** by application type for predictable allocation
- ✅ **3-day log retention** with automatic rotation
- ✅ **Shared Docker network** for inter-container communication
- ✅ **JSON file storage** (no database required)

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────┐
│          Claude Code Projects               │
│        (All connect to MCP at 2601)         │
└────────────────┬────────────────────────────┘
                 │ HTTP/SSE Protocol
                 ▼
┌─────────────────────────────────────────────┐
│     Debug Host Service (Port 2601)          │
├─────────────────────────────────────────────┤
│  • MCP HTTP Server (Express + SSE)          │
│  • Docker Manager                           │
│  • Port Registry                            │
│  • Log Manager (3-day rotation)             │
├─────────────────────────────────────────────┤
│     React Dashboard (Port 2602)             │
└─────────────┬───────────────────────────────┘
              │ Docker API
              ▼
┌─────────────────────────────────────────────┐
│          Pre-built Base Images              │
├─────────────────────────────────────────────┤
│  debug-host/node:latest    (with nodemon)   │
│  debug-host/python:latest  (with watchdog)  │
│  debug-host/php:latest     (with watcher)   │
│  debug-host/static:latest  (with vite/serve)│
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│     Running Containers (Project Instances)   │
├─────────────────────────────────────────────┤
│  Node Apps:    Ports 3000-3999              │
│  Python Apps:  Ports 5000-5999              │
│  PHP Apps:     Ports 8080-8980              │
│  Static Apps:  Ports 4000-4999              │
└─────────────────────────────────────────────┘
```

### Component Descriptions

#### MCP HTTP Server
- **Technology**: Node.js with Express framework
- **Protocol**: HTTP with Server-Sent Events (SSE) for streaming
- **Port**: 2601
- **Purpose**: Primary interface for Claude Code agents to manage services

#### Docker Manager
- **Technology**: Dockerode library for Node.js
- **Purpose**: Container lifecycle management, image handling, network configuration
- **Features**: Container creation, start/stop/restart, health monitoring, resource limits

#### Port Registry
- **Purpose**: Intelligent port allocation with conflict prevention
- **Features**: Range-based allocation, automatic assignment, conflict detection
- **Storage**: JSON file with real-time updates

#### Log Manager
- **Purpose**: Centralized logging with rotation and streaming
- **Retention**: 3-day automatic rotation
- **Features**: Real-time streaming via SSE, multiplexed output, search capability

#### React Dashboard
- **Technology**: React 18 with TypeScript
- **Port**: 2602
- **Purpose**: Human-readable monitoring and manual intervention interface
- **Features**: Real-time updates, service control, log viewing, metrics display

## Port Allocation Strategy

### System Ports (Reserved)
```
2601: MCP HTTP/SSE Server (Primary Interface)
2602: React Dashboard
2603: Metrics API (Future - Prometheus-compatible)
2604: Health Check Endpoint (Future)
2605: WebSocket for real-time updates (Future)
2606-2699: Reserved for system expansion
```

### Application Port Ranges
```
Node Applications:    3000-3999  (1,000 ports)
Static Applications:  4000-4999  (1,000 ports)
Python Applications:  5000-5999  (1,000 ports)
PHP Applications:     8080-8980  (901 ports)
────────────────────────────────────────────
Total Capacity:       3,901 application ports
```

### Port Conflict Resolution
1. Type validation ensures applications use correct range
2. Automatic assignment finds next available port in range
3. Detailed error messages guide agents to resolution
4. Port exhaustion handling with clear feedback

## Pre-built Docker Base Images

### Node.js Base Image
```dockerfile
# debug-host/node:latest
FROM node:20-slim
RUN npm install -g nodemon pm2 tsx ts-node
WORKDIR /app
ENV NODE_ENV=development
# Auto-restart configuration
CMD ["nodemon", "--watch", "/app", "--ext", "js,ts,json,mjs", "--delay", "1000ms"]
```

### Python Base Image
```dockerfile
# debug-host/python:latest
FROM python:3.11-slim
RUN pip install watchdog python-dotenv
WORKDIR /app
ENV PYTHONUNBUFFERED=1
# Auto-restart configuration
CMD ["python", "-m", "watchdog.auto_restart", "--directory", "/app", "--pattern", "*.py"]
```

### PHP Base Image
```dockerfile
# debug-host/php:latest
FROM php:8.2-cli
RUN apt-get update && apt-get install -y inotify-tools
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
WORKDIR /app
COPY ./scripts/php-watcher.sh /usr/local/bin/
# Auto-restart configuration
CMD ["php-watcher.sh"]
```

### Static Content Base Image
```dockerfile
# debug-host/static:latest
FROM node:20-slim
RUN npm install -g serve http-server vite
WORKDIR /app
# Serves with built-in hot reload
CMD ["serve", "-p", "$PORT"]
```

## Project Lifecycle Management

### 1. Registration Phase
```javascript
// Agent registers a new project
const result = await mcp.call('host.register', {
  name: 'my-api-service',
  type: 'node',
  workspace: '/mnt/c/Projects/my-api'
});

// Returns
{
  projectId: 'proj_abc123def456',
  status: 'registered',
  type: 'node',
  portRange: '3000-3999'
}
```

### 2. Start Phase
```javascript
// Agent starts the project with specific command
const result = await mcp.call('host.start', {
  projectId: 'proj_abc123def456',
  command: 'npm run dev',  // Agent-specified command
  port: 3000              // Or 'auto' for automatic assignment
});

// Returns
{
  success: true,
  port: 3000,
  status: 'running',
  containerId: 'docker_container_abc123',
  url: 'http://localhost:3000'
}
```

### 3. Internal Execution Flow
1. Select appropriate pre-built base image
2. Create container with workspace mounted to `/app`
3. Establish persistent volume for dependencies
4. Configure file watcher with language-specific patterns
5. Execute wrapped command with auto-restart
6. Stream logs to MCP clients and dashboard
7. Monitor health and resource usage

### 4. Stop/Cleanup Phase
```javascript
// Agent stops the project
await mcp.call('host.stop', {
  projectId: 'proj_abc123def456'
});

// Agent removes project entirely
await mcp.call('host.remove', {
  projectId: 'proj_abc123def456'
});
```

## Auto-Restart and File Watching

### Configuration by Language

| Language | Watcher Tool | File Patterns | Ignored | Restart Delay | Graceful Shutdown |
|----------|-------------|---------------|---------|---------------|-------------------|
| Node | nodemon | *.js, *.ts, *.json, *.mjs | node_modules, .git, .env | 1 second | SIGTERM → 10s → SIGKILL |
| Python | watchdog | *.py, *.pyw | __pycache__, venv, .git | 1 second | SIGTERM → 5s → SIGKILL |
| PHP | inotify | *.php, *.inc | vendor, .git | 500ms | SIGTERM → 3s → SIGKILL |
| Static | vite/serve | (built-in HMR) | node_modules, .git | immediate | N/A (stateless) |

### Dependency Management

#### Node.js Projects
- Persistent `node_modules` volume per project
- Automatic `npm install` on package.json changes
- Support for npm, yarn, pnpm package managers

#### Python Projects
- Virtual environment inside container at `/app/venv`
- Automatic `pip install -r requirements.txt` on changes
- Support for pip, poetry, pipenv

#### PHP Projects
- Persistent `vendor` directory
- Automatic `composer install` on composer.json changes
- Autoload configuration preserved

## MCP API Specification

### Tool Definitions

```typescript
interface DebugHostTools {
  // Project Management
  'host.register': (args: {
    name: string
    type: 'node' | 'python' | 'php' | 'static'
    workspace: string
  }) => {
    projectId: string
    status: 'registered'
    type: string
    portRange: string
  }

  'host.start': (args: {
    projectId: string
    command: string           // Agent-specified command
    port?: number | 'auto'    // Specific port or automatic
    env?: Record<string, string>  // Additional environment variables
  }) => {
    success: boolean
    port?: number
    status: 'running' | 'failed'
    containerId?: string
    error?: {
      type: 'SYSTEM_RESERVED' | 'PORT_IN_USE' | 'WRONG_RANGE' | 'HOST_PORT_BUSY'
      message: string
      details?: object
      suggestions?: number[]
    }
  }

  'host.stop': (args: {
    projectId: string
  }) => {
    status: 'stopped'
    stoppedAt: string
  }

  'host.restart': (args: {
    projectId: string
  }) => {
    status: 'running'
    restartedAt: string
  }

  'host.remove': (args: {
    projectId: string
    cleanup?: boolean  // Remove logs and volumes
  }) => {
    removed: true
    cleaned: boolean
  }

  // Discovery & Monitoring
  'host.list': () => Array<{
    projectId: string
    name: string
    type: string
    status: 'running' | 'stopped' | 'error'
    port?: number
    uptime?: number
    cpu?: number
    memory?: number
  }>

  'host.status': (args: {
    projectId: string
  }) => {
    running: boolean
    port?: number
    containerId?: string
    cpu: number
    memory: number
    uptime: number
    lastError?: string
  }

  // Logging
  'host.logs': (args: {
    projectId: string
    lines?: number      // Default: 100
    since?: string      // ISO timestamp
    grep?: string       // Search pattern
  }) => string[]

  // Port Management
  'host.checkPort': (args: {
    port: number
  }) => {
    available: boolean
    reason?: string
    owner?: {
      projectId?: string
      projectName?: string
      systemService?: string
      externalProcess?: string
    }
  }

  'host.suggestPort': (args: {
    type: 'node' | 'python' | 'php' | 'static'
    preferred?: number[]
  }) => {
    suggested: number
    alternatives: number[]
  }

  'host.ports': () => Record<number, {
    projectId: string
    projectName: string
    type: string
    assignedAt: string
  }>
}
```

### SSE Streaming Endpoints

```http
GET /mcp/logs/:projectId/stream
Accept: text/event-stream

Response:
event: log
data: {"timestamp":"2024-01-15T10:00:00Z","message":"Server started on port 3000"}

event: log
data: {"timestamp":"2024-01-15T10:00:01Z","message":"Database connected"}

event: error
data: {"timestamp":"2024-01-15T10:00:02Z","error":"Connection timeout"}
```

## Data Storage Schema

### File System Layout
```
/opt/debug-host/
├── src/
│   ├── index.js              # Main entry point
│   ├── mcp-server.js         # MCP HTTP/SSE implementation
│   ├── docker-manager.js     # Docker orchestration
│   ├── port-registry.js      # Port allocation logic
│   ├── log-manager.js        # Log rotation and streaming
│   └── project-manager.js    # Project lifecycle
├── data/
│   ├── projects.json         # Project registry
│   ├── ports.json           # Port allocations
│   ├── config.json          # System configuration
│   └── metrics.json         # Performance metrics
├── logs/
│   ├── system/
│   │   └── debug-host.log   # System logs
│   └── projects/
│       └── {projectId}/
│           ├── 2024-01-15.log  # Current day
│           ├── 2024-01-14.log  # Yesterday
│           └── 2024-01-13.log  # 2 days ago
├── volumes/
│   └── {projectId}_deps/    # Persistent dependencies
├── dashboard/               # React monitoring UI
│   ├── src/
│   └── build/
└── docker/
    ├── node.dockerfile
    ├── python.dockerfile
    ├── php.dockerfile
    └── static.dockerfile
```

### Project Registry Schema
```json
{
  "projects": {
    "proj_abc123def456": {
      "id": "proj_abc123def456",
      "name": "my-api-service",
      "type": "node",
      "workspace": "/mnt/c/Projects/my-api",
      "port": 3000,
      "created": "2024-01-15T10:00:00Z",
      "lastStarted": "2024-01-15T14:30:00Z",
      "container": {
        "id": "docker_container_abc123",
        "status": "running",
        "started": "2024-01-15T14:30:00Z",
        "image": "debug-host/node:latest"
      },
      "config": {
        "command": "npm run dev",
        "env": {
          "NODE_ENV": "development",
          "DEBUG": "app:*"
        },
        "autoRestart": true,
        "watchPatterns": ["*.js", "*.ts", "*.json"]
      },
      "metrics": {
        "restarts": 12,
        "totalUptime": 3600000,
        "lastCrash": null
      }
    }
  }
}
```

### Port Registry Schema
```json
{
  "system": {
    "2601": {
      "service": "mcp-server",
      "status": "running",
      "pid": 12345,
      "started": "2024-01-15T09:00:00Z"
    },
    "2602": {
      "service": "dashboard",
      "status": "running",
      "pid": 12346,
      "started": "2024-01-15T09:00:00Z"
    }
  },
  "applications": {
    "3000": {
      "projectId": "proj_abc123def456",
      "projectName": "my-api-service",
      "type": "node",
      "assigned": "2024-01-15T10:00:00Z",
      "containerId": "docker_container_abc123"
    }
  },
  "history": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "action": "assigned",
      "port": 3000,
      "projectId": "proj_abc123def456",
      "type": "node"
    }
  ]
}
```

## Network Architecture

### Docker Network Configuration
```yaml
# docker-compose.yml
version: '3.8'

networks:
  debug-host-network:
    name: debug-host-network
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1

services:
  debug-host:
    image: debug-host/core:latest
    networks:
      - debug-host-network
    ports:
      - "2601:2601"  # MCP Server
      - "2602:2602"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
      - ./logs:/app/logs
```

### Container Network Policy
- All project containers join `debug-host-network`
- No firewall between containers (full mesh connectivity)
- Containers addressable by hostname: `project-{projectId}`
- External access only through published ports

## Security Considerations

### Access Control
- MCP server binds to localhost only (127.0.0.1:2601)
- No authentication required (local development only)
- Dashboard accessible only from local machine

### Container Isolation
- Read-only root filesystem where possible
- No privileged containers
- Resource limits enforced (CPU, memory)
- User namespace remapping (future enhancement)

### Secret Management
- Environment variables loaded from project `.env` files
- No secrets stored in debug-host data files
- Container environment isolated from host

## Performance Specifications

### Target Metrics
- Project start time: < 3 seconds
- Port allocation: < 100ms
- Log streaming latency: < 500ms
- Dashboard update frequency: 1 Hz
- Maximum concurrent projects: 10
- Maximum log retention: 3 days per project

### Resource Limits
- Per container CPU: 2 cores max
- Per container memory: 2GB max
- Per container disk: 10GB max
- Total system overhead: < 500MB RAM

## Error Handling Strategy

### Port Conflicts
- Detailed error messages with specific conflict information
- Automatic suggestions for alternative ports
- Range validation with clear guidance

### Container Failures
- Automatic restart with exponential backoff
- Crash logs preserved in project logs
- Health check integration for proactive recovery

### System Errors
- Graceful degradation when Docker unavailable
- Persistent state recovery after restart
- Clear error propagation to MCP clients

## Future Enhancements (Not in MVP)

1. **Metrics & Monitoring**
   - Prometheus metrics endpoint (port 2603)
   - Grafana dashboard integration
   - Performance profiling per project

2. **Advanced Networking**
   - Project network isolation options
   - Custom DNS resolution
   - Load balancer integration

3. **Enhanced Security**
   - JWT authentication for MCP
   - Role-based access control
   - Audit logging

4. **Scaling Features**
   - Multi-instance project support
   - Distributed deployment
   - Kubernetes migration path

## Implementation Priorities

### Phase 1: Core Infrastructure (Week 1)
1. Build Docker base images
2. Implement MCP HTTP server
3. Create Docker manager module
4. Develop port registry

### Phase 2: Project Management (Week 2)
1. Project registration system
2. Container lifecycle management
3. Log management with rotation
4. Error handling framework

### Phase 3: User Interface (Week 3)
1. React dashboard scaffolding
2. Real-time WebSocket updates
3. Log viewer component
4. Service control panel

### Phase 4: Testing & Hardening (Week 4)
1. Integration test suite
2. Load testing
3. Error recovery testing
4. Documentation completion

## Approval and Sign-off

This architecture has been reviewed and approved for implementation. It represents a balanced approach between functionality and simplicity, prioritizing Claude Code agent integration while maintaining human oversight capabilities.

**Approved by**: User (Project Owner)  
**Date**: January 5, 2025  
**Status**: Ready for Implementation

---

*This document serves as the authoritative reference for the MCP Debug Host Platform architecture. All implementation decisions should align with the specifications defined herein.*