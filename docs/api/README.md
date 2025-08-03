# API Reference

The MCP Debug Host Server provides three types of APIs for different use cases:

1. **🔧 MCP Tools API** - For AI agents to manage processes
2. **🌐 WebSocket API** - For real-time communication
3. **📡 REST API** - For dashboard and external integrations

This comprehensive reference covers all endpoints, parameters, and usage examples.

## 📋 Quick Reference

### MCP Tools
- [`server:start`](mcp-tools.md#serverstart) - Start a development server
- [`server:stop`](mcp-tools.md#serverstop) - Stop a running server
- [`server:logs`](mcp-tools.md#serverlogs) - Get server logs
- [`server:status`](mcp-tools.md#serverstatus) - Get session status
- [`server:restart`](mcp-tools.md#serverrestart) - Restart a server
- [`system:health`](mcp-tools.md#systemhealth) - Get system health
- [`framework:detect`](mcp-tools.md#frameworkdetect) - Detect project framework

### REST API
- [`GET /api/sessions`](rest-api.md#get-apisessions) - List all sessions
- [`POST /api/sessions`](rest-api.md#post-apisessions) - Create new session
- [`GET /api/sessions/:id`](rest-api.md#get-apisessionsid) - Get session details
- [`DELETE /api/sessions/:id`](rest-api.md#delete-apisessionsid) - Stop session
- [`GET /api/sessions/:id/logs`](rest-api.md#get-apisessionsidlogs) - Get session logs
- [`GET /api/health`](rest-api.md#get-apihealth) - Health check

### WebSocket Events
- [`session:created`](websocket-api.md#sessioncreated) - New session started
- [`session:stopped`](websocket-api.md#sessionstopped) - Session stopped
- [`session:log`](websocket-api.md#sessionlog) - New log entry
- [`system:metrics`](websocket-api.md#systemmetrics) - System metrics update

## 🚀 Getting Started with APIs

### Using MCP Tools (AI Agents)

MCP tools are automatically available to AI agents when the server is running:

```javascript
// AI agent can use these tools directly
await mcp.callTool('server:start', {
  cwd: '/path/to/project',
  port: 3000,
  sessionName: 'My React App'
});
```

### Using REST API (External Applications)

```javascript
// Fetch all sessions
const response = await fetch('http://localhost:8080/api/sessions');
const sessions = await response.json();

// Start a new session
const newSession = await fetch('http://localhost:8080/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cwd: '/path/to/project',
    port: 3000,
    sessionName: 'My App'
  })
});
```

### Using WebSocket API (Real-time Updates)

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  switch (event.type) {
    case 'session:log':
      console.log(`[${event.sessionId}] ${event.message}`);
      break;
    case 'session:created':
      console.log(`New session: ${event.sessionName}`);
      break;
  }
});
```

## 📚 Detailed Documentation

### [MCP Tools API](mcp-tools.md)
Complete reference for all MCP tools that AI agents can use to manage development processes.

### [REST API](rest-api.md)
HTTP endpoints for dashboard functionality and external integrations.

### [WebSocket API](websocket-api.md)
Real-time events and messaging for live updates and monitoring.

### [Configuration API](configuration-api.md)
Settings and configuration management endpoints.

## 🔐 Authentication & Security

### API Keys (Optional)

Configure API key authentication in `.env`:

```env
ENABLE_API_AUTH=true
API_KEYS=key1,key2,key3
```

Use API keys in requests:

```bash
# With header
curl -H "X-API-Key: your-api-key" http://localhost:8080/api/sessions

# With query parameter
curl "http://localhost:8080/api/sessions?api_key=your-api-key"
```

### CORS Configuration

Configure allowed origins:

```env
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000,https://mydomain.com
```

### Rate Limiting

API requests are rate-limited by default:

```env
API_RATE_LIMIT=100  # Requests per minute per IP
```

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📊 Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "status": "running"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID 'invalid-id' not found",
    "details": {
      "sessionId": "invalid-id"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Pagination

Large result sets are paginated:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 245,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔍 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid request parameters | 400 |
| `SESSION_NOT_FOUND` | Session ID not found | 404 |
| `PORT_IN_USE` | Requested port is already in use | 409 |
| `FRAMEWORK_NOT_SUPPORTED` | Framework not supported | 422 |
| `PROCESS_START_FAILED` | Failed to start process | 500 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `UNAUTHORIZED` | Invalid API key | 401 |
| `FORBIDDEN` | Access denied | 403 |

## 📈 Usage Examples

### Complete Workflow Example

```javascript
// 1. Detect framework
const detection = await mcp.callTool('framework:detect', {
  projectPath: '/path/to/project'
});

// 2. Start server
const session = await mcp.callTool('server:start', {
  cwd: '/path/to/project',
  framework: detection.framework,
  port: detection.defaultPort,
  sessionName: 'My Project'
});

// 3. Monitor logs
const logs = await mcp.callTool('server:logs', {
  sessionId: session.sessionId,
  tail: 50,
  follow: true
});

// 4. Check status
const status = await mcp.callTool('server:status', {
  sessionId: session.sessionId
});

// 5. Stop when done
await mcp.callTool('server:stop', {
  sessionId: session.sessionId
});
```

### Dashboard Integration Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Custom Dashboard</title>
</head>
<body>
    <div id="sessions"></div>
    <div id="logs"></div>

    <script>
        // Connect to WebSocket
        const ws = new WebSocket('ws://localhost:8080');
        
        // Load initial sessions
        fetch('/api/sessions')
            .then(r => r.json())
            .then(data => {
                renderSessions(data.data);
            });
        
        // Listen for real-time updates
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'session:created':
                    addSession(data.session);
                    break;
                case 'session:log':
                    appendLog(data.sessionId, data.message);
                    break;
                case 'session:stopped':
                    removeSession(data.sessionId);
                    break;
            }
        };
        
        function renderSessions(sessions) {
            const container = document.getElementById('sessions');
            container.innerHTML = sessions.map(session => `
                <div class="session" data-id="${session.id}">
                    <h3>${session.name}</h3>
                    <p>Status: ${session.status}</p>
                    <button onclick="stopSession('${session.id}')">Stop</button>
                    <button onclick="viewLogs('${session.id}')">Logs</button>
                </div>
            `).join('');
        }
        
        async function stopSession(sessionId) {
            await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });
        }
        
        async function viewLogs(sessionId) {
            const response = await fetch(`/api/sessions/${sessionId}/logs`);
            const logs = await response.json();
            
            document.getElementById('logs').innerHTML = 
                logs.data.map(log => `<div>${log.timestamp} ${log.message}</div>`).join('');
        }
    </script>
</body>
</html>
```

## 🧪 Testing APIs

### Using curl

```bash
# Get all sessions
curl http://localhost:8080/api/sessions

# Start a session
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"cwd":"/path/to/project","port":3000}'

# Get session logs
curl "http://localhost:8080/api/sessions/session-id/logs?tail=100"

# Health check
curl http://localhost:8080/api/health
```

### Using Postman

Import the [Postman Collection](../assets/MCP-Debug-Host.postman_collection.json) for interactive testing.

### Using JavaScript

```javascript
// Test MCP tools (in Claude Code environment)
const testMCPTools = async () => {
  try {
    // Test framework detection
    const detection = await mcp.callTool('framework:detect', {
      projectPath: process.cwd()
    });
    console.log('Framework:', detection);
    
    // Test server start
    const session = await mcp.callTool('server:start', {
      cwd: process.cwd(),
      port: 3000
    });
    console.log('Session:', session);
    
    // Test logs
    const logs = await mcp.callTool('server:logs', {
      sessionId: session.sessionId,
      tail: 10
    });
    console.log('Logs:', logs);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## 📝 SDK & Client Libraries

### JavaScript SDK

```javascript
import { MCPDebugHostClient } from '@apm/debug-host-client';

const client = new MCPDebugHostClient('http://localhost:8080');

// Start a session
const session = await client.sessions.create({
  cwd: '/path/to/project',
  port: 3000,
  sessionName: 'My App'
});

// Get logs
const logs = await client.sessions.getLogs(session.id, { tail: 100 });

// Stop session
await client.sessions.delete(session.id);
```

### Python SDK

```python
from apm_debug_host import DebugHostClient

client = DebugHostClient('http://localhost:8080')

# Start a session
session = client.sessions.create(
    cwd='/path/to/project',
    port=3000,
    session_name='My App'
)

# Get logs
logs = client.sessions.get_logs(session.id, tail=100)

# Stop session
client.sessions.delete(session.id)
```

## 🔗 Related Documentation

- [Getting Started Guide](../getting-started/README.md) - Basic usage
- [Dashboard Tour](../getting-started/dashboard-tour.md) - Web interface
- [Developer Guide](../developer/README.md) - Extending functionality
- [Best Practices](../training/best-practices.md) - Optimization tips

---

**📚 API Reference Complete!** You now have comprehensive documentation for all MCP Debug Host Server APIs.

**Next Steps:**
- 🔧 [MCP Tools API](mcp-tools.md) - Detailed MCP tool reference
- 📡 [REST API](rest-api.md) - HTTP endpoint documentation
- 🌐 [WebSocket API](websocket-api.md) - Real-time communication