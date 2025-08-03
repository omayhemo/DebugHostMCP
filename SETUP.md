# Debug Host MCP Setup Guide

## Prerequisites

1. Ensure the global Debug Host service is running:
```bash
# Check if service is running
curl http://localhost:8081/api/v1/health

# If not running, start it:
node ~/.apm-debug-host/service/global-service.js &
```

2. Access the dashboard at http://localhost:8080

## Adding to Your Project

### Method 1: Local Project Configuration

Create `.claude/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "debug-host": {
      "command": "node",
      "args": ["/mnt/c/Code/MCPServers/DebugHostMCP/adapter/mcp-adapter.js"],
      "env": {
        "DEBUG_HOST_API_URL": "http://localhost:8081/api/v1",
        "DEBUG_HOST_DASHBOARD_URL": "http://localhost:8080"
      }
    }
  }
}
```

### Method 2: Global Configuration (All Projects)

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "debug-host": {
      "command": "node",
      "args": ["~/.apm-debug-host/adapter/mcp-adapter.js"],
      "env": {
        "DEBUG_HOST_API_URL": "http://localhost:8081/api/v1",
        "DEBUG_HOST_DASHBOARD_URL": "http://localhost:8080"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
    }
  }
}
```

## Available MCP Tools

Once configured, Claude will have access to these tools:

- `server_start` - Start a development server
- `server_stop` - Stop a running server
- `server_restart` - Restart a server
- `server_status` - Get server status
- `server_logs` - View server logs
- `server_list` - List all servers
- `dashboard_open` - Open the dashboard URL

## Usage Examples

### Starting a React Dev Server
```
Claude: "Start the React development server"
→ Uses server_start with "npm run dev"
```

### Starting a Python Server
```
Claude: "Run the Django server"
→ Uses server_start with "python manage.py runserver"
```

### Monitoring Logs
```
Claude: "Show me the server logs"
→ Uses server_logs to fetch recent output
```

## Troubleshooting

### Service Not Running
If you get "Debug Host Service is not running":
1. Start the global service: `node ~/.apm-debug-host/service/global-service.js &`
2. Check it's running: `curl http://localhost:8081/api/v1/health`

### Port Conflicts
The service uses these ports by default:
- 8080: Dashboard
- 8081: API
- 8082: Health check

Change them via environment variables if needed:
```bash
API_PORT=9081 DASHBOARD_PORT=9080 node ~/.apm-debug-host/service/global-service.js &
```

### Logs Location
- Service logs: `~/.apm-debug-host/data/logs/service.log`
- Server logs: Streamed in real-time to dashboard

## Auto-Start on Boot (Optional)

### Linux (systemd)
```bash
sudo cp ~/.apm-debug-host/service/systemd/apm-debug-host.service /etc/systemd/system/
sudo systemctl enable apm-debug-host
sudo systemctl start apm-debug-host
```

### macOS (launchd)
```bash
cp ~/.apm-debug-host/service/launchd/com.apm.debug-host.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.apm.debug-host.plist
```

### Windows (Task Scheduler)
Use the provided PowerShell script:
```powershell
~/.apm-debug-host/service/windows/install-service.ps1
```