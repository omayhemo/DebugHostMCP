# Story 6.1: User Workspace Isolation Architecture

**Story ID**: 6.1  
**Epic**: Multi-User Support & Workspace Management (Epic 5)  
**Sprint**: 6  
**Story Points**: 13  
**Priority**: Critical  
**Created**: August 8, 2025  

## User Story

**As a** platform administrator  
**I want** isolated user workspaces with secure boundaries  
**So that** multiple users can work simultaneously without interfering with each other's development environments  

## Business Value

- **Security**: Prevents users from accessing each other's projects and data
- **Resource Isolation**: Ensures fair resource allocation and prevents resource conflicts
- **Scalability**: Enables the platform to support multiple concurrent users
- **Data Protection**: Protects sensitive project data through workspace boundaries

## Acceptance Criteria

### Workspace Creation and Management
1. **GIVEN** a new user registers on the platform  
   **WHEN** their account is activated  
   **THEN** a dedicated workspace is automatically created with unique identifiers  

2. **GIVEN** a user has an active workspace  
   **WHEN** they create projects  
   **THEN** all projects are isolated within their workspace boundaries  

3. **GIVEN** multiple users are active simultaneously  
   **WHEN** they perform operations  
   **THEN** actions in one workspace do not affect other workspaces  

### Container Isolation
4. **GIVEN** a user starts a container in their workspace  
   **WHEN** the container is created  
   **THEN** it operates within a user-specific Docker network  

5. **GIVEN** containers from different users exist  
   **WHEN** network communication is attempted  
   **THEN** cross-user container communication is blocked by default  

6. **GIVEN** a user's container requires host resources  
   **WHEN** resources are allocated  
   **THEN** resource limits are enforced per workspace  

### File System Isolation
7. **GIVEN** a user workspace is created  
   **WHEN** examining file system access  
   **THEN** users can only access their own workspace directories  

8. **GIVEN** project files are stored  
   **WHEN** different users access the system  
   **THEN** file permissions prevent cross-user access  

9. **GIVEN** a user deletes their workspace  
   **WHEN** cleanup occurs  
   **THEN** all associated files and containers are completely removed  

### Port Management Isolation
10. **GIVEN** multiple users need to run services  
    **WHEN** ports are allocated  
    **THEN** each user gets their own port range without conflicts  

11. **GIVEN** a user's service needs a specific port  
    **WHEN** port assignment occurs  
    **THEN** ports are scoped to the user's workspace  

12. **GIVEN** users run similar services (e.g., React dev servers)  
    **WHEN** default ports are requested  
    **THEN** automatic port allocation prevents conflicts  

### Resource Quota Enforcement
13. **GIVEN** workspace resource limits are defined  
    **WHEN** users attempt to exceed limits  
    **THEN** resource allocation is denied with clear error messages  

14. **GIVEN** a user reaches their resource quota  
    **WHEN** they try to start new containers  
    **THEN** appropriate error messages suggest optimization or upgrade  

15. **GIVEN** system resources are limited  
    **WHEN** multiple users compete for resources  
    **THEN** fair allocation algorithms distribute resources equitably  

## Technical Requirements

### Workspace Architecture
```typescript
interface UserWorkspace {
  id: string;
  userId: string;
  name: string;
  
  // Isolation boundaries
  dockerNetwork: {
    name: string;
    subnet: string;
    gateway: string;
  };
  
  fileSystemPath: string;
  portRange: {
    start: number;
    end: number;
  };
  
  // Resource limits
  resourceLimits: {
    maxContainers: number;
    maxCpuCores: number;
    maxMemoryGB: number;
    maxStorageGB: number;
  };
  
  // Current usage
  currentUsage: {
    containers: number;
    cpuCores: number;
    memoryGB: number;
    storageGB: number;
  };
  
  createdAt: Date;
  lastAccessedAt: Date;
}
```

### Database Schema
```sql
CREATE TABLE user_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  docker_network_name VARCHAR(64) NOT NULL UNIQUE,
  docker_network_subnet CIDR NOT NULL,
  file_system_path VARCHAR(255) NOT NULL,
  port_range_start INTEGER NOT NULL,
  port_range_end INTEGER NOT NULL,
  resource_limits JSONB NOT NULL DEFAULT '{}',
  current_usage JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_workspace UNIQUE(user_id, name),
  CONSTRAINT valid_port_range CHECK(port_range_end > port_range_start)
);

CREATE TABLE workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES user_workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_project UNIQUE(workspace_id, project_id)
);
```

### Docker Network Isolation
```javascript
class WorkspaceNetworkManager {
  async createWorkspaceNetwork(workspaceId, userId) {
    const networkName = `workspace-${workspaceId}`;
    const subnet = await this.allocateSubnet(userId);
    
    await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
      IPAM: {
        Config: [{ Subnet: subnet }]
      },
      Options: {
        'com.docker.network.bridge.name': networkName,
        'workspace.id': workspaceId,
        'workspace.user': userId
      },
      Labels: {
        'mcp-debug-host.workspace': workspaceId,
        'mcp-debug-host.user': userId,
        'mcp-debug-host.type': 'workspace-isolation'
      }
    });
    
    return { name: networkName, subnet };
  }

  async allocateSubnet(userId) {
    // Allocate unique /24 subnet for each workspace
    // Starting from 172.20.0.0/16, each user gets 172.20.x.0/24
    const userHash = crypto.createHash('md5').update(userId).digest('hex');
    const subnetIndex = parseInt(userHash.substring(0, 4), 16) % 256;
    return `172.20.${subnetIndex}.0/24`;
  }
}
```

### File System Isolation
```javascript
class WorkspaceFileManager {
  constructor() {
    this.workspaceRoot = '/opt/debug-host/workspaces';
  }

  async createWorkspaceDirectory(workspaceId, userId) {
    const workspacePath = path.join(this.workspaceRoot, userId, workspaceId);
    
    await fs.ensureDir(workspacePath);
    await fs.chmod(workspacePath, 0o700); // Owner only access
    
    // Create subdirectories
    await fs.ensureDir(path.join(workspacePath, 'projects'));
    await fs.ensureDir(path.join(workspacePath, 'volumes'));
    await fs.ensureDir(path.join(workspacePath, 'logs'));
    
    return workspacePath;
  }

  async validateAccess(userId, filePath) {
    const userWorkspaceRoot = path.join(this.workspaceRoot, userId);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(userWorkspaceRoot)) {
      throw new Error('Access denied: Path outside user workspace');
    }
    
    return true;
  }
}
```

### Resource Quota Management
```javascript
class ResourceQuotaManager {
  defaultQuotas = {
    maxContainers: 10,
    maxCpuCores: 4,
    maxMemoryGB: 8,
    maxStorageGB: 50
  };

  async checkResourceAvailability(workspaceId, resourceRequest) {
    const workspace = await this.getWorkspace(workspaceId);
    const currentUsage = workspace.current_usage;
    const limits = workspace.resource_limits;

    const checks = {
      containers: currentUsage.containers + 1 <= limits.maxContainers,
      cpu: currentUsage.cpuCores + resourceRequest.cpu <= limits.maxCpuCores,
      memory: currentUsage.memoryGB + resourceRequest.memory <= limits.maxMemoryGB,
      storage: currentUsage.storageGB + resourceRequest.storage <= limits.maxStorageGB
    };

    const violations = Object.entries(checks)
      .filter(([_, allowed]) => !allowed)
      .map(([resource]) => resource);

    if (violations.length > 0) {
      throw new ResourceQuotaExceededError(violations, limits, currentUsage);
    }

    return true;
  }

  async updateResourceUsage(workspaceId, resourceDelta) {
    await db.user_workspaces.update(
      { id: workspaceId },
      {
        current_usage: db.literal(`
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(current_usage, '{containers}', 
                  (COALESCE(current_usage->>'containers', '0')::int + ${resourceDelta.containers})::text::jsonb),
                '{cpuCores}', 
                  (COALESCE(current_usage->>'cpuCores', '0')::numeric + ${resourceDelta.cpu})::text::jsonb),
              '{memoryGB}', 
                (COALESCE(current_usage->>'memoryGB', '0')::numeric + ${resourceDelta.memory})::text::jsonb),
            '{storageGB}', 
              (COALESCE(current_usage->>'storageGB', '0')::numeric + ${resourceDelta.storage})::text::jsonb)
        `),
        last_accessed_at: new Date()
      }
    );
  }
}
```

## Dependencies

### Prerequisites
- Epic 4 (Authentication & Security Framework) - **REQUIRED**
- Enhanced Docker orchestration capabilities
- File system permission management
- Network subnet allocation system

### External Libraries
- `dockerode` - Enhanced Docker API integration
- `fs-extra` - File system operations
- `ip-subnet-calculator` - Network subnet management
- `node-cron` - Resource cleanup scheduling

## Testing Strategy

### Unit Tests
- Workspace creation and deletion
- Resource quota calculations
- File system isolation validation
- Docker network creation and isolation
- Port range allocation logic

### Integration Tests
- Complete workspace isolation verification
- Multi-user concurrent operations
- Resource sharing and conflict prevention
- Cross-workspace security boundary testing
- Performance under multiple active workspaces

### Security Tests
- File system access boundary enforcement
- Container escape prevention
- Network isolation verification
- Resource exhaustion attack prevention
- Privilege escalation attempts

## Definition of Done

- [ ] Workspace isolation architecture implemented
- [ ] Docker network isolation for each user workspace
- [ ] File system boundaries enforced with proper permissions
- [ ] Resource quota system functional with enforcement
- [ ] Port range isolation preventing conflicts
- [ ] Workspace lifecycle management (create/delete/cleanup)
- [ ] Multi-user testing completed successfully
- [ ] Security boundaries validated through penetration testing
- [ ] Performance benchmarks met for concurrent users
- [ ] Comprehensive test suite (>90% coverage)
- [ ] Documentation for workspace management
- [ ] Monitoring integration for resource usage tracking

## Performance Requirements

### Scalability Targets
- Support 50+ concurrent active workspaces
- Workspace creation time: <5 seconds
- Resource allocation overhead: <5% of total system resources
- File system operations: <100ms within workspace boundaries

### Resource Efficiency
- Efficient Docker network management
- Lazy loading of workspace resources
- Automatic cleanup of inactive workspaces
- Optimized storage allocation and deduplication

## Security Considerations

### Isolation Boundaries
- **Container Isolation**: Docker network and resource isolation
- **File System**: OS-level permission enforcement
- **Process Isolation**: Container runtime security
- **Network Segmentation**: Isolated subnets per workspace

### Attack Prevention
- **Resource Exhaustion**: Strict quota enforcement
- **Privilege Escalation**: Minimal container privileges
- **Data Leakage**: Secure workspace boundaries
- **Network Attacks**: Isolated network segments

## Story Sizing Justification (13 Points)

This is a **high complexity** story requiring:
- Complex multi-layered isolation architecture (containers, networks, file systems)
- Advanced Docker networking and resource management
- Security-critical boundary enforcement
- Database schema changes for workspace management
- Resource quota system with real-time monitoring
- Performance optimization for concurrent multi-user scenarios
- Comprehensive security testing and validation
- Integration with existing authentication and project management systems

The 13-point estimate reflects the foundational nature of multi-user support and the critical security requirements for proper workspace isolation.

---

*This story establishes the foundational isolation architecture that enables secure multi-user collaboration on the platform.*