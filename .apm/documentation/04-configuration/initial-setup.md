# APM Initial Setup Configuration Guide

This guide walks you through the complete first-time configuration of the Agentic Persona Mapping (APM) framework.

## Prerequisites

Before starting configuration:

- [ ] APM framework installed via `./install.sh`
- [ ] Claude Code CLI installed and configured
- [ ] Project directory structure in place
- [ ] Basic understanding of APM concepts

## Step 1: Core Configuration Files

### 1.1 Settings Configuration

Create or verify `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/settings.json`:

```json
{
  "apm": {
    "version": "4.0.0",
    "root_path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
    "project_root": "/mnt/c/Code/MCPServers/DebugHostMCP",
    "installer_root": "{{INSTALLER_ROOT}}"
  },
  "session_management": {
    "auto_create_notes": true,
    "session_timeout_hours": 8,
    "auto_archive_days": 7,
    "max_session_size_mb": 10
  },
  "voice_notifications": {
    "enabled": true,
    "voice_script_path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/",
    "audio_enabled": true,
    "notification_level": "standard"
  },
  "personas": {
    "master_definitions_path": "{{INSTALLER_ROOT}}/personas/_master/",
    "generated_templates_path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/",
    "auto_regenerate": true
  },
  "parallel_execution": {
    "native_subagents_enabled": true,
    "max_concurrent_agents": 4,
    "coordination_timeout_seconds": 300
  }
}
```

### 1.2 Environment Variables (Optional)

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/.env` for environment-specific settings:

```bash
# APM Framework Configuration
APM_VERSION=4.0.0
APM_ENVIRONMENT=development

# Path Configuration
APM_ROOT=/mnt/c/Code/MCPServers/DebugHostMCP/.apm
PROJECT_ROOT=/mnt/c/Code/MCPServers/DebugHostMCP
INSTALLER_ROOT={{INSTALLER_ROOT}}

# Feature Flags
VOICE_NOTIFICATIONS_ENABLED=true
PARALLEL_EXECUTION_ENABLED=true
DEBUG_LOGGING_ENABLED=false

# MCP Plopdock Integration
MCP_PLOPDOCK_ENABLED=true
MCP_DEBUG_PORT=8080

# Voice Configuration
VOICE_ENGINE=system
VOICE_SPEED=1.2
VOICE_VOLUME=0.8

# Session Management
AUTO_ARCHIVE_ENABLED=true
SESSION_BACKUP_ENABLED=true
MAX_SESSION_HISTORY=50
```

## Step 2: Persona Configuration

### 2.1 Verify Master Persona Definitions

Check that master persona files exist:

```bash
ls -la {{INSTALLER_ROOT}}/personas/_master/
```

Expected files:
- `analyst.persona.json`
- `architect.persona.json`
- `design-architect.persona.json`
- `developer.persona.json`
- `orchestrator.persona.json`
- `pm.persona.json`
- `po.persona.json`
- `qa.persona.json`
- `sm.persona.json`

### 2.2 Generate Persona Templates

Run the persona generation script:

```bash
cd {{INSTALLER_ROOT}}
./generate-personas.sh
```

Verify generated templates:

```bash
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/
```

### 2.3 Customize Default Personas (Optional)

Edit master persona definitions to customize behavior:

```bash
# Edit orchestrator persona
nano {{INSTALLER_ROOT}}/personas/_master/orchestrator.persona.json

# Regenerate templates after changes
./generate-personas.sh
```

## Step 3: Voice Notifications Setup

### 3.1 Verify Voice Scripts

Check voice script installation:

```bash
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/
```

Expected scripts:
- `speakOrchestrator.sh`
- `speakDeveloper.sh`
- `speakArchitect.sh`
- `speakAnalyst.sh`
- `speakQa.sh`
- `speakPm.sh`
- `speakPo.sh`
- `speakSm.sh`
- `speakDesignArchitect.sh`

### 3.2 Test Voice Notifications

```bash
# Test orchestrator voice
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "APM configuration test successful"

# Test other personas
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh "Developer voice test"
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh "Architect voice test"
```

### 3.3 Configure Audio Settings (Optional)

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json`:

```json
{
  "voice_engine": "system",
  "default_voice": "default",
  "speech_rate": 1.2,
  "volume": 0.8,
  "persona_voices": {
    "orchestrator": {"voice": "Alex", "rate": 1.0},
    "developer": {"voice": "Samantha", "rate": 1.1},
    "architect": {"voice": "Tom", "rate": 0.9},
    "analyst": {"voice": "Karen", "rate": 1.0},
    "qa": {"voice": "Daniel", "rate": 1.0},
    "pm": {"voice": "Victoria", "rate": 1.0},
    "po": {"voice": "Oliver", "rate": 1.0},
    "sm": {"voice": "Fiona", "rate": 1.0}
  },
  "notification_types": {
    "activation": true,
    "completion": true,
    "error": true,
    "handoff": true,
    "session_events": false
  }
}
```

## Step 4: Session Management Setup

### 4.1 Initialize Session Directories

```bash
# Create session management structure
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules

# Set appropriate permissions
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules
```

### 4.2 Create Default Rules

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/default-behavior.md`:

```markdown
# APM Default Behavior Rules

## Session Management
- Always create session notes when activating personas
- Update session notes every 10-15 minutes during active work
- Archive sessions when wrapping or ending work
- Maintain context continuity between sessions

## Voice Notifications
- Use voice scripts for all persona responses
- Announce persona activation and major state changes
- Provide audio feedback for task completion
- Alert on errors or blocking issues

## Parallel Execution
- Use native sub-agents for parallel commands
- Coordinate between concurrent execution streams
- Aggregate results from parallel operations
- Monitor performance and resource usage

## Project Management
- Update backlog.md after any story-related work
- Track acceptance criteria completion
- Maintain sprint progress visibility
- Document decisions and architectural choices
```

### 4.3 Configure Session Templates

Create session note template at `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/templates/session-note-template.md`:

```markdown
# Session: {{SESSION_TITLE}}
Date: {{SESSION_DATE}}
Persona: {{PERSONA_NAME}}
Previous Session: {{PREVIOUS_SESSION_LINK}}

## Objectives
- [ ] {{OBJECTIVE_1}}
- [ ] {{OBJECTIVE_2}}

## Context
{{SESSION_CONTEXT}}

## Progress
{{TIMESTAMP}} - Session initialized

## Decisions Made
- None yet

## Issues Encountered
- None yet

## Next Steps
- Continue with planned objectives
- Update session notes regularly
- Archive when complete

## Handoff Notes
{{HANDOFF_CONTEXT}}
```

## Step 5: Development Integration

### 5.1 MCP Plopdock Configuration

Enable MCP Plopdock integration in settings:

```json
{
  "development": {
    "mcp_plopdock_enabled": true,
    "plopdock_port": 8080,
    "auto_detect_servers": true,
    "persistent_servers": true,
    "voice_notifications_for_servers": true
  }
}
```

### 5.2 Claude Code Integration

Verify Claude Code configuration in `/mnt/c/Code/MCPServers/DebugHostMCP/.claude/settings.json`:

```json
{
  "apm": {
    "enabled": true,
    "root": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
    "auto_activate": false
  },
  "hooks": {
    "pre_tool_use": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/hooks/pre_tool_use.py",
    "post_tool_use": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/hooks/post_tool_use.py",
    "user_prompt_submit": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/hooks/user_prompt_submit.py"
  }
}
```

## Step 6: Validation and Testing

### 6.1 Basic Functionality Test

Test core APM functionality:

```bash
# In Claude Code, run these commands one by one:
# /ap
# /handoff dev
# /wrap
```

### 6.2 Persona Activation Test

Test each persona:

```bash
# Test commands (run in Claude Code):
# /analyst
# /architect
# /developer
# /pm
# /qa
```

### 6.3 Parallel Execution Test

Test native sub-agent parallelism:

```bash
# Test parallel command (run in Claude Code):
# /parallel-sprint
```

### 6.4 Voice Notification Test

Verify voice notifications work across personas:

```bash
# Manual voice tests
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "Orchestrator test"
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh "Developer test"
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh "Architect test"
```

## Step 7: Customization Options

### 7.1 Project-Specific Configuration

Create project-specific settings overlay:

```json
{
  "project_specific": {
    "project_name": "",
    "project_type": "web_application",
    "technology_stack": ["React", "Node.js", "MongoDB"],
    "team_size": 5,
    "sprint_length_weeks": 2
  },
  "custom_personas": {
    "enabled": false,
    "definitions_path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/custom-personas/"
  }
}
```

### 7.2 Team Configuration

For team environments, create shared configuration:

```json
{
  "team": {
    "shared_session_notes": true,
    "collaborative_backlog": true,
    "standardized_personas": true,
    "voice_notifications_team_wide": false
  }
}
```

## Troubleshooting Initial Setup

### Common Issues

#### Issue: APM commands not recognized
**Solution**: 
- Verify `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/CLAUDE.md` exists
- Check Claude Code is reading project CLAUDE.md
- Restart Claude Code session

#### Issue: Voice notifications not working
**Solution**:
- Check audio system configuration
- Verify voice script permissions: `chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh`
- Test system audio: `say "test" || espeak "test"`

#### Issue: Persona templates not found
**Solution**:
- Run persona generation: `{{INSTALLER_ROOT}}/generate-personas.sh`
- Verify master definitions exist
- Check file permissions

#### Issue: Session notes not saving
**Solution**:
- Create session directories: `mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes`
- Check write permissions
- Verify settings.json configuration

## Next Steps

After completing initial setup:

1. **Read the [Environment Variables Guide](./environment-variables.md)** for advanced configuration
2. **Review the [Persona Customization Guide](./customizing-personas.md)** to tailor behaviors
3. **Configure [Voice Notifications](./voice-notifications.md)** for optimal audio feedback
4. **Set up [Path Configuration](./path-configuration.md)** for team environments

## Configuration Complete

Your APM framework is now configured and ready for use. Test with:

```
/ap
```

This should activate the AP Orchestrator with full voice notifications and session management.

---

**Support**: For configuration issues, check the troubleshooting section or review the detailed configuration guides in this directory.