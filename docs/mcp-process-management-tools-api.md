# MCP Process Management Tools API Documentation

**Sprint 6 - Story 3.5: New MCP Tools Implementation**  
**Version**: 2.1.0  
**Date**: 2025-01-25  

## Overview

This document describes the 15 new MCP (Model Context Protocol) tools that provide comprehensive multi-tech process management capabilities for Claude Code agents. These tools leverage the Multi-Tech Process Discovery Engine and Enhanced Port Registry to deliver intelligent, safe, and fast process management across all supported technology stacks.

### Key Features

- **5-Technology Support**: Node.js, PHP, Python, Static Sites, Docker
- **Performance Optimized**: <500ms response time requirement
- **Safety-Aware**: Built-in safety checks and workspace validation
- **Intelligent Automation**: AI-driven decision making for cleanup operations
- **Comprehensive Monitoring**: Real-time monitoring and health checks
- **Audit Trail**: Complete logging for all process operations

## Tool Categories

### 1. Process Discovery Tools (1-4)
Cross-stack process discovery and analysis

### 2. Process Management Tools (5-9)
Safe process termination with workspace validation

### 3. Monitoring & Analysis Tools (10-13)
Real-time monitoring and health checking

### 4. Automated Maintenance Tools (14-15)
Intelligence-driven automated cleanup

---

## Process Discovery Tools

### 1. `host.discover_processes`

**Description**: Comprehensive process discovery across all supported technology stacks

**Safety Level**: `safe`

**Parameters**:
```json
{
  "techStacks": ["nodejs", "php", "python", "static", "docker"],
  "includeCorrelation": true,
  "forceRefresh": false
}
```

**Example Request**:
```json
{
  "name": "host.discover_processes",
  "arguments": {
    "techStacks": ["nodejs", "php", "docker"],
    "includeCorrelation": true,
    "forceRefresh": true
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-25T14:30:00.000Z",
  "processingTime": 450,
  "discoveryResults": {
    "totalProcesses": 23,
    "techStackResults": {
      "nodejs": {
        "processes": [
          {
            "pid": 12345,
            "port": 3000,
            "command": "node server.js",
            "techStack": "nodejs"
          }
        ],
        "success": true
      }
    },
    "correlation": {
      "registeredProcesses": [],
      "discoveredProcesses": [],
      "rogueProcesses": []
    }
  },
  "processCategories": {
    "registered": [],
    "discovered": [],
    "rogue": [],
    "orphaned": [],
    "containers": []
  },
  "summary": {
    "totalProcesses": 23,
    "processingTime": 450,
    "meetsPerfReq": true
  }
}
```

---

### 2. `host.scan_tech_stack`

**Description**: Technology-specific scanning with framework detection

**Safety Level**: `safe`

**Parameters**:
```json
{
  "techStack": "nodejs",
  "includeFrameworks": true,
  "portRange": {
    "start": 3000,
    "end": 4000
  }
}
```

**Example Request**:
```json
{
  "name": "host.scan_tech_stack",
  "arguments": {
    "techStack": "nodejs",
    "includeFrameworks": true,
    "portRange": {
      "start": 3000,
      "end": 8000
    }
  }
}
```

**Framework Detection**: Automatically detects Express.js, NestJS, Next.js, React, Vue.js, and other popular frameworks.

---

### 3. `host.container_discovery`

**Description**: Docker container detection with port mapping and health status

**Safety Level**: `safe`

**Parameters**:
```json
{
  "includeInactive": false,
  "networkMode": "all"
}
```

**Example Request**:
```json
{
  "name": "host.container_discovery",
  "arguments": {
    "includeInactive": true,
    "networkMode": "bridge"
  }
}
```

---

### 4. `host.process_tree_analysis`

**Description**: Process relationship mapping and dependency analysis

**Safety Level**: `safe`

**Parameters**:
```json
{
  "rootPid": 1234,
  "maxDepth": 5,
  "includeResources": true
}
```

**Example Request**:
```json
{
  "name": "host.process_tree_analysis",
  "arguments": {
    "maxDepth": 3,
    "includeResources": true
  }
}
```

---

## Process Management Tools

### 5. `host.kill_process`

**Description**: Safe process termination with workspace validation and safety checks

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "pid": 12345,
  "port": 3000,
  "signal": "SIGTERM",
  "validateWorkspace": true,
  "reason": "Process cleanup for development environment"
}
```

**Example Request**:
```json
{
  "name": "host.kill_process",
  "arguments": {
    "port": 3000,
    "signal": "SIGTERM",
    "reason": "Stopping development server for restart"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-25T14:30:00.000Z",
  "terminatedProcess": {
    "pid": 12345,
    "port": 3000,
    "signal": "SIGTERM",
    "reason": "Stopping development server for restart"
  },
  "safetyCheck": {
    "safe": true,
    "checks": {
      "workspaceValidation": true,
      "criticalProcess": false,
      "dependencyCheck": true
    },
    "recommendations": []
  },
  "auditTrail": {
    "action": "process_termination",
    "user": "developer",
    "timestamp": "2025-01-25T14:30:00.000Z",
    "reason": "Stopping development server for restart",
    "safetyValidated": true
  }
}
```

---

### 6. `host.kill_by_tech_stack`

**Description**: Technology stack-specific cleanup operations with batch safety

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "techStack": "nodejs",
  "processCategory": "rogue",
  "maxProcesses": 5,
  "reason": "Cleaning up rogue Node.js processes"
}
```

---

### 7. `host.cleanup_rogue`

**Description**: Rogue process cleanup with comprehensive safety checks

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "dryRun": true,
  "ageThreshold": 30,
  "excludePorts": [22, 80, 443],
  "reason": "Weekly rogue process cleanup"
}
```

**Example Request (Dry Run)**:
```json
{
  "name": "host.cleanup_rogue",
  "arguments": {
    "dryRun": true,
    "ageThreshold": 60,
    "excludePorts": [3000, 8080],
    "reason": "Analysis for rogue process cleanup"
  }
}
```

---

### 8. `host.cleanup_by_project_type`

**Description**: Project type-specific cleanup operations with workspace correlation

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "projectType": "nodejs",
  "workspacePath": "/home/user/projects",
  "includeOrphaned": true,
  "reason": "Cleaning up old Node.js projects"
}
```

---

### 9. `host.bulk_process_management`

**Description**: Multi-process operations with batch safety and rollback capability

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "operations": [
    {
      "action": "kill",
      "target": { "pid": 12345 }
    },
    {
      "action": "restart",
      "target": { "port": 3000 }
    }
  ],
  "atomic": true,
  "reason": "Batch process management for environment reset"
}
```

---

## Monitoring & Analysis Tools

### 10. `host.monitor_port_ranges`

**Description**: Real-time port monitoring by technology stack with change detection

**Safety Level**: `safe`

**Parameters**:
```json
{
  "portRanges": [
    {
      "start": 3000,
      "end": 4000,
      "techStack": "nodejs"
    }
  ],
  "duration": 30,
  "changeThreshold": 10
}
```

**Example Request**:
```json
{
  "name": "host.monitor_port_ranges",
  "arguments": {
    "portRanges": [
      { "start": 3000, "end": 8000, "techStack": "nodejs" }
    ],
    "duration": 60,
    "changeThreshold": 15
  }
}
```

---

### 11. `host.correlate_workspace`

**Description**: Workspace-process correlation analysis with relationship mapping

**Safety Level**: `safe`

**Parameters**:
```json
{
  "workspacePath": "/home/user/projects/myapp",
  "includeSubdirectories": true,
  "correlationDepth": "deep"
}
```

---

### 12. `host.workspace_health_check`

**Description**: Workspace process validation and health assessment

**Safety Level**: `safe`

**Parameters**:
```json
{
  "workspacePath": "/home/user/projects",
  "healthCriteria": {
    "maxCpuUsage": 80,
    "maxMemoryUsage": 80,
    "maxProcessAge": 1440
  },
  "includeRecommendations": true
}
```

**Example Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-25T14:30:00.000Z",
  "workspacePath": "/home/user/projects",
  "analysis": {
    "healthy": [],
    "unhealthy": [],
    "warnings": [],
    "healthScore": 85
  },
  "recommendations": [
    {
      "priority": "medium",
      "category": "monitoring",
      "message": "3 processes have minor issues",
      "action": "Monitor these processes closely"
    }
  ],
  "overallHealth": {
    "status": "good",
    "score": 85
  }
}
```

---

### 13. `host.system_process_report`

**Description**: Comprehensive system analysis and reporting with trend analysis

**Safety Level**: `safe`

**Parameters**:
```json
{
  "reportType": "comprehensive",
  "timeRange": "24h",
  "includeTrends": true,
  "format": "json"
}
```

**Report Types**:
- `summary`: Basic system overview
- `detailed`: Complete system data
- `performance`: Performance-focused analysis
- `security`: Security-focused analysis
- `comprehensive`: Full analysis with all data

---

## Automated Maintenance Tools

### 14. `host.auto_cleanup_orphaned`

**Description**: Automated orphan process cleanup with intelligence-driven decision making

**Safety Level**: `dangerous`

**Parameters**:
```json
{
  "ageCriteria": {
    "minAge": 60,
    "maxAge": 1440
  },
  "resourceCriteria": {
    "maxCpuUsage": 5,
    "maxMemoryUsage": 100
  },
  "dryRun": true,
  "maxCleanupCount": 10
}
```

**Example Request (Analysis)**:
```json
{
  "name": "host.auto_cleanup_orphaned",
  "arguments": {
    "ageCriteria": {
      "minAge": 30,
      "maxAge": 720
    },
    "resourceCriteria": {
      "maxCpuUsage": 3,
      "maxMemoryUsage": 50
    },
    "dryRun": true,
    "maxCleanupCount": 5
  }
}
```

---

### 15. `host.process_safety_check`

**Description**: Pre-termination validation and risk assessment with comprehensive safety analysis

**Safety Level**: `safe`

**Parameters**:
```json
{
  "pid": 12345,
  "port": 3000,
  "checkCriteria": {
    "workspaceValidation": true,
    "dependencyAnalysis": true,
    "resourceImpact": true,
    "criticalProcessCheck": true
  },
  "riskTolerance": "medium"
}
```

**Example Request**:
```json
{
  "name": "host.process_safety_check",
  "arguments": {
    "port": 3000,
    "checkCriteria": {
      "workspaceValidation": true,
      "dependencyAnalysis": true,
      "resourceImpact": true,
      "criticalProcessCheck": true
    },
    "riskTolerance": "low"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-25T14:30:00.000Z",
  "targetProcess": {
    "pid": 12345,
    "port": 3000,
    "command": "node server.js",
    "techStack": "nodejs"
  },
  "recommendation": {
    "safe": true,
    "riskLevel": "low",
    "action": "proceed",
    "confidence": 0.95
  },
  "details": {
    "workspaceCheck": {
      "valid": true,
      "workspacePath": "/home/user/projects/myapp"
    },
    "dependencyAnalysis": {
      "hasDependencies": false,
      "dependencies": []
    },
    "resourceImpact": {
      "impact": "low",
      "cpuUsage": 2.1,
      "memoryUsage": 45
    },
    "criticalProcessCheck": {
      "isCritical": false,
      "reason": null
    }
  }
}
```

---

## Error Handling

All tools implement comprehensive error handling and return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "PROCESS_NOT_FOUND",
    "message": "Process with PID 12345 not found",
    "details": {
      "pid": 12345,
      "tool": "host.kill_process",
      "timestamp": "2025-01-25T14:30:00.000Z"
    }
  }
}
```

### Common Error Codes

- `PROCESS_NOT_FOUND`: Target process not found
- `SAFETY_CHECK_FAILED`: Safety validation failed
- `WORKSPACE_VALIDATION_FAILED`: Workspace validation failed
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions for operation
- `TIMEOUT`: Operation timed out
- `INVALID_PARAMETERS`: Invalid input parameters
- `SERVICE_UNAVAILABLE`: Required service not available

---

## Performance Requirements

All tools are optimized to meet the performance requirements:

- **Response Time**: < 500ms per tool execution
- **CPU Usage**: < 2% during operation
- **Memory Usage**: < 50MB additional memory
- **Concurrent Operations**: Support for up to 10 concurrent tool executions

---

## Safety Features

### Built-in Safety Checks
- Workspace validation
- Critical process detection
- System process protection
- Dependency analysis
- Resource impact assessment

### Audit Trail
All dangerous operations include comprehensive audit trails:
- User identification
- Timestamp
- Operation details
- Safety validation results
- Reason for operation

### Risk Assessment
Three-tier risk assessment system:
- **Low Risk**: Safe to proceed
- **Medium Risk**: Proceed with caution
- **High Risk**: Requires additional validation
- **Critical Risk**: Operation blocked

---

## Integration with Story 3.6 Safety Framework

These tools are designed to integrate seamlessly with the upcoming Safety Framework (Story 3.6):

- **Safety Level Classification**: All tools pre-classified for safety framework
- **Risk Assessment Integration**: Compatible with advanced risk assessment
- **Rollback Capabilities**: Support for operation rollback
- **Safety Override**: Framework-controlled safety override capabilities

---

## Usage Examples

### Common Workflows

#### 1. Development Environment Cleanup
```json
// Step 1: Discover all processes
{"name": "host.discover_processes", "arguments": {"forceRefresh": true}}

// Step 2: Safety check specific processes
{"name": "host.process_safety_check", "arguments": {"port": 3000}}

// Step 3: Clean up rogue processes (dry run first)
{"name": "host.cleanup_rogue", "arguments": {"dryRun": true, "reason": "Dev cleanup"}}

// Step 4: Actual cleanup
{"name": "host.cleanup_rogue", "arguments": {"dryRun": false, "reason": "Dev cleanup"}}
```

#### 2. Health Monitoring
```json
// Monitor workspace health
{"name": "host.workspace_health_check", "arguments": {"workspacePath": "/projects"}}

// Monitor port ranges
{"name": "host.monitor_port_ranges", "arguments": {"duration": 300}}

// Generate system report
{"name": "host.system_process_report", "arguments": {"reportType": "comprehensive"}}
```

#### 3. Automated Maintenance
```json
// Analyze orphaned processes
{"name": "host.auto_cleanup_orphaned", "arguments": {"dryRun": true}}

// Perform intelligent cleanup
{"name": "host.auto_cleanup_orphaned", "arguments": {"dryRun": false}}
```

---

## Support and Troubleshooting

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export DEBUG_PROCESS_TOOLS=true
```

### Common Issues

1. **Permission Denied**: Ensure proper user permissions for process operations
2. **Process Not Found**: Verify process exists and refresh discovery data
3. **Safety Check Failed**: Review safety check details and workspace validation
4. **Performance Issues**: Check system load and concurrent operation limits

### Best Practices

1. **Always Use Safety Checks**: Run `host.process_safety_check` before dangerous operations
2. **Start with Dry Runs**: Use `dryRun: true` for analysis before actual operations
3. **Monitor Performance**: Check `processingTime` in responses for performance optimization
4. **Use Appropriate Safety Levels**: Match tool safety level with operation requirements
5. **Keep Audit Trails**: Always provide meaningful reasons for operations

---

## Changelog

### Version 2.1.0 (2025-01-25)
- Initial release of 15 new MCP process management tools
- Integration with Multi-Tech Process Discovery Engine
- Enhanced Port Registry integration
- Comprehensive safety framework preparation
- Performance optimization for <500ms response time
- Complete API documentation and examples

---

**End of Documentation**

For technical support or questions about these tools, refer to the Sprint 6 documentation or contact the development team.