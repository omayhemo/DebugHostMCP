# MCP Debug Host Architecture Plan
## Client-Server Implementation Standard

### Executive Summary
Transform the MCP Debug Host from a monolithic per-instance design to a distributed client-server architecture that eliminates conflicts and enables shared state across all Claude sessions and projects.

---

## 1. System Architecture

### 1.1 Component Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     System Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Claude Sessions                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Claude 1 │ │ Claude 2 │ │ Claude N │                   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘                   │
│       │            │            │                           │
│       ▼            ▼            ▼                           │
│  ┌──────────────────────────────────┐                      │
│  │   MCP Adapter Layer (Stateless)  │                      │
│  │   - No ports                     │                      │
│  │   - No persistent state          │                      │
│  │   - HTTP client only             │                      │
│  └────────────┬─────────────────────┘                      │
│               │                                             │
│               ▼ HTTP API (localhost:8081)                  │
│  ┌──────────────────────────────────────────┐             │
│  │        Global Debug Host Service         │             │
│  │  ┌────────────┬──────────┬────────────┐ │             │
│  │  │  Process   │   Log    │  Session   │ │             │
│  │  │  Manager   │  Store   │  Manager   │ │             │
│  │  └────────────┴──────────┴────────────┘ │             │
│  │  ┌────────────────────────────────────┐ │             │
│  │  │      Web Dashboard (:8080)         │ │             │
│  │  └────────────────────────────────────┘ │             │
│  └──────────────────────────────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Global Debug Host Service
- **Single Instance**: One per system, runs as daemon
- **Port Bindings**: 
  - 8080: Web Dashboard (WebSocket + HTTP)
  - 8081: REST API
  - 8082: Health Check Endpoint
- **State Management**: All process sessions, logs, metrics
- **Resource Control**: Process lifecycle, port allocation, cleanup
- **Persistence**: SQLite or file-based storage for sessions/logs

#### MCP Adapter
- **Multiple Instances**: One per Claude session
- **Stateless**: No local storage or state
- **Translation Layer**: MCP protocol ↔ HTTP API
- **Authentication**: Session tokens for API access
- **Error Handling**: Graceful degradation if service unavailable

---

## 2. API Specification

### 2.1 REST API Endpoints

```yaml
# Process Management
POST   /api/v1/servers
GET    /api/v1/servers
GET    /api/v1/servers/:id
DELETE /api/v1/servers/:id
POST   /api/v1/servers/:id/restart

# Log Management  
GET    /api/v1/servers/:id/logs
GET    /api/v1/servers/:id/logs/stream  # SSE endpoint

# Session Management
POST   /api/v1/sessions
GET    /api/v1/sessions
DELETE /api/v1/sessions/:id

# System Status
GET    /api/v1/health
GET    /api/v1/metrics
GET    /api/v1/config

# WebSocket
WS     /api/v1/ws  # Real-time updates
```

### 2.2 Data Models

```typescript
interface ServerSession {
  id: string;           // UUID
  name: string;
  command: string;
  cwd: string;
  port?: number;
  pid?: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  startTime: number;
  endTime?: number;
  exitCode?: number;
  env?: Record<string, string>;
  metadata?: Record<string, any>;
}

interface LogEntry {
  sessionId: string;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'system';
  data: string;
  metadata?: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

---

## 3. Implementation Plan

### Phase 1: Core Service Development (Week 1)
1. **Service Core**
   - [ ] Create `global-service.js` with Express server
   - [ ] Implement process manager with proper isolation
   - [ ] Add log aggregation with rotation
   - [ ] Build session persistence layer

2. **API Layer**
   - [ ] Implement all REST endpoints
   - [ ] Add WebSocket support for real-time updates
   - [ ] Create OpenAPI documentation
   - [ ] Add rate limiting and request validation

3. **Dashboard Updates**
   - [ ] Modify to use API instead of direct access
   - [ ] Add authentication UI if needed
   - [ ] Implement real-time log streaming
   - [ ] Add multi-session filtering

### Phase 2: MCP Adapter Development (Week 2)
1. **Adapter Core**
   - [ ] Create `mcp-adapter.js` 
   - [ ] Implement MCP Server with tool registration
   - [ ] Add HTTP client with retry logic
   - [ ] Handle service discovery

2. **Tool Implementations**
   ```javascript
   // Each tool becomes a thin wrapper
   async function server_start(params) {
     return apiClient.post('/servers', params);
   }
   ```

3. **Error Handling**
   - [ ] Graceful fallback if service unavailable
   - [ ] Queue commands for retry
   - [ ] User-friendly error messages

### Phase 3: Migration & Deployment (Week 3)
1. **Migration Strategy**
   - [ ] Backup existing installation
   - [ ] Migrate configuration to new format
   - [ ] Convert existing sessions if possible
   - [ ] Update system service definitions

2. **Deployment Automation**
   - [ ] Create installer script
   - [ ] Add systemd/launchd service files
   - [ ] Configure auto-start on boot
   - [ ] Add health monitoring

3. **Configuration Management**
   ```json
   // ~/.apm-debug-host/config.json
   {
     "service": {
       "apiPort": 8081,
       "dashboardPort": 8080,
       "healthPort": 8082
     },
     "storage": {
       "type": "sqlite",
       "path": "~/.apm-debug-host/data.db"
     },
     "limits": {
       "maxSessions": 50,
       "maxLogSize": "100MB",
       "sessionTimeout": "24h"
     }
   }
   ```

---

## 4. Technical Standards

### 4.1 Communication Protocol
- **HTTP/REST**: Primary API communication
- **WebSocket**: Real-time updates
- **Server-Sent Events**: Log streaming
- **JSON**: Data serialization format

### 4.2 Security
- **Authentication**: API key or JWT tokens
- **Authorization**: Per-session access control
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs
- **Process Isolation**: Sandbox execution

### 4.3 Reliability
- **Health Checks**: `/health` endpoint
- **Graceful Shutdown**: Clean process termination
- **Auto-Recovery**: Restart failed processes
- **Log Rotation**: Prevent disk exhaustion
- **Backup Strategy**: Regular state snapshots

### 4.4 Performance
- **Connection Pooling**: Reuse HTTP connections
- **Caching**: Cache frequent queries
- **Pagination**: Limit response sizes
- **Compression**: gzip for large responses
- **Async Operations**: Non-blocking I/O

---

## 5. File Structure

```
~/.apm-debug-host/
├── service/
│   ├── global-service.js      # Main service daemon
│   ├── api/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── validators/
│   ├── managers/
│   │   ├── process-manager.js
│   │   ├── log-manager.js
│   │   └── session-manager.js
│   └── dashboard/
│       ├── public/
│       └── src/
├── adapter/
│   ├── mcp-adapter.js         # MCP client adapter
│   ├── api-client.js          # HTTP client
│   └── tools/
│       ├── server-tools.js
│       └── log-tools.js
├── config/
│   ├── config.json            # Service configuration
│   └── mcp-config.json        # MCP registration
├── data/
│   ├── sessions.db            # SQLite database
│   └── logs/                  # Log files
├── scripts/
│   ├── install.sh
│   ├── uninstall.sh
│   └── migrate.sh
└── systemd/
    └── apm-debug-host.service
```

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Service API endpoints
- MCP adapter tools
- Process manager operations
- Log rotation logic

### 6.2 Integration Tests
- Full flow: MCP → Adapter → Service → Process
- Multi-session concurrency
- Service restart recovery
- Migration scenarios

### 6.3 Load Tests
- 50+ concurrent Claude sessions
- 100+ managed processes
- Log streaming performance
- Dashboard responsiveness

---

## 7. Migration Path

### From Current Setup
1. **Stop existing service**
   ```bash
   systemctl stop apm-debug-host
   ```

2. **Backup current data**
   ```bash
   cp -r ~/.apm-debug-host ~/.apm-debug-host.backup
   ```

3. **Install new service**
   ```bash
   ./scripts/install.sh
   ```

4. **Update Claude config**
   ```json
   {
     "mcpServers": {
       "debug-host": {
         "command": "node",
         "args": ["~/.apm-debug-host/adapter/mcp-adapter.js"]
       }
     }
   }
   ```

5. **Start new service**
   ```bash
   systemctl start apm-debug-host
   systemctl enable apm-debug-host
   ```

---

## 8. Success Criteria

### Functional Requirements
- [ ] Multiple Claude sessions can connect simultaneously
- [ ] No port conflicts between instances
- [ ] Shared visibility of all managed processes
- [ ] Dashboard accessible from any session
- [ ] Logs persist across Claude restarts

### Performance Requirements
- [ ] Service starts in < 2 seconds
- [ ] API response time < 100ms
- [ ] Support 50+ concurrent sessions
- [ ] Log streaming with < 500ms latency

### Reliability Requirements
- [ ] Service uptime > 99.9%
- [ ] Graceful handling of Claude disconnects
- [ ] Automatic recovery from crashes
- [ ] No data loss on service restart

---

## 9. Documentation Requirements

### User Documentation
- Installation guide
- Configuration reference
- Troubleshooting guide
- API documentation
- Dashboard user guide

### Developer Documentation
- Architecture overview
- API specification
- Contributing guidelines
- Testing procedures
- Release process

---

## 10. Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1 | Core Service | Global service, API, Dashboard updates |
| 2 | MCP Adapter | Adapter, tools, error handling |
| 3 | Migration | Installer, migration, deployment |
| 4 | Testing | Test suite, load tests, documentation |
| 5 | Release | Final testing, release, monitoring |

---

## 11. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Service downtime | High | Implement auto-restart, health monitoring |
| Data corruption | High | Use transactions, regular backups |
| Port conflicts | Medium | Use configurable ports, auto-detection |
| Performance degradation | Medium | Implement caching, connection pooling |
| Migration failures | Medium | Provide rollback script, test thoroughly |

---

## 12. Future Enhancements

### Phase 2 Features
- Multi-user support with authentication
- Cloud deployment option
- Metrics and monitoring integration
- Plugin system for custom tools
- Container/Docker support

### Phase 3 Features
- Distributed architecture (multiple hosts)
- GraphQL API option
- Advanced log analysis (search, filters)
- Process templates and presets
- CI/CD integration

---

## Appendix A: Example API Calls

### Start a server
```bash
curl -X POST http://localhost:8081/api/v1/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "command": "npm start",
    "cwd": "/home/user/projects/app",
    "port": 3000
  }'
```

### Stream logs
```bash
curl -N http://localhost:8081/api/v1/servers/abc-123/logs/stream
```

### WebSocket connection
```javascript
const ws = new WebSocket('ws://localhost:8081/api/v1/ws');
ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Server event:', event);
});
```

---

## Appendix B: Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "service": {
      "type": "object",
      "properties": {
        "apiPort": { "type": "number", "minimum": 1024, "maximum": 65535 },
        "dashboardPort": { "type": "number", "minimum": 1024, "maximum": 65535 },
        "host": { "type": "string", "default": "localhost" }
      }
    },
    "storage": {
      "type": "object",
      "properties": {
        "type": { "enum": ["sqlite", "json", "memory"] },
        "path": { "type": "string" }
      }
    },
    "limits": {
      "type": "object",
      "properties": {
        "maxSessions": { "type": "number", "minimum": 1 },
        "maxLogSize": { "type": "string", "pattern": "^\\d+[KMG]B$" }
      }
    }
  }
}
```

---

*This architecture plan provides a robust, scalable solution for managing development servers across multiple Claude sessions without conflicts.*