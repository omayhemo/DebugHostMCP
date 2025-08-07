# Story 2.2: Container Lifecycle Management

| Field | Value |
|-------|--------|
| **Epic** | Phase 2: Project Management |
| **Story ID** | 2.2 |
| **Title** | Container Lifecycle Management with Start/Stop/Restart |
| **Status** | Draft |
| **Priority** | High |
| **Story Points** | 5 |
| **Sprint** | Sprint 2 |
| **Assignee** | Developer Agent |

## 📝 User Story

**As a** developer using MCP Debug Host
**I want** to start, stop, and restart my registered project containers
**So that** I can manage my development environment lifecycle efficiently through Claude Code

## ✅ Acceptance Criteria

### AC1: Container Start Operation
- **Given** a registered project with valid configuration
- **When** I call `host.start` with the projectId
- **Then** the system should:
  - Create container from appropriate Docker base image
  - Mount workspace directory with proper permissions
  - Expose allocated ports correctly
  - Start container and verify it's running
  - Return container status and connection details

### AC2: Container Stop Operation
- **Given** a running project container
- **When** I call `host.stop` with the projectId
- **Then** the system should:
  - Gracefully stop the container (SIGTERM then SIGKILL)
  - Clean up resources and temporary files
  - Update project status to "stopped"
  - Return confirmation of successful stop

### AC3: Container Restart Operation
- **Given** a project container (running or stopped)
- **When** I call `host.restart` with the projectId
- **Then** the system should:
  - Stop existing container if running
  - Start new container with current configuration
  - Preserve workspace data and volumes
  - Return new container status

### AC4: Container Status Monitoring
- **Given** any project container
- **When** status is requested via `host.status`
- **Then** it should return:
  - Current container state (running/stopped/error)
  - Uptime and performance metrics
  - Port mappings and accessibility
  - Resource usage (CPU, memory, disk)

### AC5: Error Recovery and Resilience
- **Given** container startup or operation failures
- **When** lifecycle operations are performed
- **Then** the system should:
  - Provide detailed error diagnostics
  - Attempt automatic recovery where possible
  - Clean up failed containers and resources
  - Maintain project registry integrity

## 🔧 Technical Requirements

### Core Components
- **Container Manager**: Orchestrates Docker container lifecycle
- **Status Monitor**: Tracks container health and metrics
- **Resource Cleanup**: Manages container and volume cleanup
- **Integration Layer**: Connects with Docker Manager and Port Registry

### Container Configuration
```javascript
const CONTAINER_CONFIG = {
  image: 'mcp-debug-host-${techStack}',
  volumes: {
    workspace: '/app/workspace',
    logs: '/app/logs',
    cache: '/app/.cache'
  },
  environment: {
    NODE_ENV: 'development',
    DEBUG: '*',
    PORT: '${assignedPort}'
  },
  networks: ['debug-host-network']
};
```

### Lifecycle States
```javascript
const CONTAINER_STATES = {
  CREATING: 'creating',
  STARTING: 'starting', 
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error',
  RESTARTING: 'restarting'
};
```

### API Endpoints
- `POST /api/projects/:id/start` - Start project container
- `POST /api/projects/:id/stop` - Stop project container
- `POST /api/projects/:id/restart` - Restart project container
- `GET /api/projects/:id/status` - Get container status
- `GET /api/projects/:id/logs` - Get container logs

## 🏁 Definition of Done

### Requirements Met
- [ ] All functional requirements implemented
- [ ] All acceptance criteria met

### Coding Standards & Project Structure
- [ ] Adherence to MCP Debug Host operational guidelines
- [ ] Integration with existing Docker Manager (Story 1.3)
- [ ] Proper error handling and logging
- [ ] Resource cleanup and memory management
- [ ] Security best practices for container operations
- [ ] No new linter errors
- [ ] Comprehensive logging for debugging

### Testing
- [ ] Unit tests for lifecycle operations
- [ ] Integration tests with Docker daemon
- [ ] Error scenario testing (Docker unavailable, port conflicts)
- [ ] Container resource cleanup verification
- [ ] All tests passing with >80% coverage

### Functionality & Verification
- [ ] Manual verification of start/stop/restart cycles
- [ ] Resource cleanup verification
- [ ] Performance testing under normal loads

### Dependencies, Build & Configuration
- [ ] Successful integration with Docker Manager
- [ ] No new security vulnerabilities
- [ ] Container health check mechanisms working
- [ ] Monitoring and metrics collection active

### Documentation
- [ ] API documentation for lifecycle endpoints
- [ ] Container configuration documentation
- [ ] Troubleshooting guide for common issues

## 🧪 Test Scenarios

### Happy Path Tests
1. **Complete Lifecycle Flow**
   - Register project → Start container → Verify running → Stop → Verify stopped
   - Expect: All operations successful, clean resource management

2. **Multiple Projects Management**
   - Start multiple containers simultaneously
   - Expect: Proper port isolation, no resource conflicts

3. **Restart During Development**
   - Start container → Make code changes → Restart → Verify changes
   - Expect: Workspace persistence, updated container

### Edge Cases
1. **Docker Daemon Unavailable**
   - Attempt operations when Docker is down
   - Expect: Clear error messages, graceful degradation

2. **Resource Constraints**
   - Start containers with limited system resources
   - Expect: Proper resource management, informative errors

3. **Port Conflicts**
   - Start container when port is already in use
   - Expect: Automatic port reallocation or clear conflict message

### Error Scenarios
1. **Container Startup Failure**
   - Invalid image or configuration
   - Expect: Detailed diagnostics, cleanup of failed resources

2. **Abrupt Stop Operations**
   - Force stop containers, system interruptions
   - Expect: Proper cleanup, no orphaned containers

3. **Corrupted Container State**
   - Container in inconsistent state
   - Expect: State recovery, fresh container creation

## 📋 Implementation Tasks

### AP-TASKS-START
- [ ] Create `src/services/container-lifecycle.js`
- [ ] Create `src/services/container-monitor.js`
- [ ] Update `src/mcp-tools.js` with lifecycle tools
- [ ] Create `src/api/routes/lifecycle.js`
- [ ] Implement container health checks
- [ ] Create lifecycle operation tests
- [ ] Create integration tests with Docker
- [ ] Add container metrics collection
- [ ] Update project registry for lifecycle state
### AP-TASKS-END

## 🔄 Dependencies

### Prerequisites
- Story 1.3: Docker Manager Module (✅ Complete)
- Story 1.4: Port Registry System (✅ Complete) 
- Story 2.1: Project Registration System (Planned)

### Integrations Needed
- Docker Manager for container operations
- Project Registry for project metadata
- Port Registry for port allocation validation
- Log Management (Story 2.3) for log streaming

## 💼 Business Context

### Value Proposition
- Enables full development environment control through Claude Code
- Reduces manual Docker command complexity
- Provides reliable container lifecycle management
- Foundation for advanced development workflows

### Success Metrics
- Container start success rate >98%
- Average start time <10 seconds
- Resource cleanup effectiveness 100%
- Zero orphaned containers after operations

## 📝 Progress Log

### Development Notes
- Consider container warm-up strategies for faster restarts
- Health check implementation should be configurable per tech stack
- Resource monitoring can inform capacity planning

### Change Log
- v1.0: Initial story creation
- Focus on core lifecycle operations
- Extensible for advanced container orchestration

---

**Story Status**: Ready for Sprint 2 Planning
**Estimated Effort**: 5 Story Points
**Risk Level**: Medium (Docker integration complexity)