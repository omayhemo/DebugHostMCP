# PlopDock - Important Development Notes

## Global Installation Policy

**CRITICAL**: The production version of PlopDock ALWAYS runs from the global installation at `~/.plopdock/`. This is the ONLY production version that should ever be running.

### Key Points:
1. **Global Installation Path**: `~/.plopdock/`
2. **Global Config**: `~/.config/claude/mcp.json` - Configures PlopDock for ALL Claude Code projects
3. **Development Path**: `/mnt/c/Code/plopdock/` - For development ONLY

### Publishing/Deployment:
- When we publish or deploy changes, we ALWAYS publish to the global version at `~/.plopdock/`
- Never run the development version as a service
- The global version is what all Claude Code instances use across all projects

### Development Workflow:
1. Make changes in `/mnt/c/Code/plopdock/`
2. Test changes locally (stop global version temporarily if needed)
3. When ready to deploy, copy changes to `~/.plopdock/`
4. Restart the global service

### Commands:
```bash
# Stop global instance (for testing dev version)
pkill -f 'plopdock/src/index.js'

# Copy changes to global installation
cp -r /mnt/c/Code/plopdock/* ~/.plopdock/

# The global instance auto-starts with Claude Code
```

## Current Issues Fixed:
- Restart bug: Fixed in process-manager.js - now properly stops before restarting
- System processes monitoring: Added ability to view all processes by environment (npm, node, etc.)


# Coherence Claude.md Template

<BEGIN-APM-CLAUDE-MERGE>

## 🎭 COHERENCE - AGENTIC PERSONA MAPPING

**Unified Context Engineering**

---

### 🔴 CRITICAL COMMAND 🔴

**When the user types ANY of these as their first message:**
- `coherence`
- `ap`
- `ap_orchestrator` 
- `agents`
- `apm`

**→ IMMEDIATELY execute the `/coherence` command**

This launches the full Coherence Orchestrator initialization sequence, including:
- Loading unified context engineering system from `.apm/` directory
- Initializing all specialized agent personas with orchestrated intelligence
- Setting up seamless session management
- Presenting orchestrated coordination capabilities

---

### Coherence Framework Structure

The Coherence - Agentic Persona Mapping system provides:
- **Coherence Orchestrator**: Central coordination with unified context engineering
- **Specialized Agents**: Analyst, PM, Architect, Developer, QA, and more with orchestrated intelligence
- **Session Management**: Intelligent context preservation and seamless handoffs
- **Collaborative Workflow**: Unified transitions between personas with coherent output

All Coherence components are located in the `.apm/` directory.

---

**Remember**: `coherence` = Full Unified Context Engineering activation with orchestrated AI intelligence!

Legacy commands (`ap`, `ap_orchestrator`) redirect to `/coherence` for backward compatibility.

</END-APM-CLAUDE-MERGE>