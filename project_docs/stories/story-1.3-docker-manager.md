# Story 1.3: Create Docker Manager Module

**Status**: Draft  
**Priority**: High  
**Story Points**: 5  
**Sprint**: 1  

## User Story

**As a** Claude Code agent  
**I want** a Docker management module  
**So that** I can create, start, stop, and monitor containers programmatically  

## Acceptance Criteria

1. **Given** a project configuration **When** creating a container **Then** it should use the appropriate base image from Story 1.1
2. **Given** a container **When** starting it **Then** it should join the debug-host-network
3. **Given** a running container **When** stopping it **Then** it should gracefully shutdown with SIGTERM
4. **Given** a container **When** requesting its status **Then** it should return running state, CPU, and memory usage
5. **Given** a project workspace **When** creating a container **Then** the workspace should be mounted at /app
6. **Given** a container **When** it exits unexpectedly **Then** the manager should detect and update its status
7. **Given** the Docker network **When** first container starts **Then** it should create debug-host-network if not exists

## Technical Requirements

### Dependencies
- Docker Engine API access via /var/run/docker.sock
- dockerode npm package for Docker API
- Story 1.1 completion (base images available)
- Story 1.2 completion (to integrate with MCP server)

### Technical Notes
- Use dockerode library for Docker API interactions
- Implement connection pooling for Docker API
- Handle Docker daemon unavailability gracefully
- Support both local Docker and Docker Desktop
- Retry logic: exponential backoff with 3 attempts (1s, 2s, 4s delays)
- Connection timeout: 5 seconds per attempt
- Operation timeout: 30 seconds for container operations

### File Structure
```
src/
├── docker/
│   ├── manager.js       # Main Docker manager class
│   ├── container.js     # Container operations
│   ├── network.js       # Network management
│   ├── images.js        # Image operations
│   └── monitor.js       # Container monitoring
```

### Docker Network Configuration
```javascript
{
  Name: 'debug-host-network',
  Driver: 'bridge',
  IPAM: {
    Config: [{
      Subnet: '172.28.0.0/16',
      Gateway: '172.28.0.1'
    }]
  }
}
```

## Definition of Done

- [ ] Docker manager can create containers from base images
- [ ] Containers properly join debug-host-network
- [ ] Container lifecycle methods work (start, stop, restart, remove)
- [ ] Container monitoring returns CPU and memory stats
- [ ] Workspace volumes mount correctly
- [ ] Network auto-creation implemented
- [ ] Error handling for Docker unavailability
- [ ] Unit tests for all manager methods

## Tasks

1. **Set up dockerode connection**
   - Initialize Docker client
   - Test connection to Docker daemon
   - Implement health check
   - Add connection retry logic

2. **Implement network management**
   - Check if debug-host-network exists
   - Create network with proper configuration
   - Handle network conflicts
   - Implement network cleanup

3. **Create container operations**
   - Container creation from image
   - Volume mounting configuration
   - Environment variable injection
   - Label management for tracking

4. **Implement lifecycle management**
   - Start container method
   - Stop with graceful shutdown
   - Restart functionality
   - Remove with cleanup

5. **Add container monitoring**
   - Get container stats (CPU, memory)
   - Stream container logs
   - Monitor container health
   - Detect unexpected exits

6. **Create dependency volume management**
   - Create named volumes for dependencies
   - Mount node_modules, venv, vendor appropriately
   - Implement volume cleanup
   - Handle volume persistence

## Test Scenarios

### Happy Path
- Create and start a Node.js container
- Mount workspace and verify file access
- Stop container gracefully
- Monitor resource usage while running

### Edge Cases
- Docker daemon not running
- Network already exists with different config
- Container name conflicts
- Volume mount permission issues
- Out of disk space

### Error Scenarios
- Base image not found
- Invalid workspace path
- Container fails to start
- Network creation fails
- Docker API timeout

## Notes & Discussion

### Implementation Notes
- Container labels should include project ID, type, and creation timestamp
- Implement exponential backoff for Docker API retries
- Consider container resource limits (2 CPU, 2GB RAM defaults)

### Container Naming Convention
```
debug-host-{projectId}-{timestamp}
```

### Environment Variables
All containers should receive:
- `PORT` - Assigned port number
- `PROJECT_ID` - Unique project identifier
- `DEBUG_HOST` - Set to 'true'

### Questions for Review
1. Should we implement container auto-restart on crash?
2. What should happen to orphaned containers on service restart?
3. Should we limit concurrent containers per project type?

## Story Progress

| Date | Developer | Status | Notes |
|------|-----------|--------|-------|
| TBD | - | Draft | Story created from architecture |

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-05 | SM Agent | Initial story creation |