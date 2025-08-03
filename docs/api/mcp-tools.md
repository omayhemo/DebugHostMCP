# MCP Tools API Reference

MCP (Model Context Protocol) tools are the primary interface for AI agents to interact with the Debug Host Server. These tools enable AI agents to start, stop, monitor, and manage development processes seamlessly.

## 🔧 Available Tools

### Core Process Management
- [`server:start`](#serverstart) - Start a development server
- [`server:stop`](#serverstop) - Stop a running server  
- [`server:restart`](#serverrestart) - Restart a server
- [`server:logs`](#serverlogs) - Get server logs
- [`server:status`](#serverstatus) - Get session status

### System Information
- [`system:health`](#systemhealth) - Get system health status
- [`framework:detect`](#frameworkdetect) - Detect project framework
- [`system:metrics`](#systemmetrics) - Get system performance metrics

### Advanced Operations
- [`session:list`](#sessionlist) - List all active sessions
- [`session:export`](#sessionexport) - Export session logs
- [`process:kill`](#processkill) - Force kill a process

## 🚀 Core Process Management

### `server:start`

Starts a development server with automatic framework detection and intelligent port management.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cwd` | string | ✅ | Working directory (project root) |
| `port` | number | ❌ | Port number (auto-assigned if not specified) |
| `sessionName` | string | ❌ | Human-readable session name |
| `framework` | string | ❌ | Framework override (auto-detected if not specified) |
| `command` | string | ❌ | Custom start command |
| `env` | object | ❌ | Environment variables |
| `args` | string[] | ❌ | Additional command arguments |

**Example Usage:**

```json
{
  "tool": "server:start",
  "parameters": {
    "cwd": "/home/user/my-react-app",
    "port": 3000,
    "sessionName": "My React App",
    "env": {
      "NODE_ENV": "development",
      "REACT_APP_API_URL": "http://localhost:8000"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "sessionName": "My React App",
    "framework": "react",
    "port": 3000,
    "pid": 12345,
    "status": "starting",
    "cwd": "/home/user/my-react-app",
    "command": "npm start",
    "startTime": "2024-01-15T10:30:00.000Z",
    "dashboardUrl": "http://localhost:8080/sessions/f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

**Framework-Specific Behaviors:**

- **React**: Uses `npm start` or `yarn start`
- **Next.js**: Uses `npm run dev` or `yarn dev`
- **Vue.js**: Uses `npm run serve` or `yarn serve`
- **Django**: Uses `python manage.py runserver`
- **Laravel**: Uses `php artisan serve`
- **Express**: Uses `npm start` or `node server.js`

### `server:stop`

Gracefully stops a running development server.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID to stop |
| `force` | boolean | ❌ | Force kill if graceful stop fails (default: false) |
| `timeout` | number | ❌ | Timeout in seconds for graceful stop (default: 30) |

**Example Usage:**

```json
{
  "tool": "server:stop",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "force": false,
    "timeout": 30
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "stopped",
    "stopTime": "2024-01-15T11:45:00.000Z",
    "runtime": "1h 15m 32s",
    "gracefulStop": true
  }
}
```

### `server:restart`

Restarts a development server (stop + start).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID to restart |
| `preserveEnv` | boolean | ❌ | Keep existing environment variables (default: true) |
| `newPort` | number | ❌ | Use a different port |

**Example Usage:**

```json
{
  "tool": "server:restart",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "preserveEnv": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "restarting",
    "restartTime": "2024-01-15T12:00:00.000Z",
    "newPid": 12387,
    "previousRuntime": "2h 30m 15s"
  }
}
```

### `server:logs`

Retrieves logs from a development server session.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID |
| `tail` | number | ❌ | Number of recent lines (default: 100) |
| `follow` | boolean | ❌ | Stream live logs (default: false) |
| `filter` | string | ❌ | Filter logs by level (error, warn, info, debug) |
| `search` | string | ❌ | Search for specific text |
| `since` | string | ❌ | Get logs since timestamp (ISO 8601) |

**Example Usage:**

```json
{
  "tool": "server:logs",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "tail": 50,
    "filter": "error",
    "search": "webpack"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "logs": [
      {
        "timestamp": "2024-01-15T10:32:15.123Z",
        "level": "info",
        "message": "webpack compiled successfully",
        "source": "webpack-dev-server"
      },
      {
        "timestamp": "2024-01-15T10:32:18.456Z",
        "level": "error", 
        "message": "Module not found: Error: Can't resolve './component'",
        "source": "webpack",
        "details": {
          "file": "src/App.js",
          "line": 23,
          "column": 15
        }
      }
    ],
    "totalLines": 1247,
    "filteredLines": 2,
    "following": false
  }
}
```

### `server:status`

Gets detailed status information for one or all sessions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ❌ | Specific session ID (omit for all sessions) |
| `includeMetrics` | boolean | ❌ | Include performance metrics (default: false) |

**Example Usage:**

```json
{
  "tool": "server:status",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "includeMetrics": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "sessionName": "My React App",
    "status": "running",
    "framework": "react",
    "port": 3000,
    "pid": 12345,
    "cwd": "/home/user/my-react-app",
    "command": "npm start",
    "startTime": "2024-01-15T10:30:00.000Z",
    "runtime": "45m 23s",
    "url": "http://localhost:3000",
    "health": "healthy",
    "metrics": {
      "cpu": 12.5,
      "memory": 145.2,
      "uptime": 2723,
      "restarts": 0,
      "errors": 2,
      "warnings": 8
    },
    "lastActivity": "2024-01-15T11:14:42.000Z"
  }
}
```

## 📊 System Information

### `system:health`

Gets overall system health and status.

**Parameters:** None

**Example Usage:**

```json
{
  "tool": "system:health",
  "parameters": {}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "2d 14h 32m",
    "version": "1.2.3",
    "sessions": {
      "total": 3,
      "running": 2,
      "stopped": 1,
      "errors": 0
    },
    "system": {
      "cpu": 23.4,
      "memory": 67.8,
      "disk": 45.2,
      "load": [1.2, 1.1, 0.9]
    },
    "dashboard": {
      "url": "http://localhost:8080",
      "connected": true,
      "clients": 2
    }
  }
}
```

### `framework:detect`

Automatically detects the framework and configuration for a project.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectPath` | string | ✅ | Path to project directory |
| `deep` | boolean | ❌ | Perform deep analysis (default: false) |

**Example Usage:**

```json
{
  "tool": "framework:detect",
  "parameters": {
    "projectPath": "/home/user/my-project",
    "deep": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "framework": "react",
    "version": "18.2.0",
    "buildTool": "webpack",
    "packageManager": "npm",
    "startCommand": "npm start",
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "defaultPort": 3000,
    "configFiles": [
      "package.json",
      "webpack.config.js",
      "tsconfig.json"
    ],
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "typescript": "^4.9.4"
    },
    "confidence": 0.95,
    "recommendations": [
      "Enable TypeScript strict mode",
      "Add ESLint configuration",
      "Consider upgrading to React 18.3"
    ]
  }
}
```

### `system:metrics`

Gets detailed system performance metrics.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeRange` | string | ❌ | Time range: '1h', '24h', '7d' (default: '1h') |
| `sessionId` | string | ❌ | Metrics for specific session only |

**Example Usage:**

```json
{
  "tool": "system:metrics",
  "parameters": {
    "timeRange": "24h"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "timestamp": "2024-01-15T11:30:00.000Z",
    "system": {
      "cpu": {
        "current": 23.4,
        "average": 18.7,
        "peak": 87.2,
        "history": [12.1, 15.3, 23.4, ...]
      },
      "memory": {
        "current": 67.8,
        "average": 45.2,
        "peak": 89.1,
        "available": 8192,
        "used": 5547
      },
      "disk": {
        "usage": 45.2,
        "available": 125000,
        "ioRate": 234.5
      },
      "network": {
        "bytesIn": 1024768,
        "bytesOut": 2048192,
        "connections": 23
      }
    },
    "sessions": [
      {
        "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "cpu": 12.5,
        "memory": 145.2,
        "uptime": 7200,
        "errors": 2
      }
    ]
  }
}
```

## 🔍 Advanced Operations

### `session:list`

Lists all active and recent sessions with detailed information.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ❌ | Filter by status: 'running', 'stopped', 'error' |
| `framework` | string | ❌ | Filter by framework |
| `limit` | number | ❌ | Maximum sessions to return (default: 50) |

**Example Usage:**

```json
{
  "tool": "session:list",
  "parameters": {
    "status": "running",
    "limit": 10
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "sessionName": "My React App",
        "status": "running",
        "framework": "react",
        "port": 3000,
        "pid": 12345,
        "startTime": "2024-01-15T10:30:00.000Z",
        "runtime": "1h 15m",
        "cwd": "/home/user/my-react-app"
      },
      {
        "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "sessionName": "Django API",
        "status": "running",
        "framework": "django",
        "port": 8000,
        "pid": 12387,
        "startTime": "2024-01-15T09:15:00.000Z",
        "runtime": "2h 30m",
        "cwd": "/home/user/my-django-api"
      }
    ],
    "total": 2,
    "running": 2,
    "stopped": 0
  }
}
```

### `session:export`

Exports session logs and configuration for debugging or archival.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID to export |
| `format` | string | ❌ | Export format: 'json', 'csv', 'txt' (default: 'json') |
| `includeConfig` | boolean | ❌ | Include session configuration (default: true) |

**Example Usage:**

```json
{
  "tool": "session:export",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "format": "json",
    "includeConfig": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "exportFormat": "json",
    "exportPath": "/tmp/session-export-20240115-1130.json",
    "downloadUrl": "http://localhost:8080/api/exports/session-export-20240115-1130.json",
    "size": 2048576,
    "logLines": 15432,
    "timeRange": {
      "start": "2024-01-15T10:30:00.000Z",
      "end": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

### `process:kill`

Force kills a process when normal stop doesn't work.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID |
| `signal` | string | ❌ | Kill signal: 'SIGTERM', 'SIGKILL' (default: 'SIGTERM') |

**Example Usage:**

```json
{
  "tool": "process:kill",
  "parameters": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "signal": "SIGKILL"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "pid": 12345,
    "signal": "SIGKILL",
    "killed": true,
    "killTime": "2024-01-15T11:45:00.000Z"
  }
}
```

## 🚨 Error Handling

### Common Error Responses

**Session Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID 'invalid-id' not found",
    "details": {
      "sessionId": "invalid-id",
      "availableSessions": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
    }
  }
}
```

**Port In Use:**
```json
{
  "success": false,
  "error": {
    "code": "PORT_IN_USE",
    "message": "Port 3000 is already in use",
    "details": {
      "port": 3000,
      "suggestedPorts": [3001, 3002, 3003]
    }
  }
}
```

**Framework Not Supported:**
```json
{
  "success": false,
  "error": {
    "code": "FRAMEWORK_NOT_SUPPORTED",
    "message": "Framework 'unknown-framework' is not supported",
    "details": {
      "framework": "unknown-framework",
      "supportedFrameworks": ["react", "nextjs", "vue", "django", "laravel"]
    }
  }
}
```

**Process Start Failed:**
```json
{
  "success": false,
  "error": {
    "code": "PROCESS_START_FAILED",
    "message": "Failed to start development server",
    "details": {
      "command": "npm start",
      "exitCode": 1,
      "stderr": "Error: Cannot find module 'react-scripts'",
      "suggestion": "Run 'npm install' to install dependencies"
    }
  }
}
```

## 📋 Tool Usage Patterns

### Basic Development Workflow

```javascript
// 1. Detect project framework
const detection = await mcp.callTool('framework:detect', {
  projectPath: '/path/to/project'
});

// 2. Start development server
const session = await mcp.callTool('server:start', {
  cwd: '/path/to/project',
  framework: detection.framework,
  port: detection.defaultPort || 3000,
  sessionName: 'My Project'
});

// 3. Monitor for a while
const logs = await mcp.callTool('server:logs', {
  sessionId: session.sessionId,
  tail: 20,
  filter: 'error'
});

// 4. Check if everything is healthy
const status = await mcp.callTool('server:status', {
  sessionId: session.sessionId,
  includeMetrics: true
});

// 5. Stop when done
await mcp.callTool('server:stop', {
  sessionId: session.sessionId
});
```

### Multi-Service Development

```javascript
// Start multiple related services
const services = [
  { name: 'Frontend', path: '/app/frontend', port: 3000 },
  { name: 'Backend API', path: '/app/backend', port: 8000 },
  { name: 'Database', path: '/app/database', port: 5432 }
];

const sessions = [];

for (const service of services) {
  const session = await mcp.callTool('server:start', {
    cwd: service.path,
    port: service.port,
    sessionName: service.name
  });
  sessions.push(session);
}

// Monitor all services
const allStatus = await mcp.callTool('session:list', {
  status: 'running'
});

// Stop all services when done
for (const session of sessions) {
  await mcp.callTool('server:stop', {
    sessionId: session.sessionId
  });
}
```

### Debug and Troubleshooting

```javascript
// Get system health overview
const health = await mcp.callTool('system:health');

// Check specific session with detailed metrics
const status = await mcp.callTool('server:status', {
  sessionId: 'problematic-session-id',
  includeMetrics: true
});

// Get recent error logs
const errorLogs = await mcp.callTool('server:logs', {
  sessionId: 'problematic-session-id',
  filter: 'error',
  tail: 100
});

// If server is unresponsive, force kill
if (status.health === 'unhealthy') {
  await mcp.callTool('process:kill', {
    sessionId: 'problematic-session-id',
    signal: 'SIGKILL'
  });
}

// Export logs for external analysis
const exportData = await mcp.callTool('session:export', {
  sessionId: 'problematic-session-id',
  format: 'json',
  includeConfig: true
});
```

---

**🔧 MCP Tools Reference Complete!** AI agents now have comprehensive access to all Debug Host Server functionality.

**Next Steps:**
- 📡 [REST API](rest-api.md) - HTTP endpoints for external integrations
- 🌐 [WebSocket API](websocket-api.md) - Real-time communication
- 🎮 [Dashboard Tour](../getting-started/dashboard-tour.md) - Visual interface