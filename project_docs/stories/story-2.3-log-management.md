# Story 2.3: Log Management System

| Field | Value |
|-------|--------|
| **Epic** | Phase 2: Project Management |
| **Story ID** | 2.3 |
| **Title** | Log Management System with Rotation and Streaming |
| **Status** | Draft |
| **Priority** | High |
| **Story Points** | 5 |
| **Sprint** | Sprint 2 |
| **Assignee** | Developer Agent |

## 📝 User Story

**As a** developer using MCP Debug Host
**I want** to access real-time logs and historical log data from my project containers
**So that** I can debug issues, monitor application behavior, and maintain development productivity

## ✅ Acceptance Criteria

### AC1: Real-Time Log Streaming
- **Given** a running project container
- **When** I request logs via `host.logs` or SSE endpoint
- **Then** the system should:
  - Stream live container output in real-time
  - Support filtering by log level (debug, info, warn, error)
  - Provide timestamped log entries
  - Handle multiple concurrent log streams

### AC2: Historical Log Access
- **Given** a project with existing log history
- **When** I request historical logs with time range
- **Then** the system should:
  - Return logs from specified time period
  - Support pagination for large log sets
  - Maintain chronological ordering
  - Preserve log formatting and metadata

### AC3: Log Rotation and Management
- **Given** containers generating continuous logs
- **When** log files reach size or age limits
- **Then** the system should:
  - Automatically rotate logs to prevent disk overflow
  - Compress old log files for storage efficiency
  - Maintain configurable retention periods
  - Clean up expired log files automatically

### AC4: Multi-Container Log Aggregation
- **Given** multiple project containers running
- **When** requesting aggregated logs
- **Then** the system should:
  - Merge logs from multiple containers chronologically
  - Tag logs with container/service identifiers
  - Support filtering by container or project
  - Provide unified log stream for related services

### AC5: Log Search and Filtering
- **Given** historical or live log data
- **When** applying search criteria or filters
- **Then** the system should:
  - Support text search across log messages
  - Filter by timestamp ranges
  - Filter by log levels and sources
  - Provide regex pattern matching

## 🔧 Technical Requirements

### Core Components
- **Log Collector**: Captures container stdout/stderr streams
- **Log Storage**: Persistent storage with rotation policies
- **Log Streamer**: SSE-based real-time log delivery
- **Log Search**: Index and query capabilities

### Log Format Structure
```javascript
const LOG_ENTRY = {
  timestamp: 'ISO-8601 datetime',
  projectId: 'uuid-string', 
  containerId: 'docker-container-id',
  level: 'debug|info|warn|error',
  source: 'stdout|stderr|system',
  message: 'log content',
  metadata: {
    service: 'service-name',
    component: 'component-name'
  }
};
```

### Storage Configuration
```javascript
const LOG_CONFIG = {
  retention: {
    maxFiles: 10,
    maxSize: '100MB',
    maxAge: '30d'
  },
  rotation: {
    frequency: 'daily',
    compress: true,
    datePattern: 'YYYY-MM-DD'
  },
  streaming: {
    bufferSize: 1024,
    flushInterval: 1000
  }
};
```

### API Endpoints
- `GET /api/projects/:id/logs` - Get historical logs
- `GET /api/projects/:id/logs/stream` - SSE real-time logs
- `GET /api/projects/:id/logs/search` - Search logs
- `POST /api/logs/rotate` - Manual log rotation
- `GET /api/logs/status` - Log system status

## 🏁 Definition of Done

### Requirements Met
- [ ] All functional requirements implemented
- [ ] All acceptance criteria met

### Coding Standards & Project Structure
- [ ] Integration with existing SSE infrastructure (Story 1.2)
- [ ] Proper log file management and permissions
- [ ] Configurable log levels and rotation policies
- [ ] Memory-efficient streaming implementation
- [ ] Error handling for log system failures
- [ ] No new linter errors
- [ ] Comprehensive system logging

### Testing
- [ ] Unit tests for log collection and storage
- [ ] Integration tests for SSE streaming
- [ ] Performance tests for large log volumes
- [ ] Log rotation and cleanup verification
- [ ] All tests passing with >80% coverage

### Functionality & Verification
- [ ] Manual verification of real-time streaming
- [ ] Log rotation triggers working correctly
- [ ] Search and filtering accuracy verified

### Dependencies, Build & Configuration
- [ ] Log storage directory configuration
- [ ] Disk space monitoring and alerts
- [ ] Integration with container lifecycle management
- [ ] No performance impact on container operations

### Documentation
- [ ] Log management API documentation
- [ ] Configuration guide for log policies
- [ ] Troubleshooting guide for log issues

## 🧪 Test Scenarios

### Happy Path Tests
1. **Real-Time Log Streaming**
   - Start container → Open log stream → Generate logs → Verify real-time delivery
   - Expect: Sub-second latency, no missing log entries

2. **Log Rotation Workflow**
   - Generate large log volume → Trigger rotation → Verify file management
   - Expect: Proper rotation, compression, cleanup of old files

3. **Multi-Container Aggregation**
   - Start multiple containers → Request aggregated logs → Verify merging
   - Expect: Chronological order, proper container tagging

### Edge Cases
1. **High-Volume Logging**
   - Container generating rapid log output
   - Expect: No dropped messages, proper back-pressure handling

2. **Log Search Performance**
   - Search across large historical log sets
   - Expect: Reasonable response times, accurate results

3. **Container Restart During Streaming**
   - Active log stream when container restarts
   - Expect: Graceful stream reconnection, continuity maintained

### Error Scenarios
1. **Disk Space Exhaustion**
   - Log storage approaching disk limits
   - Expect: Aggressive rotation, alerts, no system crash

2. **Corrupted Log Files**
   - Log file corruption or permission issues
   - Expect: Recovery mechanisms, alternative storage

3. **SSE Connection Failures**
   - Network interruptions during log streaming
   - Expect: Automatic reconnection, buffering of missed logs

## 📋 Implementation Tasks

### AP-TASKS-START
- [ ] Create `src/services/log-collector.js`
- [ ] Create `src/services/log-storage.js`
- [ ] Create `src/services/log-streamer.js`
- [ ] Update `src/mcp-tools.js` with log management tools
- [ ] Create `src/api/routes/logs.js`
- [ ] Implement log rotation policies
- [ ] Create log search and filtering
- [ ] Create SSE streaming tests
- [ ] Add log system monitoring
- [ ] Update container integration for log capture
### AP-TASKS-END

## 🔄 Dependencies

### Prerequisites
- Story 1.2: MCP HTTP Server Foundation (✅ Complete - SSE infrastructure)
- Story 1.3: Docker Manager Module (✅ Complete - container integration)
- Story 2.2: Container Lifecycle Management (Planned - log capture triggers)

### Integrations Needed
- Docker Manager for container log capture
- SSE infrastructure for real-time streaming
- Container Lifecycle for log start/stop triggers
- File system for log storage and rotation

## 💼 Business Context

### Value Proposition
- Essential debugging and monitoring capability
- Reduces context switching between tools
- Enables rapid development troubleshooting
- Foundation for advanced log analytics

### Success Metrics
- Log streaming latency <100ms average
- Zero log message loss during normal operation
- Disk usage growth <10MB per active container per hour
- Log search response time <2 seconds for typical queries

## 📝 Progress Log

### Development Notes
- Consider log indexing for faster search capabilities
- Log compression ratio expected ~70% for typical development logs
- Integration with external log aggregation systems possible

### Change Log
- v1.0: Initial story creation
- Focus on core log management and streaming
- Extensible for advanced analytics and alerting

---

**Story Status**: Ready for Sprint 2 Planning
**Estimated Effort**: 5 Story Points
**Risk Level**: Medium (real-time streaming complexity, storage management)