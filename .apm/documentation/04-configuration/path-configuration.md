# APM Path Configuration Guide

This guide covers the configuration and customization of directory structures and file paths in the Agentic Persona Mapping (APM) framework.

## Path Architecture Overview

APM uses a sophisticated path system to organize:

- **Framework Components**: Core APM infrastructure and personas
- **Project Integration**: Project-specific configurations and data
- **Session Management**: Session notes, archives, and temporary files
- **Templates and Generation**: Source templates and generated content
- **Logs and Diagnostics**: System logs, performance data, and debugging info

## Core Path Structure

### Standard APM Directory Layout

```
/mnt/c/Code/MCPServers/DebugHostMCP/
├── .apm/                           # APM framework root
│   ├── agents/                     # Agent-related files
│   │   ├── personas/               # Generated persona templates
│   │   ├── voice/                  # Voice notification scripts
│   │   └── hooks/                  # Integration hooks
│   ├── config/                     # Configuration files
│   │   ├── voice-config.json       # Voice system configuration
│   │   └── path-config.json        # Path configuration
│   ├── session_notes/              # Active session notes
│   │   └── archive/                # Archived session notes
│   ├── rules/                      # Behavioral rules
│   ├── logs/                       # System logs
│   ├── temp/                       # Temporary files
│   ├── settings.json               # Main APM settings
│   └── CLAUDE.md                   # APM-specific Claude instructions
├── installer/                      # APM installer and templates
│   ├── personas/_master/           # Master persona definitions
│   ├── templates/                  # Template source files
│   └── scripts/                    # Installation and utility scripts
├── project_docs/                   # Project documentation
└── .claude/                        # Claude Code configuration
    ├── commands/                   # Generated APM commands
    └── settings.json               # Claude Code settings
```

### Path Variables and Resolution

APM uses template variables for dynamic path resolution:

- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm` - Root directory of APM installation
- `/mnt/c/Code/MCPServers/DebugHostMCP` - Root directory of the project
- `{{INSTALLER_ROOT}}` - Directory containing installer and templates
- `{{PERSONA_ROOT}}` - Directory containing persona definitions
- `{{SESSION_ROOT}}` - Directory for session management
- `{{LOGS_ROOT}}` - Directory for log files
- `{{TEMP_ROOT}}` - Directory for temporary files

## Path Configuration Methods

### Method 1: Environment Variables

Set path variables through environment configuration:

```bash
# Core path variables
export APM_ROOT="/home/user/project/.apm"
export PROJECT_ROOT="/home/user/project"
export INSTALLER_ROOT="/home/user/project/installer"

# Derived path variables
export PERSONA_ROOT="$APM_ROOT/agents/personas"
export SESSION_ROOT="$APM_ROOT/session_notes"
export LOGS_ROOT="$APM_ROOT/logs"
export TEMP_ROOT="$APM_ROOT/temp"

# Custom path overrides
export CUSTOM_PERSONAS_DIR="$PROJECT_ROOT/custom-personas"
export SHARED_SESSION_DIR="/shared/apm/sessions"
```

### Method 2: Settings.json Configuration

Configure paths in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/settings.json`:

```json
{
  "paths": {
    "apm_root": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
    "project_root": "/mnt/c/Code/MCPServers/DebugHostMCP",
    "installer_root": "{{INSTALLER_ROOT}}",
    "persona_definitions": "{{INSTALLER_ROOT}}/personas/_master",
    "generated_personas": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas",
    "voice_scripts": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice",
    "session_notes": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes",
    "session_archive": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive",
    "rules": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules",
    "logs": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs",
    "temp": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/temp",
    "config": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config"
  },
  "path_resolution": {
    "auto_create_missing": true,
    "validate_permissions": true,
    "relative_path_base": "/mnt/c/Code/MCPServers/DebugHostMCP",
    "template_variable_expansion": true
  }
}
```

### Method 3: Path Configuration File

Create dedicated path configuration at `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/path-config.json`:

```json
{
  "path_configuration": {
    "version": "4.0.0",
    "last_updated": "2025-01-15T10:30:00Z",
    "configuration_method": "dedicated_config_file"
  },
  "core_paths": {
    "apm_root": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm",
      "description": "Root directory of APM framework installation",
      "required": true,
      "auto_create": false,
      "permissions": "755"
    },
    "project_root": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP",
      "description": "Root directory of the project using APM",
      "required": true,
      "auto_create": false,
      "permissions": "755"
    },
    "installer_root": {
      "path": "{{INSTALLER_ROOT}}",
      "description": "Directory containing APM installer and templates",
      "required": true,
      "auto_create": false,
      "permissions": "755"
    }
  },
  "framework_paths": {
    "agents": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents",
      "description": "Agent-related files and configurations",
      "auto_create": true,
      "permissions": "755"
    },
    "personas": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas",
      "description": "Generated persona templates",
      "auto_create": true,
      "permissions": "755",
      "cleanup_policy": "regenerate_on_build"
    },
    "voice_scripts": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice",
      "description": "Voice notification scripts",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "755"
    },
    "hooks": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/hooks",
      "description": "Integration hooks for Claude Code",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "755"
    }
  },
  "session_paths": {
    "session_notes": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes",
      "description": "Active session notes directory",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "644"
    },
    "session_archive": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive",
      "description": "Archived session notes",
      "auto_create": true,
      "permissions": "755",
      "cleanup_policy": "age_based_retention"
    },
    "session_templates": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/templates",
      "description": "Session and document templates",
      "auto_create": true,
      "permissions": "755"
    }
  },
  "configuration_paths": {
    "config": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config",
      "description": "APM configuration files",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "644"
    },
    "rules": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules",
      "description": "Behavioral and operational rules",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "644"
    }
  },
  "operational_paths": {
    "logs": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs",
      "description": "System and operation logs",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "644",
      "cleanup_policy": "size_and_age_rotation"
    },
    "temp": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/temp",
      "description": "Temporary files and working directories",
      "auto_create": true,
      "permissions": "755",
      "cleanup_policy": "session_cleanup"
    },
    "cache": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/cache",
      "description": "Cached data and generated content",
      "auto_create": true,
      "permissions": "755",
      "cleanup_policy": "lru_eviction"
    }
  },
  "integration_paths": {
    "claude_commands": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands",
      "description": "Generated Claude Code commands",
      "auto_create": true,
      "permissions": "755",
      "file_permissions": "644"
    },
    "project_docs": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/project_docs",
      "description": "Project documentation directory",
      "auto_create": true,
      "permissions": "755"
    }
  }
}
```

## Environment-Specific Path Configuration

### Development Environment

```json
{
  "environment": "development",
  "path_overrides": {
    "logs": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/development",
      "log_level": "debug",
      "retention_days": 7
    },
    "temp": {
      "path": "/tmp/apm-dev-{{USER}}",
      "cleanup_interval": "hourly"
    },
    "session_notes": {
      "path": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/dev",
      "auto_backup": true,
      "backup_interval": "every_session"
    }
  },
  "development_features": {
    "enable_path_debugging": true,
    "validate_all_paths": true,
    "create_path_diagnostics": true,
    "monitor_path_usage": true
  }
}
```

### Production Environment

```json
{
  "environment": "production",
  "path_overrides": {
    "logs": {
      "path": "/var/log/apm",
      "log_level": "info",
      "retention_days": 30,
      "rotation_size": "100MB"
    },
    "session_notes": {
      "path": "/opt/apm/sessions",
      "compression_enabled": true,
      "archive_after_days": 1
    },
    "temp": {
      "path": "/tmp/apm",
      "cleanup_interval": "every_15_minutes",
      "max_disk_usage": "1GB"
    }
  },
  "security_settings": {
    "restrict_path_creation": true,
    "validate_path_ownership": true,
    "enforce_permissions": true,
    "audit_path_access": true
  }
}
```

### Team Environment

```json
{
  "environment": "team",
  "shared_paths": {
    "session_notes": {
      "path": "/shared/apm/team-sessions",
      "shared_access": true,
      "user_subdirectories": true
    },
    "project_docs": {
      "path": "/shared/project/docs",
      "collaborative_editing": true,
      "version_control": true
    },
    "personas": {
      "path": "/shared/apm/team-personas",
      "standardized_definitions": true,
      "central_management": true
    }
  },
  "collaboration_features": {
    "shared_session_visibility": true,
    "cross_user_handoffs": true,
    "centralized_logging": true,
    "team_metrics": true
  }
}
```

## Custom Path Implementations

### Project-Specific Path Structures

Create project-specific path layouts:

```json
{
  "project_type": "web_application",
  "custom_paths": {
    "frontend_docs": "/mnt/c/Code/MCPServers/DebugHostMCP/docs/frontend",
    "backend_docs": "/mnt/c/Code/MCPServers/DebugHostMCP/docs/backend",
    "api_specs": "/mnt/c/Code/MCPServers/DebugHostMCP/docs/api",
    "deployment_configs": "/mnt/c/Code/MCPServers/DebugHostMCP/deployment",
    "test_reports": "/mnt/c/Code/MCPServers/DebugHostMCP/reports/testing",
    "performance_logs": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/performance",
    "security_audits": "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/security"
  }
}
```

### Multi-Project Path Management

Support multiple projects with shared APM:

```json
{
  "multi_project_setup": {
    "shared_apm_root": "/opt/apm-framework",
    "project_specific_configs": "{{SHARED_APM_ROOT}}/projects/",
    "shared_personas": "{{SHARED_APM_ROOT}}/personas/shared",
    "shared_voice_scripts": "{{SHARED_APM_ROOT}}/voice/shared",
    "project_isolation": true
  },
  "project_mappings": {
    "ecommerce-platform": {
      "project_root": "/home/dev/ecommerce",
      "apm_root": "/opt/apm-framework/projects/ecommerce-platform"
    },
    "mobile-app": {
      "project_root": "/home/dev/mobile",
      "apm_root": "/opt/apm-framework/projects/mobile-app"
    }
  }
}
```

## Path Validation and Management

### Path Validation Script

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-paths.sh`:

```bash
#!/bin/bash
# APM Path Validation Script

CONFIG_FILE="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/path-config.json"
ERRORS=0

echo "=== APM Path Validation ==="

# Load path configuration
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Path configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Function to validate a path
validate_path() {
    local path_key="$1"
    local path_value="$2"
    local should_exist="$3"
    local required_permissions="$4"
    
    # Expand template variables
    expanded_path=$(echo "$path_value" | envsubst)
    
    echo "Validating $path_key: $expanded_path"
    
    if [ "$should_exist" = "true" ]; then
        if [ ! -e "$expanded_path" ]; then
            echo "❌ Path does not exist: $expanded_path"
            ((ERRORS++))
            return 1
        fi
        
        # Check permissions if specified
        if [ -n "$required_permissions" ]; then
            actual_permissions=$(stat -c "%a" "$expanded_path" 2>/dev/null)
            if [ "$actual_permissions" != "$required_permissions" ]; then
                echo "⚠️ Permission mismatch: expected $required_permissions, got $actual_permissions"
            fi
        fi
        
        echo "✅ $path_key validated"
    else
        echo "ℹ️ $path_key marked as not required to exist"
    fi
}

# Validate core paths
echo -e "\n=== Core Paths ==="
validate_path "APM_ROOT" "$APM_ROOT" "true" "755"
validate_path "PROJECT_ROOT" "$PROJECT_ROOT" "true" "755"
validate_path "INSTALLER_ROOT" "$INSTALLER_ROOT" "true" "755"

# Validate framework paths
echo -e "\n=== Framework Paths ==="
framework_paths=$(jq -r '.framework_paths | to_entries[] | "\(.key) \(.value.path) \(.value.auto_create // false) \(.value.permissions // "755")"' "$CONFIG_FILE" 2>/dev/null)
while IFS=' ' read -r key path auto_create permissions; do
    [ -z "$key" ] && continue
    validate_path "$key" "$path" "$auto_create" "$permissions"
done <<< "$framework_paths"

# Validate session paths
echo -e "\n=== Session Paths ==="
session_paths=$(jq -r '.session_paths | to_entries[] | "\(.key) \(.value.path) \(.value.auto_create // false) \(.value.permissions // "755")"' "$CONFIG_FILE" 2>/dev/null)
while IFS=' ' read -r key path auto_create permissions; do
    [ -z "$key" ] && continue
    validate_path "$key" "$path" "$auto_create" "$permissions"
done <<< "$session_paths"

# Summary
echo -e "\n=== Validation Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All paths validated successfully"
else
    echo "❌ $ERRORS validation errors found"
    exit 1
fi
```

### Path Creation and Setup

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/setup-paths.sh`:

```bash
#!/bin/bash
# APM Path Setup Script

CONFIG_FILE="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/path-config.json"

echo "=== APM Path Setup ==="

# Function to create path with proper permissions
create_path() {
    local path="$1"
    local permissions="$2"
    local file_permissions="$3"
    
    # Expand template variables
    expanded_path=$(echo "$path" | envsubst)
    
    if [ ! -e "$expanded_path" ]; then
        echo "Creating: $expanded_path"
        mkdir -p "$expanded_path"
        chmod "$permissions" "$expanded_path"
        
        # Set file permissions for existing files
        if [ -n "$file_permissions" ]; then
            find "$expanded_path" -type f -exec chmod "$file_permissions" {} \;
        fi
        
        echo "✅ Created: $expanded_path"
    else
        echo "ℹ️ Already exists: $expanded_path"
    fi
}

# Setup framework paths
echo -e "\n=== Setting up Framework Paths ==="
jq -r '.framework_paths | to_entries[] | "\(.value.path) \(.value.permissions // "755") \(.value.file_permissions // "")"' "$CONFIG_FILE" 2>/dev/null | while IFS=' ' read -r path permissions file_perms; do
    [ -z "$path" ] && continue
    create_path "$path" "$permissions" "$file_perms"
done

# Setup session paths
echo -e "\n=== Setting up Session Paths ==="
jq -r '.session_paths | to_entries[] | "\(.value.path) \(.value.permissions // "755") \(.value.file_permissions // "")"' "$CONFIG_FILE" 2>/dev/null | while IFS=' ' read -r path permissions file_perms; do
    [ -z "$path" ] && continue
    create_path "$path" "$permissions" "$file_perms"
done

# Setup operational paths
echo -e "\n=== Setting up Operational Paths ==="
jq -r '.operational_paths | to_entries[] | "\(.value.path) \(.value.permissions // "755") \(.value.file_permissions // "")"' "$CONFIG_FILE" 2>/dev/null | while IFS=' ' read -r path permissions file_perms; do
    [ -z "$path" ] && continue
    create_path "$path" "$permissions" "$file_perms"
done

echo -e "\n✅ Path setup complete"
```

## Dynamic Path Resolution

### Template Variable Expansion

Create advanced template variable expansion:

```bash
#!/bin/bash
# Advanced path template expansion

expand_path_variables() {
    local path_template="$1"
    local expanded_path="$path_template"
    
    # Core variables
    expanded_path=${expanded_path//\{\{APM_ROOT\}\}/$APM_ROOT}
    expanded_path=${expanded_path//\{\{PROJECT_ROOT\}\}/$PROJECT_ROOT}
    expanded_path=${expanded_path//\{\{INSTALLER_ROOT\}\}/$INSTALLER_ROOT}
    
    # User-specific variables
    expanded_path=${expanded_path//\{\{USER\}\}/$USER}
    expanded_path=${expanded_path//\{\{HOME\}\}/$HOME}
    
    # Date/time variables
    expanded_path=${expanded_path//\{\{DATE\}\}/$(date +%Y-%m-%d)}
    expanded_path=${expanded_path//\{\{TIME\}\}/$(date +%H-%M-%S)}
    expanded_path=${expanded_path//\{\{TIMESTAMP\}\}/$(date +%Y-%m-%d-%H-%M-%S)}
    
    # Project-specific variables
    if [ -f "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json" ]; then
        local project_name=$(jq -r '.project.name // "unknown"' /mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json)
        local project_version=$(jq -r '.project.version // "unknown"' /mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json)
        expanded_path=${expanded_path//\{\{PROJECT_NAME\}\}/$project_name}
        expanded_path=${expanded_path//\{\{PROJECT_VERSION\}\}/$project_version}
    fi
    
    # Environment variables
    expanded_path=$(echo "$expanded_path" | envsubst)
    
    echo "$expanded_path"
}
```

### Context-Aware Path Generation

Generate paths based on current context:

```bash
#!/bin/bash
# Context-aware path generation

generate_context_path() {
    local base_path="$1"
    local context_type="$2"
    local context_data="$3"
    
    case "$context_type" in
        "session")
            local session_id=$(echo "$context_data" | jq -r '.session_id')
            local persona=$(echo "$context_data" | jq -r '.persona')
            echo "$base_path/$persona/$session_id"
            ;;
        "project")
            local project_name=$(echo "$context_data" | jq -r '.project_name')
            local environment=$(echo "$context_data" | jq -r '.environment')
            echo "$base_path/$project_name/$environment"
            ;;
        "user")
            local user_id=$(echo "$context_data" | jq -r '.user_id')
            local workspace=$(echo "$context_data" | jq -r '.workspace')
            echo "$base_path/$user_id/$workspace"
            ;;
        *)
            echo "$base_path"
            ;;
    esac
}
```

## Path Migration and Maintenance

### Path Migration Script

Handle path structure changes between versions:

```bash
#!/bin/bash
# APM Path Migration Script

migrate_path_structure() {
    local from_version="$1"
    local to_version="$2"
    
    echo "=== Migrating APM Path Structure ==="
    echo "From version: $from_version"
    echo "To version: $to_version"
    
    case "$from_version" in
        "3.5.0")
            migrate_from_3_5_0
            ;;
        "4.0.0")
            echo "No migration needed for v4.0.0"
            ;;
        *)
            echo "Unknown version: $from_version"
            exit 1
            ;;
    esac
}

migrate_from_3_5_0() {
    echo "Migrating from v3.5.0 to v4.0.0..."
    
    # Move legacy persona files
    if [ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/personas/legacy" ]; then
        echo "Moving legacy personas to archive..."
        mkdir -p "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/archive/v3.5.0/personas"
        mv "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/personas/legacy"/* "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/archive/v3.5.0/personas/"
    fi
    
    # Update path references in configuration files
    echo "Updating configuration file paths..."
    find "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config" -name "*.json" -exec sed -i 's|/personas/legacy/|/agents/personas/|g' {} \;
    
    # Migrate session notes structure
    echo "Migrating session notes structure..."
    if [ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/sessions" ]; then
        mv "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/sessions" "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes"
    fi
    
    echo "Migration from v3.5.0 complete"
}
```

### Path Cleanup and Maintenance

```bash
#!/bin/bash
# APM Path Cleanup and Maintenance

cleanup_paths() {
    local config_file="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/path-config.json"
    
    echo "=== APM Path Cleanup ==="
    
    # Cleanup temporary files
    echo "Cleaning temporary files..."
    if [ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/temp" ]; then
        find "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/temp" -type f -mtime +1 -delete
        find "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/temp" -type d -empty -delete
    fi
    
    # Rotate logs based on policy
    echo "Rotating logs..."
    rotate_logs "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs" "30"  # Keep 30 days
    
    # Archive old session notes
    echo "Archiving old session notes..."
    archive_old_sessions "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes" "7"  # Archive after 7 days
    
    # Clean cache based on LRU policy
    echo "Cleaning cache..."
    clean_cache "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/cache" "100MB"  # Keep max 100MB
    
    echo "Path cleanup complete"
}

rotate_logs() {
    local log_dir="$1"
    local retention_days="$2"
    
    find "$log_dir" -name "*.log" -type f -mtime +$retention_days -delete
}

archive_old_sessions() {
    local session_dir="$1"
    local archive_after_days="$2"
    
    find "$session_dir" -name "*.md" -type f -mtime +$archive_after_days -exec mv {} "$session_dir/archive/" \;
}

clean_cache() {
    local cache_dir="$1"
    local max_size="$2"
    
    # Use du to check cache size and clean if necessary
    local current_size=$(du -s "$cache_dir" | cut -f1)
    local max_size_kb=$(echo "$max_size" | sed 's/MB/000/')
    
    if [ "$current_size" -gt "$max_size_kb" ]; then
        # Remove oldest files first
        find "$cache_dir" -type f -printf '%T@ %p\n' | sort -n | head -n -100 | cut -d' ' -f2- | xargs rm -f
    fi
}
```

## Troubleshooting Path Issues

### Common Path Problems

#### Issue: Path not found errors
**Symptoms**: APM commands fail with "file not found" or "directory not found"
**Solutions**:
```bash
# Verify core paths
echo "APM_ROOT: $APM_ROOT"
echo "PROJECT_ROOT: $PROJECT_ROOT"
echo "INSTALLER_ROOT: $INSTALLER_ROOT"

# Check path existence
ls -la "$APM_ROOT"
ls -la "$PROJECT_ROOT"
ls -la "$INSTALLER_ROOT"

# Recreate missing paths
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/setup-paths.sh
```

#### Issue: Permission denied errors
**Symptoms**: Cannot create files or directories in APM paths
**Solutions**:
```bash
# Check permissions
ls -la "$(dirname "$APM_ROOT")"

# Fix permissions
chmod -R 755 "$APM_ROOT"
chmod -R 755 "$APM_ROOT/agents/voice"

# Check ownership
chown -R "$USER:$USER" "$APM_ROOT"
```

#### Issue: Path conflicts in team environments
**Symptoms**: Multiple users overwriting each other's files
**Solutions**:
```bash
# Use user-specific subdirectories
export APM_USER_ROOT="$APM_ROOT/users/$USER"
mkdir -p "$APM_USER_ROOT"

# Configure shared vs. private paths
# See team environment configuration above
```

#### Issue: Template variable expansion failures
**Symptoms**: Paths contain unexpanded variables like /mnt/c/Code/MCPServers/DebugHostMCP/.apm
**Solutions**:
```bash
# Check environment variables are set
env | grep -E "(APM_ROOT|PROJECT_ROOT|INSTALLER_ROOT)"

# Test manual expansion
echo "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/test" | envsubst

# Verify configuration file syntax
jq empty "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/path-config.json"
```

### Path Diagnostic Tools

#### Path System Diagnostics

```bash
#!/bin/bash
# Comprehensive path system diagnostics

diagnose_path_system() {
    echo "=== APM Path System Diagnostics ==="
    
    echo "1. Core Path Variables:"
    echo "   APM_ROOT: ${APM_ROOT:-NOT SET}"
    echo "   PROJECT_ROOT: ${PROJECT_ROOT:-NOT SET}"
    echo "   INSTALLER_ROOT: ${INSTALLER_ROOT:-NOT SET}"
    
    echo -e "\n2. Path Existence Check:"
    local paths=("$APM_ROOT" "$PROJECT_ROOT" "$INSTALLER_ROOT")
    for path in "${paths[@]}"; do
        if [ -d "$path" ]; then
            echo "   ✅ $path: Exists"
        else
            echo "   ❌ $path: Missing"
        fi
    done
    
    echo -e "\n3. Permission Check:"
    for path in "${paths[@]}"; do
        if [ -r "$path" ] && [ -w "$path" ] && [ -x "$path" ]; then
            echo "   ✅ $path: Read/Write/Execute OK"
        else
            echo "   ❌ $path: Permission issues"
        fi
    done
    
    echo -e "\n4. Disk Space Check:"
    df -h "$APM_ROOT" 2>/dev/null | tail -1 | awk '{print "   Available space: " $4}'
    
    echo -e "\n5. Configuration Files:"
    local config_files=(
        "$APM_ROOT/settings.json"
        "$APM_ROOT/config/path-config.json"
        "$PROJECT_ROOT/.claude/settings.json"
    )
    for config in "${config_files[@]}"; do
        if [ -f "$config" ]; then
            echo "   ✅ $(basename "$config"): Found"
        else
            echo "   ❌ $(basename "$config"): Missing"
        fi
    done
    
    echo -e "\nDiagnostics complete."
}

diagnose_path_system
```

---

**Conclusion**: This completes the comprehensive path configuration guide for the APM framework. With proper path configuration, you ensure reliable operation across different environments and use cases. Review the [Configuration Overview](./README.md) for additional configuration options, or proceed to test your complete APM setup.