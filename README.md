# PlopDock Platform

**Version**: 2.0.0 (Complete Redesign)  
**Architecture**: Container-based with MCP HTTP/SSE Interface  
**Status**: Clean Slate - Ready for Implementation  
**Tagline**: "Just plop it down and dock it!"

## Overview

PlopDock (formerly MCP Debug Host Platform) is a centralized containerized development environment system that instantly spins up isolated Docker containers for your projects. Just "plop" your project down and let it "dock" - no port conflicts, no resource contention, just instant development environments.

## New Architecture

See: `project_docs/architecture/MCP-DEBUG-HOST-ARCHITECTURE.md`

### Key Features
- **MCP HTTP/SSE Interface** on port 2601
- **4 Pre-built Docker Base Images** (Node, Python, PHP, Static)
- **Automatic Port Management** with dedicated ranges per language
- **File Watching & Auto-Restart** for all environments
- **3-Day Log Retention** with automatic rotation
- **React Dashboard** for human monitoring on port 2602

### Port Allocation
- **System**: 2601-2699
- **Node Apps**: 3000-3999
- **Static Apps**: 4000-4999
- **Python Apps**: 5000-5999
- **PHP Apps**: 8080-8980

## Project Structure

```
/mnt/c/Code/MCPServers/DebugHostMCP/
├── src/                    # New source code (to be implemented)
│   ├── mcp/               # MCP server implementation
│   ├── docker/            # Docker management
│   ├── managers/          # Port, log, project managers
│   └── utils/             # Utilities
├── dashboard/             # React monitoring dashboard
│   ├── src/              # React source
│   └── public/           # Static assets
├── docker/               # Docker configurations
│   └── images/          # Dockerfiles for base images
├── data/                # Runtime data (JSON storage)
│   ├── projects/        # Project registry
│   ├── logs/           # Application logs
│   └── system/         # System configuration
├── volumes/            # Docker volumes for dependencies
├── scripts/           # Utility scripts
└── project_docs/      # Documentation
    └── architecture/  # Architecture specifications

## Legacy System

The previous implementation (v1.x) has been archived to `archive-legacy-system/2025-08-05/`. This includes all source code, tests, documentation, and configurations from the original system.

## Implementation Status

- ✅ Architecture defined and approved
- ✅ Legacy system archived
- ✅ Clean project structure created
- ⏳ MCP HTTP server implementation
- ⏳ Docker base images creation
- ⏳ Port management system
- ⏳ Dashboard development
- ⏳ Testing suite

## Getting Started

*Implementation in progress - instructions will be added as components are built.*

## Development with APM Framework

This project uses the Agentic Persona Mapping (APM) framework for development. The framework is located in `.apm/` and provides specialized AI agents for different development phases.

## License

MIT

---

*For the legacy system documentation and code, see `archive-legacy-system/`*