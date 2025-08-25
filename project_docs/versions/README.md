# PlopDock Documentation Versions

This directory contains versioned documentation to preserve the evolution of the PlopDock platform architecture and features.

## Version History

### v2.0 - Current Production System (88% Complete)
**Status**: Production Ready, Actively Used  
**Location**: `v2.0/`  
**Description**: Core MCP Debug Host Platform with container orchestration, port management, and basic project lifecycle management.

**Key Features**:
- Docker-based project orchestration
- Static port registry system  
- Basic MCP tools (15 tools)
- Simple project dashboard
- Support for Node.js, PHP, Python, Static projects

### v2.1 - Multi-Tech Stack Process Discovery (PROPOSED)
**Status**: Architecture Complete, Ready for Implementation  
**Location**: `v2.1-proposed/`  
**Description**: Revolutionary enhancement adding dynamic process discovery, rogue process management, and comprehensive multi-technology stack support.

**Key Enhancements**:
- Multi-tech stack process discovery engine
- Dynamic port registry with rogue process detection
- Enhanced MCP tools (30 total tools)
- Real-time multi-technology dashboard
- Agent safety framework with context-aware controls
- Comprehensive workspace correlation

## Archive Strategy

When creating a new major version:

1. **Archive Current Version**:
   - Move all current documentation to `v{X.Y}/`
   - Preserve exact file structure and content
   - Create version-specific index

2. **Create Proposed Version**:
   - Place new/enhanced documentation in `v{X.Y+1}-proposed/`
   - Maintain clear separation between current and proposed
   - Include migration guides and compatibility notes

3. **Update Main Documentation**:
   - Update main `index.md` to reference both versions
   - Clearly mark current vs. proposed status
   - Provide guidance on which version to reference

## Usage Guidelines

### For Development Teams
- **Current Implementation**: Reference `v2.0/` for existing system work
- **New Feature Development**: Reference `v2.1-proposed/` for enhancement implementation
- **Migration Planning**: Use both versions to plan transition strategy

### For Users
- **Production Use**: Follow `v2.0/` documentation for current system
- **Future Planning**: Review `v2.1-proposed/` for upcoming capabilities
- **Feature Requests**: Base on understanding of both current and proposed systems

---

**Maintained by**: PlopDock Documentation Team  
**Last Updated**: August 24, 2025