# Plop-a-Dock Rebranding Checklist

**Created**: 2025-08-13  
**Status**: IN PROGRESS  
**Orchestrator**: AP Orchestrator  

## Overview
Complete rebranding from "MCP Debug Host" to "Plop-a-Dock" across all assets.

**Found**: 1,470 references across 361 files

## Brand Identity
- **New Name**: Plop-a-Dock
- **Tagline**: "Just plop it down and dock it!"
- **Description**: Instant containerized development environments
- **Global Install Path**: `~/.plop-a-dock/`

## Rebranding Progress

### ✅ Core Completed (5 files)
- [x] package.json - Updated name, description, keywords, author
- [x] README.md - Added tagline, updated overview
- [x] CLAUDE.md - Updated global installation paths
- [x] product-backlog.md - Added Phase 5 rebranding stories
- [x] This checklist created

### 🔄 In Progress

#### High Priority Files (System Critical)
- [ ] src/mcp-server.js - Update service name references
- [ ] src/docker-manager.js - Update Docker image tags
- [ ] src/index.js - Update startup messages
- [ ] docker/images/*/Dockerfile - Update image names
- [ ] .env.example & .env.template - Update environment variables

#### Dashboard UI (React Components)
- [ ] dashboard/index.html - Title and meta tags
- [ ] dashboard/src/App.tsx - Application title
- [ ] dashboard/src/components/layout/Sidebar.tsx - Brand display
- [ ] dashboard/src/pages/LoginPage.tsx - Login branding
- [ ] dashboard/public/* - Static assets

#### Shell Scripts
- [ ] start-production.sh
- [ ] start-persistent.sh
- [ ] test-mcp-complete.sh
- [ ] test-docker-integration.sh
- [ ] scripts/*.sh - All utility scripts

#### Documentation (project_docs/)
- [ ] architecture/MCP-DEBUG-HOST-ARCHITECTURE.md → PLOP-A-DOCK-ARCHITECTURE.md
- [ ] All epic files (8 files)
- [ ] All story files (30+ files)
- [ ] All test documentation
- [ ] developer-faq.md

### Brand Replacement Patterns

| Old Pattern | New Pattern |
|------------|------------|
| MCP Debug Host | Plop-a-Dock |
| mcp-debug-host | plop-a-dock |
| apm-debug-host | plop-a-dock |
| MCPServers/DebugHostMCP | (keep for now - folder structure) |
| MCP_DEBUG_HOST | PLOP_A_DOCK |
| mcp_debug_host | plop_a_dock |

### Docker Image Naming

| Old Image | New Image |
|-----------|-----------|
| mcp-debug-host-node | plop-a-dock-node |
| mcp-debug-host-python | plop-a-dock-python |
| mcp-debug-host-php | plop-a-dock-php |
| mcp-debug-host-static | plop-a-dock-static |

### Environment Variables

| Old Variable | New Variable |
|-------------|--------------|
| MCP_DEBUG_HOST_PORT | PLOP_A_DOCK_PORT |
| MCP_DEBUG_HOST_DATA | PLOP_A_DOCK_DATA |
| MCP_DEBUG_HOST_LOGS | PLOP_A_DOCK_LOGS |

## Validation Checklist

### Functional Testing
- [ ] Service starts with new name
- [ ] Docker containers build with new tags
- [ ] Dashboard displays new branding
- [ ] Logs show new service name
- [ ] Port registry works correctly

### Visual Consistency
- [ ] Dashboard header shows "Plop-a-Dock"
- [ ] Login page branded correctly
- [ ] Browser title updated
- [ ] Console messages use new name

### Documentation Consistency
- [ ] All markdown files updated
- [ ] Architecture diagrams reference new name
- [ ] API documentation updated
- [ ] Code comments updated

## Notes
- Keep folder structure as `/mnt/c/Code/MCPServers/DebugHostMCP/` for now to avoid breaking paths
- Global installation will move from `~/.apm-debug-host/` to `~/.plop-a-dock/`
- MCP protocol references can stay as-is (Model Context Protocol is the standard)

## Next Steps
1. Complete high-priority system files
2. Update all Docker configurations
3. Rebrand entire dashboard UI
4. Systematic documentation update
5. Final testing and validation