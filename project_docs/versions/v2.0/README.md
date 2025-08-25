# PlopDock v2.0 - Current Production System

**Version**: 2.0.0  
**Status**: Production Ready, 88% Complete (37/42 story points delivered)  
**Date**: January 2025  

## Overview

**PlopDock v2.0** is the current production MCP Debug Host Platform - a centralized service management system designed for Claude Code agents to orchestrate multiple project services without port conflicts.

This is the **CURRENT WORKING SYSTEM** that is actively used in production environments.

## Core Capabilities (v2.0)

### ✅ Implemented Features
- **Docker-based Project Orchestration**: 4 pre-built base images (Node.js, PHP, Python, Static)
- **Static Port Registry**: Predictable port allocation by project type
- **MCP HTTP/SSE Interface**: 15 MCP tools for basic project management
- **Basic Project Lifecycle**: Start, stop, monitor registered projects
- **Log Management**: 3-day retention with automatic rotation
- **Simple Dashboard**: Basic project monitoring interface

### 🏗️ Architecture (v2.0)
- **MCP Server**: HTTP with Server-Sent Events on port 2601
- **Dashboard**: React interface on port 2602  
- **Port Strategy**: System (2601-2699), Node (3000-3999), Python (5000-5999), PHP (8080-8980), Static (4000-4999)
- **Storage**: JSON file-based registry (no database required)
- **Docker Network**: Shared network for inter-container communication

## Key Documentation (v2.0)

### Architecture
- [**MCP Debug Host Architecture**](MCP-DEBUG-HOST-ARCHITECTURE.md) - Complete 85-page system specification

### Current Implementation Status
- **Phase 1**: Core Infrastructure ✅ COMPLETE (21/21 points)
- **Phase 2**: Project Management 🟡 76% COMPLETE (16/21 points)  
- **Phase 3**: User Interface 🔴 PENDING
- **Phase 4**: Testing & Hardening 🔴 PENDING

## Limitations (v2.0)

### Known Issues
- **Static Port Registry**: Cannot discover processes on unexpected ports
- **No Rogue Process Detection**: Cannot manage processes started outside PlopDock
- **Basic UI**: Limited real-time monitoring capabilities
- **Single Tech Stack View**: No technology-specific insights
- **Limited Agent Tools**: Only 15 basic MCP tools available

### Agent Challenges
- **Port Conflicts**: Agents struggle with processes that auto-increment ports (Vite, live-server)
- **Process Discovery**: Cannot detect or manage "rogue" development servers
- **Safety Limitations**: Basic process control without workspace correlation
- **Tech Stack Awareness**: No understanding of different development environments

## Migration Path

**Note**: This v2.0 system will be enhanced by the proposed v2.1 Multi-Tech Stack Process Discovery system. See `../v2.1-proposed/` for the comprehensive enhancement architecture.

### Backward Compatibility
- All v2.0 functionality will be preserved in v2.1
- Existing projects and configurations will continue to work unchanged
- Migration will be additive, not disruptive

---

**For current production usage, follow this v2.0 documentation.**  
**For future enhancements, see the v2.1 proposed specifications.**