# APM Template Variables Reference

Complete reference for all template variables used in the Agentic Persona Mapping (APM) framework.

## 📋 Table of Contents

1. [Core System Variables](#core-system-variables)
2. [Path Variables](#path-variables)
3. [Project Variables](#project-variables)
4. [Persona Variables](#persona-variables)
5. [Date/Time Variables](#datetime-variables)
6. [Configuration Variables](#configuration-variables)
7. [Build Variables](#build-variables)
8. [User Environment Variables](#user-environment-variables)

---

## 🏗️ Core System Variables

### Primary System Identifiers

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `/mnt/c/Code/MCPServers/DebugHostMCP/.apm` | Root directory of APM installation | `/path/to/project/.apm` | All APM file references |
| `/mnt/c/Code/MCPServers/DebugHostMCP` | Root directory of the project | `/path/to/project` | Project file references |
| `` | Name of the current project | `my-awesome-project` | Display names, titles |
| `{{PROJECT_VERSION}}` | Current APM version | `4.0.0` | Version displays, compatibility |
| `{{APM_VERSION}}` | APM framework version | `4.0.0` | Framework version references |

### System Architecture

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{EXECUTION_MODE}}` | Current execution mode | `native_subagents` | Performance optimizations |
| `{{PARALLEL_SUPPORT}}` | Parallel execution capability | `true` | Feature availability |
| `{{VOICE_NOTIFICATIONS}}` | Voice notification status | `enabled` | Audio feature controls |
| `{{SESSION_MANAGEMENT}}` | Session management status | `active` | Session feature controls |

---

## 📁 Path Variables

### APM Directory Structure

| Variable | Description | Full Path Example |
|----------|-------------|-------------------|
| `/mnt/c/Code/MCPServers/DebugHostMCP/.apm` | APM installation root | `/path/to/project/.apm` |
| `{{APM_AGENTS_PATH}}` | Agents directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents` |
| `{{APM_PERSONAS_PATH}}` | Personas directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas` |
| `{{APM_VOICE_PATH}}` | Voice scripts directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice` |
| `{{APM_SESSION_NOTES_PATH}}` | Session notes directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes` |
| `{{APM_RULES_PATH}}` | Rules directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules` |
| `{{APM_CONFIG_PATH}}` | Configuration directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config` |

### Project Directory Structure

| Variable | Description | Full Path Example |
|----------|-------------|-------------------|
| `/mnt/c/Code/MCPServers/DebugHostMCP` | Project root directory | `/path/to/project` |
| `{{PROJECT_DOCS_PATH}}` | Project documentation | `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs` |
| `{{PROJECT_SRC_PATH}}` | Source code directory | `/mnt/c/Code/MCPServers/DebugHostMCP/src` |
| `{{PROJECT_TESTS_PATH}}` | Tests directory | `/mnt/c/Code/MCPServers/DebugHostMCP/tests` |
| `{{PROJECT_CONFIG_PATH}}` | Project configuration | `/mnt/c/Code/MCPServers/DebugHostMCP/config` |

### Claude Code Integration Paths

| Variable | Description | Full Path Example |
|----------|-------------|-------------------|
| `{{CLAUDE_ROOT}}` | Claude Code root directory | `/mnt/c/Code/MCPServers/DebugHostMCP/.claude` |
| `{{CLAUDE_COMMANDS_PATH}}` | Claude commands directory | `{{CLAUDE_ROOT}}/commands` |
| `{{CLAUDE_HOOKS_PATH}}` | Claude hooks directory | `{{CLAUDE_ROOT}}/hooks` |
| `{{CLAUDE_SETTINGS_PATH}}` | Claude settings file | `{{CLAUDE_ROOT}}/settings.json` |

---

## 🚀 Project Variables

### Project Metadata

| Variable | Description | Example Value | Usage Context |
|----------|-------------|---------------|---------------|
| `` | Project name | `ecommerce-platform` | Titles, file names |
| `{{PROJECT_TITLE}}` | Display title | `E-commerce Platform` | Human-readable displays |
| `{{PROJECT_DESCRIPTION}}` | Project description | `Modern e-commerce solution` | Documentation, READMEs |
| `{{PROJECT_AUTHOR}}` | Project author | `Development Team` | Attribution |
| `{{PROJECT_LICENSE}}` | Project license | `MIT` | License references |

### Project Configuration

| Variable | Description | Example Value | Usage Context |
|----------|-------------|---------------|---------------|
| `{{PROJECT_LANGUAGE}}` | Primary language | `JavaScript` | Language-specific configs |
| `{{PROJECT_FRAMEWORK}}` | Primary framework | `React` | Framework-specific setups |
| `{{PROJECT_RUNTIME}}` | Runtime environment | `Node.js 18` | Runtime configurations |
| `{{PROJECT_DATABASE}}` | Database system | `PostgreSQL` | Database configurations |

---

## 👥 Persona Variables

### Core Personas

| Variable | Description | Persona Name | Voice Script |
|----------|-------------|--------------|--------------|
| `{{ORCHESTRATOR_PERSONA}}` | AP Orchestrator | `ap_orchestrator` | `speakOrchestrator.sh` |
| `{{ANALYST_PERSONA}}` | Business Analyst | `analyst` | `speakAnalyst.sh` |
| `{{ARCHITECT_PERSONA}}` | System Architect | `architect` | `speakArchitect.sh` |
| `{{DEVELOPER_PERSONA}}` | Developer | `developer` | `speakDeveloper.sh` |
| `{{QA_PERSONA}}` | QA Engineer | `qa` | `speakQa.sh` |
| `{{PM_PERSONA}}` | Project Manager | `pm` | `speakPm.sh` |
| `{{PO_PERSONA}}` | Product Owner | `po` | `speakPo.sh` |
| `{{SM_PERSONA}}` | Scrum Master | `sm` | `speakSm.sh` |
| `{{DESIGN_ARCHITECT_PERSONA}}` | Design Architect | `design_architect` | `speakDesignArchitect.sh` |

### Persona Configuration Variables

| Variable Pattern | Description | Example | Usage |
|------------------|-------------|---------|-------|
| `{{PERSONA_NAME}}` | Current persona name | `developer` | Persona identification |
| `{{PERSONA_DISPLAY_NAME}}` | Human-readable name | `Developer Agent` | UI displays |
| `{{PERSONA_VOICE_SCRIPT}}` | Voice script path | `speakDeveloper.sh` | Audio notifications |
| `{{PERSONA_CAPABILITIES}}` | Comma-separated capabilities | `coding,testing,review` | Feature lists |

---

## 📅 Date/Time Variables

### Current Date/Time

| Variable | Description | Example Value | Format |
|----------|-------------|---------------|---------|
| `{{CURRENT_DATE}}` | Current date | `2025-01-15` | YYYY-MM-DD |
| `{{CURRENT_TIME}}` | Current time | `14:30:25` | HH:MM:SS |
| `{{CURRENT_DATETIME}}` | Current date and time | `2025-01-15 14:30:25` | YYYY-MM-DD HH:MM:SS |
| `{{CURRENT_TIMESTAMP}}` | Unix timestamp | `1705327825` | Seconds since epoch |
| `{{CURRENT_ISO_DATE}}` | ISO 8601 date | `2025-01-15T14:30:25Z` | ISO format |

### Session Date/Time

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{SESSION_DATE}}` | Session start date | `2025-01-15` | Session file naming |
| `{{SESSION_TIME}}` | Session start time | `14:30:25` | Session timestamps |
| `{{SESSION_ID}}` | Session identifier | `2025-01-15-14-30-25` | Unique session ID |

### Formatted Dates

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{DATE_YEAR}}` | Current year | `2025` | Year-specific references |
| `{{DATE_MONTH}}` | Current month | `01` | Month-specific references |
| `{{DATE_DAY}}` | Current day | `15` | Day-specific references |
| `{{DATE_READABLE}}` | Human-readable date | `January 15, 2025` | Documentation displays |

---

## ⚙️ Configuration Variables

### APM Configuration

| Variable | Description | Example Value | Config Section |
|----------|-------------|---------------|----------------|
| `{{APM_CONFIG_VERSION}}` | Configuration version | `1.0` | version |
| `{{VOICE_ENABLED}}` | Voice notifications enabled | `true` | features.voice_notifications |
| `{{PARALLEL_ENABLED}}` | Parallel execution enabled | `true` | features.parallel_execution |
| `{{SESSION_ENABLED}}` | Session management enabled | `true` | features.session_management |

### Performance Configuration

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{MAX_PARALLEL_AGENTS}}` | Maximum parallel agents | `8` | Parallel execution limits |
| `{{SESSION_TIMEOUT}}` | Session timeout (minutes) | `120` | Session management |
| `{{VOICE_TIMEOUT}}` | Voice script timeout | `5` | Audio notifications |

### Integration Configuration

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{CLAUDE_CODE_VERSION}}` | Claude Code version | `2.1.0` | Compatibility checks |
| `{{HOOK_ENABLED}}` | Hooks enabled status | `true` | Hook system |
| `{{MCP_PLOPDOCK}}` | MCP Plopdock enabled | `true` | Development server management |

---

## 🔧 Build Variables

### Build Information

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{BUILD_DATE}}` | Build creation date | `2025-01-15` | Build information |
| `{{BUILD_TIME}}` | Build creation time | `14:30:25` | Build information |
| `{{BUILD_VERSION}}` | Build version number | `4.0.0-build.123` | Version tracking |
| `{{BUILD_HASH}}` | Git commit hash | `abc123def456` | Version identification |

### Distribution Variables

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{INSTALLER_VERSION}}` | Installer version | `4.0.0` | Installation tracking |
| `{{DISTRIBUTION_DATE}}` | Distribution creation date | `2025-01-15` | Release information |
| `{{TEMPLATE_VERSION}}` | Template system version | `4.0.0` | Template compatibility |

---

## 🌐 User Environment Variables

### User Information

| Variable | Description | Example Value | Source |
|----------|-------------|---------------|---------|
| `{{USER_NAME}}` | Current user name | `developer` | System environment |
| `{{USER_HOME}}` | User home directory | `/home/developer` | System environment |
| `{{USER_EMAIL}}` | User email address | `dev@company.com` | Git config or environment |

### System Environment

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{OS_TYPE}}` | Operating system | `linux` | Platform-specific logic |
| `{{OS_VERSION}}` | OS version | `Ubuntu 22.04` | Compatibility checks |
| `{{SHELL_TYPE}}` | Shell type | `bash` | Shell-specific scripts |
| `{{TERMINAL_TYPE}}` | Terminal emulator | `gnome-terminal` | Terminal-specific features |

### Development Environment

| Variable | Description | Example Value | Usage |
|----------|-------------|---------------|-------|
| `{{NODE_VERSION}}` | Node.js version | `18.19.0` | Runtime compatibility |
| `{{NPM_VERSION}}` | npm version | `10.2.3` | Package management |
| `{{GIT_VERSION}}` | Git version | `2.40.1` | Version control |
| `{{EDITOR}}` | Default editor | `code` | Editor integration |

---

## 🔄 Dynamic Variables

### Session-Specific Variables

These variables are generated dynamically during session execution:

| Variable | Description | Generated When | Example Value |
|----------|-------------|----------------|---------------|
| `{{ACTIVE_PERSONA}}` | Currently active persona | Persona activation | `developer` |
| `{{SESSION_DURATION}}` | Current session duration | Session updates | `45 minutes` |
| `{{TASKS_COMPLETED}}` | Tasks completed in session | Task completion | `3` |
| `{{CURRENT_OBJECTIVE}}` | Current session objective | Objective setting | `Implement user auth` |

### Context-Aware Variables

| Variable | Description | Context | Example Value |
|----------|-------------|---------|---------------|
| `{{PREVIOUS_PERSONA}}` | Last active persona | Persona handoff | `architect` |
| `{{HANDOFF_REASON}}` | Reason for persona change | Handoff execution | `Architecture complete` |
| `{{SESSION_STATUS}}` | Current session status | Session management | `in_progress` |

---

## 🎯 Usage Patterns

### Common Variable Combinations

#### File Path Construction
```markdown
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/{{SESSION_ID}}-.md
/mnt/c/Code/MCPServers/DebugHostMCP/{{PROJECT_DOCS_PATH}}/{{PERSONA_NAME}}-guide.md
```

#### Display Titles
```markdown
# {{PROJECT_TITLE}} - {{PERSONA_DISPLAY_NAME}} Session
## {{CURRENT_DATE}} - {{SESSION_ID}}
```

#### Configuration References
```json
{
  "version": "{{APM_VERSION}}",
  "project": "",
  "paths": {
    "root": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
    "personas": "{{APM_PERSONAS_PATH}}"
  }
}
```

### Template Processing Rules

1. **Variable Resolution Order:**
   - System variables first
   - User environment variables
   - Dynamic/session variables last

2. **Fallback Values:**
   - Missing variables default to `{{VARIABLE_NAME}}`
   - Optional variables can have default values
   - Critical variables halt processing if missing

3. **Escaping Rules:**
   - Use `\{{VARIABLE}}` to escape template processing
   - Double braces `{{{{VARIABLE}}}}` for literal double braces

---

## 🔍 Variable Validation

### Required Variables

These variables must be present for APM to function:

- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm` - APM installation path
- `/mnt/c/Code/MCPServers/DebugHostMCP` - Project directory
- `{{APM_VERSION}}` - Framework version
- `{{CURRENT_DATE}}` - Current date

### Optional Variables

These variables have sensible defaults:

- `` - Defaults to directory name
- `{{PROJECT_DESCRIPTION}}` - Defaults to empty string
- `{{VOICE_ENABLED}}` - Defaults to `true`
- `{{PARALLEL_ENABLED}}` - Defaults to `true`

### Variable Validation Schema

```json
{
  "required_variables": [
    "APM_ROOT",
    "PROJECT_ROOT", 
    "APM_VERSION",
    "CURRENT_DATE"
  ],
  "optional_variables": [
    "PROJECT_NAME",
    "PROJECT_DESCRIPTION",
    "VOICE_ENABLED",
    "PARALLEL_ENABLED"
  ],
  "validation_rules": {
    "path_variables": "must_be_absolute_paths",
    "boolean_variables": "must_be_true_or_false",
    "version_variables": "must_match_semver"
  }
}
```

---

**Template Variable System Version**: {{PROJECT_VERSION}}  
**Last Updated**: {{CURRENT_DATE}}  
**Total Variables**: 75+ documented variables