# Story 3.7: Multi-Tech Dashboard Core

**Story ID**: STORY-3.7  
**Epic**: Epic 3 - Multi-Tech Stack Process Discovery (v2.1)  
**Phase**: 3 - UI Integration  
**Sprint**: Sprint 7  
**Story Points**: 15  
**Priority**: High  
**Status**: Ready for Development  

## User Story

**As a** platform administrator  
**I want** a multi-technology stack dashboard with real-time process monitoring  
**So that** I can visualize and manage all development processes across different technology stacks from a unified interface  

## Business Value

- **Unified Visibility**: Single dashboard view of all technology stacks and process states
- **Real-time Monitoring**: Live updates of process status with 5-second refresh cycles
- **Technology Intelligence**: Technology-specific insights and management capabilities
- **Process Management**: Direct control over discovered and rogue processes

## Acceptance Criteria

### Technology Stack Tabs
1. **GIVEN** the dashboard is loaded  
   **WHEN** I view the interface  
   **THEN** I see tabs for Node.js, PHP, Python, Static Sites, Docker, and All Processes  

2. **GIVEN** I click on the Node.js tab  
   **WHEN** the tab loads  
   **THEN** I see only Node.js processes with framework-specific information (Vite, Next.js, etc.)  

3. **GIVEN** I click on the Docker tab  
   **WHEN** the tab loads  
   **THEN** I see container processes with host-to-container port mapping details  

### Process Categorization Display
4. **GIVEN** processes are categorized by the registry  
   **WHEN** I view any technology tab  
   **THEN** processes are visually distinguished as Registered (green), Discovered (blue), Rogue (orange), Orphaned (red)  

5. **GIVEN** rogue processes are detected  
   **WHEN** I view the dashboard  
   **THEN** rogue processes are highlighted with clear warnings and suggested actions  

6. **GIVEN** orphaned allocations exist  
   **WHEN** I view the dashboard  
   **THEN** orphaned entries show cleanup recommendations  

### Real-time Updates
7. **GIVEN** the dashboard is open  
   **WHEN** new processes start  
   **THEN** the dashboard updates within 5 seconds showing the new processes  

8. **GIVEN** processes terminate  
   **WHEN** the dashboard refreshes  
   **THEN** terminated processes are removed from the display within 5 seconds  

9. **GIVEN** process states change (registered → rogue, etc.)  
   **WHEN** the dashboard updates  
   **THEN** visual indicators update to reflect the new categorization  

### Process Management Controls
10. **GIVEN** I select a rogue process  
    **WHEN** I click the "Terminate" button  
    **THEN** I see a safety confirmation dialog with workspace correlation information  

11. **GIVEN** I select multiple processes  
    **WHEN** I use bulk operations  
    **THEN** I can perform batch actions with appropriate safety warnings  

12. **GIVEN** I click on a container process  
    **WHEN** the details panel opens  
    **THEN** I see container information, port mappings, and associated workspace  

### Dashboard Performance
13. **GIVEN** the dashboard displays 50+ processes  
    **WHEN** refresh cycles execute  
    **THEN** the UI remains responsive with updates completing in < 1 second  

14. **GIVEN** the dashboard runs for 8+ hours  
    **WHEN** continuous real-time updates occur  
    **THEN** memory usage remains stable without memory leaks  

## Technical Requirements

### Dashboard Architecture
```typescript
interface MultiTechDashboard {
  state: {
    processesByTechStack: {
      nodejs: DiscoveredProcess[]
      php: DiscoveredProcess[]
      python: DiscoveredProcess[]
      static: DiscoveredProcess[]
      docker: DiscoveredProcess[]
    }
    systemHealth: SystemHealthMetrics
    rogueProcesses: RogueProcess[]
    correlationResults: CorrelationResult[]
  }
  
  refreshAllTechStacks(): Promise<void>
  handleRogueProcess(process: RogueProcess): Promise<ActionResult>
  renderTechStackTabs(): JSX.Element
}
```

### Technology-Specific Views
- **Node.js Tab**: Framework detection (Vite, Next.js, Webpack), port ranges, npm script identification
- **PHP Tab**: Server type (built-in, Apache, Nginx), document roots, PHP version detection
- **Python Tab**: Framework identification (Flask, Django, FastAPI), virtual environment detection
- **Static Tab**: Tool detection (live-server, http-server, serve), served directory paths
- **Docker Tab**: Container details, image information, port mapping visualization

### Real-time Communication
- **Server-Sent Events (SSE)**: Real-time process updates from server
- **WebSocket Integration**: Bi-directional communication for process management
- **Auto-reconnection**: Robust connection handling with automatic retry logic
- **Offline Detection**: Graceful handling of network interruptions

## Definition of Done

- [ ] Multi-tech dashboard with technology-specific tabs implemented
- [ ] Real-time updates with 5-second refresh cycle working
- [ ] Process categorization with visual indicators (registered/discovered/rogue/orphaned)
- [ ] Process management controls with safety framework integration
- [ ] Performance requirements met (< 1s updates, stable memory usage)
- [ ] Responsive design working across different screen sizes
- [ ] Integration with Enhanced Dynamic Port Registry
- [ ] Error handling for network issues and server unavailability

## Dependencies

### Prerequisites
- ✅ Story 3.3 (Enhanced Dynamic Port Registry)
- ✅ Story 3.5 (New MCP Tools Implementation)
- ✅ Story 3.6 (Agent Safety Framework)
- ✅ Existing React dashboard foundation from v2.0

### Integration Points
- **Enhanced Port Registry**: Real-time process data source
- **MCP Tools**: Process management operations backend
- **Safety Framework**: UI confirmation dialogs and safety warnings

---

**This story provides the comprehensive visual interface that transforms process discovery data into actionable insights and management capabilities.**