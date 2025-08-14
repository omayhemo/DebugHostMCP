# PlopDock - Important Development Notes

## Global Installation Policy

**CRITICAL**: The production version of PlopDock ALWAYS runs from the global installation at `~/.plopdock/`. This is the ONLY production version that should ever be running.

### Key Points:
1. **Global Installation Path**: `~/.plopdock/`
2. **Global Config**: `~/.config/claude/mcp.json` - Configures PlopDock for ALL Claude Code projects
3. **Development Path**: `/mnt/c/Code/MCPServers/DebugHostMCP/` - For development ONLY

### Publishing/Deployment:
- When we publish or deploy changes, we ALWAYS publish to the global version at `~/.plopdock/`
- Never run the development version as a service
- The global version is what all Claude Code instances use across all projects

### Development Workflow:
1. Make changes in `/mnt/c/Code/MCPServers/DebugHostMCP/`
2. Test changes locally (stop global version temporarily if needed)
3. When ready to deploy, copy changes to `~/.plopdock/`
4. Restart the global service

### Commands:
```bash
# Stop global instance (for testing dev version)
pkill -f 'plopdock/src/index.js'

# Copy changes to global installation
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/* ~/.plopdock/

# The global instance auto-starts with Claude Code
```

## Current Issues Fixed:
- Restart bug: Fixed in process-manager.js - now properly stops before restarting
- System processes monitoring: Added ability to view all processes by environment (npm, node, etc.)
# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template


# APM Claude.md Template

<BEGIN-APM-CLAUDE-MERGE>

## 🚀 AGENTIC PERSONA MAPPING (APM)

---

### 🔴 CRITICAL COMMAND 🔴

**When the user types ANY of these as their first message:**
- `ap`
- `ap_orchestrator`
- `agents`
- `apm`

**→ IMMEDIATELY execute the `/ap_orchestrator` command**

This launches the full AP Orchestrator initialization sequence, including:
- Loading all APM infrastructure from `.apm/` directory
- Initializing all agent personas
- Setting up session management
- Presenting orchestrator capabilities

---

### APM Framework Structure

The Agentic Persona Mapping system provides:
- **AP Orchestrator**: Central coordination and delegation
- **Specialized Agents**: Analyst, PM, Architect, Developer, QA, and more
- **Session Management**: Intelligent context preservation and handoffs
- **Collaborative Workflow**: Seamless transitions between personas

All APM components are located in the `.apm/` directory.

---

**Remember**: `ap` = Full AP Orchestrator activation, not just a simple response!

</END-APM-CLAUDE-MERGE>