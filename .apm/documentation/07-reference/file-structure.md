# APM File Structure Reference

Complete directory and file organization reference for the Agentic Persona Mapping (APM) framework.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Root Directory Structure](#root-directory-structure)
3. [APM Directory (.apm)](#apm-directory-apm)
4. [Project Documentation](#project-documentation)
5. [Claude Code Integration](#claude-code-integration)
6. [Installer Structure](#installer-structure)
7. [File Naming Conventions](#file-naming-conventions)
8. [Permission Requirements](#permission-requirements)

---

## 🏗️ Overview

APM v4.0.0 follows a unified directory structure optimized for:
- **Native Sub-Agent Integration** with Claude Code
- **Template-Based Generation** with single source of truth
- **Session Management** with intelligent archiving
- **Modular Architecture** with clear separation of concerns

### Key Principles

- **Unified Persona System**: All personas defined in JSON at `/installer/personas/_master/`
- **Template Generation**: Templates auto-generated from JSON during build
- **Path Variables**: All paths use template variables (no hardcoded paths)
- **Modular Organization**: Clear separation between framework, project, and user content

---

## 📁 Root Directory Structure

```
/mnt/c/Code/MCPServers/DebugHostMCP/
├── .apm/                           # APM Framework Installation
├── .claude/                        # Claude Code Configuration
├── project_docs/                   # Project Documentation
├── installer/                      # APM Installation System
├── src/                           # Project Source Code
├── tests/                         # Test Suites
├── CHANGELOG.md                   # Change History
├── README.md                      # Project Overview
├── VERSION                        # Version Information
└── CLAUDE.md                      # Claude Code Instructions
```

### Core Files

| File | Description | Required | Generated |
|------|-------------|----------|-----------|
| `CLAUDE.md` | Project-specific Claude instructions | ✅ | ❌ |
| `README.md` | Project overview and setup | ✅ | 🔄 |
| `VERSION` | Current project version | ✅ | 🔄 |
| `CHANGELOG.md` | Version history and changes | ✅ | 🔄 |

**Legend**: ✅ Required, ❌ User-created, 🔄 Template-generated

---

## 🎯 APM Directory (.apm)

The `.apm` directory contains the complete APM framework installation:

```
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/
├── agents/
│   ├── personas/                   # Persona Definitions
│   │   ├── analyst.persona.md
│   │   ├── architect.persona.md
│   │   ├── developer.persona.md
│   │   ├── pm.persona.md
│   │   ├── po.persona.md
│   │   ├── qa.persona.md
│   │   ├── sm.persona.md
│   │   └── design-architect.persona.md
│   └── voice/                      # Voice Notification Scripts
│       ├── speakOrchestrator.sh
│       ├── speakAnalyst.sh
│       ├── speakArchitect.sh
│       ├── speakDeveloper.sh
│       ├── speakPm.sh
│       ├── speakPo.sh
│       ├── speakQa.sh
│       ├── speakSm.sh
│       └── speakDesignArchitect.sh
├── session_notes/                  # Session Management
│   ├── archive/                    # Archived Session Notes
│   ├── 2025-01-15-14-30-00-Orchestrator.md
│   └── 2025-01-15-15-45-12-Development.md
├── rules/                          # Behavioral Rules
│   ├── orchestrator-rules.md
│   ├── session-management-rules.md
│   └── backlog-management-rules.md
├── config/                         # Configuration Files
│   ├── apm-config.json
│   └── persona-config.json
├── hooks/                          # Integration Hooks
│   ├── pre_tool_use.py
│   ├── post_tool_use.py
│   └── user_prompt_submit.py
├── CLAUDE.md                       # APM-Specific Instructions
├── README.md                       # APM Framework Overview
└── VERSION                         # APM Framework Version
```

### APM Subdirectories

#### `/agents/personas/`
Contains persona definition files generated from master JSON definitions.

| File | Persona | Generated From |
|------|---------|----------------|
| `analyst.persona.md` | Business Analyst | `installer/personas/_master/analyst.persona.json` |
| `architect.persona.md` | System Architect | `installer/personas/_master/architect.persona.json` |
| `developer.persona.md` | Developer | `installer/personas/_master/developer.persona.json` |
| `pm.persona.md` | Project Manager | `installer/personas/_master/pm.persona.json` |
| `po.persona.md` | Product Owner | `installer/personas/_master/po.persona.json` |
| `qa.persona.md` | QA Engineer | `installer/personas/_master/qa.persona.json` |
| `sm.persona.md` | Scrum Master | `installer/personas/_master/sm.persona.json` |
| `design-architect.persona.md` | Design Architect | `installer/personas/_master/design-architect.persona.json` |

#### `/agents/voice/`
Voice notification scripts for audio feedback.

| Script | Persona | Platform |
|--------|---------|----------|
| `speakOrchestrator.sh` | AP Orchestrator | Linux/macOS/WSL |
| `speakAnalyst.sh` | Business Analyst | Linux/macOS/WSL |
| `speakArchitect.sh` | System Architect | Linux/macOS/WSL |
| `speakDeveloper.sh` | Developer | Linux/macOS/WSL |
| `speakPm.sh` | Project Manager | Linux/macOS/WSL |
| `speakPo.sh` | Product Owner | Linux/macOS/WSL |
| `speakQa.sh` | QA Engineer | Linux/macOS/WSL |
| `speakSm.sh` | Scrum Master | Linux/macOS/WSL |
| `speakDesignArchitect.sh` | Design Architect | Linux/macOS/WSL |

#### `/session_notes/`
Session management with automatic archiving.

```
session_notes/
├── archive/
│   ├── 2025-01-10-completed-sessions/
│   └── 2025-01-14-archived-sessions/
├── 2025-01-15-14-30-00-Orchestrator-Setup.md      # Active session
├── 2025-01-15-15-45-12-Development-Sprint.md       # Active session
└── 2025-01-15-16-20-33-QA-Framework-Testing.md     # Active session
```

**Session Note Naming Convention:**
`YYYY-MM-DD-HH-mm-ss-{Description}.md`

#### `/rules/`
Behavioral and operational rules for APM agents.

| File | Purpose | Scope |
|------|---------|-------|
| `orchestrator-rules.md` | AP Orchestrator behavior | Coordination, delegation |
| `session-management-rules.md` | Session handling | Note-taking, transitions |
| `backlog-management-rules.md` | Backlog updates | Story tracking, acceptance criteria |
| `parallel-execution-rules.md` | Parallel processing | Sub-agent coordination |
| `qa-framework-rules.md` | QA operations | Testing, quality metrics |

#### `/config/`
Configuration files and schemas.

| File | Content | Format |
|------|---------|---------|
| `apm-config.json` | APM system configuration | JSON |
| `persona-config.json` | Persona-specific settings | JSON |
| `hooks-config.json` | Hook system configuration | JSON |
| `voice-config.json` | Voice notification settings | JSON |

---

## 📚 Project Documentation

The `project_docs` directory contains comprehensive project documentation:

```
{{PROJECT_DOCS_PATH}}/
├── README.md                       # Project Documentation Overview
├── backlog.md                      # Product Backlog (CRITICAL)
├── architecture.md                 # System Architecture
├── api-documentation.md            # API Reference
├── deployment-guide.md             # Deployment Instructions
├── troubleshooting.md              # Common Issues & Solutions
├── reports/                        # Generated Reports
│   ├── persona-usage-report.md
│   ├── qa-metrics-report.md
│   └── sprint-velocity-report.md
└── archive/                        # Historical Documentation
    ├── v3.5.0-documentation/
    └── legacy-architecture/
```

### Critical Files

#### `backlog.md` - Product Backlog
**🚨 CRITICAL**: The most important file in the project. All personas must update this file.

```markdown
# Product Backlog

## Current Sprint (Sprint 5)

### In Progress
- **[Story-001]** User Authentication System [8 points] - Developer: John
  - [x] Login form implementation
  - [x] Password validation
  - [ ] Session management
  - [ ] Password reset functionality
  
### Ready for Sprint
- **[Story-002]** Product Catalog [13 points]
- **[Story-003]** Shopping Cart [5 points]

## Epics

### Epic 1: User Management (60% Complete)
- Authentication System (In Progress)
- User Profile Management (Ready)
- Access Control (Backlog)
```

---

## 🔧 Claude Code Integration

The `.claude` directory integrates APM with Claude Code:

```
{{CLAUDE_ROOT}}/
├── commands/                       # Claude Commands
│   ├── ap.md                      # AP Orchestrator Command
│   ├── analyst.md                 # Analyst Activation
│   ├── architect.md               # Architect Activation
│   ├── developer.md               # Developer Activation
│   ├── pm.md                      # PM Activation
│   ├── po.md                      # PO Activation
│   ├── qa.md                      # QA Activation
│   ├── sm.md                      # SM Activation
│   ├── design-architect.md        # Design Architect Activation
│   ├── parallel-sprint.md         # Parallel Development
│   ├── qa-framework.md            # QA Framework
│   └── handoff.md                 # Persona Handoff
├── hooks/                          # Integration Hooks
│   ├── pre_tool_use.py            # Pre-execution hooks
│   ├── post_tool_use.py           # Post-execution hooks
│   └── user_prompt_submit.py      # Prompt enhancement
└── settings.json                   # Claude Code Settings
```

### Claude Commands Structure

All Claude commands follow this structure:

```markdown
# Command Title

Brief description of the command.

## Prerequisites
- Required conditions
- Dependencies

## Process Flow
1. Step 1: Description
2. Step 2: Description
3. Step 3: Description

## Success Criteria
- Expected outcomes
- Validation steps
```

---

## 🛠️ Installer Structure

The installer system manages APM deployment and updates:

```
installer/
├── personas/
│   └── _master/                    # Master Persona Definitions
│       ├── analyst.persona.json
│       ├── analyst.persona.yaml
│       ├── architect.persona.json
│       ├── developer.persona.json
│       ├── pm.persona.json
│       ├── po.persona.json
│       ├── qa.persona.json
│       ├── sm.persona.json
│       └── design-architect.persona.json
├── templates/                      # Template System
│   ├── APM-README.md.template
│   ├── claude/
│   │   └── commands/               # Claude Command Templates
│   ├── agents/
│   │   ├── personas/               # Persona Templates
│   │   └── voice/                  # Voice Script Templates
│   ├── hooks/                      # Hook Templates
│   ├── documentation/              # Documentation Templates
│   │   ├── 01-getting-started/
│   │   ├── 02-personas/
│   │   ├── 03-workflows/
│   │   ├── 04-commands/
│   │   ├── 05-configuration/
│   │   ├── 06-troubleshooting/
│   │   ├── 07-advanced/
│   │   └── 08-reference/
│   └── rules/                      # Rule Templates
├── scripts/                        # Installation Scripts
│   ├── install.sh
│   ├── generate-personas.sh
│   ├── build-distribution.sh
│   └── update-documentation.sh
├── VERSION                         # Installer Version
└── README.md                       # Installer Guide
```

### Master Persona System

APM v4.0.0 introduces the unified persona system with single source of truth:

#### JSON Master Definitions
```json
{
  "name": "developer",
  "display_name": "Developer Agent",
  "description": "Full-stack development specialist",
  "voice_script": "speakDeveloper.sh",
  "capabilities": [
    "code_implementation",
    "unit_testing",
    "code_review",
    "technical_documentation"
  ],
  "commands": [
    {
      "name": "implement",
      "description": "Implement feature or fix",
      "parameters": {"story_id": "string", "acceptance_criteria": "array"}
    }
  ]
}
```

#### Template Generation Flow
1. **Master Definition**: `/installer/personas/_master/developer.persona.json`
2. **APM Template**: Generated to `/installer/templates/agents/personas/developer.persona.md.template`
3. **Claude Template**: Generated to `/installer/templates/claude/commands/developer.md.template`
4. **Installation**: Deployed to `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/developer.persona.md`

---

## 📝 File Naming Conventions

### Session Notes
- **Format**: `YYYY-MM-DD-HH-mm-ss-{Description}.md`
- **Examples**: 
  - `2025-01-15-14-30-00-Orchestrator-Setup.md`
  - `2025-01-15-16-45-22-Sprint-Planning-Session.md`

### Persona Files
- **Format**: `{persona-name}.persona.{extension}`
- **Examples**:
  - `developer.persona.json` (Master definition)
  - `developer.persona.md` (Generated persona file)

### Voice Scripts
- **Format**: `speak{PersonaName}.sh`
- **Examples**:
  - `speakDeveloper.sh`
  - `speakOrchestrator.sh`
  - `speakDesignArchitect.sh`

### Command Files
- **Format**: `{command-name}.md`
- **Examples**:
  - `ap.md` (AP Orchestrator)
  - `parallel-sprint.md` (Parallel development)
  - `qa-framework.md` (QA Framework)

### Template Files
- **Format**: `{base-name}.{extension}.template`
- **Examples**:
  - `README.md.template`
  - `developer.persona.md.template`
  - `apm-config.json.template`

### Rule Files
- **Format**: `{rule-category}-rules.md`
- **Examples**:
  - `orchestrator-rules.md`
  - `session-management-rules.md`
  - `backlog-management-rules.md`

---

## 🔐 Permission Requirements

### File System Permissions

#### APM Directory
```bash
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/                       # 755 (rwxr-xr-x)
├── agents/                         # 755 (rwxr-xr-x)
│   ├── personas/                   # 755 (rwxr-xr-x)
│   │   └── *.persona.md            # 644 (rw-r--r--)
│   └── voice/                      # 755 (rwxr-xr-x)
│       └── *.sh                    # 755 (rwxr-xr-x)
├── session_notes/                  # 755 (rwxr-xr-x)
│   └── *.md                        # 644 (rw-r--r--)
├── rules/                          # 755 (rwxr-xr-x)
│   └── *.md                        # 644 (rw-r--r--)
└── config/                         # 755 (rwxr-xr-x)
    └── *.json                      # 644 (rw-r--r--)
```

#### Voice Scripts
All voice scripts require execution permissions:
```bash
chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh
```

#### Session Notes Directory
Must be writable for session management:
```bash
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/
```

### Security Considerations

#### File Access
- **Read Access**: All users need read access to persona and rule files
- **Write Access**: Only APM system needs write access to session notes
- **Execute Access**: Voice scripts need execute permissions

#### Directory Traversal
- Use absolute paths with template variables
- Validate all file paths before access
- Sanitize user-provided file names

---

## 🔄 File Lifecycle Management

### Template Processing
1. **Build Time**: Templates processed during `build-distribution.sh`
2. **Install Time**: Templates deployed to target locations
3. **Runtime**: Template variables resolved dynamically

### Session Note Archiving
1. **Active Session**: Created in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
2. **Session End**: Moved to `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/YYYY-MM-DD/`
3. **Cleanup**: Old archives removed after 90 days (configurable)

### Configuration Updates
1. **Version Check**: Compare current vs. installed versions
2. **Backup**: Create backup of existing configuration
3. **Merge**: Merge new configuration with user customizations
4. **Validate**: Verify configuration integrity

---

## 📊 File System Metrics

### APM v4.0.0 Statistics

| Category | Count | Size (approx) |
|----------|-------|---------------|
| **Core Files** | 12 | 2.1 MB |
| **Persona Definitions** | 9 | 180 KB |
| **Voice Scripts** | 9 | 45 KB |
| **Rule Files** | 8 | 120 KB |
| **Template Files** | 95+ | 3.8 MB |
| **Documentation** | 60+ | 1.2 MB |
| **Total Installation** | ~200 files | ~7.5 MB |

### Cleanup Impact (v4.0.0)
- **Files Removed**: 141 deprecated files
- **Lines Removed**: 25,599 lines of code
- **Size Reduction**: 40% smaller installation
- **Template Consolidation**: 3x duplication eliminated

---

**File Structure Version**: {{PROJECT_VERSION}}  
**Last Updated**: {{CURRENT_DATE}}  
**Total Files Documented**: 200+ files and directories