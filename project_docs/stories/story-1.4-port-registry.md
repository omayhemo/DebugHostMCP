# Story 1.4: Develop Port Registry System

**Status**: Draft  
**Priority**: High  
**Story Points**: 3  
**Sprint**: 1  

## User Story

**As a** Claude Code agent  
**I want** intelligent port allocation with conflict prevention  
**So that** multiple projects can run simultaneously without port conflicts  

## Acceptance Criteria

1. **Given** a Node.js project **When** requesting a port **Then** it should be allocated from range 3000-3999
2. **Given** a Python project **When** requesting a port **Then** it should be allocated from range 5000-5999
3. **Given** a PHP project **When** requesting a port **Then** it should be allocated from range 8080-8980
4. **Given** a Static project **When** requesting a port **Then** it should be allocated from range 4000-4999
5. **Given** a specific port request **When** the port is already in use **Then** return detailed conflict information with suggestions
6. **Given** a port request with 'auto' **When** processed **Then** assign the next available port in the correct range
7. **Given** a system port request (2601-2699) **When** from an application **Then** reject with SYSTEM_RESERVED error

## Technical Requirements

### Dependencies
- net module for port checking
- File system access for JSON persistence
- Story 1.2 completion (integrate with MCP server)
- Story 1.3 completion (coordinate with Docker manager)

### Technical Notes
- Persist port allocations in JSON file for service restart recovery
- Check both allocated ports and system ports before assignment
- Implement atomic file operations to prevent race conditions (example below)
- Port check should verify both TCP and UDP availability

### Atomic File Operations Pattern
```javascript
const fs = require('fs').promises;
const path = require('path');

async function atomicWriteJSON(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;
  
  try {
    // Write to temp file
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    
    // Create backup of existing file if it exists
    try {
      await fs.rename(filePath, backupPath);
    } catch (err) {
      // File doesn't exist yet, that's ok
    }
    
    // Atomic rename temp to actual
    await fs.rename(tempPath, filePath);
    
    // Clean up backup after successful write
    try {
      await fs.unlink(backupPath);
    } catch (err) {
      // Backup cleanup is non-critical
    }
  } catch (error) {
    // Restore from backup if available
    try {
      await fs.rename(backupPath, filePath);
    } catch (err) {
      // No backup to restore
    }
    throw error;
  }
}
```

### File Structure
```
src/
├── managers/
│   └── port-registry.js   # Port management logic
data/
└── system/
    └── ports.json         # Persistent port allocations
```

### Port Ranges
```javascript
const PORT_RANGES = {
  system:  { start: 2601, end: 2699 },
  node:    { start: 3000, end: 3999 },
  static:  { start: 4000, end: 4999 },
  python:  { start: 5000, end: 5999 },
  php:     { start: 8080, end: 8980 }
};
```

## Definition of Done

- [ ] Port allocation respects defined ranges
- [ ] Conflict detection works accurately
- [ ] Auto-assignment finds next available port
- [ ] System ports are protected
- [ ] Port registry persists to JSON file
- [ ] Suggestions provided on conflicts
- [ ] Port release on project stop
- [ ] Unit tests cover all allocation scenarios

## Tasks

1. **Create port registry class**
   - Define port ranges configuration
   - Initialize with existing allocations
   - Implement registry persistence
   - Add logging for port operations

2. **Implement port allocation**
   - Range validation by project type
   - Auto-assignment algorithm
   - Specific port request handling
   - System port protection

3. **Add conflict detection**
   - Check allocated ports registry
   - Verify port availability on system
   - Detect external process conflicts
   - Generate detailed conflict reports

4. **Create suggestion engine**
   - Find alternative ports in range
   - Rank suggestions by convention
   - Provide 3 alternatives minimum
   - Consider port patterns (3000, 3001, etc.)

5. **Implement port release**
   - Release port on project stop
   - Update persistent registry
   - Clean up orphaned allocations
   - Log port releases

6. **Add registry persistence**
   - Load allocations on startup
   - Save on each change
   - Handle file corruption gracefully
   - Implement backup mechanism

## Test Scenarios

### Happy Path
- Allocate ports for each project type
- Auto-assign multiple Node.js projects
- Release and reallocate same port
- Persist and restore after restart

### Edge Cases
- All ports in range exhausted
- Specific port at range boundary
- Rapid concurrent allocations
- Registry file locked/corrupted

### Error Scenarios
- Request port outside valid ranges
- System port requested by app
- Port already in use by external process
- Filesystem permissions issue

## Notes & Discussion

### Port Registry Schema
```json
{
  "system": {
    "2601": { "service": "mcp-server", "status": "running" },
    "2602": { "service": "dashboard", "status": "running" }
  },
  "applications": {
    "3000": {
      "projectId": "proj_abc123",
      "projectName": "my-api",
      "type": "node",
      "assigned": "2025-01-05T10:00:00Z"
    }
  },
  "history": [
    {
      "timestamp": "2025-01-05T10:00:00Z",
      "action": "assigned",
      "port": 3000,
      "projectId": "proj_abc123"
    }
  ]
}
```

### Error Response Format
```javascript
{
  success: false,
  error: 'PORT_IN_USE',
  message: 'Port 3000 is already used by project "my-api"',
  details: {
    conflictingProject: 'proj_abc123',
    conflictingService: 'my-api',
    startedAt: '2025-01-05T10:00:00Z'
  },
  suggestions: [3001, 3002, 3003]
}
```

### Questions for Review
1. Should we implement port reservation (claim before use)?
2. How long should port history be retained?
3. Should we support custom port ranges via configuration?

## Story Progress

| Date | Developer | Status | Notes |
|------|-----------|--------|-------|
| TBD | - | Draft | Story created from architecture |

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-05 | SM Agent | Initial story creation |