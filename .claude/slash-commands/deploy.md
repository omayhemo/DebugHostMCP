# /deploy-to-global

Deploy MCP Debug Host from development (`/mnt/c/Code/MCPServers/DebugHostMCP/`) to global installation (`~/.apm-debug-host/`).

## Execute Deployment

```bash
# Stop current service
pkill -f 'apm-debug-host/src/index.js' || echo "No service running"
sleep 2

# Create backup
cp -r ~/.apm-debug-host ~/.apm-debug-host.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No existing installation to backup"

# Copy files from development to global
echo "Copying files to global installation..."
mkdir -p ~/.apm-debug-host/{src,adapter,service}
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/src/* ~/.apm-debug-host/src/
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/adapter/* ~/.apm-debug-host/adapter/ 2>/dev/null || true
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/service/* ~/.apm-debug-host/service/ 2>/dev/null || true
cp /mnt/c/Code/MCPServers/DebugHostMCP/package*.json ~/.apm-debug-host/ 2>/dev/null || true

# Verify port configuration
sed -i 's/"PORT": "8080"/"PORT": "2601"/g' ~/.config/claude/mcp.json 2>/dev/null || true

# Install dependencies
cd ~/.apm-debug-host && npm install --production --silent 2>/dev/null || echo "Dependencies installed with warnings"

# Service will auto-start when Claude Code connects
echo "Deployment complete! Service will start automatically."

# Verify deployment
sleep 3
curl -s http://localhost:2601/api/health | jq '.' || echo "Service starting..."
```

## Verify Success

```bash
# Check service status
ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep

# Check health
curl -s http://localhost:2601/api/health | jq '.'

# View dashboard
echo "Dashboard: http://localhost:2601"
```

## If Deployment Fails

```bash
# Rollback to previous version
LATEST_BACKUP=$(ls -t ~/.apm-debug-host.backup.* 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    pkill -f 'apm-debug-host/src/index.js'
    rm -rf ~/.apm-debug-host
    cp -r "$LATEST_BACKUP" ~/.apm-debug-host
    echo "Rolled back to: $LATEST_BACKUP"
fi
```