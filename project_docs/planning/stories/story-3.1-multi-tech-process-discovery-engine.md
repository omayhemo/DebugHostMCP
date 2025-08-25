# Story 3.1: Multi-Tech Process Discovery Engine

**Story ID**: STORY-3.1  
**Epic**: Epic 3 - Multi-Tech Stack Process Discovery (v2.1)  
**Phase**: 1 - Core Engine Development  
**Sprint**: Sprint 5  
**Story Points**: 13  
**Priority**: Critical  
**Status**: Ready for Development  

## User Story

**As a** Claude Code agent  
**I want** a comprehensive multi-tech process discovery engine  
**So that** I can automatically detect all development processes across Node.js, PHP, Python, Static Sites, and Docker regardless of their registration status  

## Business Value

- **Foundation Component**: Core engine that enables all other v2.1 capabilities
- **Agent Productivity**: Eliminates 95% of agent blocking issues from unknown processes
- **System Visibility**: Real-time understanding of actual vs. registered system state
- **Multi-Tech Support**: Unified approach across all supported technology stacks

## Acceptance Criteria

### Core Discovery Engine
1. **GIVEN** the process discovery engine is initialized  
   **WHEN** I execute a system scan  
   **THEN** it completes in less than 2 seconds  

2. **GIVEN** multiple technology stacks are running  
   **WHEN** the discovery engine scans the system  
   **THEN** it detects processes from Node.js, PHP, Python, Static Sites, and Docker  

3. **GIVEN** the discovery engine detects processes  
   **WHEN** it analyzes each process  
   **THEN** it correctly identifies the technology stack type  

### Technology Stack Detection
4. **GIVEN** a Vite development server is running on port 3001  
   **WHEN** the Node.js detector scans  
   **THEN** it identifies the process as "nodejs" with framework "vite"  

5. **GIVEN** a PHP built-in server is running on port 8080  
   **WHEN** the PHP detector scans  
   **THEN** it identifies the process as "php" with server type "builtin"  

6. **GIVEN** a Django development server is running on port 5000  
   **WHEN** the Python detector scans  
   **THEN** it identifies the process as "python" with framework "django"  

7. **GIVEN** a live-server is running on port 4500  
   **WHEN** the Static detector scans  
   **THEN** it identifies the process as "static" with tool "live-server"  

8. **GIVEN** a Docker container is running with port mapping 3001:3000  
   **WHEN** the Docker detector scans  
   **THEN** it identifies the container process with correct port mapping  

### Process Correlation
9. **GIVEN** processes are discovered  
   **WHEN** the correlation engine analyzes them  
   **THEN** each process has a correlation status (registered, discovered, rogue, orphaned)  

10. **GIVEN** a process is running in a known workspace directory  
    **WHEN** workspace correlation executes  
    **THEN** the process is marked as correlated with that workspace  

11. **GIVEN** a process is running outside any known workspace  
    **WHEN** workspace correlation executes  
    **THEN** the process is marked as "rogue"  

### Detection Accuracy
12. **GIVEN** 10 different processes across all technology stacks  
    **WHEN** the discovery engine scans  
    **THEN** it detects at least 9 of them (95% accuracy rate)  

13. **GIVEN** the system has 0 development processes running  
    **WHEN** the discovery engine scans  
    **THEN** it returns an empty process list with no false positives  

14. **GIVEN** the same process is scanned multiple times  
    **WHEN** repeated scans occur  
    **THEN** the process details remain consistent  

### Performance Requirements
15. **GIVEN** a system with up to 50 processes  
    **WHEN** a full system scan is performed  
    **THEN** it completes within the 2-second requirement  

16. **GIVEN** the discovery engine is running  
    **WHEN** system resources are monitored  
    **THEN** CPU usage remains below 5% during scanning  

17. **GIVEN** the discovery engine performs continuous scans  
    **WHEN** memory usage is monitored  
    **THEN** additional memory footprint remains below 50MB  

### Error Handling
18. **GIVEN** a process terminates during scanning  
    **WHEN** the discovery engine encounters the terminated process  
    **THEN** it handles the error gracefully without crashing  

19. **GIVEN** system process utilities are unavailable  
    **WHEN** the discovery engine attempts to scan  
    **THEN** it returns an appropriate error message  

20. **GIVEN** permission issues prevent process access  
    **WHEN** the discovery engine scans  
    **THEN** it logs the permission issue and continues with other processes  

## Technical Requirements

### Core Architecture
- **MultiTechProcessDiscoveryEngine** class as central coordinator
- **TechStackDetector** interface for technology-specific detection
- **5 Detector Implementations**: NodeJS, PHP, Python, Static, Docker
- **ProcessCorrelationEngine** for workspace association
- **PerformanceMonitor** for resource usage tracking

### Technology Detection Patterns
- **Node.js**: Process name patterns (`vite`, `next`, `tsx`, `npm run dev`)
- **PHP**: Server detection (`php -S`, `apache2`, `nginx`) + port analysis  
- **Python**: Framework patterns (`flask`, `django`, `uvicorn`, `python -m http.server`)
- **Static**: Tool patterns (`live-server`, `http-server`, `serve`)
- **Docker**: Container API integration with `docker ps` + port mapping

### Data Structures
```typescript
interface DiscoveredProcess {
  pid: number
  port: number
  techStack: TechStack
  framework?: string
  workspacePath?: string
  correlationStatus: 'registered' | 'discovered' | 'rogue' | 'orphaned'
  detectionTime: Date
}

enum TechStack {
  NODEJS = 'nodejs',
  PHP = 'php', 
  PYTHON = 'python',
  STATIC = 'static',
  DOCKER = 'docker'
}
```

### Integration Points
- **Port Registry**: Read existing static allocations for correlation
- **Docker Manager**: Leverage existing container management capabilities
- **Workspace Detection**: Analyze process working directories
- **System Utilities**: `pgrep`, `ps`, `netstat`, `docker ps`

## Definition of Done

- [x] MultiTechProcessDiscoveryEngine implemented with all 5 detectors
- [x] All 20 acceptance criteria addressed in implementation  
- [x] Performance optimizations implemented (parallel scanning, timeout handling, error recovery)
- [x] Integration with existing Port Registry system
- [x] Error handling for all edge cases with graceful degradation
- [x] Core engine architecture completed and tested
- [x] Python and NodeJS detectors optimized with parallel scanning
- [ ] Performance requirements validation (< 3s scan, < 5% CPU, < 50MB memory) - PENDING: Full detector optimization
- [ ] Remaining detectors (PHP, Static, Docker) optimization - READY for Story 3.2
- [ ] Comprehensive automated test suite completion

## Dependencies

### Prerequisites
- ✅ PlopDock v2.0 Core Infrastructure
- ✅ Port Registry System (Story 1.4)
- ✅ Docker Manager Module (Story 1.3)

### Parallel Development
- Can be developed alongside Story 3.2 (Technology Stack Detectors)
- Provides foundation for Story 3.3 (Enhanced Dynamic Port Registry)

## Risk Assessment

### High Risk
- **Technology Detection Accuracy**: Different framework versions may have varying patterns
- **Performance Under Load**: Resource usage with many concurrent processes

### Medium Risk
- **Cross-Platform Compatibility**: Process detection patterns may vary across OS
- **Permission Issues**: System process access limitations

### Mitigation
- Comprehensive testing across multiple framework versions
- Performance benchmarking with load simulation
- Graceful degradation for permission-limited environments
- Extensive logging for troubleshooting detection issues

## Testing Strategy

- **Unit Tests**: Each detector with mock processes and real process simulation
- **Integration Tests**: Full discovery engine with real multi-tech environment
- **Performance Tests**: Load testing with 50+ processes
- **Edge Case Tests**: Process termination, permission issues, malformed data
- **Cross-Platform Tests**: Linux, macOS, Windows WSL validation

---

**This story establishes the foundational detection engine that enables all subsequent v2.1 enhancements and directly addresses the core agent productivity issues.**