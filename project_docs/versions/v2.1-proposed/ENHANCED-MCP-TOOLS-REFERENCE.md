# Enhanced MCP Tools Reference - Multi-Tech Stack Support

**Version**: 2.1.0  
**Date**: August 24, 2025  
**Status**: Implementation Ready  
**Related**: [Multi-Tech Process Discovery Architecture](../architecture/MULTI-TECH-PROCESS-DISCOVERY-ARCHITECTURE.md)

## Overview

The Enhanced MCP Tools provide comprehensive multi-technology stack process discovery, management, and safety capabilities for Claude Code agents. These tools transform PlopDock from a static registry system into a dynamic, intelligent process management platform.

## Core Enhancement Tools

### 1. Process Discovery Tools

#### `host.discover_processes`
**Purpose**: Comprehensive system-wide process discovery across all technology stacks.

```json
{
  "name": "host.discover_processes",
  "description": "Discover all development processes on the system",
  "inputSchema": {
    "type": "object",
    "properties": {
      "scope": {
        "type": "string",
        "enum": ["all", "registered", "rogue", "by_workspace", "by_tech_stack"],
        "default": "all",
        "description": "Discovery scope filter"
      },
      "workspace": {
        "type": "string", 
        "description": "Filter by workspace path"
      },
      "tech_stack": {
        "type": "string",
        "enum": ["nodejs", "php", "python", "static", "docker"],
        "description": "Filter by technology stack"
      },
      "port_range": {
        "type": "object",
        "properties": {
          "start": { "type": "number" },
          "end": { "type": "number" }
        },
        "description": "Custom port range filter"
      },
      "include_containers": {
        "type": "boolean",
        "default": false,
        "description": "Include Docker container processes"
      }
    }
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "total_processes": 12,
  "registered": [
    {
      "pid": 1234,
      "port": 3000,
      "command": "npm run dev",
      "tech_stack": "nodejs",
      "server_type": "vite",
      "workspace": "/mnt/c/Code/my-project",
      "project_id": "proj_abc123",
      "status": "registered"
    }
  ],
  "discovered": [
    {
      "pid": 5678,
      "port": 3001,
      "command": "node vite dev",
      "tech_stack": "nodejs",
      "server_type": "vite",
      "workspace": "/mnt/c/Code/my-project",
      "suspected_project": "proj_abc123",
      "confidence": 0.95,
      "status": "rogue"
    }
  ],
  "orphaned": [],
  "containers": []
}
```

#### `host.scan_tech_stack`
**Purpose**: Technology-specific process scanning with enhanced detection patterns.

```json
{
  "name": "host.scan_tech_stack",
  "description": "Scan for processes of specific tech stack",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tech_stack": {
        "type": "string",
        "enum": ["nodejs", "php", "python", "static", "docker", "all"],
        "description": "Technology stack to scan"
      },
      "detection_level": {
        "type": "string",
        "enum": ["basic", "comprehensive", "deep"],
        "default": "comprehensive",
        "description": "Detection thoroughness level"
      },
      "include_containers": { "type": "boolean", "default": false },
      "workspace_filter": { "type": "string" }
    },
    "required": ["tech_stack"]
  }
}
```

### 2. Process Management Tools

#### `host.kill_process`
**Purpose**: Safe, context-aware process termination with workspace validation.

```json
{
  "name": "host.kill_process",
  "description": "Safely terminate a process with confirmation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "oneOf": [
          { "type": "number", "description": "Process PID" },
          { "type": "string", "description": "Process identifier or port" }
        ]
      },
      "signal": {
        "type": "string",
        "enum": ["TERM", "INT", "KILL"],
        "default": "TERM",
        "description": "Termination signal"
      },
      "confirm_workspace": {
        "type": "string",
        "description": "Workspace path for safety confirmation"
      },
      "force": {
        "type": "boolean",
        "default": false,
        "description": "Bypass safety checks (use with caution)"
      },
      "dry_run": {
        "type": "boolean",
        "default": false,
        "description": "Preview action without execution"
      }
    },
    "required": ["target"]
  }
}
```

**Safety Features**:
- **Workspace Correlation**: Verifies process belongs to specified workspace
- **Multi-target Resolution**: Supports PID, port number, or process identifier
- **Signal Escalation**: Starts with TERM, can escalate to KILL if needed
- **Dry Run Mode**: Preview actions before execution

#### `host.kill_by_tech_stack`
**Purpose**: Technology stack-specific bulk process termination.

```json
{
  "name": "host.kill_by_tech_stack",
  "description": "Safely terminate processes by technology stack",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tech_stack": {
        "type": "string",
        "enum": ["nodejs", "php", "python", "static"]
      },
      "workspace": {
        "type": "string",
        "description": "Workspace path for safety"
      },
      "server_type": {
        "type": "string",
        "description": "Specific server type (vite, flask, php-builtin, etc.)"
      },
      "exclude_registered": {
        "type": "boolean",
        "default": true,
        "description": "Skip registered processes"
      },
      "dry_run": { "type": "boolean", "default": true }
    },
    "required": ["tech_stack", "workspace"]
  }
}
```

### 3. Cleanup and Maintenance Tools

#### `host.cleanup_rogue`
**Purpose**: Intelligent cleanup of orphaned and rogue development processes.

```json
{
  "name": "host.cleanup_rogue",
  "description": "Clean up orphaned development processes",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workspace": {
        "type": "string",
        "description": "Limit to specific workspace"
      },
      "tech_stack": {
        "type": "string", 
        "enum": ["nodejs", "php", "python", "static", "all"],
        "default": "all"
      },
      "max_age": {
        "type": "number",
        "description": "Max age in minutes",
        "default": 60
      },
      "dry_run": { "type": "boolean", "default": true },
      "auto_correlate": {
        "type": "boolean",
        "default": true,
        "description": "Attempt workspace correlation before cleanup"
      }
    }
  }
}
```

#### `host.cleanup_by_project_type`
**Purpose**: Project type-specific cleanup with enhanced safety checks.

### 4. Analysis and Monitoring Tools

#### `host.correlate_workspace`
**Purpose**: Intelligent correlation of processes with project workspaces.

```json
{
  "name": "host.correlate_workspace",
  "description": "Correlate discovered processes with workspaces",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workspace": {
        "type": "string",
        "description": "Target workspace path"
      },
      "confidence_threshold": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "default": 0.7,
        "description": "Minimum confidence for correlation"
      },
      "include_suspected": {
        "type": "boolean", 
        "default": true,
        "description": "Include low-confidence matches"
      }
    },
    "required": ["workspace"]
  }
}
```

#### `host.monitor_port_ranges`
**Purpose**: Real-time monitoring of development port ranges.

#### `host.system_process_report`
**Purpose**: Comprehensive system analysis and health report.

```json
{
  "name": "host.system_process_report",
  "description": "Generate comprehensive system process analysis",
  "inputSchema": {
    "type": "object",
    "properties": {
      "include_system_health": { "type": "boolean", "default": true },
      "include_port_utilization": { "type": "boolean", "default": true },
      "include_tech_stack_breakdown": { "type": "boolean", "default": true },
      "include_recommendations": { "type": "boolean", "default": true },
      "format": {
        "type": "string",
        "enum": ["json", "markdown", "summary"],
        "default": "json"
      }
    }
  }
}
```

## Technology Stack-Specific Features

### Node.js Tools
- **Vite Detection**: Advanced pattern matching for Vite dev servers
- **Port Sequence Prediction**: Intelligent port increment detection (3001, 3002...)
- **Package Manager Detection**: npm, yarn, pnpm process identification

### PHP Tools
- **Built-in Server Detection**: `php -S` process identification
- **Web Server Integration**: Apache, Nginx, PHP-FPM correlation
- **Container PHP Detection**: Docker PHP container discovery

### Python Tools
- **Framework Detection**: Flask, Django, FastAPI identification
- **WSGI Server Detection**: Gunicorn, uWSGI, Uvicorn support
- **Static Server Detection**: Python HTTP server identification

### Static Site Tools
- **Multi-server Detection**: live-server, http-server, serve support
- **Build Tool Integration**: Detection of build system dev servers
- **Python Static Detection**: Python HTTP server for static content

### Docker Tools
- **Port Mapping Analysis**: Host-to-container port correlation
- **Container Tech Detection**: Technology stack identification within containers
- **Multi-container Orchestration**: Docker Compose support

## Safety Framework

### Context-Aware Safety Rules

```typescript
interface SafetyRule {
  condition: 'killing_registered_process' | 
            'killing_rogue_in_workspace' | 
            'killing_system_process' |
            'killing_unrelated_process'
  action: 'allow' | 'require_confirmation' | 'block' | 'allow_with_logging'
  message: string
}

const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  {
    condition: 'killing_registered_process',
    action: 'require_confirmation', 
    message: 'This will terminate a registered PlopDock process'
  },
  {
    condition: 'killing_rogue_in_workspace',
    action: 'allow_with_logging',
    message: 'Terminating rogue process in current workspace'
  },
  {
    condition: 'killing_system_process', 
    action: 'block',
    message: 'Cannot terminate system processes'
  },
  {
    condition: 'killing_unrelated_process',
    action: 'require_explicit_confirmation',
    message: 'Process not related to current workspace'
  }
]
```

### Agent Integration Examples

#### Safe Process Cleanup
```typescript
// Agent workflow for cleaning up development environment
async function cleanupDevelopmentEnvironment(workspace: string) {
  // 1. Discover processes in workspace
  const processes = await mcp.call('host.discover_processes', {
    scope: 'by_workspace',
    workspace: workspace
  })
  
  // 2. Identify rogue processes safely
  const rogueProcesses = processes.discovered.filter(p => p.status === 'rogue')
  
  // 3. Clean up with confirmation
  for (const process of rogueProcesses) {
    await mcp.call('host.kill_process', {
      target: process.pid,
      confirm_workspace: workspace,
      signal: 'TERM'
    })
  }
  
  // 4. Cleanup orphaned processes
  await mcp.call('host.cleanup_rogue', {
    workspace: workspace,
    dry_run: false,
    max_age: 30
  })
}
```

#### Multi-Tech Environment Setup
```typescript
// Agent workflow for multi-technology project setup
async function setupMultiTechProject(workspace: string) {
  // 1. Scan for existing processes
  const existingProcesses = await mcp.call('host.scan_tech_stack', {
    tech_stack: 'all',
    workspace_filter: workspace
  })
  
  // 2. Clean up conflicting processes
  if (existingProcesses.processes.length > 0) {
    await mcp.call('host.cleanup_by_project_type', {
      project_type: 'all',
      workspace: workspace,
      include_containers: true
    })
  }
  
  // 3. Start new services with intelligent port allocation
  // (existing PlopDock functionality enhanced with discovery)
}
```

## Error Handling and Diagnostics

### Enhanced Error Responses
```json
{
  "success": false,
  "error_code": "PROCESS_SAFETY_VIOLATION", 
  "message": "Cannot terminate process: safety check failed",
  "details": {
    "pid": 1234,
    "process_workspace": "/different/workspace",
    "requested_workspace": "/mnt/c/Code/my-project", 
    "safety_rule": "killing_unrelated_process",
    "suggestions": [
      "Verify the correct workspace path",
      "Use force=true if you're certain about the termination",
      "Check process correlation with host.correlate_workspace"
    ]
  }
}
```

### Diagnostic Tools
- **Process Tree Analysis**: Understanding parent-child process relationships
- **Port Conflict Resolution**: Identifying and resolving port conflicts
- **Workspace Health Checks**: Comprehensive workspace process validation

This enhanced MCP tool set provides Claude Code agents with **comprehensive, safe, and intelligent process management capabilities** across all supported technology stacks, dramatically improving development workflow reliability and agent effectiveness.

---

**Implementation Timeline**: 6-8 weeks for full enhanced MCP tool suite
**Testing Strategy**: Progressive rollout with extensive safety validation
**Performance Target**: < 2 second response times for all discovery operations