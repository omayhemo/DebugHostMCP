# Story 3.3: Enhanced Dynamic Port Registry

**Story ID**: STORY-3.3  
**Epic**: Epic 3 - Multi-Tech Stack Process Discovery (v2.1)  
**Phase**: 1 - Core Engine Development  
**Sprint**: Sprint 5  
**Story Points**: 8  
**Priority**: High  
**Status**: Ready for Development  

## User Story

**As a** Claude Code agent  
**I want** an enhanced port registry that combines static allocations with dynamic process discovery  
**So that** I have complete visibility into both registered and discovered processes in real-time  

## Business Value

- **Complete Visibility**: Unified view of static allocations and dynamic discoveries
- **Real-time State**: Eliminates discrepancy between registered and actual system state
- **Process Categorization**: Clear classification of registered, discovered, rogue, and orphaned processes
- **Agent Reliability**: Provides accurate data for intelligent process management decisions

## Acceptance Criteria

### Enhanced Registry Core
1. **GIVEN** the enhanced port registry is initialized  
   **WHEN** I query for all active processes  
   **THEN** it returns both static allocations and discovered processes in a unified format  

2. **GIVEN** static allocations and discovered processes exist  
   **WHEN** the registry updates  
   **THEN** each process is correctly categorized as registered, discovered, rogue, or orphaned  

3. **GIVEN** the registry is updated with new discoveries  
   **WHEN** the update completes  
   **THEN** the registry maintains consistency between static and dynamic data  

### Process Categorization Logic
4. **GIVEN** a process is running on a statically allocated port  
   **WHEN** the registry categorizes it  
   **THEN** it is marked as "registered" with correlation to the static allocation  

5. **GIVEN** a process is discovered but not in static allocations  
   **WHEN** workspace correlation succeeds  
   **THEN** it is marked as "discovered" with workspace association  

6. **GIVEN** a process is discovered with no workspace correlation  
   **WHEN** the registry categorizes it  
   **THEN** it is marked as "rogue" with isolation recommendations  

7. **GIVEN** a static allocation exists but no process is found  
   **WHEN** the registry evaluates the allocation  
   **THEN** it is marked as "orphaned" with suggested cleanup actions  

### Real-time Updates
8. **GIVEN** the registry has 5-second refresh intervals  
   **WHEN** a new process starts between intervals  
   **THEN** the next refresh cycle detects and categorizes the new process  

9. **GIVEN** a process terminates  
   **WHEN** the registry refreshes  
   **THEN** the terminated process is removed from discovered processes  

10. **GIVEN** process changes occur rapidly  
    **WHEN** multiple refresh cycles execute  
    **THEN** the registry maintains consistent state without data corruption  

### Container Integration
11. **GIVEN** Docker containers are running with port mappings  
    **WHEN** the registry processes container data  
    **THEN** host ports are correlated with container processes accurately  

12. **GIVEN** a container stops but its host port remains allocated  
    **WHEN** the registry refreshes  
    **THEN** the orphaned port allocation is identified and flagged for cleanup  

### Performance Requirements
13. **GIVEN** the registry contains 100+ process entries  
    **WHEN** a full refresh is performed  
    **THEN** it completes within 1 second  

14. **GIVEN** continuous refresh cycles are running  
    **WHEN** system resources are monitored  
    **THEN** registry operations consume less than 2% CPU  

### Data Consistency
15. **GIVEN** concurrent access to registry data  
    **WHEN** multiple readers access process information  
    **THEN** all readers receive consistent data without race conditions  

16. **GIVEN** the registry update fails partway through  
    **WHEN** error recovery executes  
    **THEN** the registry reverts to the last known good state  

## Technical Requirements

### Enhanced Registry Architecture
```typescript
interface EnhancedPortRegistry {
  // Static registry (existing)
  staticAllocations: Map<number, StaticAllocation>
  
  // Dynamic discoveries (new)
  discoveredProcesses: Map<number, DiscoveredProcess>
  rogueProcesses: Map<number, RogueProcess>
  orphanedAllocations: Map<number, OrphanedAllocation>
  containerMappings: Map<string, ContainerMapping>
  
  // Core methods
  getAllActiveProcesses(): Promise<ProcessRegistry>
  updateDynamicRegistry(discoveries: DiscoveredProcess[]): Promise<void>
  correlateWithWorkspaces(): Promise<CorrelationResult[]>
  identifyChanges(previous: ProcessRegistry): ProcessChangeSet
}
```

### Process Categories
```typescript
interface ProcessRegistry {
  registered: RegisteredProcess[]    // Static + discovered match
  discovered: DiscoveredProcess[]    // Found but not registered  
  rogue: RogueProcess[]             // No workspace correlation
  orphaned: OrphanedAllocation[]    // Static allocation, no process
  containers: ContainerProcess[]     // Docker process mappings
}
```

### Change Detection
- **Process Lifecycle Tracking**: Start/stop event detection
- **Port State Changes**: Allocation/deallocation monitoring
- **Container Events**: Docker container lifecycle integration
- **Workspace Correlation Changes**: Project association updates

### Data Persistence
- **In-Memory Cache**: Fast access to current state
- **Periodic Snapshots**: Registry state persistence for recovery
- **Change Logs**: Audit trail of all registry modifications
- **Configuration Backup**: Static allocation preservation

## Definition of Done

- [ ] EnhancedPortRegistry class implemented with all categorization logic
- [ ] Real-time refresh capability with 5-second cycle and change detection
- [ ] Process categorization (registered/discovered/rogue/orphaned) working correctly
- [ ] Container integration with Docker port mapping correlation
- [ ] Performance requirements met (< 1s refresh, < 2% CPU usage)
- [ ] Data consistency protection with concurrent access handling
- [ ] Error recovery and state rollback mechanisms
- [ ] Integration tests with actual multi-tech process scenarios
- [ ] Documentation for new registry API methods

## Dependencies

### Prerequisites
- ✅ Story 3.1 (Multi-Tech Process Discovery Engine) - Provides discovered process data
- ✅ Story 3.2 (Technology Stack Detectors) - Provides technology-specific insights
- ✅ Existing Port Registry System - Foundation for static allocations

### Integration Points
- **Docker Manager**: Container lifecycle events and port mappings
- **Workspace Detection**: Project directory correlation logic
- **MCP Server**: Registry data access for agent tools

## Risk Assessment

### Medium Risk
- **Data Synchronization**: Potential race conditions between discovery and registry updates
- **Memory Usage**: Large numbers of discovered processes may impact memory footprint
- **Refresh Performance**: Frequent updates may affect system responsiveness

### Low Risk
- **Static Registry Migration**: Existing functionality preservation during enhancement
- **Configuration Changes**: Registry settings modification without service interruption

### Mitigation Strategies
- **Atomic Updates**: Registry modifications use transactional approaches
- **Memory Management**: Automatic cleanup of stale process entries
- **Performance Monitoring**: Real-time tracking of refresh cycle performance
- **Gradual Migration**: Phased integration with fallback to existing registry

## Testing Strategy

### Unit Tests
- Registry operations with mock process data
- Categorization logic with various process scenarios
- Change detection and event handling
- Performance testing with large process datasets

### Integration Tests
- Real multi-technology environment with all process types
- Container lifecycle integration with Docker events
- Concurrent access patterns with multiple clients
- Long-running stability tests with continuous refresh cycles

---

**This story creates the intelligent registry foundation that enables real-time process visibility and accurate state management for enhanced agent automation.**