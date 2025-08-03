# MCP Debug Host Configuration Guide

This comprehensive guide covers all configuration options for the MCP Debug Host Server, including deployment-specific settings, security configuration, and advanced features.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Files](#configuration-files)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Security Settings](#security-settings)
- [Advanced Configuration](#advanced-configuration)
- [Configuration Management](#configuration-management)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Generate Configuration

```bash
# Generate production configuration
node scripts/config-setup.js generate production

# Generate development configuration
node scripts/config-setup.js generate development

# Generate staging configuration
node scripts/config-setup.js generate staging
```

### 2. Deploy Configuration

```bash
# Deploy to MCP home directory
node scripts/config-setup.js deploy production

# Force overwrite existing configuration
node scripts/config-setup.js deploy production --force
```

### 3. Validate Configuration

```bash
# Validate configuration file
node scripts/config-setup.js validate ~/.apm-debug-host/config.json
```

## Configuration Files

The MCP Debug Host uses two main configuration files:

### 1. `config.json` - Main Configuration

Contains all server settings, security options, and feature flags.

**Location**: `~/.apm-debug-host/config.json`

### 2. `.env` - Environment Variables

Contains sensitive data and environment-specific values.

**Location**: `~/.apm-debug-host/.env`

## Environment-Specific Configurations

### Development Environment

Optimized for local development with verbose logging and debugging features.

**Key Features**:
- Verbose logging enabled
- Debug mode active
- Hot reload enabled
- Reduced security restrictions
- Mock data available
- No authentication required for dashboard

**Configuration**:
```bash
node scripts/config-setup.js generate development
```

### Staging Environment

Balanced configuration for testing production-like scenarios.

**Key Features**:
- Moderate security settings
- Basic monitoring enabled
- Authentication required
- Compressed logging
- Cache enabled
- Webhook testing enabled

**Configuration**:
```bash
node scripts/config-setup.js generate staging
```

### Production Environment

Secure, optimized configuration for production deployment.

**Key Features**:
- Maximum security settings
- Full monitoring and alerting
- Strict process limits
- Encrypted backups
- Rate limiting enabled
- Dashboard authentication required

**Configuration**:
```bash
node scripts/config-setup.js generate production
```

## Security Settings

### API Key Management

The MCP Debug Host uses API keys for authentication:

```bash
# Generate new API keys
node scripts/config-setup.js keys
```

**Security Best Practices**:
- Use minimum 32-character API keys
- Rotate keys regularly in production
- Store keys securely (environment variables)
- Never commit keys to version control

### CORS Configuration

Configure Cross-Origin Resource Sharing for web dashboard access:

```json
{
  "security": {
    "enableCors": true,
    "allowedOrigins": "https://your-domain.com,https://localhost:3000"
  }
}
```

### Rate Limiting

Protect against abuse with configurable rate limiting:

```json
{
  "security": {
    "rateLimiting": {
      "enabled": true,
      "windowMs": 900000,
      "maxRequests": 100
    }
  }
}
```

### Dashboard Authentication

Secure the web dashboard with username/password authentication:

```json
{
  "dashboard": {
    "authentication": {
      "enabled": true,
      "username": "admin",
      "password": "secure-password-here"
    }
  }
}
```

## Advanced Configuration

### Process Management

Configure how the server manages development processes:

```json
{
  "processes": {
    "maxConcurrent": 10,
    "defaultTimeout": 86400000,
    "autoRestart": false,
    "memoryLimit": 2048,
    "cpuLimit": 80,
    "killSignal": "SIGTERM",
    "killTimeout": 5000
  }
}
```

**Key Settings**:
- `maxConcurrent`: Maximum number of simultaneous processes
- `memoryLimit`: Memory limit per process (MB)
- `cpuLimit`: CPU usage limit per process (%)
- `autoRestart`: Automatically restart failed processes

### Monitoring and Alerting

Configure system monitoring and alerting:

```json
{
  "monitoring": {
    "enabled": true,
    "metricsInterval": 60000,
    "alerts": {
      "enabled": true,
      "memory": {
        "threshold": 85,
        "action": "restart"
      },
      "cpu": {
        "threshold": 90,
        "action": "alert"
      }
    }
  }
}
```

**Alert Actions**:
- `log`: Write to log file
- `alert`: Send notification
- `restart`: Restart affected process
- `cleanup`: Clean up resources

### Storage Configuration

Configure logging, caching, and session storage:

```json
{
  "storage": {
    "logs": {
      "path": "/home/user/.apm-debug-host/logs",
      "maxSize": "100MB",
      "maxFiles": 10,
      "rotation": "daily",
      "compression": "gzip",
      "format": "json"
    },
    "cache": {
      "enabled": true,
      "maxSize": "1GB",
      "ttl": 3600
    }
  }
}
```

### Project Detection

Configure automatic project type detection:

```json
{
  "detection": {
    "enabled": true,
    "scanDepth": 3,
    "cacheResults": true,
    "frameworks": [
      "nextjs", "react", "vue", "angular",
      "express", "django", "flask", "rails"
    ],
    "customPatterns": {
      "server_ready": [
        "listening on",
        "server started",
        "ready on"
      ]
    }
  }
}
```

### Dashboard Customization

Customize the web dashboard appearance and features:

```json
{
  "dashboard": {
    "title": "My Debug Host Dashboard",
    "theme": "dark",
    "logBuffer": 2000,
    "autoScroll": true,
    "refreshInterval": 5000,
    "features": {
      "realTimeUpdates": true,
      "downloadLogs": true,
      "processControls": true,
      "systemMetrics": true
    }
  }
}
```

### Integrations

Configure external integrations:

```json
{
  "integrations": {
    "claude": {
      "enabled": true,
      "apiVersion": "2024-01-01",
      "maxTokens": 4096
    },
    "webhooks": {
      "enabled": true,
      "endpoints": "https://hooks.slack.com/webhook-url",
      "timeout": 10000,
      "retries": 3
    },
    "notifications": {
      "enabled": true,
      "channels": "email,slack",
      "events": "error,restart,deploy"
    }
  }
}
```

## Configuration Management

### Backup and Restore

Backup your configuration before making changes:

```bash
# Create backup
node scripts/config-setup.js backup

# Restore from backup
node scripts/config-setup.js restore /path/to/backup.json
```

### Configuration Validation

Validate configuration against the schema:

```bash
# Validate current configuration
node scripts/config-setup.js validate ~/.apm-debug-host/config.json

# Validate before deployment
node scripts/config-setup.js validate ./config.json
```

### Hot Reload

The server automatically reloads configuration when files change in production mode.

### Environment Variables

Override any configuration value using environment variables:

```bash
# Override port
export PORT=9090

# Override log level
export LOG_LEVEL=debug

# Override API key
export API_KEY=your-new-api-key
```

## Configuration Examples

### Minimal Configuration

```json
{
  "version": "1.0.0",
  "server": {
    "port": 8080,
    "host": "localhost"
  },
  "security": {
    "apiKey": "your-api-key-here"
  },
  "storage": {
    "logs": {
      "path": "/tmp/mcp-logs",
      "maxSize": "50MB"
    }
  },
  "processes": {
    "maxConcurrent": 5,
    "defaultTimeout": 3600000
  }
}
```

### High-Performance Configuration

```json
{
  "version": "1.0.0",
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "maxRequestSize": "50mb",
    "keepAliveTimeout": 120000
  },
  "processes": {
    "maxConcurrent": 50,
    "memoryLimit": 4096,
    "cpuLimit": 90
  },
  "storage": {
    "cache": {
      "enabled": true,
      "maxSize": "5GB",
      "ttl": 7200
    }
  },
  "monitoring": {
    "enabled": true,
    "metricsInterval": 30000
  }
}
```

### Security-Focused Configuration

```json
{
  "version": "1.0.0",
  "security": {
    "apiKey": "very-long-secure-api-key-with-64-characters-minimum",
    "enableCors": true,
    "allowedOrigins": "https://trusted-domain.com",
    "rateLimiting": {
      "enabled": true,
      "windowMs": 300000,
      "maxRequests": 50
    },
    "auth": {
      "enabled": true,
      "tokenExpiry": 1800
    }
  },
  "dashboard": {
    "authentication": {
      "enabled": true,
      "username": "admin",
      "password": "SecurePassword123!"
    },
    "features": {
      "processControls": false
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Configuration Validation Errors

**Problem**: Configuration file fails validation
**Solution**: 
```bash
# Check validation errors
node scripts/config-setup.js validate config.json

# Regenerate configuration
node scripts/config-setup.js generate production --force
```

#### 2. Permission Errors

**Problem**: Cannot write to configuration directory
**Solution**:
```bash
# Fix permissions
chmod 700 ~/.apm-debug-host
chmod 600 ~/.apm-debug-host/.env
```

#### 3. Port Already in Use

**Problem**: Server port is already occupied
**Solution**:
```bash
# Change port in environment
export PORT=8081

# Or update configuration
node scripts/config-setup.js generate production
```

#### 4. API Key Issues

**Problem**: API key authentication fails
**Solution**:
```bash
# Generate new API key
node scripts/config-setup.js keys

# Update .env file with new key
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
export DEBUG_MODE=true
export LOG_LEVEL=debug
```

### Log Analysis

Check logs for configuration issues:

```bash
tail -f ~/.apm-debug-host/logs/server.log
```

### Configuration Schema

The configuration follows a JSON schema located at `schemas/config.schema.json`. Use this for IDE validation and auto-completion.

## Support

For additional help with configuration:

1. Check the [Implementation Guide](../project_docs/MCP-DEBUG-HOST-IMPLEMENTATION-GUIDE.md)
2. Review example configurations in the `configs/` directory
3. Validate configuration using the setup script
4. Check server logs for specific error messages

## Version History

- **v1.0.0**: Initial configuration system with environment-specific presets
- **v1.1.0**: Added JSON schema validation and configuration management tools
- **v1.2.0**: Enhanced security settings and monitoring configuration