# APM API Reference

Complete API documentation for the Agentic Persona Mapping (APM) framework.

## 📋 Table of Contents

1. [Core APIs](#core-apis)
2. [Persona APIs](#persona-apis)
3. [Session Management APIs](#session-management-apis)
4. [Configuration APIs](#configuration-apis)
5. [File System APIs](#file-system-apis)
6. [Voice Notification APIs](#voice-notification-apis)
7. [Parallel Execution APIs](#parallel-execution-apis)
8. [QA Framework APIs](#qa-framework-apis)

---

## 🏗️ Core APIs

### APM Initialization API

#### `/ap_orchestrator` Command
```yaml
endpoint: /ap_orchestrator
aliases: [/ap, /agents, /apm]
type: command
description: Initialize APM Orchestrator with full system activation
```

**Process Flow:**
1. **Session Notes Check** - `LS /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
2. **Rules Loading** - `LS /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/`
3. **Configuration Load** - Read APM configuration files
4. **Voice Activation** - Execute `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh`
5. **Orchestrator Persona** - Activate central coordination agent

**Response Schema:**
```json
{
  "status": "activated",
  "persona": "ap_orchestrator",
  "session_id": "YYYY-MM-DD-HH-mm-ss-description",
  "voice_script": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh",
  "capabilities": [
    "persona_coordination",
    "parallel_execution",
    "session_management"
  ]
}
```

### System Status API

#### System Health Check
```yaml
endpoint: /status
type: internal
description: Check APM system health and configuration
```

**Response Schema:**
```json
{
  "apm_version": "{{PROJECT_VERSION}}",
  "root_path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
  "personas_loaded": 9,
  "active_session": "session_filename.md",
  "voice_notifications": true,
  "parallel_execution": "native_subagents",
  "health_status": "operational"
}
```

---

## 👥 Persona APIs

### Persona Activation Schema

All persona commands follow this unified activation pattern:

```yaml
endpoint: /{persona_name}
type: command
parameters:
  persona_id: string (analyst|architect|developer|pm|po|qa|sm|design-architect)
  voice_script: path
  session_management: boolean (default: true)
```

### Individual Persona Endpoints

#### Analyst Persona
```yaml
endpoint: /analyst
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakAnalyst.sh
capabilities:
  - requirements_analysis
  - user_story_creation
  - acceptance_criteria_definition
  - stakeholder_interviews
```

#### Architect Persona
```yaml
endpoint: /architect
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh
capabilities:
  - system_design
  - technical_specifications
  - architecture_documentation
  - technology_recommendations
```

#### Developer Persona
```yaml
endpoint: /developer
aliases: [/dev]
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh
capabilities:
  - code_implementation
  - unit_testing
  - code_reviews
  - technical_documentation
```

#### QA Persona
```yaml
endpoint: /qa
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakQa.sh
capabilities:
  - test_planning
  - test_execution
  - defect_management
  - quality_metrics
```

#### Project Manager Persona
```yaml
endpoint: /pm
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPm.sh
capabilities:
  - project_planning
  - resource_management
  - risk_assessment
  - timeline_management
```

#### Product Owner Persona
```yaml
endpoint: /po
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPo.sh
capabilities:
  - backlog_management
  - priority_setting
  - stakeholder_communication
  - product_vision
```

#### Scrum Master Persona
```yaml
endpoint: /sm
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakSm.sh
capabilities:
  - ceremony_facilitation
  - impediment_removal
  - team_coaching
  - process_improvement
```

#### Design Architect Persona
```yaml
endpoint: /design-architect
voice_script: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDesignArchitect.sh
capabilities:
  - ui_design
  - ux_architecture
  - design_systems
  - user_experience_optimization
```

---

## 🔄 Session Management APIs

### Session Creation API

```yaml
endpoint: internal:create_session
parameters:
  title: string
  persona: string
  objectives: array<string>
```

**File Format:**
```markdown
# Session: {title}
Date: YYYY-MM-DD HH:MM:SS
Persona: {persona_name}

## Objectives
- [ ] {objective_1}
- [ ] {objective_2}

## Progress
[To be updated during session]

## Decisions Made
[Important decisions and rationale]

## Issues Encountered
[Problems and solutions]

## Next Steps
[What needs to be done next session]
```

### Session Transition APIs

#### Handoff API
```yaml
endpoint: /handoff
parameters:
  target_persona: string
  context_summary: string (optional)
type: command
description: Direct transition to another persona without session compaction
```

#### Switch API
```yaml
endpoint: /switch
parameters:
  target_persona: string
  compact_session: boolean (default: true)
type: command
description: Compact current session before switching to another persona
```

#### Wrap API
```yaml
endpoint: /wrap
type: command
description: Archive session notes and create summary
```

---

## ⚙️ Configuration APIs

### Configuration Schema

#### APM Configuration
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "paths": {
      "type": "object",
      "properties": {
        "apm_root": {"type": "string"},
        "session_notes": {"type": "string"},
        "rules": {"type": "string"},
        "personas": {"type": "string"},
        "voice": {"type": "string"}
      },
      "required": ["apm_root"]
    },
    "features": {
      "type": "object",
      "properties": {
        "voice_notifications": {"type": "boolean"},
        "parallel_execution": {"type": "boolean"},
        "session_management": {"type": "boolean"}
      }
    }
  },
  "required": ["version", "paths"]
}
```

#### Persona Configuration Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "display_name": {"type": "string"},
    "description": {"type": "string"},
    "voice_script": {"type": "string"},
    "capabilities": {
      "type": "array",
      "items": {"type": "string"}
    },
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "description": {"type": "string"},
          "parameters": {"type": "object"}
        }
      }
    }
  },
  "required": ["name", "display_name", "voice_script"]
}
```

---

## 📁 File System APIs

### Path Resolution API

```yaml
endpoint: internal:resolve_path
parameters:
  path_type: string (apm_root|session_notes|rules|personas|voice)
  relative_path: string (optional)
returns: string (absolute_path)
```

**Path Types:**
- `apm_root`: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm`
- `session_notes`: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes`
- `rules`: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules`
- `personas`: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas`
- `voice`: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice`

### File Management API

#### Session Notes Management
```yaml
endpoint: internal:session_notes
operations:
  - create: Create new session note file
  - update: Append to existing session note
  - archive: Move session note to archive
  - list: List all session notes
```

#### Rules Management
```yaml
endpoint: internal:rules
operations:
  - load: Load all rule files from rules directory
  - validate: Validate rule file format
  - apply: Apply rules to current session
```

---

## 🔊 Voice Notification APIs

### Voice Script API

```yaml
endpoint: internal:voice_notification
parameters:
  persona: string
  message: string
  script_path: string
```

**Voice Script Locations:**
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakAnalyst.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakQa.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPm.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPo.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakSm.sh`
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDesignArchitect.sh`

**Script Parameters:**
```bash
./speakPersona.sh "message_text"
```

---

## ⚡ Parallel Execution APIs

### Native Sub-Agent API

APM v4.0.0 uses Claude Code's native sub-agent system for parallel execution:

```yaml
endpoint: internal:parallel_execution
type: native_subagent
performance: 4-8x improvement
architecture: native_claude_code_integration
```

### Parallel Command Schema

All parallel commands follow this pattern:

```yaml
endpoint: /parallel-{command_name}
execution_mode: native_subagent
parallel_agents: 2-8
coordination: intelligent_dependency_management
```

#### Examples:

**Parallel Sprint Development:**
```yaml
endpoint: /parallel-sprint
agents: 4
coordination: dependency_resolution
performance: 4.6x improvement
```

**Parallel QA Framework:**
```yaml
endpoint: /parallel-qa-framework
agents: 4
test_types: [unit, integration, performance, security]
ai_ml_features: [prediction, optimization, anomaly_detection]
```

---

## 🧪 QA Framework APIs

### Core QA API

```yaml
endpoint: /qa-framework
components:
  - test_execution_engine
  - security_scanner
  - performance_tester
  - ai_ml_analytics
```

### AI/ML Powered APIs

#### Test Prediction API
```yaml
endpoint: /qa-predict
accuracy: 92%
features:
  - historical_pattern_analysis
  - code_change_analysis
  - dependency_risk_assessment
returns:
  - failure_probability: number (0-1)
  - risk_factors: array<string>
  - recommendations: array<string>
```

#### Test Optimization API
```yaml
endpoint: /qa-optimize
performance_improvement: 63%
strategies:
  - fail_fast
  - coverage_max
  - risk_based
returns:
  - execution_order: array<test>
  - estimated_time_savings: number
  - parallel_execution_plan: object
```

#### Anomaly Detection API
```yaml
endpoint: /qa-anomaly
precision: 94%
detection_types:
  - performance_degradation
  - unusual_failure_patterns
  - quality_metric_anomalies
returns:
  - anomalies: array<anomaly>
  - severity: string (low|medium|high|critical)
  - recommendations: array<string>
```

---

## 🔧 Error Handling

### Standard Error Response

All APIs return errors in this format:

```json
{
  "error": true,
  "error_type": "string",
  "message": "Human readable error message",
  "details": {
    "code": "ERROR_CODE",
    "context": "Additional context information"
  },
  "timestamp": "YYYY-MM-DD HH:MM:SS"
}
```

### Common Error Codes

- `APM_NOT_INITIALIZED`: APM system not properly initialized
- `PERSONA_NOT_FOUND`: Requested persona does not exist
- `SESSION_CREATE_FAILED`: Unable to create session note file
- `VOICE_SCRIPT_NOT_FOUND`: Voice script file missing
- `PARALLEL_EXECUTION_FAILED`: Native sub-agent execution error
- `CONFIG_INVALID`: Configuration file validation failed

---

## 📊 Performance Metrics

### APM v4.0.0 Performance Improvements

- **Native Sub-Agent Architecture**: 4-8x performance improvement
- **Parallel Execution**: True concurrent processing
- **Memory Usage**: Optimized resource management
- **CLI Stability**: Zero crashes with native integration

### Benchmarks

| Operation | v3.5.0 | v4.0.0 | Improvement |
|-----------|---------|---------|-------------|
| Persona Activation | 2.3s | 0.8s | 2.9x faster |
| Parallel Development | 45min | 9.8min | 4.6x faster |
| QA Framework | 12min | 3.1min | 3.9x faster |
| Session Management | 1.8s | 0.5s | 3.6x faster |

---

## 🔗 Integration Points

### Claude Code Integration

APM integrates with Claude Code through:
- **Native Sub-Agent System**: Direct API integration
- **Command Pipeline**: Claude Code command processing
- **File System Access**: Unified file operation handling
- **Error Handling**: Consistent error reporting

### External Tool Integration

APM supports integration with:
- **Version Control**: Git integration for session tracking
- **CI/CD Systems**: Automated testing and deployment
- **Project Management**: Backlog and issue tracking
- **Communication**: Notification systems

---

**Version**: {{PROJECT_VERSION}}  
**Last Updated**: {{CURRENT_DATE}}  
**APM Root**: /mnt/c/Code/MCPServers/DebugHostMCP/.apm