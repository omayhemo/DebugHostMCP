# Story 6.5: Multi-User Port Management

**Story ID**: 6.5  
**Epic**: Multi-User Support & Workspace Management (Epic 5)  
**Sprint**: 6  
**Story Points**: 5  
**Priority**: Medium  
**Created**: August 8, 2025  

## User Story

**As a** platform user in a multi-user environment  
**I want** intelligent port allocation that prevents conflicts between users  
**So that** my development services can run without port conflicts while maintaining predictable port assignments for shared projects  

## Business Value

- **Conflict Prevention**: Eliminates port conflicts between multiple users
- **Service Reliability**: Ensures consistent port allocation for shared services
- **Developer Experience**: Provides predictable and intuitive port management
- **Team Coordination**: Enables port sharing strategies for team collaboration

## Acceptance Criteria

### User-Scoped Port Allocation
1. **GIVEN** multiple users are running services simultaneously  
   **WHEN** they request port assignments  
   **THEN** each user receives ports from their dedicated range without conflicts  

2. **GIVEN** a user has a preferred port for their service  
   **WHEN** that port is available in their range  
   **THEN** the preferred port is assigned if within their allocated range  

3. **GIVEN** a user's preferred port is outside their range  
   **WHEN** they request the port  
   **THEN** an alternative port in their range is suggested with clear explanation  

### Dynamic Port Range Management
4. **GIVEN** new users join the platform  
   **WHEN** they need port allocations  
   **THEN** port ranges are dynamically assigned to avoid existing user ranges  

5. **GIVEN** a user has been inactive for an extended period  
   **WHEN** port cleanup occurs  
   **THEN** their unused ports are released while preserving active allocations  

6. **GIVEN** system port usage approaches capacity  
   **WHEN** administrators review port utilization  
   **THEN** comprehensive port usage analytics and recommendations are available  

### Team-Based Port Coordination
7. **GIVEN** team members work on shared projects  
   **WHEN** they need consistent port assignments for shared services  
   **THEN** team-scoped port reservations can be created and managed  

8. **GIVEN** a team has reserved ports for shared infrastructure  
   **WHEN** team members deploy services  
   **THEN** shared ports are accessible to all authorized team members  

9. **GIVEN** team port allocations conflict with individual user ranges  
   **WHEN** conflicts are detected  
   **THEN** automatic resolution with user notification occurs  

### Port Discovery and Management
10. **GIVEN** a user wants to see their allocated ports  
    **WHEN** they access port management interface  
    **THEN** all their current port allocations with service details are displayed  

11. **GIVEN** users need to find available ports  
    **WHEN** they query for port availability  
    **THEN** real-time port availability within their range is provided  

12. **GIVEN** a user wants to release unused ports  
    **WHEN** they manually release port allocations  
    **THEN** ports are immediately available for reallocation  

### Cross-User Port Visibility
13. **GIVEN** team members need to connect to each other's services  
    **WHEN** they look up team member service ports  
    **THEN** authorized access to teammate service ports is provided  

14. **GIVEN** a user wants to avoid port conflicts proactively  
    **WHEN** they check port usage patterns  
    **THEN** team-wide port usage visibility helps inform their choices  

15. **GIVEN** shared services need well-known ports  
    **WHEN** team leads configure shared infrastructure  
    **THEN** predictable port assignments for common services are available  

## Technical Requirements

### Enhanced Port Registry Schema
```sql
-- Extended port registry for multi-user support
CREATE TABLE user_port_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  range_start INTEGER NOT NULL,
  range_end INTEGER NOT NULL,
  range_size INTEGER GENERATED ALWAYS AS (range_end - range_start + 1) STORED,
  allocated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT valid_range CHECK (range_end > range_start),
  CONSTRAINT no_range_overlap EXCLUDE USING gist (
    int4range(range_start, range_end, '[]') WITH &&
  )
);

CREATE TABLE team_shared_ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  port INTEGER NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_team_port UNIQUE(team_id, port)
);

CREATE TABLE port_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id), -- For shared ports
  project_id UUID REFERENCES projects(id),
  container_id VARCHAR(64),
  service_name VARCHAR(100),
  allocation_type VARCHAR(20) DEFAULT 'user', -- 'user', 'team', 'system'
  allocated_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_port_allocation UNIQUE(port)
);
```

### Multi-User Port Manager
```typescript
class MultiUserPortManager {
  private readonly PORT_RANGE_SIZE = 100; // Ports per user
  private readonly BASE_USER_PORT = 10000; // Starting port for user ranges

  async allocateUserPortRange(userId: string): Promise<PortRange> {
    // Find next available port range
    const existingRanges = await db.user_port_ranges.findAll({
      where: { is_active: true },
      order: [['range_start', 'ASC']]
    });

    let nextStart = this.BASE_USER_PORT;
    
    for (const range of existingRanges) {
      if (nextStart + this.PORT_RANGE_SIZE <= range.range_start) {
        break; // Found a gap
      }
      nextStart = range.range_end + 1;
    }

    const portRange = {
      user_id: userId,
      range_start: nextStart,
      range_end: nextStart + this.PORT_RANGE_SIZE - 1
    };

    await db.user_port_ranges.create(portRange);
    
    return portRange;
  }

  async allocatePortForUser(
    userId: string, 
    preferredPort?: number,
    projectId?: string
  ): Promise<PortAllocation> {
    
    const userRange = await this.getUserPortRange(userId);
    if (!userRange) {
      throw new Error('User port range not found');
    }

    let assignedPort = preferredPort;

    // Validate preferred port is in user's range
    if (preferredPort && !this.isPortInRange(preferredPort, userRange)) {
      assignedPort = null; // Will auto-assign from range
    }

    // Check if preferred port is available
    if (assignedPort && await this.isPortAllocated(assignedPort)) {
      assignedPort = null; // Will auto-assign alternative
    }

    // Auto-assign if no preferred port or preferred port unavailable
    if (!assignedPort) {
      assignedPort = await this.findAvailablePortInRange(userRange);
    }

    if (!assignedPort) {
      throw new PortRangeExhaustedException(userRange);
    }

    // Create allocation record
    const allocation = await db.port_allocations.create({
      port: assignedPort,
      user_id: userId,
      project_id: projectId,
      allocation_type: 'user',
      service_name: `user-service-${assignedPort}`
    });

    return {
      port: assignedPort,
      userId: userId,
      projectId: projectId,
      allocatedAt: allocation.allocated_at
    };
  }

  async allocateSharedPortForTeam(
    teamId: string,
    port: number,
    serviceName: string,
    requestedBy: string
  ): Promise<TeamPortAllocation> {
    
    // Verify port is not in any user's personal range
    const conflictingRange = await this.findConflictingUserRange(port);
    if (conflictingRange) {
      throw new PortConflictError(
        `Port ${port} conflicts with user range ${conflictingRange.range_start}-${conflictingRange.range_end}`
      );
    }

    // Check if port is already allocated
    if (await this.isPortAllocated(port)) {
      throw new PortAlreadyAllocatedException(port);
    }

    // Create team shared port
    const sharedPort = await db.team_shared_ports.create({
      team_id: teamId,
      port: port,
      service_name: serviceName,
      created_by: requestedBy
    });

    // Create allocation record
    await db.port_allocations.create({
      port: port,
      team_id: teamId,
      allocation_type: 'team',
      service_name: serviceName
    });

    return sharedPort;
  }

  async getPortUsageAnalytics(): Promise<PortUsageAnalytics> {
    const totalPorts = await db.port_allocations.count({
      where: { is_active: true }
    });

    const userPortUsage = await db.port_allocations.findAll({
      attributes: [
        'user_id',
        [db.literal('COUNT(*)'), 'allocated_ports'],
        [db.literal('MAX(last_accessed_at)'), 'last_activity']
      ],
      where: { 
        allocation_type: 'user',
        is_active: true 
      },
      group: ['user_id']
    });

    const teamPortUsage = await db.port_allocations.findAll({
      attributes: [
        'team_id',
        [db.literal('COUNT(*)'), 'allocated_ports']
      ],
      where: { 
        allocation_type: 'team',
        is_active: true 
      },
      group: ['team_id']
    });

    return {
      totalAllocatedPorts: totalPorts,
      userUsage: userPortUsage,
      teamUsage: teamPortUsage,
      availablePortRanges: await this.calculateAvailableRanges()
    };
  }
}
```

### Port Discovery API
```typescript
class PortDiscoveryService {
  async getAvailablePortsForUser(userId: string): Promise<number[]> {
    const userRange = await this.portManager.getUserPortRange(userId);
    if (!userRange) return [];

    const allocatedPorts = await db.port_allocations.findAll({
      attributes: ['port'],
      where: {
        port: {
          [Op.between]: [userRange.range_start, userRange.range_end]
        },
        is_active: true
      }
    });

    const allocatedPortNumbers = allocatedPorts.map(p => p.port);
    const availablePorts = [];

    for (let port = userRange.range_start; port <= userRange.range_end; port++) {
      if (!allocatedPortNumbers.includes(port)) {
        availablePorts.push(port);
      }
    }

    return availablePorts;
  }

  async getTeamServicePorts(teamId: string, userId: string): Promise<TeamServicePort[]> {
    // Verify user is team member
    await this.verifyTeamMembership(userId, teamId);

    const sharedPorts = await db.team_shared_ports.findAll({
      where: { team_id: teamId },
      include: [{
        model: db.port_allocations,
        where: { is_active: true }
      }]
    });

    return sharedPorts.map(port => ({
      port: port.port,
      serviceName: port.service_name,
      description: port.description,
      createdBy: port.created_by,
      isActive: port.port_allocation?.is_active || false
    }));
  }
}
```

### API Endpoints
```typescript
// Multi-user port management endpoints
GET    /api/ports/my-range                // Get user's port range
GET    /api/ports/available               // List available ports in user range
POST   /api/ports/allocate                // Allocate port for user
DELETE /api/ports/:port                   // Release user port

GET    /api/ports/team/:teamId            // Get team shared ports
POST   /api/ports/team/:teamId/allocate   // Allocate shared team port
DELETE /api/ports/team/:teamId/:port      // Release team shared port

GET    /api/ports/usage/analytics         // Port usage analytics (admin)
GET    /api/ports/conflicts               // Check for port conflicts
```

## Dependencies

### Prerequisites
- Story 6.1 (User Workspace Isolation Architecture) - **REQUIRED**
- Story 6.2 (Team Management & Project Sharing) - **REQUIRED**
- Enhanced database schema for multi-user ports
- Existing port registry system

### External Libraries
- `lodash` - Array and range manipulation utilities
- `node-cron` - Port cleanup scheduling
- `joi` - Port allocation request validation

## Testing Strategy

### Unit Tests
- Port range allocation algorithms
- Multi-user conflict detection logic
- Team shared port management
- Port availability calculations
- Cleanup and reallocation mechanisms

### Integration Tests
- Multi-user port allocation scenarios
- Team shared port coordination
- Port conflict resolution
- Cross-user service connectivity
- Port usage analytics accuracy

### Load Tests
- Concurrent port allocation requests
- Port range exhaustion scenarios
- High-frequency port allocation/deallocation
- System performance with 100+ active users

## Definition of Done

- [ ] User-scoped port range allocation system
- [ ] Multi-user port conflict prevention
- [ ] Team shared port management
- [ ] Port discovery and availability checking
- [ ] Port usage analytics and monitoring
- [ ] Automatic port cleanup for inactive allocations
- [ ] Cross-user port visibility for team collaboration
- [ ] API endpoints for port management operations
- [ ] Performance optimization for port operations
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Documentation for multi-user port management
- [ ] Integration with existing project management

## Performance Requirements

### Port Management Performance
- Port allocation: <100ms per request
- Port availability check: <50ms response time
- Port range calculation: <200ms for new users
- Port usage analytics: <2 seconds for comprehensive report

### Scalability Targets
- Support 100+ concurrent users with dedicated port ranges
- Handle 1000+ simultaneous port allocation requests
- Manage 10,000+ active port allocations efficiently
- Process port cleanup for 500+ inactive ports per cycle

## Story Sizing Justification (5 Points)

This is a **medium complexity** story requiring:
- Enhanced port registry system for multi-user support
- Port range allocation and management algorithms
- Team-based shared port coordination
- Conflict detection and resolution mechanisms
- Port discovery and analytics features
- Database schema extensions for user and team ports
- Integration with existing workspace and team management

The 5-point estimate reflects the focused scope of port management while building on existing infrastructure, with well-defined algorithms and clear business requirements.

---

*This story completes the multi-user infrastructure by ensuring seamless port management that prevents conflicts and enables effective team collaboration.*