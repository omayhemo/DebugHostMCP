# Deploy MCP Debug Host to Global Installation

## Command: /deploy-to-global

### Purpose
Deploys the MCP Debug Host from the development codebase to the global installation that is used by all Claude Code projects.

### What This Command Does
1. **Stops** the currently running global MCP Debug Host service (if running)
2. **Copies** all updated code from development to the global installation
3. **Restarts** the global service with the new code
4. **Verifies** the deployment was successful

### Important Paths
- **Development Path**: `/mnt/c/Code/MCPServers/DebugHostMCP/` (where you develop and test changes)
- **Global Installation Path**: `~/.apm-debug-host/` (the production version used by all Claude Code instances)
- **Global MCP Config**: `~/.config/claude/mcp.json` (configures MCP Debug Host for Claude Code)
- **Service Port**: 2601 (the port the global service runs on)

### Pre-Deployment Checklist
Before running this command, ensure:
- [ ] All development changes are tested locally
- [ ] No syntax errors in JavaScript files
- [ ] Port 2601 is configured consistently across all files
- [ ] The dashboard HTML is working correctly

### Deployment Steps

#### Step 1: Check Current Service Status
First, check if the global service is currently running:
```bash
# Check if MCP Debug Host is running
ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep

# Check what port it's listening on
ss -tuln | grep 2601

# Verify health endpoint
curl -s http://localhost:2601/api/health | jq '.'
```

#### Step 2: Stop the Running Service
Stop the currently running global instance (if it exists):
```bash
# Kill the running process
pkill -f 'apm-debug-host/src/index.js'

# Wait a moment for the process to fully stop
sleep 2

# Verify it's stopped
ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep || echo "Service stopped successfully"
```

#### Step 3: Backup Current Global Installation (Optional but Recommended)
Create a backup of the current working global installation:
```bash
# Create backup with timestamp
cp -r ~/.apm-debug-host ~/.apm-debug-host.backup.$(date +%Y%m%d_%H%M%S)

# List recent backups to confirm
ls -la ~/.apm-debug-host.backup.* 2>/dev/null | tail -3
```

#### Step 4: Copy Development Code to Global Installation
Copy all files from development to the global installation:
```bash
# Copy all source files (preserving structure)
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/src/* ~/.apm-debug-host/src/

# Copy the adapter directory
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/adapter/* ~/.apm-debug-host/adapter/

# Copy service files if they exist
if [ -d "/mnt/c/Code/MCPServers/DebugHostMCP/service" ]; then
  cp -r /mnt/c/Code/MCPServers/DebugHostMCP/service/* ~/.apm-debug-host/service/
fi

# Copy configuration files (but don't overwrite existing config.json)
cp /mnt/c/Code/MCPServers/DebugHostMCP/package*.json ~/.apm-debug-host/

# Copy any new dependencies or scripts
cp /mnt/c/Code/MCPServers/DebugHostMCP/*.js ~/.apm-debug-host/ 2>/dev/null || true
cp /mnt/c/Code/MCPServers/DebugHostMCP/*.sh ~/.apm-debug-host/ 2>/dev/null || true

echo "Files copied successfully from development to global installation"
```

#### Step 5: Verify Port Configuration
Ensure the global installation is configured to use port 2601:
```bash
# Check MCP configuration
grep -E "PORT|2601|8080" ~/.config/claude/mcp.json

# If port is wrong, update it:
# sed -i 's/"PORT": "8080"/"PORT": "2601"/g' ~/.config/claude/mcp.json

# Verify the main index.js uses correct port
grep -E "PORT|2601|8080" ~/.apm-debug-host/src/index.js
```

#### Step 6: Install/Update Dependencies
Ensure all npm dependencies are installed:
```bash
cd ~/.apm-debug-host
npm install --production
cd -
```

#### Step 7: Start the Global Service
The service will automatically start when Claude Code needs it, but you can verify it starts correctly:
```bash
# The service auto-starts with Claude Code, but we can test it
# Start it in background to test
nohup node ~/.apm-debug-host/src/index.js > ~/.apm-debug-host/service.log 2>&1 &

# Wait for it to start
sleep 3

# Check if it started successfully
ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep
```

#### Step 8: Verify Deployment
Perform comprehensive verification of the deployment:
```bash
# Check service is running
echo "=== Service Status ==="
ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep

# Check port is listening
echo -e "\n=== Port Status ==="
ss -tuln | grep 2601

# Test health endpoint
echo -e "\n=== Health Check ==="
curl -s http://localhost:2601/api/health | jq '.'

# Test sessions endpoint
echo -e "\n=== Sessions Check ==="
curl -s http://localhost:2601/api/sessions | jq '.'

# Check dashboard is accessible
echo -e "\n=== Dashboard Check ==="
curl -s -I http://localhost:2601/ | head -3

# Check for any startup errors
echo -e "\n=== Recent Log Entries ==="
tail -5 ~/.apm-debug-host/service.log 2>/dev/null || echo "No log file yet"
```

#### Step 9: Test Basic Functionality
Create a test session to ensure everything works:
```bash
# Create a simple test session
curl -s -X POST http://localhost:2601/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "deployment-test",
    "command": "echo \"Deployment successful\"",
    "cwd": "/tmp",
    "port": 9999
  }' | jq '.'

# Clean up test session after verification
curl -s -X POST http://localhost:2601/api/sessions/clear-inactive | jq '.'
```

### Troubleshooting Guide

#### Issue: Port 2601 Already in Use
```bash
# Find what's using port 2601
lsof -i :2601

# Kill the process if it's an old instance
pkill -f 'apm-debug-host'
```

#### Issue: Service Won't Start
```bash
# Check for syntax errors
node -c ~/.apm-debug-host/src/index.js

# Check npm dependencies
cd ~/.apm-debug-host && npm ls

# Check log files for errors
tail -50 ~/.apm-debug-host/service.log
```

#### Issue: Dashboard Not Loading
```bash
# Verify dashboard files exist
ls -la ~/.apm-debug-host/src/dashboard/public/

# Check if index.html is present
[ -f ~/.apm-debug-host/src/dashboard/public/index.html ] && echo "Dashboard HTML exists" || echo "Dashboard HTML missing!"
```

#### Issue: MCP Not Connecting
```bash
# Verify MCP configuration
cat ~/.config/claude/mcp.json | jq '.mcpServers["apm-debug-host"]'

# Ensure PORT environment variable is set correctly
grep PORT ~/.config/claude/mcp.json
```

### Rollback Procedure
If deployment fails and you need to rollback:
```bash
# Stop the broken service
pkill -f 'apm-debug-host/src/index.js'

# Find most recent backup
LATEST_BACKUP=$(ls -t ~/.apm-debug-host.backup.* 2>/dev/null | head -1)

# Restore from backup
if [ -n "$LATEST_BACKUP" ]; then
  rm -rf ~/.apm-debug-host
  cp -r "$LATEST_BACKUP" ~/.apm-debug-host
  echo "Restored from backup: $LATEST_BACKUP"
else
  echo "No backup found! Manual recovery needed."
fi
```

### Post-Deployment Notes
1. The global service will automatically restart when Claude Code connects to it
2. All Claude Code projects on this system will use the updated version
3. Monitor the service for the first few minutes to ensure stability
4. Keep the development codebase in sync with what was deployed

### Success Indicators
✅ Service running on PID (check with `ps aux`)
✅ Port 2601 is listening
✅ Health endpoint returns `{"success": true, "status": "ok"}`
✅ Dashboard loads at http://localhost:2601
✅ Can create and manage sessions via API

### Command Summary
For experienced users, here's the quick deployment command chain:
```bash
# One-liner deployment (use with caution)
pkill -f 'apm-debug-host/src/index.js' && \
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/src/* ~/.apm-debug-host/src/ && \
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/adapter/* ~/.apm-debug-host/adapter/ && \
sleep 2 && \
curl -s http://localhost:2601/api/health | jq '.' && \
echo "Deployment complete!"
```

### Important Warnings
⚠️ **NEVER** run the development version as a service - it's for testing only
⚠️ **ALWAYS** deploy to `~/.apm-debug-host/` for production use
⚠️ **VERIFY** the service is working before closing your terminal
⚠️ **BACKUP** before deployment if you have a working version

### Questions or Issues?
If deployment fails, check:
1. The service logs at `~/.apm-debug-host/service.log`
2. The MCP configuration at `~/.config/claude/mcp.json`
3. Port availability with `ss -tuln | grep 2601`
4. File permissions with `ls -la ~/.apm-debug-host/`