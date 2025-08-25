# Epic 3: Multi-Tech Stack Process Discovery (v2.1)

**Epic ID**: EPIC-3  
**Priority**: CRITICAL - Active Development  
**Sprint Target**: Sprint 5-8 (12 weeks)  
**Estimated Points**: 120 story points  
**Created**: August 25, 2025  
**Status**: Architecture Complete, Ready for Implementation  

## Epic Summary

Transform PlopDock from a static registry system into a dynamic, resilient process management platform capable of discovering, tracking, and managing development processes across all supported technology stacks (Node.js, PHP, Python, Static Sites, Docker).

## Business Value

### Critical Problem Addressed
**Agent Productivity Crisis**: 95% of Claude Code agent development issues involve port conflicts or orphaned processes that the current static port registry cannot discover or manage, leading to:

- **Agents blocked by safety hooks** preventing necessary process cleanup
- **No visibility** into actual system state vs. registered system state  
- **Rogue processes** on unexpected ports due to automatic port allocation
- **Multi-tech stack complexity** not addressed by current single-approach system

### Strategic Impact
- **95% Reduction** in agent process management issues
- **Real-time visibility** into actual vs. registered system state
- **Automated cleanup** of orphaned development servers
- **Foundation for enterprise-grade** development platform

## Key Stakeholders

- **Claude Code Agents**: Primary beneficiaries requiring reliable process management
- **Platform Administrators**: Need comprehensive system visibility and control
- **Development Teams**: Require multi-tech stack support and automated cleanup
- **System Architects**: Foundation for future enterprise features

## User Personas

1. **Claude Code Agent**: Autonomous process management without human intervention
2. **Platform Administrator**: System-wide process monitoring and management
3. **Developer**: Multi-tech stack development environment management
4. **DevOps Engineer**: Container and process orchestration oversight

## Success Criteria

- [ ] **< 2 seconds** system scan time for full multi-tech discovery
- [ ] **95% detection rate** for all supported technology stacks
- [ ] **< 5% CPU overhead** during active scanning
- [ ] **Real-time correlation** of processes with workspaces
- [ ] **15 new MCP tools** for enhanced agent capabilities
- [ ] **Automated rogue process cleanup** with workspace validation
- [ ] **Multi-tech dashboard** with technology-specific views

## Technical Architecture

### Core Components

#### 1. Multi-Tech Process Discovery Engine
- **Dynamic Process Detection**: Real-time discovery across Node.js, PHP, Python, Static Sites, Docker
- **Rogue Process Management**: Intelligent detection and management of processes on unexpected ports
- **Workspace Correlation**: Smart association of processes with project workspaces
- **Technology-Specific Insights**: Framework and server type detection

#### 2. Enhanced Dynamic Port Registry
- **Hybrid Registry**: Static allocations + real-time process discovery
- **Process Categorization**: Registered, Discovered, Rogue, Orphaned process views
- **Container Correlation**: Docker process mapping and port correlation
- **Real-time Updates**: 5-second refresh cycle with change detection

#### 3. Agent Safety Framework
- **Context-Aware Controls**: Workspace validation for process management
- **Graduated Safety Rules**: Different safety levels based on process correlation
- **Comprehensive Audit Logging**: Full tracking of agent process operations
- **Emergency Override**: Power-user access for critical situations

#### 4. Enhanced MCP Tools (15 New Tools)
- `host.discover_processes` - Comprehensive process discovery
- `host.scan_tech_stack` - Technology-specific scanning
- `host.kill_process` - Safe process termination
- `host.cleanup_rogue` - Rogue process cleanup
- `host.correlate_workspace` - Workspace-process correlation
- `host.monitor_port_ranges` - Real-time port monitoring
- `host.container_discovery` - Docker container detection
- `host.process_tree_analysis` - Process relationship mapping
- `host.workspace_health_check` - Workspace process validation
- `host.auto_cleanup_orphaned` - Automated orphan cleanup
- `host.process_safety_check` - Pre-termination validation
- `host.bulk_process_management` - Multi-process operations
- `host.system_process_report` - Comprehensive system analysis
- `host.kill_by_tech_stack` - Tech stack-specific cleanup
- `host.cleanup_by_project_type` - Project type-specific cleanup

#### 5. Multi-Tech Stack Dashboard
- **Technology Stack Tabs**: Separate views for each supported platform
- **Real-time Monitoring**: Live process activity streams with 5-second updates
- **Bulk Operations**: Multi-process management with safety checks
- **Process Categorization**: Visual distinction between registered/discovered/rogue/orphaned

## Technology Coverage

| Tech Stack | Process Patterns | Port Behavior | Detection Method |
|------------|------------------|---------------|------------------|
| **Node.js** | `vite`, `next`, `tsx`, `npm run dev` | **Dynamic** (3001, 3002...) | `pgrep -f` + port scanning |
| **PHP** | `php -S`, `apache2`, `nginx` | **Static** (fails if busy) | Process + web server detection |
| **Python** | `flask`, `django`, `uvicorn`, `python -m http.server` | **Mixed** (framework dependent) | Multi-pattern matching |
| **Static** | `live-server`, `http-server`, `serve` | **Dynamic** (varies by tool) | Server-specific detection |
| **Docker** | Container processes | **Complex mapping** | `docker ps` + port mapping |

## Stories Breakdown (4 Phases)

### Phase 1: Core Engine Development (4 weeks - 40 points)
1. **Story 3.1**: Multi-Tech Process Discovery Engine (13 points)
2. **Story 3.2**: Technology Stack Detectors Implementation (13 points)
3. **Story 3.3**: Enhanced Dynamic Port Registry (8 points)
4. **Story 3.4**: Core Engine Integration Testing (6 points)

### Phase 2: MCP Enhancement (3 weeks - 30 points)
5. **Story 3.5**: New MCP Tools Implementation (15 new tools) (20 points)
6. **Story 3.6**: Agent Safety Framework (10 points)

### Phase 3: UI Integration (3 weeks - 30 points)
7. **Story 3.7**: Multi-Tech Dashboard Core (15 points)
8. **Story 3.8**: Real-time Process Monitoring UI (10 points)
9. **Story 3.9**: Bulk Operations & Safety Controls (5 points)

### Phase 4: Production Deployment (2 weeks - 20 points)
10. **Story 3.10**: Performance Optimization & Load Testing (8 points)
11. **Story 3.11**: Production Rollout & Migration (8 points)
12. **Story 3.12**: User Documentation & Training (4 points)

## Performance Specifications

- **System Scan Time**: < 2 seconds for full multi-tech discovery
- **Real-time Updates**: 5-second refresh cycle
- **Memory Footprint**: < 50MB additional overhead
- **CPU Impact**: < 5% during active scanning
- **Agent Response Time**: < 500ms for all MCP tool calls
- **Process Correlation Accuracy**: > 95% correct workspace associations

## Dependencies

### Prerequisites
- ✅ PlopDock v2.0 Core Infrastructure (Phases 1-3 complete)
- ✅ Existing MCP Server Foundation
- ✅ Current Port Registry System
- ✅ Docker Manager Module

### External Dependencies
- Docker Engine API (existing)
- System process management utilities (`pgrep`, `ps`, `netstat`)
- Node.js ecosystem detection libraries
- Technology-specific port scanning capabilities

## Risk Assessment

### High Risk
- **Performance impact** on system resources during active scanning
- **False positive** process correlation leading to incorrect workspace associations
- **Security implications** of automated process termination
- **Backward compatibility** with existing v2.0 projects

### Medium Risk
- **Technology detection accuracy** across different framework versions
- **Docker container mapping** complexity with nested processes
- **Real-time synchronization** between discovery engine and dashboard
- **Agent tool performance** under high process discovery loads

### Mitigation Strategies
- **Gradual rollout** with feature flags and monitoring
- **Comprehensive testing** across all supported technology stacks
- **Performance benchmarking** at each development milestone
- **Fallback mechanisms** to v2.0 behavior if issues detected
- **Extensive validation** of workspace correlation logic

## Definition of Done

- [ ] All 4 phases completed with 120 story points delivered
- [ ] **< 2-second system scan** performance requirement met
- [ ] **15 new MCP tools** fully implemented and tested
- [ ] **95% process detection accuracy** across all technology stacks
- [ ] **Multi-tech dashboard** with real-time monitoring operational
- [ ] **Agent safety framework** protecting against unintended terminations
- [ ] **Comprehensive documentation** for users and administrators
- [ ] **Performance benchmarks** meeting all specified targets
- [ ] **Production deployment** with zero-downtime migration
- [ ] **User training** and adoption support completed

## Migration Strategy

### Backward Compatibility
- **Existing Registry**: All v2.0 functionality preserved and enhanced
- **Gradual Enhancement**: New features overlay existing system seamlessly
- **Configuration Migration**: Automatic migration of existing projects
- **API Compatibility**: All existing MCP tools continue to function

### Rollout Plan
1. **Development Environment**: Test with existing PlopDock development setup
2. **Beta Testing**: Limited rollout to controlled test environments
3. **Phased Production**: Gradual rollout with comprehensive monitoring
4. **Full Activation**: Complete multi-tech stack discovery enabled
5. **Legacy Retirement**: Deprecate old static-only approaches

## Success Metrics

### Technical Metrics
- **Process Discovery Accuracy**: > 95% detection rate
- **False Positive Rate**: < 2% incorrect correlations
- **System Performance**: < 5% CPU overhead during scanning
- **Agent Success Rate**: > 98% successful process operations
- **Response Time**: < 500ms average for all MCP tool calls

### Business Metrics
- **Agent Productivity**: 95% reduction in process-related blocking issues
- **Developer Experience**: 3x faster environment management
- **Support Ticket Reduction**: 80% fewer port/process conflict reports
- **User Satisfaction**: > 90% positive feedback on process management
- **System Reliability**: 99.9% uptime during process discovery operations

---

**This epic transforms PlopDock from a basic container orchestrator into a comprehensive, intelligent development process management platform capable of handling the full complexity of modern multi-technology development environments.**

**Next Steps**: Implementation begins immediately with Phase 1: Core Engine Development (4 weeks, 40 story points).