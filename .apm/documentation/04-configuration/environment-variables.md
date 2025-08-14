# APM Environment Variables Configuration Guide

This guide provides comprehensive documentation for all environment variables used in the Agentic Persona Mapping (APM) framework.

## Environment Variable Overview

APM supports environment variables through multiple mechanisms:

1. **System Environment Variables**: Set in your shell or system configuration
2. **`.env` Files**: Local environment files in APM root directory
3. **Settings.json**: JSON-based configuration with environment variable references
4. **Claude Code Integration**: Variables that affect Claude Code behavior

## Core Framework Variables

### APM_ROOT
**Description**: Root directory path for APM installation  
**Default**: Auto-detected during installation  
**Example**: `/home/user/project/.apm`  
**Usage**: Used by all APM components to locate configuration files, personas, and resources  

```bash
export APM_ROOT="/path/to/project/.apm"
```

### PROJECT_ROOT
**Description**: Root directory of the project using APM  
**Default**: Auto-detected as parent of APM_ROOT  
**Example**: `/home/user/project`  
**Usage**: Referenced in templates and path resolution  

```bash
export PROJECT_ROOT="/path/to/project"
```

### INSTALLER_ROOT
**Description**: Directory containing APM installer and templates  
**Default**: Auto-detected relative to installation location  
**Example**: `/home/user/project/installer`  
**Usage**: Used for persona generation and template processing  

```bash
export INSTALLER_ROOT="/path/to/project/installer"
```

## Feature Control Variables

### APM_ENVIRONMENT
**Description**: Deployment environment designation  
**Values**: `development`, `staging`, `production`  
**Default**: `development`  
**Usage**: Controls logging levels, debug features, and performance optimizations  

```bash
# Development environment with debug features
export APM_ENVIRONMENT="development"

# Production environment with optimized performance
export APM_ENVIRONMENT="production"
```

### VOICE_NOTIFICATIONS_ENABLED
**Description**: Global toggle for voice notification system  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables/disables all voice feedback from APM personas  

```bash
# Enable voice notifications
export VOICE_NOTIFICATIONS_ENABLED="true"

# Disable for quiet operation
export VOICE_NOTIFICATIONS_ENABLED="false"
```

### PARALLEL_EXECUTION_ENABLED
**Description**: Enable native sub-agent parallel execution  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Controls whether APM uses native sub-agents for parallel commands  

```bash
# Enable parallel execution (recommended)
export PARALLEL_EXECUTION_ENABLED="true"

# Disable for sequential operation
export PARALLEL_EXECUTION_ENABLED="false"
```

### DEBUG_LOGGING_ENABLED
**Description**: Enable detailed debug logging  
**Values**: `true`, `false`  
**Default**: `false`  
**Usage**: Controls verbosity of APM logging output  

```bash
# Enable debug logging
export DEBUG_LOGGING_ENABLED="true"
```

## Voice System Variables

### VOICE_ENGINE
**Description**: Text-to-speech engine selection  
**Values**: `system`, `espeak`, `festival`, `custom`  
**Default**: `system`  
**Usage**: Determines which TTS engine voice scripts use  

```bash
# Use system default TTS
export VOICE_ENGINE="system"

# Use espeak on Linux
export VOICE_ENGINE="espeak"
```

### VOICE_SPEED
**Description**: Speech rate multiplier  
**Values**: `0.5` to `2.0` (decimal)  
**Default**: `1.0`  
**Usage**: Controls speaking speed for voice notifications  

```bash
# Slower speech
export VOICE_SPEED="0.8"

# Faster speech
export VOICE_SPEED="1.3"
```

### VOICE_VOLUME
**Description**: Audio volume level  
**Values**: `0.0` to `1.0` (decimal)  
**Default**: `0.8`  
**Usage**: Controls volume of voice notifications  

```bash
# Quieter notifications
export VOICE_VOLUME="0.5"

# Louder notifications
export VOICE_VOLUME="1.0"
```

### VOICE_PERSONA_DIFFERENTIATION
**Description**: Use different voices for different personas  
**Values**: `true`, `false`  
**Default**: `false`  
**Usage**: Enables persona-specific voice characteristics  

```bash
export VOICE_PERSONA_DIFFERENTIATION="true"
```

## Session Management Variables

### AUTO_ARCHIVE_ENABLED
**Description**: Automatically archive completed sessions  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Controls automatic session archival  

```bash
export AUTO_ARCHIVE_ENABLED="true"
```

### SESSION_BACKUP_ENABLED
**Description**: Create backups of session notes  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables session note backup functionality  

```bash
export SESSION_BACKUP_ENABLED="true"
```

### MAX_SESSION_HISTORY
**Description**: Maximum number of session notes to retain  
**Values**: Positive integer  
**Default**: `50`  
**Usage**: Controls session history cleanup  

```bash
export MAX_SESSION_HISTORY="100"
```

### SESSION_TIMEOUT_HOURS
**Description**: Hours after which sessions are considered inactive  
**Values**: Positive integer  
**Default**: `8`  
**Usage**: Used for session cleanup and archival decisions  

```bash
export SESSION_TIMEOUT_HOURS="12"
```

## Development Integration Variables

### MCP_PLOPDOCK_ENABLED
**Description**: Enable MCP Plopdock integration  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables development server management through MCP Plopdock  

```bash
export MCP_PLOPDOCK_ENABLED="true"
```

### MCP_DEBUG_PORT
**Description**: Port for MCP Plopdock dashboard  
**Values**: Port number (1024-65535)  
**Default**: `8080`  
**Usage**: Configures dashboard access port  

```bash
export MCP_DEBUG_PORT="3001"
```

### AUTO_DETECT_SERVERS
**Description**: Automatically detect development servers  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables automatic server detection and management  

```bash
export AUTO_DETECT_SERVERS="true"
```

## Persona System Variables

### PERSONA_AUTO_REGENERATE
**Description**: Automatically regenerate persona templates  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Controls automatic template regeneration after persona definition changes  

```bash
export PERSONA_AUTO_REGENERATE="false"
```

### MAX_CONCURRENT_AGENTS
**Description**: Maximum number of concurrent native sub-agents  
**Values**: Positive integer (1-8 recommended)  
**Default**: `4`  
**Usage**: Controls parallel execution concurrency  

```bash
export MAX_CONCURRENT_AGENTS="6"
```

### COORDINATION_TIMEOUT_SECONDS
**Description**: Timeout for parallel agent coordination  
**Values**: Positive integer (seconds)  
**Default**: `300`  
**Usage**: Maximum time to wait for parallel agent coordination  

```bash
export COORDINATION_TIMEOUT_SECONDS="600"
```

## Claude Code Integration Variables

### HOOK_PRE_TOOL_USE_ENABLED
**Description**: Enable pre-tool-use hooks  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables APM pre-processing of Claude Code tool usage  

```bash
export HOOK_PRE_TOOL_USE_ENABLED="true"
```

### HOOK_POST_TOOL_USE_ENABLED
**Description**: Enable post-tool-use hooks  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables APM post-processing of Claude Code tool results  

```bash
export HOOK_POST_TOOL_USE_ENABLED="true"
```

### HOOK_USER_PROMPT_SUBMIT_ENABLED
**Description**: Enable user prompt submission hooks  
**Values**: `true`, `false`  
**Default**: `false`  
**Usage**: Enables automatic prompt enhancement (v3.3.0+)  

```bash
export HOOK_USER_PROMPT_SUBMIT_ENABLED="true"
```

### PROMPT_APPEND_TEXT
**Description**: Text to append to all user prompts  
**Values**: Any string  
**Default**: Empty  
**Usage**: Automatically appends context to user prompts  

```bash
export PROMPT_APPEND_TEXT="[Remember: Update backlog.md after story work]"
```

## Performance and Resource Variables

### ENABLE_PERFORMANCE_MONITORING
**Description**: Enable performance metrics collection  
**Values**: `true`, `false`  
**Default**: `false`  
**Usage**: Collects timing and resource usage metrics  

```bash
export ENABLE_PERFORMANCE_MONITORING="true"
```

### MEMORY_LIMIT_MB
**Description**: Memory limit for APM operations  
**Values**: Positive integer (MB)  
**Default**: `1024`  
**Usage**: Controls memory usage limits  

```bash
export MEMORY_LIMIT_MB="2048"
```

### CACHE_ENABLED
**Description**: Enable APM caching systems  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Enables persona and template caching  

```bash
export CACHE_ENABLED="true"
```

## Security Variables

### APM_SECURITY_MODE
**Description**: Security mode for APM operations  
**Values**: `strict`, `standard`, `permissive`  
**Default**: `standard`  
**Usage**: Controls security checks and validations  

```bash
export APM_SECURITY_MODE="strict"
```

### DISABLE_REMOTE_TEMPLATES
**Description**: Disable remote template loading  
**Values**: `true`, `false`  
**Default**: `true`  
**Usage**: Security feature to prevent remote template execution  

```bash
export DISABLE_REMOTE_TEMPLATES="true"
```

## Environment Variable Configuration Methods

### Method 1: System Environment

Set in your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Add to ~/.bashrc or ~/.zshrc
export APM_ROOT="/path/to/.apm"
export VOICE_NOTIFICATIONS_ENABLED="true"
export DEBUG_LOGGING_ENABLED="false"
```

### Method 2: .env File

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/.env`:

```bash
# APM Framework Configuration
APM_ENVIRONMENT=development
VOICE_NOTIFICATIONS_ENABLED=true
PARALLEL_EXECUTION_ENABLED=true
DEBUG_LOGGING_ENABLED=false

# Voice Configuration
VOICE_ENGINE=system
VOICE_SPEED=1.2
VOICE_VOLUME=0.8

# Session Management
AUTO_ARCHIVE_ENABLED=true
SESSION_BACKUP_ENABLED=true
MAX_SESSION_HISTORY=50

# Development Integration
MCP_PLOPDOCK_ENABLED=true
MCP_DEBUG_PORT=8080
```

### Method 3: Settings.json Integration

Reference environment variables in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/settings.json`:

```json
{
  "apm": {
    "root_path": "${APM_ROOT}",
    "environment": "${APM_ENVIRONMENT:-development}"
  },
  "voice_notifications": {
    "enabled": "${VOICE_NOTIFICATIONS_ENABLED:-true}",
    "engine": "${VOICE_ENGINE:-system}",
    "speed": "${VOICE_SPEED:-1.0}"
  }
}
```

### Method 4: Docker Environment

For containerized deployments:

```dockerfile
# Dockerfile
ENV APM_ROOT=/app/.apm
ENV VOICE_NOTIFICATIONS_ENABLED=false
ENV PARALLEL_EXECUTION_ENABLED=true
ENV APM_ENVIRONMENT=production
```

## Environment-Specific Configurations

### Development Environment

```bash
# Development optimized settings
export APM_ENVIRONMENT="development"
export DEBUG_LOGGING_ENABLED="true"
export VOICE_NOTIFICATIONS_ENABLED="true"
export MCP_PLOPDOCK_ENABLED="true"
export SESSION_BACKUP_ENABLED="true"
export ENABLE_PERFORMANCE_MONITORING="true"
```

### Production Environment

```bash
# Production optimized settings
export APM_ENVIRONMENT="production"
export DEBUG_LOGGING_ENABLED="false"
export VOICE_NOTIFICATIONS_ENABLED="false"
export MCP_PLOPDOCK_ENABLED="false"
export SESSION_BACKUP_ENABLED="false"
export ENABLE_PERFORMANCE_MONITORING="false"
export APM_SECURITY_MODE="strict"
```

### Team Environment

```bash
# Team collaboration settings
export APM_ENVIRONMENT="staging"
export VOICE_NOTIFICATIONS_ENABLED="false"
export SESSION_BACKUP_ENABLED="true"
export MAX_SESSION_HISTORY="200"
export AUTO_ARCHIVE_ENABLED="true"
```

## Environment Variable Validation

### Validation Script

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-env.sh`:

```bash
#!/bin/bash
# APM Environment Variable Validation Script

echo "=== APM Environment Variable Validation ==="

# Required variables
required_vars=("APM_ROOT" "PROJECT_ROOT" "INSTALLER_ROOT")

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ ERROR: Required variable $var is not set"
        exit 1
    else
        echo "✅ $var: ${!var}"
    fi
done

# Optional variables with defaults
echo -e "\n=== Optional Variables ==="
echo "APM_ENVIRONMENT: ${APM_ENVIRONMENT:-development}"
echo "VOICE_NOTIFICATIONS_ENABLED: ${VOICE_NOTIFICATIONS_ENABLED:-true}"
echo "PARALLEL_EXECUTION_ENABLED: ${PARALLEL_EXECUTION_ENABLED:-true}"
echo "DEBUG_LOGGING_ENABLED: ${DEBUG_LOGGING_ENABLED:-false}"

echo -e "\n✅ Environment validation complete"
```

### Runtime Validation

APM performs runtime validation of critical environment variables:

- **Path Variables**: Validates that paths exist and are accessible
- **Boolean Variables**: Ensures boolean values are valid (`true`/`false`)
- **Numeric Variables**: Validates ranges and formats
- **Enum Variables**: Checks against allowed values

## Troubleshooting Environment Variables

### Common Issues

#### Issue: Variable not recognized
**Symptoms**: APM uses default values instead of set environment variables
**Solutions**:
- Verify variable is exported: `export VARIABLE_NAME="value"`
- Check spelling and case sensitivity
- Restart shell session or source profile
- Verify .env file is in correct location

#### Issue: Path variables pointing to wrong locations
**Symptoms**: APM can't find files or directories
**Solutions**:
- Use absolute paths, not relative paths
- Verify paths exist: `ls -la $APM_ROOT`
- Check permissions: `ls -la $(dirname $APM_ROOT)`
- Re-run installation script if paths are incorrect

#### Issue: Voice notifications not working
**Symptoms**: No audio output from personas
**Solutions**:
- Check `VOICE_NOTIFICATIONS_ENABLED="true"`
- Verify `VOICE_ENGINE` is supported on your system
- Test TTS: `say "test"` or `espeak "test"`
- Check audio permissions and system volume

#### Issue: Performance issues
**Symptoms**: Slow APM operations
**Solutions**:
- Increase `MAX_CONCURRENT_AGENTS` for better parallel performance
- Disable `DEBUG_LOGGING_ENABLED` in production
- Enable `CACHE_ENABLED` for repeated operations
- Monitor `MEMORY_LIMIT_MB` usage

## Environment Variable Migration

### v3.x to v4.0 Migration

```bash
# Deprecated variables (remove these)
unset TASK_TOOL_ENABLED  # Now always false (native sub-agents only)
unset LEGACY_PARALLEL_MODE  # Removed in v4.0

# New variables in v4.0
export PARALLEL_EXECUTION_ENABLED="true"
export MAX_CONCURRENT_AGENTS="4"
export COORDINATION_TIMEOUT_SECONDS="300"
```

### Migration Script

```bash
#!/bin/bash
# Migrate environment variables to v4.0

echo "Migrating APM environment variables to v4.0..."

# Remove deprecated variables
unset TASK_TOOL_ENABLED
unset LEGACY_PARALLEL_MODE

# Set new default values
export PARALLEL_EXECUTION_ENABLED="${PARALLEL_EXECUTION_ENABLED:-true}"
export MAX_CONCURRENT_AGENTS="${MAX_CONCURRENT_AGENTS:-4}"
export COORDINATION_TIMEOUT_SECONDS="${COORDINATION_TIMEOUT_SECONDS:-300}"

echo "Migration complete"
```

## Security Considerations

### Sensitive Variables

Some environment variables may contain sensitive information:

- **Path Variables**: May reveal system structure
- **API Keys**: If APM integrates with external services
- **Security Settings**: Could be exploited if disclosed

### Best Practices

1. **Use .env files** for local development (add to .gitignore)
2. **Use system environment** for production deployment
3. **Validate inputs** for all environment variables
4. **Use least privilege** for path permissions
5. **Regular audits** of environment variable usage

---

**Next Steps**: After configuring environment variables, proceed to [Persona Customization](./customizing-personas.md) or [Voice Notifications](./voice-notifications.md) configuration.