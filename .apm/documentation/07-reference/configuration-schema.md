# APM Configuration Schema Reference

Comprehensive JSON schemas and configuration specifications for the Agentic Persona Mapping (APM) framework.

## 📋 Table of Contents

1. [Core Configuration Schemas](#core-configuration-schemas)
2. [Persona Configuration](#persona-configuration)
3. [Hook System Configuration](#hook-system-configuration)
4. [Voice Notification Configuration](#voice-notification-configuration)
5. [Session Management Configuration](#session-management-configuration)
6. [Parallel Execution Configuration](#parallel-execution-configuration)
7. [Claude Code Integration](#claude-code-integration)
8. [Validation Rules](#validation-rules)

---

## 🏗️ Core Configuration Schemas

### APM System Configuration

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM System Configuration",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "APM framework version (semantic versioning)"
    },
    "system": {
      "type": "object",
      "properties": {
        "execution_mode": {
          "type": "string",
          "enum": ["native_subagents", "legacy_task"],
          "default": "native_subagents",
          "description": "Execution architecture mode"
        },
        "performance_mode": {
          "type": "string",
          "enum": ["optimal", "compatibility", "debug"],
          "default": "optimal",
          "description": "Performance optimization level"
        },
        "max_parallel_agents": {
          "type": "integer",
          "minimum": 1,
          "maximum": 16,
          "default": 8,
          "description": "Maximum number of parallel sub-agents"
        }
      },
      "required": ["execution_mode"]
    },
    "paths": {
      "type": "object",
      "properties": {
        "apm_root": {
          "type": "string",
          "description": "APM installation root directory"
        },
        "project_root": {
          "type": "string", 
          "description": "Project root directory"
        },
        "session_notes": {
          "type": "string",
          "description": "Session notes directory"
        },
        "rules": {
          "type": "string",
          "description": "Rules directory"
        },
        "personas": {
          "type": "string",
          "description": "Persona definitions directory"
        },
        "voice": {
          "type": "string",
          "description": "Voice scripts directory"
        },
        "config": {
          "type": "string",
          "description": "Configuration directory"
        }
      },
      "required": ["apm_root", "project_root"]
    },
    "features": {
      "type": "object",
      "properties": {
        "voice_notifications": {
          "type": "boolean",
          "default": true,
          "description": "Enable voice notifications"
        },
        "parallel_execution": {
          "type": "boolean",
          "default": true,
          "description": "Enable native parallel execution"
        },
        "session_management": {
          "type": "boolean",
          "default": true,
          "description": "Enable automatic session management"
        },
        "backlog_automation": {
          "type": "boolean",
          "default": true,
          "description": "Enable automatic backlog updates"
        },
        "qa_framework": {
          "type": "boolean",
          "default": true,
          "description": "Enable QA framework with AI/ML"
        }
      }
    },
    "integrations": {
      "type": "object",
      "properties": {
        "claude_code": {
          "type": "object",
          "properties": {
            "version": {"type": "string"},
            "hooks_enabled": {"type": "boolean", "default": true},
            "mcp_plopdock": {"type": "boolean", "default": true}
          }
        },
        "git": {
          "type": "object",
          "properties": {
            "auto_commit_sessions": {"type": "boolean", "default": false},
            "session_branch_prefix": {"type": "string", "default": "apm-session"}
          }
        }
      }
    }
  },
  "required": ["version", "paths", "features"]
}
```

### Project Configuration

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/project-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Project Configuration",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9-_]+$",
          "description": "Project identifier (lowercase, hyphens, underscores)"
        },
        "display_name": {
          "type": "string",
          "description": "Human-readable project name"
        },
        "description": {
          "type": "string",
          "description": "Project description"
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+",
          "description": "Project version"
        },
        "author": {
          "type": "string",
          "description": "Project author or team"
        },
        "license": {
          "type": "string",
          "description": "Project license"
        }
      },
      "required": ["name", "display_name"]
    },
    "technology": {
      "type": "object",
      "properties": {
        "primary_language": {
          "type": "string",
          "enum": ["JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "Rust", "PHP"],
          "description": "Primary programming language"
        },
        "framework": {
          "type": "string",
          "description": "Primary framework (React, Django, Spring, etc.)"
        },
        "runtime": {
          "type": "string",
          "description": "Runtime environment"
        },
        "database": {
          "type": "string",
          "description": "Database system"
        }
      }
    },
    "team": {
      "type": "object",
      "properties": {
        "size": {
          "type": "integer",
          "minimum": 1,
          "description": "Team size"
        },
        "methodology": {
          "type": "string",
          "enum": ["agile", "scrum", "kanban", "waterfall"],
          "description": "Development methodology"
        },
        "sprint_length": {
          "type": "integer",
          "minimum": 1,
          "maximum": 4,
          "default": 2,
          "description": "Sprint length in weeks"
        }
      }
    }
  },
  "required": ["project"]
}
```

---

## 👥 Persona Configuration

### Master Persona Schema

**Files**: `/mnt/c/Code/MCPServers/DebugHostMCP/installer/personas/_master/*.persona.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Persona Definition",
  "type": "object",
  "properties": {
    "metadata": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z-]+$",
          "description": "Persona identifier (lowercase, hyphens)"
        },
        "display_name": {
          "type": "string",
          "description": "Human-readable persona name"
        },
        "description": {
          "type": "string",
          "description": "Persona role description"
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$",
          "description": "Persona definition version"
        },
        "category": {
          "type": "string",
          "enum": ["management", "development", "quality", "design", "analysis"],
          "description": "Persona category"
        }
      },
      "required": ["name", "display_name", "description"]
    },
    "activation": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "pattern": "^[a-z-]+$",
          "description": "Activation command (without /)"
        },
        "aliases": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Alternative activation commands"
        },
        "voice_script": {
          "type": "string",
          "pattern": "^speak[A-Z][a-zA-Z]*\\.sh$",
          "description": "Voice notification script filename"
        }
      },
      "required": ["command", "voice_script"]
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z_]+$"
      },
      "uniqueItems": true,
      "description": "List of persona capabilities"
    },
    "responsibilities": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Key responsibilities and duties"
    },
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Command name"
          },
          "description": {
            "type": "string",
            "description": "Command description"
          },
          "parameters": {
            "type": "object",
            "description": "Command parameters schema"
          },
          "parallel": {
            "type": "boolean",
            "default": false,
            "description": "Supports parallel execution"
          }
        },
        "required": ["name", "description"]
      }
    },
    "session_behavior": {
      "type": "object",
      "properties": {
        "auto_session_notes": {
          "type": "boolean",
          "default": true,
          "description": "Automatically manage session notes"
        },
        "voice_notifications": {
          "type": "boolean",
          "default": true,
          "description": "Use voice notifications"
        },
        "backlog_updates": {
          "type": "boolean",
          "default": true,
          "description": "Update backlog automatically"
        },
        "parallel_capable": {
          "type": "boolean",
          "default": false,
          "description": "Can execute in parallel with other personas"
        }
      }
    },
    "integration": {
      "type": "object",
      "properties": {
        "handoff_targets": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Personas this can hand off to"
        },
        "collaboration_personas": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Personas this collaborates with"
        },
        "required_artifacts": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Required artifacts or files"
        }
      }
    }
  },
  "required": ["metadata", "activation", "capabilities"]
}
```

### Example: Developer Persona Configuration

```json
{
  "metadata": {
    "name": "developer",
    "display_name": "Developer Agent",
    "description": "Full-stack development specialist focused on implementation and code quality",
    "version": "4.0.0",
    "category": "development"
  },
  "activation": {
    "command": "developer",
    "aliases": ["dev"],
    "voice_script": "speakDeveloper.sh"
  },
  "capabilities": [
    "code_implementation",
    "unit_testing", 
    "code_review",
    "technical_documentation",
    "debugging",
    "performance_optimization"
  ],
  "responsibilities": [
    "Implement user stories and features",
    "Write and maintain unit tests",
    "Conduct code reviews",
    "Create technical documentation",
    "Debug and fix issues",
    "Optimize code performance"
  ],
  "commands": [
    {
      "name": "implement",
      "description": "Implement feature or user story",
      "parameters": {
        "story_id": {"type": "string"},
        "acceptance_criteria": {"type": "array"}
      },
      "parallel": true
    },
    {
      "name": "review",
      "description": "Review code changes",
      "parameters": {
        "files": {"type": "array"},
        "criteria": {"type": "array"}
      }
    }
  ],
  "session_behavior": {
    "auto_session_notes": true,
    "voice_notifications": true,
    "backlog_updates": true,
    "parallel_capable": true
  },
  "integration": {
    "handoff_targets": ["qa", "architect", "pm"],
    "collaboration_personas": ["qa", "architect"],
    "required_artifacts": ["backlog.md", "architecture.md"]
  }
}
```

---

## 🔗 Hook System Configuration

### Hook Configuration Schema

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/hooks-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Hook System Configuration",
  "type": "object",
  "properties": {
    "hooks": {
      "type": "object",
      "properties": {
        "pre_tool_use": {
          "type": "object",
          "properties": {
            "enabled": {"type": "boolean", "default": true},
            "script": {"type": "string", "default": "pre_tool_use.py"},
            "timeout": {"type": "integer", "default": 30},
            "fail_on_error": {"type": "boolean", "default": false}
          }
        },
        "post_tool_use": {
          "type": "object", 
          "properties": {
            "enabled": {"type": "boolean", "default": true},
            "script": {"type": "string", "default": "post_tool_use.py"},
            "timeout": {"type": "integer", "default": 30}
          }
        },
        "user_prompt_submit": {
          "type": "object",
          "properties": {
            "enabled": {"type": "boolean", "default": false},
            "script": {"type": "string", "default": "user_prompt_submit.py"},
            "append_text": {"type": "string", "description": "Text to append to prompts"}
          }
        }
      }
    },
    "environment": {
      "type": "object",
      "properties": {
        "HOOK_PRE_TOOL_USE_ENABLED": {"type": "string", "enum": ["true", "false"]},
        "HOOK_POST_TOOL_USE_ENABLED": {"type": "string", "enum": ["true", "false"]},
        "HOOK_USER_PROMPT_SUBMIT_ENABLED": {"type": "string", "enum": ["true", "false"]},
        "PROMPT_APPEND_TEXT": {"type": "string"},
        "MCP_PLOPDOCK_ENABLED": {"type": "string", "enum": ["true", "false"]}
      }
    }
  }
}
```

### Hook Script Configuration

Each hook script can have its own configuration:

```json
{
  "pre_tool_use_config": {
    "development_server_management": {
      "enabled": true,
      "blocked_commands": ["npm run dev", "npm start", "python manage.py runserver"],
      "redirect_to_mcp": true,
      "notification_voice": true
    },
    "path_validation": {
      "enabled": true,
      "validate_file_paths": true,
      "convert_windows_paths": true
    }
  },
  "post_tool_use_config": {
    "session_tracking": {
      "enabled": true,
      "auto_update_session_notes": true,
      "track_file_changes": true
    },
    "backlog_monitoring": {
      "enabled": true,
      "auto_update_backlog": true,
      "validate_story_progress": true
    }
  }
}
```

---

## 🔊 Voice Notification Configuration

### Voice System Configuration

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Voice Notification Configuration",
  "type": "object",
  "properties": {
    "voice_system": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "platform": {
          "type": "string",
          "enum": ["linux", "macos", "windows", "wsl"],
          "description": "Target platform for voice scripts"
        },
        "voice_engine": {
          "type": "string",
          "enum": ["espeak", "say", "powershell", "auto"],
          "default": "auto",
          "description": "Text-to-speech engine"
        },
        "timeout": {
          "type": "integer",
          "minimum": 1,
          "maximum": 30,
          "default": 5,
          "description": "Voice script timeout in seconds"
        }
      }
    },
    "personas": {
      "type": "object",
      "patternProperties": {
        "^[a-z-]+$": {
          "type": "object",
          "properties": {
            "voice_script": {"type": "string"},
            "voice_enabled": {"type": "boolean", "default": true},
            "voice_rate": {
              "type": "integer",
              "minimum": 50,
              "maximum": 400,
              "default": 150,
              "description": "Speech rate (words per minute)"
            },
            "voice_pitch": {
              "type": "integer", 
              "minimum": 0,
              "maximum": 100,
              "default": 50,
              "description": "Voice pitch level"
            }
          }
        }
      }
    },
    "messages": {
      "type": "object",
      "properties": {
        "activation": {
          "type": "string",
          "default": "{persona} agent activated",
          "description": "Persona activation message template"
        },
        "handoff": {
          "type": "string", 
          "default": "Handing off from {from_persona} to {to_persona}",
          "description": "Handoff message template"
        },
        "completion": {
          "type": "string",
          "default": "Task completed by {persona}",
          "description": "Task completion message template"
        }
      }
    }
  }
}
```

---

## 📝 Session Management Configuration

### Session Configuration Schema

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/session-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Session Management Configuration",
  "type": "object",
  "properties": {
    "session_management": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "auto_create": {"type": "boolean", "default": true},
        "auto_archive": {"type": "boolean", "default": true},
        "max_session_duration": {
          "type": "integer",
          "default": 480,
          "description": "Maximum session duration in minutes"
        }
      }
    },
    "session_notes": {
      "type": "object",
      "properties": {
        "format": {
          "type": "string",
          "enum": ["markdown", "json", "yaml"],
          "default": "markdown"
        },
        "naming_convention": {
          "type": "string",
          "default": "YYYY-MM-DD-HH-mm-ss-{description}",
          "description": "Session note file naming pattern"
        },
        "required_sections": {
          "type": "array",
          "items": {"type": "string"},
          "default": ["Objectives", "Progress", "Decisions Made", "Issues Encountered", "Next Steps"]
        }
      }
    },
    "archiving": {
      "type": "object",
      "properties": {
        "archive_after_days": {
          "type": "integer",
          "default": 7,
          "description": "Days before archiving inactive sessions"
        },
        "cleanup_after_days": {
          "type": "integer",
          "default": 90,
          "description": "Days before cleaning up archived sessions"
        },
        "compression": {
          "type": "boolean",
          "default": false,
          "description": "Compress archived sessions"
        }
      }
    }
  }
}
```

### Session Note Template Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Session Note Structure",
  "type": "object",
  "properties": {
    "metadata": {
      "type": "object",
      "properties": {
        "session_id": {"type": "string"},
        "persona": {"type": "string"},
        "start_time": {"type": "string", "format": "date-time"},
        "end_time": {"type": "string", "format": "date-time"},
        "duration": {"type": "integer", "description": "Duration in minutes"}
      }
    },
    "objectives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": {"type": "string"},
          "completed": {"type": "boolean"},
          "completion_time": {"type": "string", "format": "date-time"}
        }
      }
    },
    "progress": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "timestamp": {"type": "string", "format": "date-time"},
          "description": {"type": "string"},
          "artifacts": {"type": "array", "items": {"type": "string"}}
        }
      }
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "decision": {"type": "string"},
          "rationale": {"type": "string"},
          "impact": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"}
        }
      }
    }
  }
}
```

---

## ⚡ Parallel Execution Configuration

### Parallel System Configuration

**File**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/parallel-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Parallel Execution Configuration",
  "type": "object",
  "properties": {
    "parallel_execution": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "architecture": {
          "type": "string",
          "enum": ["native_subagents", "legacy_task"],
          "default": "native_subagents"
        },
        "max_concurrent_agents": {
          "type": "integer",
          "minimum": 1,
          "maximum": 16,
          "default": 8
        },
        "resource_management": {
          "type": "object",
          "properties": {
            "memory_limit_mb": {"type": "integer", "default": 2048},
            "cpu_limit_percent": {"type": "integer", "default": 80},
            "timeout_seconds": {"type": "integer", "default": 1800}
          }
        }
      }
    },
    "coordination": {
      "type": "object",
      "properties": {
        "dependency_resolution": {"type": "boolean", "default": true},
        "conflict_detection": {"type": "boolean", "default": true},
        "progress_synchronization": {"type": "boolean", "default": true},
        "failure_recovery": {
          "type": "string",
          "enum": ["abort_all", "continue_others", "retry_failed"],
          "default": "retry_failed"
        }
      }
    },
    "performance": {
      "type": "object",
      "properties": {
        "optimization_level": {
          "type": "string",
          "enum": ["conservative", "balanced", "aggressive"],
          "default": "balanced"
        },
        "load_balancing": {"type": "boolean", "default": true},
        "dynamic_scaling": {"type": "boolean", "default": true}
      }
    }
  }
}
```

---

## 🔧 Claude Code Integration

### Claude Code Settings Schema

**File**: `{{CLAUDE_ROOT}}/settings.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Claude Code Settings with APM Integration", 
  "type": "object",
  "properties": {
    "apm": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "version": {"type": "string"},
        "root_path": {"type": "string"},
        "auto_activation": {"type": "boolean", "default": true}
      }
    },
    "hooks": {
      "type": "object",
      "properties": {
        "pre_tool_use": {"type": "string"},
        "post_tool_use": {"type": "string"},
        "user_prompt_submit": {"type": "string"}
      }
    },
    "env": {
      "type": "object",
      "properties": {
        "APM_ROOT": {"type": "string"},
        "APM_VERSION": {"type": "string"},
        "HOOK_PRE_TOOL_USE_ENABLED": {"type": "string"},
        "HOOK_POST_TOOL_USE_ENABLED": {"type": "string"},
        "HOOK_USER_PROMPT_SUBMIT_ENABLED": {"type": "string"},
        "PROMPT_APPEND_TEXT": {"type": "string"},
        "MCP_PLOPDOCK_ENABLED": {"type": "string"}
      }
    },
    "commands": {
      "type": "object",
      "patternProperties": {
        "^[a-z-]+$": {
          "type": "object",
          "properties": {
            "file": {"type": "string"},
            "description": {"type": "string"},
            "category": {"type": "string"}
          }
        }
      }
    }
  }
}
```

### Command Configuration Schema

Each Claude command has its own configuration structure:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "APM Command Configuration",
  "type": "object",
  "properties": {
    "command": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "aliases": {"type": "array", "items": {"type": "string"}},
        "description": {"type": "string"},
        "category": {"type": "string"},
        "persona": {"type": "string"},
        "parallel": {"type": "boolean", "default": false}
      }
    },
    "prerequisites": {
      "type": "array",
      "items": {"type": "string"}
    },
    "process_flow": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "step": {"type": "integer"},
          "description": {"type": "string"},
          "parallel": {"type": "boolean", "default": false},
          "dependencies": {"type": "array", "items": {"type": "integer"}}
        }
      }
    },
    "success_criteria": {
      "type": "array",
      "items": {"type": "string"}
    }
  }
}
```

---

## ✅ Validation Rules

### Configuration Validation

APM validates all configuration files during startup:

```json
{
  "validation_rules": {
    "required_files": [
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm-config.json",
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/persona-config.json"
    ],
    "optional_files": [
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/hooks-config.json",
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json",
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/session-config.json",
      "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/parallel-config.json"
    ],
    "path_validation": {
      "apm_root": "must_exist_and_be_directory",
      "project_root": "must_exist_and_be_directory",
      "voice_scripts": "must_be_executable"
    },
    "version_compatibility": {
      "min_apm_version": "4.0.0",
      "max_apm_version": "4.999.999",
      "claude_code_compatibility": ">=2.0.0"
    }
  }
}
```

### Schema Validation Process

1. **Syntax Validation**: JSON syntax and structure
2. **Schema Compliance**: Adherence to defined schemas
3. **Path Resolution**: All paths must be valid and accessible
4. **Permission Check**: Required permissions for files and directories
5. **Version Compatibility**: Compatible versions across components
6. **Integration Test**: Basic functionality verification

### Error Handling

```json
{
  "error_types": {
    "SCHEMA_VALIDATION_ERROR": {
      "severity": "critical",
      "action": "halt_initialization"
    },
    "PATH_NOT_FOUND": {
      "severity": "critical", 
      "action": "halt_initialization"
    },
    "PERMISSION_DENIED": {
      "severity": "critical",
      "action": "halt_initialization"
    },
    "VERSION_MISMATCH": {
      "severity": "warning",
      "action": "log_and_continue"
    },
    "OPTIONAL_CONFIG_MISSING": {
      "severity": "info",
      "action": "use_defaults"
    }
  }
}
```

---

## 🔧 Configuration Management Tools

### Configuration Validation Command

```bash
# Validate all APM configuration files
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh

# Validate specific configuration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh --config apm-config.json

# Generate schema documentation
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-schema-docs.sh
```

### Configuration Migration

```json
{
  "migration": {
    "from_version": "3.5.0",
    "to_version": "4.0.0",
    "changes": [
      {
        "type": "add_property",
        "path": "system.execution_mode",
        "default_value": "native_subagents"
      },
      {
        "type": "rename_property", 
        "old_path": "features.task_execution",
        "new_path": "features.parallel_execution"
      },
      {
        "type": "remove_property",
        "path": "legacy.task_system"
      }
    ]
  }
}
```

---

**Configuration Schema Version**: {{PROJECT_VERSION}}  
**Last Updated**: {{CURRENT_DATE}}  
**Total Schemas**: 12 comprehensive configuration schemas