# Rogue Process Management User Guide

**Version**: 2.1.0  
**Date**: August 24, 2025  
**Audience**: Developers, DevOps Engineers, Claude Code Users  
**Related**: [Multi-Tech Dashboard Specification](../ui/MULTI-TECH-DASHBOARD-SPECIFICATION.md)

## What Are Rogue Processes?

**Rogue processes** are development servers that start on unexpected ports due to automatic port allocation when the intended port is busy. This commonly happens with modern development tools like Vite, live-server, and other dev servers that automatically find the next available port.

### Common Scenarios

#### Example 1: Vite Port Conflict
```bash
# You expect your app on port 3000
npm run dev

# But Vite finds port 3000 busy and starts on 3001
# PlopDock's registry still shows port 3000, but nothing is there
# The actual server is "rogue" on port 3001
```

#### Example 2: Multiple Dev Sessions  
```bash
# Terminal 1: Start first project
npm run dev  # Starts on 3000

# Terminal 2: Start second project in different directory
npm run dev  # Vite auto-increments to 3001

# Both servers running, but only first is registered with PlopDock
```

## PlopDock's Multi-Tech Process Discovery

PlopDock v2.1 introduces **intelligent rogue process detection** that can:
- **Discover** all development processes across Node.js, PHP, Python, Static Sites, and Docker
- **Correlate** processes with their likely project workspaces  
- **Provide tools** for safe management and cleanup
- **Prevent conflicts** through real-time monitoring

## Using the Enhanced Dashboard

### 1. Accessing the Multi-Tech Dashboard

Navigate to `http://localhost:2602` to access the enhanced PlopDock dashboard.

### 2. Technology Stack Tabs

The dashboard now features **technology-specific tabs**:

- **📦 Node.js**: Vite, Next.js, npm dev servers
- **🐘 PHP**: Built-in servers, Apache, Nginx  
- **🐍 Python**: Flask, Django, static servers
- **📄 Static**: live-server, http-server, serve
- **🐳 Docker**: Container processes and port mappings

### 3. Process Categories

Each tab shows processes organized by status:

#### **Registered Processes** ✅
- Processes known to PlopDock
- Started through PlopDock's interface
- Full management capabilities available

#### **Discovered Processes** 🔍  
- Processes found by automatic discovery
- High confidence correlation with known workspaces
- Can be promoted to registered status

#### **Rogue Processes** ⚠️
- Processes on unexpected ports
- Medium confidence workspace correlation
- Require user action for proper management

#### **Orphaned Processes** 🗑️
- Processes with no clear workspace correlation
- May be leftover from previous sessions
- Candidates for cleanup

## Managing Rogue Processes

### Option 1: Associate with Existing Project

If PlopDock detects a rogue process that likely belongs to a known project:

1. **Click the "🔗 Associate" button** next to the rogue process
2. **Confirm the workspace correlation** in the popup dialog
3. **PlopDock updates its registry** to track this process properly

**Example Dialog:**
```
🔗 Associate Rogue Process

Process: node vite dev (PID 1234) 
Port: 3001
Suspected Workspace: /mnt/c/Code/my-project
Confidence: 95%

[ Associate with Project ]  [ Ignore ]  [ Cancel ]
```

### Option 2: Register as New Project

For rogue processes from unregistered workspaces:

1. **Click "📝 Register as New"** 
2. **Provide project details**:
   - Project name
   - Confirm workspace path
   - Set technology stack
3. **PlopDock creates new project entry** and tracks the process

### Option 3: Safely Terminate

For unwanted or stuck processes:

1. **Click "⚠️ Terminate"** next to the rogue process
2. **Review the safety confirmation**:
   - Process details
   - Workspace correlation (if any)
   - Impact assessment
3. **Confirm termination** - PlopDock uses SIGTERM first, escalates if needed

**Safety Features:**
- **Workspace verification**: Ensures process belongs to expected directory
- **Graceful termination**: Uses SIGTERM before SIGKILL
- **Impact analysis**: Shows related processes that might be affected

## Bulk Operations

### Cleanup All Rogue Processes in Workspace

Use this when shutting down a development session:

1. **Navigate to your technology stack tab** (e.g., Node.js)
2. **Select multiple rogue processes** using checkboxes  
3. **Click "🧹 Cleanup Selected"**
4. **Review the bulk operation summary**
5. **Confirm cleanup** - all selected processes terminated safely

### Associate All Discovered Processes  

When PlopDock discovers multiple processes from the same workspace:

1. **Select all high-confidence discovered processes**
2. **Click "🔗 Associate All"** 
3. **Review workspace correlations**
4. **Bulk associate** - all processes added to project registry

## Technology-Specific Features

### Node.js Management

#### Vite Port Sequence Detection
PlopDock recognizes Vite's port increment pattern (3000 → 3001 → 3002) and can:
- **Predict likely rogue ports** for better discovery
- **Show port sequence visualization** in the dashboard
- **Offer bulk cleanup** of related Vite processes

#### Package Manager Detection  
Identifies processes by package manager (npm, yarn, pnpm) and shows:
- **Script correlation** (matches `npm run dev` with package.json scripts)
- **Dependency analysis** (higher confidence when dependencies match)

### PHP Management

#### Built-in Server Detection
For `php -S` servers:
- **Port extraction** from command line
- **Document root identification**  
- **Multi-site management** for multiple PHP projects

#### Web Server Integration
For Apache/Nginx with PHP:
- **Virtual host correlation**
- **PHP-FPM process linking**
- **Configuration file detection**

### Docker Management

#### Container Port Mapping
- **Host-to-container port visualization**
- **Multi-container orchestration** awareness
- **Docker Compose integration**

## Agent Integration (For Claude Code Users)

PlopDock provides enhanced MCP tools that Claude Code agents can use:

### Discovery Commands
```typescript
// Discover all processes in current workspace
await mcp.call('host.discover_processes', {
  scope: 'by_workspace',
  workspace: '/mnt/c/Code/my-project'
})

// Scan specific technology stack  
await mcp.call('host.scan_tech_stack', {
  tech_stack: 'nodejs',
  workspace_filter: '/mnt/c/Code/my-project'
})
```

### Safe Cleanup Commands
```typescript
// Clean up rogue processes safely
await mcp.call('host.cleanup_rogue', {
  workspace: '/mnt/c/Code/my-project',
  dry_run: false,
  max_age: 30
})

// Terminate specific process with safety checks
await mcp.call('host.kill_process', {
  target: 1234,
  confirm_workspace: '/mnt/c/Code/my-project',
  signal: 'TERM'  
})
```

## Best Practices

### 1. Regular Cleanup
- **Run cleanup weekly** or after intensive development sessions
- **Use dry-run mode first** to preview actions
- **Focus on orphaned processes** older than 1 hour

### 2. Workspace Organization
- **Keep project workspaces organized** for better correlation
- **Use consistent directory structures** across projects  
- **Maintain package.json files** with accurate metadata

### 3. Port Management
- **Use PlopDock's port allocation** when starting new projects
- **Check for rogue processes** before starting development
- **Terminate unused processes** to free up ports

### 4. Agent Safety
- **Always use workspace confirmation** when agents terminate processes
- **Review bulk operations** before execution
- **Keep safety hooks enabled** in production environments

## Troubleshooting

### "Process Not Found" Errors
**Cause**: Process terminated between discovery and action attempt
**Solution**: Refresh the dashboard and try again

### "Permission Denied" Errors  
**Cause**: Insufficient permissions to terminate process
**Solution**: Check process ownership, use sudo if necessary (with caution)

### High CPU Usage During Discovery
**Cause**: System has many processes, intensive scanning
**Solution**: Increase discovery interval, use technology-specific scans

### False Positive Correlations
**Cause**: Multiple projects in similar directory structures
**Solution**: Use manual workspace verification, improve project naming

### Docker Container Not Detected
**Cause**: Docker not running or insufficient permissions
**Solution**: Ensure Docker daemon is running, check user permissions

## FAQ

### Q: Will this affect my existing PlopDock projects?
**A**: No, all existing functionality is preserved. New features are additive.

### Q: How often does discovery run?
**A**: Every 5 seconds by default, configurable in settings.

### Q: Can I disable discovery for certain tech stacks?
**A**: Yes, each technology detector can be individually enabled/disabled.

### Q: What happens if I terminate the wrong process?
**A**: PlopDock uses graceful termination (SIGTERM) first. You can also use dry-run mode to preview actions.

### Q: Does this work with Windows?
**A**: Yes, through WSL2. Windows native support planned for future releases.

### Q: Can agents bypass the safety checks?
**A**: Agents can use `force: true` but it's logged and monitored. Safety checks are recommended.

This enhanced rogue process management transforms PlopDock from a basic container manager into a comprehensive development environment orchestrator, giving you complete control over your multi-technology development processes.

---

**Need Help?** Visit the [PlopDock Documentation](../index.md) or check the [Implementation Guide](../implementation/TECH-STACK-DETECTION-IMPLEMENTATION-GUIDE.md) for technical details.